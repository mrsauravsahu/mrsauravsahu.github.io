import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Fog,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  RectAreaLight,
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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

import type { Photo, Project } from '$lib/server/photos'

// The room dark: walls, floor and ceiling are the near-black gallery wall. The
// only things carrying colour are the cream mats, the prints themselves, and
// the sparse amber safelight — matching DESIGN.md's palette exactly.

const FLOOR_Y = 0
const CEIL_Y = 5.1
const EYE_Y = 1.6
const WALL_OFFSET = 5 // half-width of the corridor (side walls at x = ±5)
const ROOM_DEPTH = 11
const DOOR_HALF_WIDTH = 1
const DOOR_HEIGHT = 3
const BODY_RADIUS = 0.45
const MIN_WALL_DISTANCE = 1.0

const WALL_COLOR = 0xd9cdb2
const SURFACE_COLOR = 0xcfc2a6
const ACCENT = 0xd9a441
const WARM_LIGHT = 0xfff2dc
const GOLD_OUTER = 0x8a6a25
const GOLD_MID = 0xd4a83a
const GOLD_HIGHLIGHT = 0xf2d27a
const LINER_COLOR = 0xf5efe2
const FRAME_BORDER = 0.22
const LINER_BORDER = 0.2
const FRAME_DEPTH = 0.06
const LINER_DEPTH = 0.03
// Same 4:3 landscape shape as the homepage Polaroids (`.tile-frame` pads to
// 75%, i.e. a 4:3 frame) with centre-crop cover, so every photograph reads as a
// uniform landscape painting regardless of the original's aspect.
const PRINT_ASPECT = 4 / 3
const PRINT_HEIGHT = 0.62
const PRINT_WIDTH = PRINT_HEIGHT * PRINT_ASPECT
const FRAME_CENTER_Y = 2.1
const CEILING_LIGHT_Y = CEIL_Y - 0.15
const PICTURE_LIGHT_REACH = 0.55
const UP = new Vector3(0, 1, 0)

// The liner is a lit surface (MeshStandardMaterial) so it can be washed by the
// picture light above each print rather than glowing on its own.
type Frame = {
  group: Group
  photo: Photo
  linerMaterial: MeshStandardMaterial
  baseLinerColor: Color
}

