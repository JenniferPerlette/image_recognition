"use client"

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Check, Trash2 } from 'lucide-react'
import { Sidebar } from '../../components/sidebar'
import PhotoGallery from '../../components/gallery'
import {
  getTrashPhotos,
  restoreAllTrash,
  // emptyTrash,
  snapshotAndEmptyTrash,
  restoreLastDeletedSnapshot,
  clearLastDeletedSnapshot,
} from '../../lib/mediaStore'
import Toast from '../../components/toast'

export default function TrashPage() {
  const [photos, setPhotos] = useState<any[]>([])

  useEffect(() => {
    setPhotos(getTrashPhotos())
  }, [])

  function refresh() {
    setPhotos(getTrashPhotos())
  }

  function restoreAll() {
    if (!confirm('Restaurer tous les éléments de la corbeille ?')) return
    restoreAllTrash()
    refresh()
  }

  function emptyAll() {
    if (!confirm("Vider la corbeille ? Cette action est irréversible.")) return
    const snap = snapshotAndEmptyTrash()
    refresh()
    if (!snap) return
    // show toast with undo
    setToast({
      message: 'Corbeille vidée',
      actionLabel: 'Annuler',
      onAction: () => {
        restoreLastDeletedSnapshot()
        refresh()
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        clearLastDeletedSnapshot()
        setToast(null)
      },
    })
    // finalize after 5s
    timerRef.current = window.setTimeout(() => {
      clearLastDeletedSnapshot()
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
            <h1 className="text-xl font-semibold">Corbeille</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreAll}
                aria-label="Restaurer tout"
                title="Restaurer tout"
                className="px-3 py-1 bg-gray-100 rounded flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Restaurer tout</span>
              </button>

              <button
                type="button"
                onClick={emptyAll}
                aria-label="Vider la corbeille"
                title="Vider la corbeille"
                className="px-3 py-1 bg-red-50 text-red-700 rounded flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Vider la corbeille</span>
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
          <PhotoGallery initialPhotos={photos} mode="trash" />
          {toast && (
            <Toast
              message={toast.message}
              actionLabel={toast.actionLabel}
              onAction={toast.onAction}
              onClose={() => {
                // finalize if closed
                if (timerRef.current) {
                  clearTimeout(timerRef.current)
                  timerRef.current = null
                }
                clearLastDeletedSnapshot()
                setToast(null)
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}
