"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Trash2, Check, CheckCircle, XCircle, Plus, MoreVertical, Tag, Archive, Download, User } from 'lucide-react'
import { addPhotosToAlbum, createAlbum, getAlbums, getLocalPhotos, getPhotoMetaMap, subscribeStoreChanges, upsertPhotoInfo, upsertPhotoTags, setPhotoConfirmedForPerson, isPhotoConfirmedForPerson, setPhotoArchived, setPhotoDeleted, permanentlyDeletePhoto, type StoredAlbum, type StoredPhotoMeta } from '../lib/mediaStore'

type Photo = {
	id: string
	url: string
	alt?: string
	createdAt: string
}

function formatDateLabel(iso: string) {
	const d = new Date(iso)
	const today = new Date()
	if (
		d.getFullYear() === today.getFullYear() &&
		d.getMonth() === today.getMonth() &&
		d.getDate() === today.getDate()
	) {
		return "Aujourd'hui"
	}
	return d.toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
}

function groupByDay(photos: Photo[]) {
  return photos.reduce((acc: Record<string, Photo[]>, photo) => {
    const key = new Date(photo.createdAt).toISOString().slice(0, 10) // YYYY-MM-DD
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})
}

export default function PhotoGallery({ count = 30, days = 5, query, initialPhotos, personId, mode = 'default' }: { count?: number; days?: number; query?: string; initialPhotos?: Photo[]; personId?: string; mode?: 'default' | 'trash' | 'archive' }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [archivedPhotos, setArchivedPhotos] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<Photo | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectionMenuOpen, setSelectionMenuOpen] = useState(false)
  const [albumPickerOpen, setAlbumPickerOpen] = useState(false)
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle] = useState('')
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  const [downloading, setDownloading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
	const [albums, setAlbums] = useState<StoredAlbum[]>(() => getAlbums())
	const [photoMeta, setPhotoMeta] = useState<Record<string, StoredPhotoMeta>>({})

  useEffect(() => {
    if (initialPhotos && initialPhotos.length) {
      setPhotos(initialPhotos)
      upsertPhotoInfo(initialPhotos)
      setPhotoMeta(getPhotoMetaMap(initialPhotos.map(p => p.id)))
      setLoading(false)
      setError(null)
      return
    }
    // initial load
    setPage(1)
    fetchPhotos({ append: false, page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhotos])

	useEffect(() => {
		return subscribeStoreChanges(() => {
			setAlbums(getAlbums())
			setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
		})
	}, [photos])

  async function fetchPhotos({ append = false, page = 1 }: { append?: boolean; page?: number } = {}) {
		try {
			setLoading(true)
			setError(null)
			const q = query ? `&query=${encodeURIComponent(query)}` : ''
      const res = await fetch(`/api/photos?count=${count}&days=${days}${q}`)
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			const data = await res.json()
			if (!Array.isArray(data.photos)) throw new Error('Invalid response')
      if (!append) {
        const local = getLocalPhotos()
        const combined = [...local, ...data.photos]
        setPhotos(combined)
        upsertPhotoInfo(combined)
        setPhotoMeta(getPhotoMetaMap(combined.map((p: Photo) => p.id)))
      } else {
        setPhotos(prev => {
          const combined = [...prev, ...data.photos]
          upsertPhotoInfo(combined)
          setPhotoMeta(getPhotoMetaMap(combined.map((p: Photo) => p.id)))
          return combined
        })
      }
      // determine if more can be loaded — for random images we'll always allow more, but guard for empty
      if (!data.photos || data.photos.length === 0) setHasMore(false)
		} catch (err: any) {
			setError(err.message || 'Erreur de chargement')
		} finally {
			setLoading(false)
		}
	}

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchPhotos({ append: true, page: next })
  }, [page, loading, hasMore])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) loadMore()
      })
    }, { rootMargin: '200px' })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [loadMore])

	function promptTags(): string[] | null {
		const raw = window.prompt('Ajouter des tags (séparés par des virgules) :')
		if (!raw) return null
		const tags = raw
			.split(',')
			.map(t => t.trim())
			.filter(Boolean)
		if (!tags.length) return null
		return tags
	}

	function addTagsToSelection(tag: string) {
		const ids = Array.from(selectedPhotos)
		if (!ids.length) return
    if (!tag) return
    const tags = tag.split(',').map(t => t.trim()).filter(Boolean)
		upsertPhotoTags(ids, tags)
		setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
    setTagModalOpen(false)
    setNewTag('')
 	}

  function handleAddTag() {
    if (!newTag.trim()) return
    addTagsToSelection(newTag)
  }

  function downloadSelectedPhotos() {
    const ids = Array.from(selectedPhotos)
    if (!ids.length) return
    setDownloading(true)
    const selectedItems = photos.filter(p => selectedPhotos.has(p.id))
    ;(async () => {
      for (const p of selectedItems) {
        try {
          const res = await fetch(p.url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const blob = await res.blob()
          const ext = (blob.type && blob.type.split('/')[1]) || 'jpg'
          const nameBase = (p.alt || p.id).replace(/[^a-z0-9-_\.]/gi, '_')
          const filename = `${nameBase}.${ext}`
          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(blobUrl)
        } catch (err) {
          console.error('Download failed for', p.id, err)
          // fallback: open image in new tab
          window.open(p.url, '_blank')
        }
      }
      setDownloading(false)
    })()
  }

  async function downloadSelectedOne() {
    if (!selected) return
    setDownloading(true)
    try {
      const res = await fetch(selected.url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const ext = (blob.type && blob.type.split('/')[1]) || 'jpg'
      const nameBase = (selected.alt || selected.id).replace(/[^a-z0-9-_\.]/gi, '_')
      const filename = `${nameBase}.${ext}`
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed for', selected.id, err)
      window.open(selected.url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

	function addSelectionToAlbum() {
		if (selectedPhotos.size === 0) return
		setSelectionMenuOpen(false)
		setCreatingAlbum(false)
		setNewAlbumTitle('')
		setAlbumPickerOpen(true)
	}

  function closeAlbumPicker() {
    setAlbumPickerOpen(false)
    setCreatingAlbum(false)
    setNewAlbumTitle('')
  }

  function addSelectionToAlbumId(albumId: string) {
    const ids = Array.from(selectedPhotos)
    if (!ids.length) return
    addPhotosToAlbum(ids, albumId)
    setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
    closeAlbumPicker()
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  function confirmCreateAlbum() {
    const title = newAlbumTitle.trim()
    if (!title) return
    const created = createAlbum(title)
    setAlbums(getAlbums())
    addSelectionToAlbumId(created.id)
  }

	function openModal(photo: Photo) {
		setSelected(photo)
	}

	function closeModal() {
		setSelected(null)
	}

	function showNext() {
		if (!selected) return
		const flat = photos
		const idx = flat.findIndex(p => p.id === selected.id)
		const next = flat[(idx + 1) % flat.length]
		setSelected(next)
	}

	function showPrev() {
		if (!selected) return
		const flat = photos
		const idx = flat.findIndex(p => p.id === selected.id)
		const prev = flat[(idx - 1 + flat.length) % flat.length]
		setSelected(prev)
	}

	const toggleSelect = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(photoId)) {
        newSelection.delete(photoId)
      } else {
        newSelection.add(photoId)
      }
      if (newSelection.size === 0) setSelectionMode(false)
      return newSelection
    })
  }

  const toggleSelectAllInDay = (photos: Photo[], e?: React.MouseEvent) => {
    e?.stopPropagation()
    const allSelected = photos.every(photo => selectedPhotos.has(photo.id))
    
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev)
      if (allSelected) {
        // Désélectionner toutes les photos du jour
        photos.forEach(photo => newSelection.delete(photo.id))
      } else {
        // Sélectionner toutes les photos du jour
        photos.forEach(photo => newSelection.add(photo.id))
      }
      if (newSelection.size === 0) setSelectionMode(false)
      return newSelection
    })
  }

  const archiveSelectedPhotos = () => {
    // persist archive flag in store
    const ids = Array.from(selectedPhotos)
    ids.forEach(id => setPhotoArchived(id, true))
    setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
    setPhotos(prevPhotos => prevPhotos.filter(photo => !selectedPhotos.has(photo.id)))
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  const unarchiveSelectedPhotos = () => {
    const ids = Array.from(selectedPhotos)
    ids.forEach(id => setPhotoArchived(id, false))
    setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  const restoreSelectedPhotos = () => {
    const ids = Array.from(selectedPhotos)
    ids.forEach(id => setPhotoDeleted(id, false))
    setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
    setPhotos(prev => prev.filter(photo => !selectedPhotos.has(photo.id)))
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  const deletePermanentlySelectedPhotos = () => {
    const ids = Array.from(selectedPhotos)
    ids.forEach(id => permanentlyDeletePhoto(id))
    setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
    setPhotos(prev => prev.filter(photo => !selectedPhotos.has(photo.id)))
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  const deleteSelectedPhotos = () => {
    const ids = Array.from(selectedPhotos)
    ids.forEach(id => setPhotoDeleted(id, true))
    setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
    setPhotos(prev => prev.filter(photo => !selectedPhotos.has(photo.id)))
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  const deletePhotosByDate = (date: string) => {
    setPhotos(prev => prev.filter(photo => {
      const photoDate = new Date(photo.createdAt).toISOString().slice(0, 10)
      return photoDate !== date
    }))
    // Nettoyer la sélection si des photos supprimées étaient sélectionnées
    setSelectedPhotos(prev => {
      const newSelection = new Set<string>()
      prev.forEach(id => {
        const photo = photos.find(p => p.id === id)
        if (photo && new Date(photo.createdAt).toISOString().slice(0, 10) !== date) {
          newSelection.add(id)
        }
      })
      return newSelection
    })
  }

	// keyboard navigation
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (!selected) return
			if (e.key === 'Escape') closeModal()
			if (e.key === 'ArrowRight') showNext()
			if (e.key === 'ArrowLeft') showPrev()
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [selected, photos])

	const grouped = groupByDay(photos)
	const dayKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1)) // newest first

	return (
    <div className="space-y-6">
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setTagModalOpen(false)}>
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
              <div className="font-semibold text-blue-900">Ajouter un tag</div>
              <button type="button" className="p-2 rounded hover:bg-gray-100" onClick={() => setTagModalOpen(false)} aria-label="Fermer" title="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600">
                Entrez un ou plusieurs tags séparés par des virgules
              </div>

              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: vacances, été, famille"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {hasMore && (
          <div className="flex justify-center py-4">
            <button onClick={loadMore} disabled={loading} className="px-4 py-2 bg-gray-100 rounded">
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}

        <div ref={sentinelRef} className="h-6" />



      {albumPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeAlbumPicker}>
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
              <div className="font-semibold text-blue-900">Ajouter à un album</div>
              <button type="button" className="p-2 rounded hover:bg-gray-100" onClick={closeAlbumPicker} aria-label="Fermer" title="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <div className="text-sm text-gray-600">
                Choisis un album existant, ou crée un nouvel album.
              </div>

              <div className="max-h-72 overflow-auto rounded-md bg-white">
                {albums.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Aucun album.</div>
                ) : (
                  albums.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => addSelectionToAlbumId(a.id)}
                      className="w-full px-3 py-3 text-sm text-left rounded-md hover:bg-blue-50"
                    >
                      {a.title}
                    </button>
                  ))
                )}
              </div>

              {!creatingAlbum ? (
                <button
                  type="button"
                  onClick={() => setCreatingAlbum(true)}
                  className="w-full mt-2 px-3 py-3 text-sm text-left border border-blue-200 bg-blue-50/50 rounded-md hover:bg-blue-50 flex items-center gap-2 text-blue-900"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter nouvel album
                </button>
              ) : (
                <div className="mt-2 border rounded-md p-3 space-y-2">
                  <div className="text-sm font-medium">Nom du nouvel album</div>
                  <input
                    type="text"
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Vacances 2025"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      onClick={() => {
                        setCreatingAlbum(false)
                        setNewAlbumTitle('')
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                      onClick={confirmCreateAlbum}
                      disabled={!newAlbumTitle.trim()}
                    >
                      Valider
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter des tags */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center ">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className=" text-gray-500 p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-lg font-medium">Ajouter des tags</h3>
              <button 
                type="button" 
                onClick={() => {
                  setTagModalOpen(false)
                  setNewTag('')
                }}
                className="text-white hover:text-gray-200"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Saisissez un ou plusieurs tags séparés par des virgules</p>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ex: vacances, été, famille"
                className="w-full p-2 border border-gray-300 rounded mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTagModalOpen(false)
                    setNewTag('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white rounded ${newTag.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectionMode && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-blue-50 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectionMenuOpen(false)
                setSelectionMode(false)
                setSelectedPhotos(new Set())
              }}
              className="p-2 rounded  hover:bg-gray-50"
              aria-label="Fermer"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
            <CheckCircle className="text-gray-100" size={20} />
            <span className="font-medium">{selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''} sélectionnée{selectedPhotos.size > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'default' && (
              <button
                type="button"
                onClick={deleteSelectedPhotos}
                className="p-2 rounded  hover:bg-gray-50 text-red-600 disabled:opacity-50"
                disabled={selectedPhotos.size === 0}
                aria-label="Supprimer"
                title={`Supprimer (${selectedPhotos.size})`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={addSelectionToAlbum}
              className="p-2 rounded  hover:bg-gray-50 disabled:opacity-50"
              disabled={selectedPhotos.size === 0}
              aria-label="Ajouter à un album"
              title="Ajouter à un album / Créer un album"
            >
              <Plus className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSelectionMenuOpen(v => !v)}
                className="p-2 rounded  hover:bg-gray-50"
                aria-label="Plus d'options"
                title="Plus d'options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {selectionMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMenuOpen(false)
                      setTagModalOpen(true)
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                    disabled={selectedPhotos.size === 0}
                  >
                    <Tag className="w-4 h-4" />
                    Ajouter tag
                  </button>
                  {mode === 'trash' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMenuOpen(false)
                          restoreSelectedPhotos()
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                        disabled={selectedPhotos.size === 0}
                      >
                        <Check className="w-4 h-4" />
                        Restaurer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMenuOpen(false)
                          deletePermanentlySelectedPhotos()
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        disabled={selectedPhotos.size === 0}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer définitivement
                      </button>
                    </>
                  ) : mode === 'archive' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMenuOpen(false)
                          unarchiveSelectedPhotos()
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                        disabled={selectedPhotos.size === 0}
                      >
                        <Check className="w-4 h-4" />
                        Désarchiver
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMenuOpen(false)
                          deleteSelectedPhotos()
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        disabled={selectedPhotos.size === 0}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer (aller à la corbeille)
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMenuOpen(false)
                        archiveSelectedPhotos()
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                      disabled={selectedPhotos.size === 0}
                    >
                      <Archive className="w-4 h-4" />
                      Archiver
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMenuOpen(false)
                      downloadSelectedPhotos()
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                    disabled={selectedPhotos.size === 0}
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {query && (
        <div className="text-sm text-gray-600">Album: <span className="font-medium">{query || 'Sans titre'}</span></div>
      )}
      {loading && !photos.length && (
        <div className="text-sm text-gray-500">Chargement des photos…</div>
      )}
      {dayKeys.map(day => {
        const dayPhotos = grouped[day]
        const allSelected = dayPhotos.every(photo => selectedPhotos.has(photo.id))
        const someSelected = dayPhotos.some(photo => selectedPhotos.has(photo.id))
        return (
          <section key={day} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectionMode && (
                  <button
                    onClick={(e) => toggleSelectAllInDay(dayPhotos, e)}
                    className={`w-5 h-5 rounded flex items-center justify-center ${
                      allSelected ? 'bg-blue-500 text-white' : someSelected ? 'bg-blue-100 border-blue-300' : 'border border-gray-300'
                    }`}
                    title={allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  >
                    {allSelected && <Check size={14} />}
                    {someSelected && !allSelected && <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>}
                  </button>
                )}
                <h3 className={`text-sm ${selectionMode ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                  {formatDateLabel(dayPhotos[0].createdAt)}
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dayPhotos.map(photo => (
                <div
                  key={photo.id}
                  className={`relative rounded overflow-hidden bg-gray-100 group ${
                    selectedPhotos.has(photo.id) ? 'ring-2 ring-gray-100' : ''
                  }`}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(photo.id)
                    } else {
                      openModal(photo)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (selectionMode) {
                        toggleSelect(photo.id)
                      } else {
                        openModal(photo)
                      }
                    }
                  }}
                >
                  <div className="relative w-full h-60">
                    <Image
                      src={photo.url}
                      alt={photo.alt || ''}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement
                        if (!failedImages[photo.id]) {
                          img.src = `https://picsum.photos/800/600?random=${photo.id}`
                          setFailedImages(prev => ({ ...prev, [photo.id]: true }))
                        }
                      }}
                    />
                    {personId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const currently = isPhotoConfirmedForPerson(photo.id, personId)
                          setPhotoConfirmedForPerson(photo.id, personId, !currently)
                          setPhotoMeta(getPhotoMetaMap(photos.map(p => p.id)))
                        }}
                        title={isPhotoConfirmedForPerson(photo.id, personId) ? 'Confirmée' : "Marquer comme cette personne"}
                        className={`absolute top-2 left-2 rounded-full p-1 bg-white/90 hover:bg-white ${isPhotoConfirmedForPerson(photo.id, personId) ? 'ring-2 ring-green-400' : ''}`}
                      >
                        {isPhotoConfirmedForPerson(photo.id, personId) ? <Check className="w-4 h-4 text-green-600"/> : <User className="w-4 h-4 text-gray-800" />}
                      </button>
                    )}
                  </div>
                  <div 
                    className={`absolute inset-0 transition-colors ${
                      selectedPhotos.has(photo.id) ? 'bg-black/30' : 'group-hover:bg-black/10'
                    }`}
                  >
                    {!!photoMeta[photo.id]?.tags?.length && !selectionMode && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full max-w-[85%] truncate">
                        {photoMeta[photo.id].tags.slice(0, 3).join(', ')}
                        {photoMeta[photo.id].tags.length > 3 ? '…' : ''}
                      </div>
                    )}
                    {/* Badge d'archivage */}
                    {archivedPhotos.has(photo.id) && !selectionMode && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                        Archivée
                      </div>
                    )}
                    
                    {/* Bouton de sélection */}
                    <div 
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        selectionMode 
                          ? selectedPhotos.has(photo.id) 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-white/80 text-transparent group-hover:text-gray-600'
                          : 'opacity-0 group-hover:opacity-100 bg-white/80 text-transparent hover:text-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!selectionMode) setSelectionMode(true)
                        toggleSelect(photo.id)
                      }}
                    >
                      <Check size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {!loading && photos.length === 0 && <div className="text-sm text-gray-500">Aucune photo.</div>}

      {/* Modal preview */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectionMode(true)
                  toggleSelect(selected.id)
                  closeModal()
                }}
                className="bg-white/90 rounded-full p-2 hover:bg-white"
                aria-label="Sélectionner cette photo"
                title="Sélectionner cette photo"
              >
                <CheckCircle className="w-4 h-4 text-gray-800" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); downloadSelectedOne() }}
                className={`bg-white/90 rounded-full p-2 hover:bg-white ${downloading ? 'opacity-60 pointer-events-none' : ''}`}
                aria-label="Télécharger"
                title={downloading ? 'Téléchargement...' : 'Télécharger'}
              >
                <Download className="w-4 h-4 text-gray-800" />
              </button>
              <button
                className="bg-white/90 rounded-full p-2 hover:bg-white"
                onClick={closeModal}
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-gray-800" />
              </button>
            </div>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 hover:bg-white"
              onClick={(e) => { e.stopPropagation(); showPrev() }}
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 hover:bg-white"
              onClick={(e) => { e.stopPropagation(); showNext() }}
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
            <div className="bg-white rounded overflow-hidden max-h-[80vh]">
              <div className="w-full h-auto max-h-[80vh] bg-black relative">
                <Image
                  src={selected.url}
                  alt={selected.alt || ''}
                  width={1200}
                  height={900}
                  className="object-contain w-full h-auto"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    if (!failedImages[selected.id]) {
                      img.src = `https://picsum.photos/1200/900?random=${selected.id}`
                      setFailedImages(prev => ({ ...prev, [selected.id]: true }))
                    }
                  }}
                />
              </div>
              <div className="p-3 text-sm text-gray-700">
                {formatDateLabel(selected.createdAt)}
                {selectedPhotos.has(selected.id) && (
                  <span className="ml-2 text-blue-500">
                    <CheckCircle className="inline-block w-4 h-4 mr-1" />
                    Sélectionnée
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
		</div>
	)
}