type HoverHandler = (photo: Photo | null) => void
type OpenHandler = (photo: Photo) => void
type RoomHandler = (index: number, total: number) => void
type ExitHandler = () => void
type MinimapHandler = (state: {
  x: number
  z: number
  dirX: number
  dirZ: number
  totalDepth: number
  wallOffset: number
  roomDepth: number
  rooms: number
  doorHalfWidth: number
  paintings: { x: number; z: number }[]
}) => void

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
  private roomSigns: Object3D[] = []
  private pictureLights: Object3D[] = []
  private roomCount = 0
  private currentRoom = 0
  private exitZ = 0

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
    private onRoom: RoomHandler,
    private onExit: ExitHandler,
    private onMinimap: MinimapHandler
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
    RectAreaLightUniformsLib.init()

    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.setPixelRatio(window.devicePixelRatio)

    // Image-based lighting: a neutral "room" environment gives the metallic
    // frames real reflections so they read as gilt wood instead of flat black.
    const pmrem = new PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    // The neutral environment provides gilt-frame reflections but is
    // deliberately dimmed: at its default of 1.0 it flattens the whole room
    // into grey and robs the picture lights of their contrast.
    this.scene.environmentIntensity = 0.3

    this.camera = new PerspectiveCamera(55, 1, 0.1, 200)
    this.camera.position.set(0, EYE_Y, ROOM_DEPTH / 2)
    this.faceEntryStart()

    this.pointerControls = new PointerLockControls(this.camera, this.canvas)
    this.scene.background = new Color(WALL_COLOR)
    this.scene.fog = new Fog(WALL_COLOR, 14, 60)

    this.setupStructure()
    this.setupLights()

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
    // Keep the base light low: the RoomEnvironment already provides the ambient
    // bounce, so this only lifts the shadows slightly warm instead of stacking
    // another full-brightness ambient on top of it.
    this.scene.add(new AmbientLight(0xffd9b8, 0.35))

    // One broad ceiling panel per room. Area lights give the soft, spread-out
    // museum wash (with wrapped, width-based falloff) that a cone of hard spots
    // cannot, avoiding the flat over-bright look of many overlapping spots.
    for (let i = 0; i < 4; i++) {
      const z = i * ROOM_DEPTH + ROOM_DEPTH / 2
      const light = new RectAreaLight(0xffe2bd, 7, WALL_OFFSET * 1.6, 5.5)
      light.position.set(0, CEIL_Y - 0.35, z)
      light.lookAt(0, 0, z)
      this.scene.add(light)
    }
  }

  private addPictureLights() {
    const bezelGeometry = new CylinderGeometry(0.11, 0.11, 0.045, 24)
    const lampGeometry = new CylinderGeometry(0.045, 0.045, 0.02, 24)

    // An emissive circular ceiling can plus the bright warm puck inside it,
    // paired with a spotlight aimed back at its print. The can sits a little
    // in front of the wall (toward the corridor) so its beam strikes the
    // vertical painting face instead of grazing straight down the wall.
    for (const f of this.frames) {
      const pos = f.group.position
      const lightX = pos.x - Math.sign(pos.x) * PICTURE_LIGHT_REACH

      const bezel = new Mesh(bezelGeometry, new MeshBasicMaterial({ color: WARM_LIGHT }))
      bezel.position.set(lightX, CEILING_LIGHT_Y, pos.z)
      this.scene.add(bezel)

      const lamp = new Mesh(lampGeometry, new MeshBasicMaterial({ color: WARM_LIGHT }))
      lamp.position.set(lightX, CEILING_LIGHT_Y - 0.035, pos.z)
      this.scene.add(lamp)

      const light = new SpotLight(0xffe9c8, 34, 0, Math.PI / 4.5, 0.55, 2)
      light.position.set(lightX, CEILING_LIGHT_Y, pos.z)
      light.target.position.set(pos.x, FRAME_CENTER_Y, pos.z)
      this.scene.add(light, light.target)
      light.castShadow = false

      this.pictureLights.push(bezel, lamp, light, light.target)
    }
  }

  private clearPictureLights() {
    for (const obj of this.pictureLights) {
      const mesh = obj as MeshT
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else if (mat) mat.dispose()
      this.scene.remove(obj)
    }
    this.pictureLights = []
  }

  private setupStructure() {
    const wallMat = new MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.95 })
    // Plush carpet: soft, matte and uniform so the corridor reads as a museum
    // floor that swallows light rather than reflecting it.
    const floorMat = new MeshStandardMaterial({ color: 0x6b5a48, roughness: 1 })
    const trimMat = new MeshStandardMaterial({ color: 0xbfae8c, roughness: 0.6, metalness: 0.1 })
    // The ceiling catches almost no direct light (the panels point downward),
    // so give it a faint warm emissive to read as a softly-bounced surface
    // instead of a black void overhead.
    const ceilMat = new MeshStandardMaterial({
      color: 0xe3d9c1,
      roughness: 0.95,
      emissive: 0x2b2618,
      emissiveIntensity: 0.25
    })

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

    // Crown molding and baseboard along both side walls so the junction between
    // wall, floor and ceiling reads as a finished gallery rather than bare slabs.
    for (const side of [-1, 1]) {
      const x = side * (half - 0.1)
      addBox(0.22, 0.16, totalDepth, x, CEIL_Y - 0.08, totalDepth / 2, trimMat)
      addBox(0.24, 0.18, totalDepth, x, 0.09, totalDepth / 2, trimMat)
    }

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

    // Exit door on the far wall (behind the last room), so the hall reads as
    // having a natural way out rather than a dead end.
    this.exitZ = totalDepth
    this.addExitDoor(totalDepth, Math.PI)
    // Matching door behind the starting position so the tour can loop back out.
    this.addExitDoor(0, 0)

    this.addBenches()
  }

  private addBenches() {
    const seatMat = new MeshStandardMaterial({ color: 0x5a4227, roughness: 0.65 })
    const legMat = new MeshStandardMaterial({ color: 0x2f2a22, roughness: 0.7, metalness: 0.25 })
    const BENCH_LENGTH = 1.7
    const BENCH_HEIGHT = 0.45
    const BENCH_DEPTH = 0.45

    // Bench per room, set against the wall opposite that room's paintings.
    for (let room = 0; room < 4; room++) {
      const side = room % 2 === 0 ? 1 : -1
      const z = room * ROOM_DEPTH + ROOM_DEPTH / 2

      const group = new Group()

      const seat = new Mesh(new BoxGeometry(BENCH_LENGTH, 0.07, BENCH_DEPTH), seatMat)
      seat.position.y = BENCH_HEIGHT
      group.add(seat)

      for (const s of [-1, 1]) {
        const leg = new Mesh(new BoxGeometry(0.08, BENCH_HEIGHT, 0.08), legMat)
        leg.position.set(s * (BENCH_LENGTH / 2 - 0.08), BENCH_HEIGHT / 2, 0)
        group.add(leg)
      }

      // Set the bench one bench-width off the wall, oriented so its length runs
      // along the corridor and leaving clear walking space behind it.
      group.position.set(side * (WALL_OFFSET - BENCH_DEPTH * 1.5), 0, z)
      group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2
      this.scene.add(group)
    }
  }

  // Start just inside the entry door, between the doorway and the left wall,
  // looking down the corridor so both the left wall's paintings and the right
  // wall's city signage are in frame.
  private faceEntryStart() {
    this.camera.position.set(2.2312594948877655, EYE_Y, 0.5)
    this.camera.lookAt(2.167773230648081, EYE_Y, 1.4979827124018178)
  }

  private addRoomSigns(projects: Project[]) {
    const titleCase = (slug: string) =>
      slug
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

    for (let room = 0; room < projects.length; room++) {
      const label = titleCase(projects[room].title || projects[room].slug).toUpperCase()
      // Large painted city name on the wall opposite the room's paintings,
      // so the empty wall carries the label. Side alternates with the art.
      const side = room % 2 === 0 ? 1 : -1
      const z = room * ROOM_DEPTH + ROOM_DEPTH / 2

      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = '500 150px Geist, ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#4a4034'
      ctx.fillText(label, canvas.width / 2, canvas.height / 2)

      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      const material = new MeshStandardMaterial({
        map: texture,
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        depthWrite: false
      })
      const sign = new Mesh(new PlaneGeometry(3.6, 0.9), material)
      sign.position.set(side * (WALL_OFFSET - 0.12), CEIL_Y / 2, z)
      sign.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2
      this.scene.add(sign)
      this.roomSigns.push(sign)
    }
  }

  private emitMinimap() {
    const dir = this.camera.getWorldDirection(new Vector3()).setY(0).normalize()
    this.onMinimap({
      x: this.camera.position.x,
      z: this.camera.position.z,
      dirX: dir.x,
      dirZ: dir.z,
      totalDepth: ROOM_DEPTH * this.roomCount,
      wallOffset: WALL_OFFSET,
      roomDepth: ROOM_DEPTH,
      rooms: this.roomCount,
      doorHalfWidth: DOOR_HALF_WIDTH,
      paintings: this.frames.map((f) => ({ x: f.group.position.x, z: f.group.position.z }))
    })
  }

  private addExitDoor(z: number, signRotation: number) {
    // A lighter, clearly framed door panel so the way out reads against the
    // wall instead of disappearing into it.
    const doorWidth = DOOR_HALF_WIDTH * 2
    const doorHeight = DOOR_HEIGHT
    const doorMaterial = new MeshStandardMaterial({ color: 0x4a4032, roughness: 0.7 })
    const doorZ = z === 0 ? 0.12 : z - 0.12
    const door = new Mesh(new PlaneGeometry(doorWidth, doorHeight), doorMaterial)
    door.position.set(0, doorHeight / 2, doorZ)
    this.scene.add(door)

    // Door casing (jamb + lintel) in warm wood so it reads as a portal.
    const casingMat = new MeshStandardMaterial({ color: 0x6b5738, roughness: 0.8 })
    const casingThick = 0.09
    const casingDepth = 0.1
    const outerW = doorWidth + casingThick * 2
    const outerH = doorHeight + casingThick * 2
    const addCasing = (w: number, h: number, x: number, y: number) => {
      const c = new Mesh(new BoxGeometry(w, h, casingDepth), casingMat)
      c.position.set(x, y, z === 0 ? 0.06 : z - 0.06)
      this.scene.add(c)
    }
    // Top lintel, left jamb, right jamb.
    addCasing(outerW, casingThick, 0, doorHeight + casingThick / 2)
    addCasing(casingThick, doorHeight, -doorWidth / 2 - casingThick / 2, doorHeight / 2)
    addCasing(casingThick, doorHeight, doorWidth / 2 + casingThick / 2, doorHeight / 2)

    const text = 'EXIT'

    // Green EXIT lettering baked onto a plain transparent plane, painted above
    // the door — matte and lit by the room rather than glowing on its own.
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '600 96px Geist Mono, ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#4f8f5a'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    const signMaterial = new MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0
    })
    const sign = new Mesh(new PlaneGeometry(1.0, 0.32), signMaterial)
    sign.position.set(0, DOOR_HEIGHT - 0.25, z === 0 ? 0.16 : z - 0.16)
    sign.rotation.y = signRotation
    this.scene.add(sign)
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

    // Lit so the mat is white near its picture light and falls off into the
    // darker room, reading as a real illuminated surface instead of a glow.
    const linerMaterial = new MeshStandardMaterial({ color: LINER_COLOR, roughness: 0.9 })
    const liner = new Mesh(new PlaneGeometry(line(photoWidth), line(photoHeight)), linerMaterial)
    group.add(liner)

    // A layered gilt frame (deep base, mid rail, raised inner lip) that reads
    // like the ornate mouldings in a Parisian gallery rather than a flat bar.
    const frameGroup = new Group()

    // Gilt wood reads best with less mirror shine and more surface grain:
    // metalness stays modest, roughness goes a little higher so the frame
    // catches light without turning into polished chrome.
    const baseMat = new MeshStandardMaterial({ color: GOLD_OUTER, roughness: 0.75, metalness: 0.3 })
    const midMat = new MeshStandardMaterial({ color: GOLD_MID, roughness: 0.65, metalness: 0.35 })
    const lipMat = new MeshStandardMaterial({ color: GOLD_HIGHLIGHT, roughness: 0.55, metalness: 0.4 })

    const rebuildFrame = (outerW: number, outerH: number, innerW: number, innerH: number) => {
      const halfOuterW = outerW / 2
      const halfOuterH = outerH / 2
      const halfInnerW = innerW / 2
      const halfInnerH = innerH / 2
      const base = FRAME_BORDER
      const mid = FRAME_BORDER * 0.6
      const lip = FRAME_BORDER * 0.35

      // Each layer is four bars; depth steps so the inner edges catch light.
      const layers = [
        { wUp: outerW, wSide: base, hUp: base, hSide: innerH, mat: baseMat, z: -FRAME_DEPTH, inset: 0 },
        { wUp: line(photoWidth) + mid * 2, wSide: mid, hUp: mid, hSide: innerH, mat: midMat, z: -FRAME_DEPTH + 0.012, inset: base - mid },
        { wUp: line(photoWidth) + lip * 2, wSide: lip, hUp: lip, hSide: innerH, mat: lipMat, z: LINER_DEPTH + 0.004, inset: base - lip }
      ]

      for (const layer of layers) {
        // top / bottom
        const tbY = halfOuterH - layer.inset - layer.hUp / 2
        const leftRightX = halfOuterW - layer.inset - layer.wSide / 2
        const barTop = new Mesh(new BoxGeometry(layer.wUp, layer.hUp, FRAME_DEPTH), layer.mat)
        barTop.position.set(0, tbY, layer.z)
        frameGroup.add(barTop)
        const barBottom = new Mesh(new BoxGeometry(layer.wUp, layer.hUp, FRAME_DEPTH), layer.mat)
        barBottom.position.set(0, -tbY, layer.z)
        frameGroup.add(barBottom)
        // left / right
        const barLeft = new Mesh(new BoxGeometry(layer.wSide, layer.hSide, FRAME_DEPTH), layer.mat)
        barLeft.position.set(-leftRightX, 0, layer.z)
        frameGroup.add(barLeft)
        const barRight = new Mesh(new BoxGeometry(layer.wSide, layer.hSide, FRAME_DEPTH), layer.mat)
        barRight.position.set(leftRightX, 0, layer.z)
        frameGroup.add(barRight)
      }
    }

    rebuildFrame(outerWidth(), outerHeight(), line(photoWidth), line(photoHeight))
    group.add(frameGroup)

    const printGeometry = new PlaneGeometry(photoWidth, photoHeight)
    // Lit (Standard) so the picture light above actually shapes the print;
    // `color` is white so it only multiplies the texture, never darkens it.
    const photoMaterial = new MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
    const print = new Mesh(printGeometry, photoMaterial)
    print.position.z = LINER_DEPTH
    group.add(print)

    // Small square caption card below the frame, aligned to the painting's left
    // or right edge so it reads as a wall label rather than a floating dot.
    const cardText = (photo.caption || '').trim()
    if (cardText) {
      const cardCanvas = document.createElement('canvas')
      cardCanvas.width = 256
      cardCanvas.height = 256
      const cctx = cardCanvas.getContext('2d')!
      cctx.clearRect(0, 0, cardCanvas.width, cardCanvas.height)
      cctx.font = '700 22px Geist, ui-sans-serif, system-ui, sans-serif'
      cctx.textAlign = 'left'
      cctx.textBaseline = 'top'
      cctx.fillStyle = '#ffffff'
      cctx.fillText(cardText, 14, 20, cardCanvas.width - 28)

      const cardTexture = new CanvasTexture(cardCanvas)
      cardTexture.colorSpace = SRGBColorSpace
      cardTexture.minFilter = LinearFilter
      cardTexture.magFilter = LinearFilter
      const cardMat = new MeshStandardMaterial({
        color: 0xf7f1e2,
        roughness: 0.85,
        metalness: 0
      })
      cardMat.map = cardTexture
      cardMat.needsUpdate = true
      const cardSize = PRINT_WIDTH / 6
      const card = new Mesh(new PlaneGeometry(cardSize, cardSize), cardMat)
      const side = Math.random() < 0.5 ? -1 : 1
      const cardX = side * (outerWidth() / 2 - cardSize / 2)
      card.position.set(cardX, -outerHeight() / 2 - 0.22, LINER_DEPTH + 0.005)
      group.add(card)
    }

    // Load the real image, then rebuild both planes to the true aspect ratio.
    new TextureLoader().load(photo.full, (texture) => {
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearMipmapLinearFilter
      texture.magFilter = LinearFilter
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
      texture.generateMipmaps = true
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
      // All paintings for a room hang on one side wall, leaving the opposite
      // wall empty for the city name; the side switches each room.
      const side = room % 2 === 0 ? -1 : 1
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const frame = this.frameFor(photo)
        // Spread frames evenly through the room depth.
        const t = photos.length === 1 ? 0.5 : i / (photos.length - 1)
        const z = room * ROOM_DEPTH + 1.5 + t * (ROOM_DEPTH - 3)
        frame.position.set(side * (WALL_OFFSET - 0.18), FRAME_CENTER_Y, z)
        frame.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2
        this.scene.add(frame)
      }
    }
  }

  setProjects(projects: Project[]) {
    // The loader may re-run; clear any stale frames first.
    this.clearPictureLights()
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
    for (const sign of this.roomSigns) {
      this.scene.remove(sign)
      const m = sign as MeshT
      if (m.geometry) m.geometry.dispose()
      const mat = m.material
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
      else if (mat) mat.dispose()
    }
    this.roomSigns = []
    this.roomCount = projects.length
    this.placeFrames(projects)
    this.addRoomSigns(projects)
    this.addPictureLights()
    this.currentRoom = 0
    this.faceEntryStart()
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
      const speed = 4
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
    const maxX = WALL_OFFSET - BODY_RADIUS - MIN_WALL_DISTANCE
    const x = Math.max(-maxX, Math.min(maxX, next.x))
    let z = next.z
    const totalDepth = ROOM_DEPTH * this.roomCount

    // The render loop starts before `setProjects` has populated the rooms; with
    // a zero-depth hall the exit check below would fire instantly. Wait until
    // the hall is actually laid out before treating the far wall as the exit.
    if (this.roomCount === 0) return new Vector3(x, EYE_Y, z)

    // Keep the player a short distance from the far wall unless they are in the
    // doorway (near x = 0), which is where the exit lives.
    const nearDoor = Math.abs(x) < DOOR_HALF_WIDTH
    const farLimit = totalDepth - (nearDoor ? 0.4 : MIN_WALL_DISTANCE)

    // Walking through the exit door returns the user to the website.
    if (nearDoor && z > totalDepth - 0.55) {
      this.onExit()
      return new Vector3(x, EYE_Y, totalDepth - 0.6)
    }

    // Clamp to the gallery ends (start wall plus the far-door limit).
    z = Math.max(0.5, Math.min(farLimit, z))

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
    this.emitMinimap()
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
