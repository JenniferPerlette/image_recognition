"use client"

import { useRouter } from 'next/navigation'
import PhotoGallery from './gallery'
import { useEffect, useState } from 'react'
import { getAlbum, getAlbumPhotos, getAlbumPhotoCounts, subscribeStoreChanges } from '../lib/mediaStore'

export default function AlbumDetail({ id }: { id: string }) {
  const router = useRouter()
  const [album, setAlbum] = useState<{ title: string; query: string; count: number } | null>(null)
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; alt?: string; createdAt: string }>>([])

  useEffect(() => {
    const sync = () => {
      const a = getAlbum(id)
      if (!a) {
        setAlbum(null)
        setPhotos([])
        return
      }
      const counts = getAlbumPhotoCounts()
      setAlbum({ title: a.title, query: a.query, count: counts[id] ?? 0 })
      setPhotos(getAlbumPhotos(id))
    }
    sync()
    return subscribeStoreChanges(sync)
  }, [id])

  if (!album) return <div className="p-6">Album introuvable.</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl text-gray-500 font-semibold">{album.title ?? 'Sans titre'}</h1>
          <div className="text-sm text-gray-500">{album.count} élément{album.count > 1 ? 's' : ''}</div>
        </div>
        <div>
          <button className="px-3 py-1 text-white bg-blue-950 rounded" onClick={() => router.push('/albums')}>Retour</button>
        </div>
      </div>

      <PhotoGallery initialPhotos={photos} />
    </div>
  )
}
