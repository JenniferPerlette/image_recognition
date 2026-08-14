"use client"

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Check, Trash2 } from 'lucide-react'
import { Sidebar } from '../../components/sidebar'
import PhotoGallery from '../../components/gallery'
import Toast from '../../components/toast'
import {
  getArchivedPhotos,
  unarchiveAll,
  snapshotAndMoveArchivedToTrash,
  restoreLastArchiveMoveSnapshot,
  clearLastArchiveMoveSnapshot,
} from '../../lib/mediaStore'

export default function ArchivePage() {
  const [photos, setPhotos] = useState<any[]>([])

  useEffect(() => {
    setPhotos(getArchivedPhotos())
  }, [])

  function refresh() {
    setPhotos(getArchivedPhotos())
  }

  function restoreAll() {
    if (!confirm('Désarchiver tous les éléments ?')) return
    unarchiveAll()
    refresh()
    setToast({ message: 'Tous les éléments ont été désarchivés' })
    setTimeout(() => setToast(null), 3000)
  }

  function emptyAll() {
    if (!confirm("Vider les archives ? Déplacer tous les éléments vers la corbeille.")) return
    const snap = snapshotAndMoveArchivedToTrash()
    refresh()
    if (!snap) return
    setToast({
      message: 'Archives déplacées vers la corbeille',
      actionLabel: 'Annuler',
      onAction: () => {
        restoreLastArchiveMoveSnapshot()
        refresh()
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        clearLastArchiveMoveSnapshot()
        setToast(null)
      },
    })
    timerRef.current = window.setTimeout(() => {
      clearLastArchiveMoveSnapshot()
      setToast(null)
      timerRef.current = null
    }, 5000)
  }

  const timerRef = useRef<number | null>(null)
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Archives</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreAll}
                aria-label="Désarchiver tout"
                title="Désarchiver tout"
                className="px-3 py-1 bg-gray-100 rounded flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Désarchiver tout</span>
              </button>

              <button
                type="button"
                onClick={emptyAll}
                aria-label="Vider les archives"
                title="Vider les archives"
                className="px-3 py-1 bg-red-50 text-red-700 rounded flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Vider les archives</span>
              </button>

              <button
                type="button"
                onClick={refresh}
                aria-label="Recharger"
                title="Recharger"
                className="p-2 rounded hover:bg-gray-50"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <PhotoGallery initialPhotos={photos} mode="archive" />
          {toast && (
            <Toast
              message={toast.message}
              actionLabel={toast.actionLabel}
              onAction={toast.onAction}
              onClose={() => {
                if (timerRef.current) {
                  clearTimeout(timerRef.current)
                  timerRef.current = null
                }
                clearLastArchiveMoveSnapshot()
                setToast(null)
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}
