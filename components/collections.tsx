// components/collections.tsx
"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState ,useMemo} from 'react'
import { AddAlbumButton } from './AddAlbumButton'
import { createAlbum, getAlbumPhotoCounts, getAlbums, subscribeStoreChanges, type StoredAlbum } from '../lib/mediaStore'

type Collection = StoredAlbum

export default function Collections({ initialCount = 8 }: { initialCount?: number }) {
  const [items, setItems] = useState<Collection[]>(() => {
    const existing = getAlbums()
    if (existing.length) return existing
    for (let i = 0; i < initialCount; i++) {
      createAlbum(`Album ${i + 1}`)
    }
    return getAlbums()
  })

  const [counts, setCounts] = useState<Record<string, number>>(() => getAlbumPhotoCounts())

  useEffect(() => {
    const onChange = () => {
      setItems(getAlbums())
      setCounts(getAlbumPhotoCounts())
    }
    return subscribeStoreChanges(onChange)
  }, [])

  const handleAddAlbum = (title: string, files: File[] = [], tags: string[] = []) => {
    const created = createAlbum(title)
    setItems(prev => [created, ...prev])
    setCounts(getAlbumPhotoCounts())
    return Promise.resolve()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-gray-500 font-semibold">Albums</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AddAlbumButton onAdd={handleAddAlbum} />

        {items.map(col => (
          <Link key={col.id} href={`/albums/${col.id}`} className="block p-3 bg-white rounded-lg shadow hover:shadow-md">
            <div className="relative h-40 rounded overflow-hidden mb-2 bg-gray-100">
              <Image
                src={`https://source.unsplash.com/random/800x600?${encodeURIComponent(col.query)}&sig=${col.id}`}
                alt={col.title ?? col.query}
                fill
                className="object-cover w-full h-full"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  if (!img.src.includes('picsum')) {
                    img.src = `https://picsum.photos/seed/${encodeURIComponent(col.id + '-' + col.query)}/800/600`
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-700">
              <div className="font-medium">{col.title ?? 'Sans titre'}</div>
              <div className="text-xs text-gray-500">{counts[col.id] ?? 0} élément{(counts[col.id] ?? 0) !== 1 ? 's' : ''}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}