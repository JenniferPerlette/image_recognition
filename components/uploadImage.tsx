"use client"

import { ImagePlus, X, Image as ImageIcon, MoreVertical, Tag, Plus, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, ChangeEvent, useEffect, Fragment } from 'react'
import { Dialog, Menu, Transition } from '@headlessui/react'


interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
  tags: string[];
}

interface ImageUploaderProps {
  onFilesChange?: (files: ImageFile[]) => void
  onUpload: (files: ImageFile[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  showActions?: boolean
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif, image/heic'
const DEFAULT_MAX_SIZE_MB = 5

export function ImageUploader({
  onFilesChange,
  onUpload,
  maxFiles = 20,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  accept = DEFAULT_ACCEPT,
  showActions = true
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previews, setPreviews] = useState<ImageFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [currentImageId, setCurrentImageId] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  useEffect(() => {
  const preventDefault = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Ajoute les écouteurs d'événements au document
  document.addEventListener('dragover', preventDefault);
  document.addEventListener('drop', preventDefault);

  // Nettoie les écouteurs d'événements
  return () => {
    document.removeEventListener('dragover', preventDefault);
    document.removeEventListener('drop', preventDefault);
  };
}, []);
  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(previews)
    }
  }, [previews, onFilesChange])

  const handleFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`Le fichier ${file.name} dépasse la taille maximale de ${maxSizeMB}MB`)
        return false
      }
      if (!file.type.match('image.*')) {
        alert(`Le fichier ${file.name} n'est pas une image valide`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const filesToProcess = validFiles.slice(0, maxFiles - previews.length)
    
    const fileReaders: Promise<ImageFile>[] = filesToProcess.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target?.result as string,
            name: file.name,
            size: file.size,
            type: file.type,
            tags: []
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(fileReaders).then(newFiles => {
      const updatedPreviews = [...previews, ...newFiles].slice(0, maxFiles)
      setPreviews(updatedPreviews)
    })
  }

  const removeImage = (id: string) => {
    const updatedPreviews = previews.filter(img => img.id !== id)
    setPreviews(updatedPreviews)
  }

  const isValidFile = (file: File): boolean => {
  if (!file.type.match('image.*')) {
    console.warn(`Le fichier ${file.name} n'est pas une image valide`)
    return false
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    console.warn(`Le fichier ${file.name} dépasse la taille maximale de ${maxSizeMB}MB`)
    return false
  }
  return true
}

const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  e.stopPropagation()
  if (!isDragging) {
    setIsDragging(true)
  }
}

const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  e.stopPropagation()
  setIsDragging(false)
}

const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  e.stopPropagation()
  setIsDragging(false)
  
  const files = e.dataTransfer.files
  if (files && files.length > 0) {
    // Convertir FileList en tableau et filtrer les fichiers valides
    const validFiles = Array.from(files).filter(isValidFile)
    
    if (validFiles.length > 0) {
      // Créer un nouveau FileList pour le composant
      const dataTransfer = new DataTransfer()
      validFiles.forEach(file => dataTransfer.items.add(file))
      handleFiles(dataTransfer.files)
    }
  }
}

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleAddTag = () => {
    if (currentImageId && newTag.trim() !== '') {
      const updatedPreviews = previews.map(img => 
        img.id === currentImageId 
          ? { ...img, tags: [...img.tags, newTag.trim()] } 
          : img
      );
      setPreviews(updatedPreviews);
      setNewTag('');
      setIsTagModalOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          // Ces deux attributs sont importants
          onDragEnter={(e) => e.preventDefault()}
          onDragEnd={(e) => e.preventDefault()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            transition-colors duration-200
            cursor-pointer
          `}
          // Ajoutez ce style pour certains navigateurs
          style={{ WebkitUserSelect: 'none' }}
        >
        <div className="flex flex-col items-center justify-center space-y-2">
          <ImagePlus className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer text-blue-600 hover:text-blue-500"
            >
              <span>Glissez et déposez des images ici, ou</span>
              <span className="ml-1 font-medium">cliquez pour sélectionner</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept={accept}
                onChange={handleFileInput}
                ref={fileInputRef}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Formats supportés: JPG, PNG, WEBP, HEIC, GIF (max {maxSizeMB}MB par fichier)
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                <Image
                  src={image.preview}
                  alt={image.name}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={() => removeImage(image.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500 truncate flex-1">
                  {image.name}
                </div>
                <Menu as="div" className="relative">
                  <Menu.Button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active: isActive }: { active: boolean }) => (
                            <button
                              className={`${
                                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm`}
                              onClick={() => {
                                setCurrentImageId(image.id);
                                setNewTag('');
                                setIsTagModalOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Ajouter un tag
                            </button>
                          )}
                        </Menu.Item>
                        {image.tags.length > 0 && (
                          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
                            <div className="font-medium mb-1">Tags :</div>
                            <div className="flex flex-wrap gap-1">
                              {image.tags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
              <div className="text-xs text-gray-400">
                {(image.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          ))}
        </div>
      )}
      {showActions && (
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={() => setPreviews([])}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Tout effacer
          </button>
          <button
            onClick={() => onUpload && onUpload(previews)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Téléverser {previews.length} image{previews.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Modal d'ajout de tag */}
      <Transition appear show={isTagModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsTagModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Ajouter un tag
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setIsTagModalOpen(false)}
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrez un tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim() !== '') {
                          handleAddTag();
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      onClick={() => setIsTagModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      disabled={!newTag.trim()}
                      onClick={handleAddTag}
                    >
                      Ajouter
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}