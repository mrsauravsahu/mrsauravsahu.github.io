import { groupPhotos, loadPhotos } from '$lib/server/photos'

export const load = async () => {
  const photos = await loadPhotos()
  return { projects: groupPhotos(photos) }
}
