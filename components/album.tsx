// components/album.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { getAlbumPhotos } from '../lib/mediaStore' // Assurez-vous d'avoir cette fonction dans votre mediaStore

interface Album {
  id: string
  title?: string
  coverUrl: string
  count: number
}

interface AlbumPhoto {
  id: string
  url: string
  alt?: string
}

export default function Album({ albums }: { albums: Album[] }) {
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null)
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([])
  const [loading, setLoading] = useState(false)

  // Charger les photos lorsque l'album est ouvert
  useEffect(() => {
    if (openAlbum) {
      const loadPhotos = async () => {
        setLoading(true)
        try {
          // Utilisez votre fonction getAlbumPhotos du mediaStore
          const photos = await getAlbumPhotos(openAlbum.id)
          setAlbumPhotos(photos)
        } catch (error) {
          console.error('Erreur lors du chargement des photos:', error)
        } finally {
          setLoading(false)
        }
      }
      loadPhotos()
    }
  }, [openAlbum])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
      {albums.map((album) => (
        <div
          key={album.id}
          className="relative group cursor-pointer"
          onClick={() => setOpenAlbum(album)}
        >
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={album.coverUrl}
              alt={album.title || 'Album sans titre'}
              width={200}
              height={200}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
          </div>
          <div className="mt-2">
            <h3 className="font-medium text-sm">
              {album.title || 'Sans titre'}
            </h3>
            <p className="text-xs text-gray-500">
              {album.count} élément{album.count > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ))}

      {openAlbum && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpenAlbum(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-5xl h-[80vh] flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="font-semibold text-lg">{openAlbum.title ?? 'Sans titre'}</div>
                <div className="text-sm text-gray-500">
                  {albumPhotos.length} photo{albumPhotos.length > 1 ? 's' : ''}
                </div>
              </div>
              <button 
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                onClick={() => setOpenAlbum(null)}
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : albumPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albumPhotos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.alt || 'Photo de l\'album'}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-lg mb-2">Aucune photo dans cet album</p>
                  <p className="text-sm">Ajoutez des photos depuis la galerie</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}