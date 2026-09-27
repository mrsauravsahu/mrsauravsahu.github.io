import {
  AmbientLight,
  BoxGeometry,
  Color,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SpotLight,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  SRGBColorSpace,
  type Mesh as MeshT,
  type Object3D
} from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

import type { Photo, Project } from '$lib/server/photos'

// The room dark: walls, floor and ceiling are the near-black gallery wall. The
// only things carrying colour are the cream mats, the prints themselves, and
// the sparse amber safelight — matching DESIGN.md's palette exactly.

const FLOOR_Y = 0
const CEIL_Y = 4.2
const EYE_Y = 1.6
const WALL_OFFSET = 5 // half-width of the corridor (side walls at x = ±5)
const ROOM_DEPTH = 11
const DOOR_HALF_WIDTH = 1
const DOOR_HEIGHT = 3
const BODY_RADIUS = 0.45

const WALL_COLOR = 0x0a0a0a
const SURFACE_COLOR = 0x111111
const ACCENT = 0xd9a441
const FRAME_COLOR = 0x3c2f1d
const LINER_COLOR = 0xffffff
const FRAME_BORDER = 0.11
const LINER_BORDER = 0.12
const FRAME_DEPTH = 0.05
const LINER_DEPTH = 0.025
// Same 4:3 landscape shape as the homepage Polaroids (`.tile-frame` pads to
// 75%, i.e. a 4:3 frame) with centre-crop cover, so every photograph reads as a
// uniform landscape painting regardless of the original's aspect.
const PRINT_ASPECT = 4 / 3
const PRINT_HEIGHT = 1.5
const PRINT_WIDTH = PRINT_HEIGHT * PRINT_ASPECT
const UP = new Vector3(0, 1, 0)

// Prints are unlit (MeshBasicMaterial) so the photograph reads true rather than
// tinted by the room; the frame and liner around it stay lit to catch the amber
// safelight.
type Frame = {
  group: Group
  photo: Photo
  linerMaterial: MeshBasicMaterial
  baseLinerColor: Color
}

type HoverHandler = (photo: Photo | null) => void
type OpenHandler = (photo: Photo) => void
type RoomHandler = (index: number, total: number) => void

