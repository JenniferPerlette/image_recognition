"use client"

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import PhotoGallery from '../../../components/gallery'
import { getPerson, renamePerson } from '../../../lib/mediaStore'
import { CheckCircle2, Trash2, Pencil,X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PersonPage({ params }: { params: { id: string } }) {
  const id = params.id
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [person, setPerson] = useState<{ id: string; name?: string } | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const p = getPerson(id)
    if (p) {
      setPerson(p)
      setName(p.name ?? '')
    } else {
      setPerson({ id, name: '' })
    }
  }, [id])

  function saveName() {
    if (name.trim()) {
      renamePerson(id, name.trim())
      setPerson(prev => prev ? { ...prev, name: name.trim() } : null)
    }
    setShowNameModal(false)
  }
  const handleDeletePerson = () => {
  if (confirm(`Voulez-vous vraiment supprimer cette personne ?`)) {
    // Implémentez la logique de suppression ici
    console.log('Personne supprimée:', id)
    // Rediriger vers la liste des personnes après suppression
    window.location.href = '/personnes'
  }
}
const toggleConfirmation = () => {
  const newState = !isConfirmed
  setIsConfirmed(newState)
  // Implémentez la logique de confirmation ici
  console.log('Statut de confirmation:', newState)
}
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                  <Link 
                    href="/personnes" 
                    className="text-gray-600 hover:text-gray-900  rounded-full hover:bg-gray-100"
                    title="Retour à la liste des personnes"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  <h1 className="text-md font-semibold text-gray-900">
                    {person?.name || 'Personne sans nom'}
                  </h1>
                </div>
               <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">{isConfirmed ? 'Confirmé' : 'Non confirmé'}</span>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={toggleConfirmation}
                      className={`p-1.5 rounded-full ${
                        isConfirmed ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={isConfirmed ? 'Personne confirmée' : 'Confirmer les photos'}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isConfirmed ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setShowNameModal(true)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full"
                      title="Modifier le nom"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDeletePerson}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                      title="Supprimer les photos de cette personne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Photos de cette personne
              </div>
            </div>

            <PhotoGallery query={person?.name} personId={id} />
          </div>
        </div>
      </main>

      {/* Modal de modification du nom */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Modifier le nom
                </h3>
                <button
                  onClick={() => {
                    setShowNameModal(false)
                    setName(person?.name ?? '')
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="personName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom de la personne
                  </label>
                  <input
                    type="text"
                    id="personName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Entrez le nom"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName()
                      if (e.key === 'Escape') {
                        setShowNameModal(false)
                        setName(person?.name ?? '')
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setShowNameModal(false)
                      setName(person?.name ?? '')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveName}
                    disabled={!name.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}