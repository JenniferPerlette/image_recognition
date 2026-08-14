// components/AddAlbumButton.tsx
"use client"

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ImageUploader } from './uploadImage'
import type { ImageFile } from '../app/types/media'

type AddAlbumButtonProps = {
  onAdd: (title: string, files: File[],tags:string[]) => Promise<void>
}

export function AddAlbumButton({ onAdd }: AddAlbumButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1) // 1: Titre, 2: Upload
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<ImageFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFilesChange = (imageFiles: ImageFile[]) => {
   setFiles(imageFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }

    if (files.length === 0) {
      alert('Veuillez ajouter au moins une image')
      return
    }

    setIsSubmitting(true)
    try {
      const tagsList = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      await onAdd(
        title.trim(),
        files.map(f => f.file),
        tagsList
      )
      handleClose()
    } catch (error) {
      console.error('Erreur lors de la création de l\'album:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep(1)
    setTitle('')
    setTags('')
    setFiles([])
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div className="w-full h-36 rounded bg-gray-100 flex flex-col items-center justify-center">
          <Plus className="w-8 h-8 text-gray-400 mb-2" />
          <div className="text-sm text-gray-700">
            <div className="font-medium">Nouvel album</div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div 
            className="bg-white rounded-lg w-full max-w-2xl p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4">
              {step === 1 ? 'Créer un nouvel album' : 'Ajouter des images'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="mb-6">
                  <label htmlFor="album-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'album
                  </label>
                  <input
                    type="text"
                    id="album-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Donnez un nom à votre album"
                    autoFocus
                    required
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <ImageUploader 
                    onFilesChange={handleFilesChange}
                    onUpload={() => {}} // Géré par le bouton de soumission du formulaire
                    maxFiles={50}
                    showActions={false}
                  />
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={step === 1 ? handleClose : () => setStep(1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  {step === 1 ? 'Annuler' : 'Retour'}
                </button>
                
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white ${
                    isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  disabled={isSubmitting || (step === 1 && !title.trim())}
                >
                  {isSubmitting 
                    ? 'Traitement...' 
                    : step === 1 
                      ? 'Suivant' 
                      : 'Créer l\'album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}