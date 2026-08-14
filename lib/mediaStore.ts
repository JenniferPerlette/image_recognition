export type StoredAlbum = {
  id: string
  title: string
  query: string
  createdAt: string
}

export type StoredPhoto = {
  id: string
  url: string
  alt?: string
  createdAt: string
}

export type StoredPhotoMeta = {
  photoId: string
  tags: string[]
  albumIds: string[]
  url?: string
  alt?: string
  createdAt?: string
  updatedAt: string
  confirmedPersonIds?: string[]
  archived?: boolean
  deleted?: boolean
}

type StoreShape = {
  version: 1
  albums: StoredAlbum[]
  photos: StoredPhoto[]
  photoMeta: Record<string, StoredPhotoMeta>
  persons?: StoredPerson[]
}

export type StoredPerson = {
  id: string
  name?: string
  createdAt: string
}

const STORAGE_KEY = 'photos_app_store_v1'
const STORE_EVENT = 'photos_app_store_changed'
const DELETED_SNAPSHOT_KEY = 'photos_app_last_deleted_snapshot_v1'
const ARCHIVE_MOVE_SNAPSHOT_KEY = 'photos_app_last_archive_move_snapshot_v1'

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function emptyStore(): StoreShape {
  return { version: 1, albums: [], photos: [], photoMeta: {} }
}

export function loadStore(): StoreShape {
  if (!isBrowser()) return emptyStore()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Partial<StoreShape>
    if (!parsed || parsed.version !== 1) return emptyStore()
    return {
      version: 1,
      albums: Array.isArray(parsed.albums) ? (parsed.albums as StoredAlbum[]) : [],
      photos: Array.isArray((parsed as any).photos) ? (((parsed as any).photos) as StoredPhoto[]) : [],
      photoMeta: parsed.photoMeta && typeof parsed.photoMeta === 'object' ? (parsed.photoMeta as Record<string, StoredPhotoMeta>) : {},
    }
  } catch {
    return emptyStore()
  }
}

export function saveStore(next: StoreShape) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(STORE_EVENT))
}