const isTouch = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export class GalleryEngine {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera: PerspectiveCamera
  private pointerControls: PointerLockControls
  private raycaster = new Raycaster()
  private pointer = new Vector2()
  private frames: Frame[] = []
  private roomCount = 0
  private currentRoom = 0

  private keys = new Set<string>()
  private velocity = new Vector3()
  private wishDirection = new Vector3()
  private damping = 8

  private animateId = 0
  private resizeHandler: () => void
  private keydownHandler: (e: KeyboardEvent) => void
  private keyupHandler: (e: KeyboardEvent) => void
  private pointermoveHandler: (e: PointerEvent) => void
  private pointerdownHandler: (e: PointerEvent) => void
  private disposed = false

  constructor(
    private canvas: HTMLCanvasElement,
    private onHover: HoverHandler,
    private onOpen: OpenHandler,
    private onRoom: RoomHandler
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new PerspectiveCamera(66, 1, 0.1, 200)
    this.camera.position.set(0, EYE_Y, ROOM_DEPTH / 2)
    this.camera.lookAt(0, EYE_Y, ROOM_DEPTH * 4)

    this.pointerControls = new PointerLockControls(this.camera, this.canvas)
    this.scene.background = new Color(WALL_COLOR)

    this.setupLights()
    this.setupStructure()

    // First-person on precise pointers; orbit otherwise (mobile/tablet).
    this.pointermoveHandler = (e) => {
      this.pointer.set(
        (e.clientX / this.canvas.clientWidth) * 2 - 1,
        -(e.clientY / this.canvas.clientHeight) * 2 + 1
      )
      this.hoverAtPointer()
    }
    this.pointerdownHandler = (e) => this.onPointerDown(e)
    this.keydownHandler = (e) => this.keys.add(e.code)
    this.keyupHandler = (e) => this.keys.delete(e.code)
    this.resizeHandler = () => this.resize()

    window.addEventListener('resize', this.resizeHandler)
    window.addEventListener('keydown', this.keydownHandler)
    window.addEventListener('keyup', this.keyupHandler)
    this.canvas.addEventListener('pointermove', this.pointermoveHandler)
    this.canvas.addEventListener('pointerdown', this.pointerdownHandler)

    this.resize()
    this.loop()
  }

  private setupLights() {
    this.scene.add(new AmbientLight(0x3a372f, 1.0))
    this.scene.add(new HemisphereLight(0x4a463d, 0x121110, 0.6))

    // One warm "safelight" above each room, falling on the frames only.
    for (let i = 0; i < 4; i++) {
      const light = new SpotLight(ACCENT, 60, 26, Math.PI / 4, 0.6, 1.4)
      light.position.set(0, 6, i * ROOM_DEPTH + ROOM_DEPTH / 2)
      light.target.position.set(0, 0, i * ROOM_DEPTH + ROOM_DEPTH / 2)
      this.scene.add(light, light.target)
    }
  }

  private setupStructure() {
    const wallMat = new MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.95 })
    const floorMat = new MeshStandardMaterial({ color: SURFACE_COLOR, roughness: 0.85 })
    const ceilMat = floorMat

    const addBox = (
      w: number, h: number, d: number,
      x: number, y: number, z: number,
      material = wallMat
    ) => {
      const mesh: MeshT = new Mesh(new BoxGeometry(w, h, d), material)
      mesh.position.set(x, y, z)
      this.scene.add(mesh)
      return mesh
    }

    const totalDepth = ROOM_DEPTH * 4
    const half = WALL_OFFSET

    // Floor + ceiling run the whole gallery.
    const floor = new Mesh(new PlaneGeometry(half * 2, totalDepth), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, FLOOR_Y, totalDepth / 2)
    this.scene.add(floor)

    const ceil = new Mesh(new PlaneGeometry(half * 2, totalDepth), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(0, CEIL_Y, totalDepth / 2)
    this.scene.add(ceil)

    // Continuous side walls left and right.
    addBox(0.2, CEIL_Y - FLOOR_Y, totalDepth, -half, (CEIL_Y - FLOOR_Y) / 2, totalDepth / 2)
    addBox(0.2, CEIL_Y - FLOOR_Y, totalDepth, half, (CEIL_Y - FLOOR_Y) / 2, totalDepth / 2)

    // Front wall (behind the start) and back wall (behind the last room).
    addBox(half * 2, CEIL_Y - FLOOR_Y, 0.2, 0, (CEIL_Y - FLOOR_Y) / 2, -0.1)
    addBox(half * 2, CEIL_Y - FLOOR_Y, 0.2, 0, (CEIL_Y - FLOOR_Y) / 2, totalDepth + 0.1)

    // Partition walls between rooms, each with a central doorway.
    for (let i = 1; i < 4; i++) {
      const z = i * ROOM_DEPTH
      const gap = DOOR_HALF_WIDTH
      const leftWidth = half - gap
      if (leftWidth > 0.001) {
        addBox(leftWidth, CEIL_Y - FLOOR_Y, 0.2, -(gap + leftWidth / 2), (CEIL_Y - FLOOR_Y) / 2, z)
        addBox(leftWidth, CEIL_Y - FLOOR_Y, 0.2, gap + leftWidth / 2, (CEIL_Y - FLOOR_Y) / 2, z)
      }
      const lintelHeight = CEIL_Y - DOOR_HEIGHT
      addBox(
        gap * 2, lintelHeight, 0.2,
        0, DOOR_HEIGHT + lintelHeight / 2, z
      )
    }
  }

  private frameFor(photo: Photo): Group {
    const group = new Group()

    // Fixed 4:3 landscape, like the homepage Polaroids. The photograph is
    // centre-cropped onto it (cover), never letterboxed or stretched.
    let photoHeight = PRINT_HEIGHT
    let photoWidth = PRINT_WIDTH

    const line = (v: number) => v + LINER_BORDER * 2
    const outerWidth = () => line(photoWidth) + FRAME_BORDER * 2
    const outerHeight = () => line(photoHeight) + FRAME_BORDER * 2

    // Unlit so the mat is always true white, not tinted grey by the amber room
    // light the way a lit surface would be.
    const linerMaterial = new MeshBasicMaterial({ color: LINER_COLOR })
    const liner = new Mesh(new PlaneGeometry(line(photoWidth), line(photoHeight)), linerMaterial)
    group.add(liner)

    // The frame is four bars of moulding (top / bottom / left / right), not a
    // solid slab — a solid box would cover the liner and print entirely. The
    // bars surround the liner, leaving the picture recessed in the opening.
    const frameMaterial = new MeshStandardMaterial({ color: FRAME_COLOR, roughness: 0.65, metalness: 0.1 })
    const frameGroup = new Group()

    const rebuildFrame = (outerW: number, outerH: number, innerW: number, innerH: number) => {
      const tall = Math.max(outerH - innerH, 0) / 2
      const wide = Math.max(outerW - innerW, 0) / 2
      const spec = [
        { w: innerW, h: FRAME_BORDER, x: 0, y: outerH / 2 - tall },                    // top
        { w: innerW, h: FRAME_BORDER, x: 0, y: -(outerH / 2 - tall) },                  // bottom
        { w: FRAME_BORDER, h: innerH, x: -(outerW / 2 - wide), y: 0 },                  // left
        { w: FRAME_BORDER, h: innerH, x: outerW / 2 - wide, y: 0 }                      // right
      ]
      for (const s of spec) {
        const bar = new Mesh(new BoxGeometry(s.w, s.h, FRAME_DEPTH), frameMaterial)
        bar.position.set(s.x, s.y, -LINER_DEPTH - FRAME_DEPTH / 2)
        frameGroup.add(bar)
      }
    }

    rebuildFrame(outerWidth(), outerHeight(), line(photoWidth), line(photoHeight))
    group.add(frameGroup)

    const printGeometry = new PlaneGeometry(photoWidth, photoHeight)
    // Basic material is unlit, but its `color` still multiplies the texture —
    // a dark placeholder would dim the finished print, so it must be white.
    const photoMaterial = new MeshBasicMaterial({ color: 0xffffff })
    const print = new Mesh(printGeometry, photoMaterial)
    print.position.z = LINER_DEPTH
    group.add(print)

    // Load the real image, then rebuild both planes to the true aspect ratio.
    new TextureLoader().load(photo.full, (texture) => {
      texture.colorSpace = SRGBColorSpace
      // Center-crop to 4:3 (cover): if the source is taller than the frame,
      // crop the top/bottom; if wider, crop the sides. Matches the Polaroid
      // tiles' `object-fit: cover`.
      const src = texture.image as HTMLImageElement | undefined
      const aspect = src?.naturalWidth && src?.naturalHeight
        ? src.naturalWidth / src.naturalHeight
        : PRINT_ASPECT
      if (aspect < PRINT_ASPECT) {
        // Source is narrower (more portrait) than 4:3 — crop vertically.
        const visible = aspect / PRINT_ASPECT
        texture.repeat.set(1, visible)
        texture.offset.set(0, (1 - visible) / 2)
      } else {
        // Source is wider (more landscape) than 4:3 — crop horizontally.
        const visible = PRINT_ASPECT / aspect
        texture.repeat.set(visible, 1)
        texture.offset.set((1 - visible) / 2, 0)
      }
      photoMaterial.map = texture
      photoMaterial.needsUpdate = true
    })

    this.frames.push({ group, photo, linerMaterial, baseLinerColor: linerMaterial.color.clone() })

    return group
  }

  private placeFrames(projects: Project[]) {
    for (let room = 0; room < projects.length; room++) {
      const photos = projects[room].photos
      // Split photos between the two side walls, alternating sides.
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const onLeft = i % 2 === 0
        const side = onLeft ? -1 : 1
        const frame = this.frameFor(photo)
        // Spread frames through the room depth, a little offset per wall so the
        // two sides don't line up in a mechanical grid.
        const t = photos.length === 1 ? 0.5 : i / (photos.length - 1)
        const z = room * ROOM_DEPTH + 1.5 + t * (ROOM_DEPTH - 3)
        frame.position.set(side * (WALL_OFFSET - 0.18), 2.35, z)
        frame.rotation.y = onLeft ? Math.PI / 2 : -Math.PI / 2
        this.scene.add(frame)
      }
    }
  }

  setProjects(projects: Project[]) {
    // The loader may re-run; clear any stale frames first.
    for (const f of this.frames) {
      this.scene.remove(f.group)
      f.group.traverse((o: Object3D) => {
        const mesh = o as MeshT
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
    }
    this.frames = []
    this.roomCount = projects.length
    this.placeFrames(projects)
    this.currentRoom = 0
    this.camera.position.set(0, EYE_Y, ROOM_DEPTH / 2)
    this.camera.lookAt(0, EYE_Y, ROOM_DEPTH * 4)
    this.onRoom(0, this.roomCount)
  }

  goToRoom(index: number) {
    if (index < 0 || index >= this.roomCount) return
    this.currentRoom = index
    this.camera.position.set(0, EYE_Y, index * ROOM_DEPTH + ROOM_DEPTH / 2)
    this.camera.lookAt(0, EYE_Y, this.camera.position.z + ROOM_DEPTH * 4)
    this.onRoom(index, this.roomCount)
  }

  private resize() {
    const { clientWidth, clientHeight } = this.canvas
    if (!clientWidth || !clientHeight) return
    this.renderer.setSize(clientWidth, clientHeight, false)
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
  }

  private hoverAtPointer() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(
      this.frames.map((f) => f.group),
      true
    )
    let hitPhoto: Photo | null = null
    if (hits.length > 0) {
      // Walk up from the hit mesh to its owning frame group.
      for (const f of this.frames) {
        const hit = hits[0]
        let obj: Object3D | null = hit.object
        while (obj && obj !== f.group) obj = obj.parent
        if (obj === f.group) { hitPhoto = f.photo; break }
      }
    }
    for (const f of this.frames) {
      const hot = f.photo === hitPhoto
      f.linerMaterial.color.set(hot ? 0xfff2dc : f.baseLinerColor)
      f.group.scale.setScalar(hot ? 1.035 : 1)
    }
    this.canvas.style.cursor = hitPhoto ? 'pointer' : ''
    this.onHover(hitPhoto)
  }

  private onPointerDown(e: PointerEvent) {
    if (isTouch()) {
      this.pointer.set(
        (e.clientX / this.canvas.clientWidth) * 2 - 1,
        -(e.clientY / this.canvas.clientHeight) * 2 + 1
      )
    }

    // A frame under the pointer (or the locked crosshair at screen centre)
    // opens the print. Touch devices tap the frame directly; precise pointers
    // open the frame on click, or capture the pointer to walk when they miss.
    this.raycaster.setFromCamera(
      this.pointerControls.isLocked ? new Vector2(0, 0) : this.pointer,
      this.camera
    )
    const hits = this.raycaster.intersectObjects(
      this.frames.map((f) => f.group),
      true
    )
    if (hits.length > 0) {
      for (const f of this.frames) {
        const hit = hits[0]
        let obj: Object3D | null = hit.object
        while (obj && obj !== f.group) obj = obj.parent
        if (obj === f.group) { this.onOpen(f.photo); return }
      }
    }
    if (!isTouch() && this.pointerControls.isLocked) {
      // Nothing hit — treat as a click to release and use the cursor.
      this.pointerControls.unlock()
    } else if (!isTouch()) {
      // Nothing hit and the pointer is free — capture it to walk around.
      this.pointerControls.lock()
    }
  }

  private update(dt: number) {
    if (!isTouch()) {
      const speed = 3.4
      const forward = this.keys.has('KeyW') || this.keys.has('ArrowUp')
      const back = this.keys.has('KeyS') || this.keys.has('ArrowDown')
      const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft')
      const right = this.keys.has('KeyD') || this.keys.has('ArrowRight')
      this.wishDirection.set((right ? 1 : 0) - (left ? 1 : 0), 0, (forward ? 1 : 0) - (back ? 1 : 0))
      if (this.wishDirection.lengthSq() > 0) this.wishDirection.normalize()
      else this.wishDirection.set(0, 0, 0)

      // Head-relative movement, ignoring pitch so walking stays level.
      // `camera.rotation.y` is unreliable here: PointerLockControls stores its
      // rotation as a quaternion built from a YXZ Euler, and reading `.rotation`
      // back in the default XYZ order corrupts the yaw whenever the view is
      // pitched. `getWorldDirection` sidesteps that entirely, and a cross
      // product against world-up gives the true right vector (with the correct
      // sign, so D moves right and A moves left).
      const forwardMove = this.camera.getWorldDirection(new Vector3()).setY(0).normalize()
      const rightMove = new Vector3().crossVectors(forwardMove, UP)
      const move = forwardMove.multiplyScalar(this.wishDirection.z).add(
        rightMove.multiplyScalar(this.wishDirection.x)
      )
      if (move.lengthSq() > 0) move.normalize()

      const approach = 1 - Math.exp(-this.damping * dt)
      this.velocity.lerp(move.multiplyScalar(speed), approach)
      const next = this.camera.position.clone().addScaledVector(this.velocity, dt)
      this.camera.position.copy(this.constrain(next))
    }
  }

  private constrain(next: Vector3): Vector3 {
    const x = Math.max(-(WALL_OFFSET - BODY_RADIUS - 0.1), Math.min(WALL_OFFSET - BODY_RADIUS - 0.1, next.x))
    let z = next.z
    const totalDepth = ROOM_DEPTH * this.roomCount

    // Clamp to the gallery ends.
    z = Math.max(0.2, Math.min(totalDepth - 0.2, z))

    // Only pass through a partition via its doorway.
    for (let i = 1; i < this.roomCount; i++) {
      const boundary = i * ROOM_DEPTH
      const prev = this.camera.position.z
      const crossed = (prev < boundary && z > boundary) || (prev > boundary && z < boundary)
      if (crossed && Math.abs(x) > DOOR_HALF_WIDTH - BODY_RADIUS) {
        // Push back to the side of the wall we came from.
        z = boundary + (prev < boundary ? -BODY_RADIUS : BODY_RADIUS)
      }
    }
    return new Vector3(x, EYE_Y, z)
  }

  private loop = () => {
    if (this.disposed) return
    const dt = Math.min(0.05, 1 / 60)
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
    this.animateId = requestAnimationFrame(this.loop)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animateId)
    window.removeEventListener('resize', this.resizeHandler)
    window.removeEventListener('keydown', this.keydownHandler)
    window.removeEventListener('keyup', this.keyupHandler)
    this.canvas.removeEventListener('pointermove', this.pointermoveHandler)
    this.canvas.removeEventListener('pointerdown', this.pointerdownHandler)
    this.pointerControls.dispose()
    this.renderer.dispose()
  }
}