export function subscribeStoreChanges(handler: () => void) {
  if (!isBrowser()) return () => {}
  window.addEventListener(STORE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(STORE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function getAlbums(): StoredAlbum[] {
  return loadStore().albums
}

export function getLocalPhotos(): StoredPhoto[] {
  return loadStore().photos
}

export function addLocalPhotos(input: Array<{ url: string; alt?: string; createdAt?: string }>) {
  const store = loadStore()
  const now = new Date().toISOString()
  const created: StoredPhoto[] = input.map((p, idx) => {
    const id = `local_${Date.now()}_${Math.floor(Math.random() * 1000)}_${idx}`
    return {
      id,
      url: p.url,
      alt: p.alt,
      createdAt: p.createdAt ?? now,
    }
  })
  store.photos = [...created, ...store.photos]
  saveStore(store)
  upsertPhotoInfo(created)
  return created
}

export function addLocalPhotosWithMeta(params: {
  photos: Array<{ url: string; alt?: string; createdAt?: string }>
  tags?: string[]
  albumId?: string
}) {
  const created = addLocalPhotos(params.photos)
  if (params.tags?.length) {
    upsertPhotoTags(
      created.map(p => p.id),
      params.tags
    )
  }
  if (params.albumId) {
    addPhotosToAlbum(
      created.map(p => p.id),
      params.albumId
    )
  }
  return created
}

export function getAlbum(albumId: string): StoredAlbum | undefined {
  return loadStore().albums.find(a => a.id === albumId)
}

export function createAlbum(title: string): StoredAlbum {
  const store = loadStore()
  const album: StoredAlbum = {
    id: `alb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title,
    query: title,
    createdAt: new Date().toISOString(),
  }
  store.albums = [album, ...store.albums]
  saveStore(store)
  return album
}

export function renameAlbum(albumId: string, title: string) {
  const store = loadStore()
  store.albums = store.albums.map(a => (a.id === albumId ? { ...a, title } : a))
  saveStore(store)
}

export function setAlbumQuery(albumId: string, query: string) {
  const store = loadStore()
  store.albums = store.albums.map(a => (a.id === albumId ? { ...a, query } : a))
  saveStore(store)
}

export function deleteAlbum(albumId: string) {
  const store = loadStore()
  store.albums = store.albums.filter(a => a.id !== albumId)
  for (const key of Object.keys(store.photoMeta)) {
    const pm = store.photoMeta[key]
    if (!pm) continue
    if (pm.albumIds.includes(albumId)) {
      store.photoMeta[key] = { ...pm, albumIds: pm.albumIds.filter(id => id !== albumId), updatedAt: new Date().toISOString() }
    }
  }
  saveStore(store)
}

export function getPhotoMeta(photoId: string): StoredPhotoMeta {
  const store = loadStore()
  const existing = store.photoMeta[photoId]
  if (existing) return existing
  return { photoId, tags: [], albumIds: [], updatedAt: new Date().toISOString() }
}

export function getPhotoMetaMap(photoIds: string[]): Record<string, StoredPhotoMeta> {
  const store = loadStore()
  const map: Record<string, StoredPhotoMeta> = {}
  const now = new Date().toISOString()
  for (const id of photoIds) {
    map[id] = store.photoMeta[id] ?? { photoId: id, tags: [], albumIds: [], updatedAt: now }
  }
  return map
}

export function getAlbumPhotoCounts(): Record<string, number> {
  const store = loadStore()
  const counts: Record<string, number> = {}
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    for (const albumId of pm.albumIds) {
      counts[albumId] = (counts[albumId] ?? 0) + 1
    }
  }
  return counts
}

export function upsertPhotoTags(photoIds: string[], tags: string[]) {
  const store = loadStore()
  const now = new Date().toISOString()
  for (const photoId of photoIds) {
    const pm = store.photoMeta[photoId] ?? { photoId, tags: [], albumIds: [], updatedAt: now }
    const merged = Array.from(new Set([...pm.tags, ...tags])).filter(Boolean)
    store.photoMeta[photoId] = { ...pm, tags: merged, updatedAt: now }
  }
  saveStore(store)
}

export function setPhotoTags(photoId: string, tags: string[]) {
  const store = loadStore()
  const now = new Date().toISOString()
  const pm = store.photoMeta[photoId] ?? { photoId, tags: [], albumIds: [], updatedAt: now }
  store.photoMeta[photoId] = { ...pm, tags: tags.filter(Boolean), updatedAt: now }
  saveStore(store)
}

export function addPhotosToAlbum(photoIds: string[], albumId: string) {
  const store = loadStore()
  const now = new Date().toISOString()
  for (const photoId of photoIds) {
    const pm = store.photoMeta[photoId] ?? { photoId, tags: [], albumIds: [], updatedAt: now }
    const albumIds = Array.from(new Set([...pm.albumIds, albumId]))
    store.photoMeta[photoId] = { ...pm, albumIds, updatedAt: now }
  }
  saveStore(store)
}

export function upsertPhotoInfo(photos: Array<{ id: string; url: string; alt?: string; createdAt: string }>) {
  const store = loadStore()
  const now = new Date().toISOString()
  for (const p of photos) {
    const pm = store.photoMeta[p.id] ?? { photoId: p.id, tags: [], albumIds: [], updatedAt: now }
    store.photoMeta[p.id] = { ...pm, url: p.url, alt: p.alt, createdAt: p.createdAt, updatedAt: now }
  }
  saveStore(store)
}

export function getAlbumPhotos(albumId: string): Array<{ id: string; url: string; alt?: string; createdAt: string; tags: string[] }> {
  const store = loadStore()
  const out: Array<{ id: string; url: string; alt?: string; createdAt: string; tags: string[] }> = []
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.albumIds.includes(albumId)) continue
    if (!pm.url || !pm.createdAt) continue
    out.push({ id: pm.photoId, url: pm.url, alt: pm.alt, createdAt: pm.createdAt, tags: pm.tags })
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return out
}

export function getPersons(): StoredPerson[] {
  return loadStore().persons ?? []
}

export function getPerson(id: string): StoredPerson | undefined {
  return (loadStore().persons ?? []).find(p => p.id === id)
}

export function createPerson(name?: string): StoredPerson {
  const store = loadStore()
  const p: StoredPerson = { id: `person_${Date.now()}_${Math.floor(Math.random()*1000)}`, name: name?.trim(), createdAt: new Date().toISOString() }
  store.persons = [p, ...(store.persons ?? [])]
  saveStore(store)
  return p
}

export function renamePerson(id: string, name?: string) {
  const store = loadStore()
  const persons = store.persons ?? []
  const exists = persons.find(p => p.id === id)
  if (exists) {
    store.persons = persons.map(p => p.id === id ? { ...p, name: name?.trim() } : p)
  } else {
    const p: StoredPerson = { id, name: name?.trim(), createdAt: new Date().toISOString() }
    store.persons = [p, ...persons]
  }
  saveStore(store)
}

export function setPhotoConfirmedForPerson(photoId: string, personId: string, confirmed: boolean) {
  const store = loadStore()
  const pm = store.photoMeta[photoId] ?? { photoId, tags: [], albumIds: [], updatedAt: new Date().toISOString(), confirmedPersonIds: [] }
  const list = new Set(pm.confirmedPersonIds ?? [])
  if (confirmed) list.add(personId)
  else list.delete(personId)
  store.photoMeta[photoId] = { ...pm, confirmedPersonIds: Array.from(list), updatedAt: new Date().toISOString() }
  saveStore(store)
}

export function isPhotoConfirmedForPerson(photoId: string, personId: string) {
  const pm = loadStore().photoMeta[photoId]
  if (!pm) return false
  return (pm.confirmedPersonIds ?? []).includes(personId)
}

export function setPhotoArchived(photoId: string, archived: boolean) {
  const store = loadStore()
  const now = new Date().toISOString()
  const pm = store.photoMeta[photoId] ?? { photoId, tags: [], albumIds: [], updatedAt: now }
  store.photoMeta[photoId] = { ...pm, archived: archived ? true : undefined, updatedAt: now }
  saveStore(store)
}

export function setPhotoDeleted(photoId: string, deleted: boolean) {
  const store = loadStore()
  const now = new Date().toISOString()
  const pm = store.photoMeta[photoId] ?? { photoId, tags: [], albumIds: [], updatedAt: now }
  store.photoMeta[photoId] = { ...pm, deleted: deleted ? true : undefined, updatedAt: now }
  saveStore(store)
}

export function getArchivedPhotos(): Array<{ id: string; url: string; alt?: string; createdAt: string }> {
  const store = loadStore()
  const out: Array<{ id: string; url: string; alt?: string; createdAt: string }> = []
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.archived) continue
    if (!pm.url || !pm.createdAt) continue
    out.push({ id: pm.photoId, url: pm.url, alt: pm.alt, createdAt: pm.createdAt })
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return out
}

export function getTrashPhotos(): Array<{ id: string; url: string; alt?: string; createdAt: string }> {
  const store = loadStore()
  const out: Array<{ id: string; url: string; alt?: string; createdAt: string }> = []
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.deleted) continue
    if (!pm.url || !pm.createdAt) continue
    out.push({ id: pm.photoId, url: pm.url, alt: pm.alt, createdAt: pm.createdAt })
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return out
}

export function permanentlyDeletePhoto(photoId: string) {
  const store = loadStore()
  // remove photo meta
  delete store.photoMeta[photoId]
  // remove from photos list
  store.photos = store.photos.filter(p => p.id !== photoId)
  saveStore(store)
}

type DeletedSnapshot = {
  photos: StoredPhoto[]
  photoMeta: Record<string, StoredPhotoMeta>
  createdAt: string
}

export function snapshotAndEmptyTrash(): DeletedSnapshot | null {
  const store = loadStore()
  const idsToDelete: string[] = []
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.deleted) continue
    idsToDelete.push(pm.photoId)
  }
  if (idsToDelete.length === 0) return null
  const photos = store.photos.filter(p => idsToDelete.includes(p.id))
  const pmMap: Record<string, StoredPhotoMeta> = {}
  for (const id of idsToDelete) {
    pmMap[id] = store.photoMeta[id]
    delete store.photoMeta[id]
  }
  store.photos = store.photos.filter(p => !idsToDelete.includes(p.id))
  saveStore(store)
  const snap: DeletedSnapshot = { photos, photoMeta: pmMap, createdAt: new Date().toISOString() }
  try {
    if (isBrowser()) window.localStorage.setItem(DELETED_SNAPSHOT_KEY, JSON.stringify(snap))
  } catch {}
  return snap
}

export function getLastDeletedSnapshot(): DeletedSnapshot | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(DELETED_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DeletedSnapshot
  } catch {
    return null
  }
}

export function restoreLastDeletedSnapshot() {
  const snap = getLastDeletedSnapshot()
  if (!snap) return
  const store = loadStore()
  // re-insert photos at start to preserve visibility
  store.photos = [...snap.photos, ...store.photos]
  for (const [id, pm] of Object.entries(snap.photoMeta)) {
    store.photoMeta[id] = pm
  }
  saveStore(store)
  try {
    if (isBrowser()) window.localStorage.removeItem(DELETED_SNAPSHOT_KEY)
  } catch {}
}

export function clearLastDeletedSnapshot() {
  try {
    if (isBrowser()) window.localStorage.removeItem(DELETED_SNAPSHOT_KEY)
  } catch {}
}

type ArchiveMoveSnapshot = {
  ids: string[]
  createdAt: string
}

export function snapshotAndMoveArchivedToTrash(): ArchiveMoveSnapshot | null {
  const store = loadStore()
  const ids: string[] = []
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.archived) continue
    ids.push(pm.photoId)
    store.photoMeta[pm.photoId] = { ...pm, archived: undefined, deleted: true, updatedAt: new Date().toISOString() }
  }
  if (ids.length === 0) return null
  saveStore(store)
  const snap: ArchiveMoveSnapshot = { ids, createdAt: new Date().toISOString() }
  try {
    if (isBrowser()) window.localStorage.setItem(ARCHIVE_MOVE_SNAPSHOT_KEY, JSON.stringify(snap))
  } catch {}
  return snap
}

export function getLastArchiveMoveSnapshot(): ArchiveMoveSnapshot | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(ARCHIVE_MOVE_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ArchiveMoveSnapshot
  } catch {
    return null
  }
}

export function restoreLastArchiveMoveSnapshot() {
  const snap = getLastArchiveMoveSnapshot()
  if (!snap) return
  const store = loadStore()
  const now = new Date().toISOString()
  for (const id of snap.ids) {
    const pm = store.photoMeta[id] ?? { photoId: id, tags: [], albumIds: [], updatedAt: now }
    store.photoMeta[id] = { ...pm, deleted: undefined, archived: true, updatedAt: now }
  }
  saveStore(store)
  try {
    if (isBrowser()) window.localStorage.removeItem(ARCHIVE_MOVE_SNAPSHOT_KEY)
  } catch {}
}

export function clearLastArchiveMoveSnapshot() {
  try { if (isBrowser()) window.localStorage.removeItem(ARCHIVE_MOVE_SNAPSHOT_KEY) } catch {}
}

export function unarchiveAll() {
  const store = loadStore()
  const now = new Date().toISOString()
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.archived) continue
    store.photoMeta[pm.photoId] = { ...pm, archived: undefined, updatedAt: now }
  }
  saveStore(store)
}

export function restoreAllTrash() {
  const store = loadStore()
  const now = new Date().toISOString()
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.deleted) continue
    store.photoMeta[pm.photoId] = { ...pm, deleted: undefined, updatedAt: now }
  }
  saveStore(store)
}

export function emptyTrash() {
  const store = loadStore()
  const idsToDelete: string[] = []
  for (const pm of Object.values(store.photoMeta)) {
    if (!pm) continue
    if (!pm.deleted) continue
    idsToDelete.push(pm.photoId)
  }
  for (const id of idsToDelete) {
    permanentlyDeletePhoto(id)
  }
}

export function removePhotosFromAlbum(photoIds: string[], albumId: string) {
  const store = loadStore()
  const now = new Date().toISOString()
  for (const photoId of photoIds) {
    const pm = store.photoMeta[photoId]
    if (!pm) continue
    store.photoMeta[photoId] = { ...pm, albumIds: pm.albumIds.filter(id => id !== albumId), updatedAt: now }
  }
  saveStore(store)
}
