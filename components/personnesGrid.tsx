"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react'
interface Person {
  id: string
  image: string
}

export default function PersonnesGrid() {
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPerson, setEditingPerson] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await fetch(
        `https://api.unsplash.com/photos/random?count=12&query=portrait&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`
        )
        const data = await response.json()

        const formattedPeople = (Array.isArray(data) ? data : []).map((photo: any) => ({
          id: String(photo.id),
          image: photo.urls?.thumb,
        }))

        setPeople(formattedPeople)
      } catch (error) {
        console.error('Error fetching people:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPeople()
  }, [])
  const handleDeletePerson = (personId: string) => {
    setPeople(prev => prev.filter(p => p.id !== personId))
  }
  const handleEditPerson = (personId: string, currentName?: string) => {
    setEditingPerson(personId)
    setNewName(currentName || '')
  }
  const handleSaveName = () => {
    if (editingPerson && newName.trim()) {
      setPeople(prev => prev.map(p => 
        p.id === editingPerson ? { ...p, name: newName.trim() } : p
      ))
      setEditingPerson(null)
      setNewName('')
    }
  }
  if (isLoading) {
    return <div className="animate-pulse p-3">Chargement des personnes...</div>
  }

  return (
     <>
      {/* Bouton de retour */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </div>
      {/* Grille de personnes */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-6">
        {people.map((person) => (
          <div key={person.id} className="flex flex-col items-center group relative">
            {/* Actions overlay */}
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDeletePerson(person.id)
                }}
                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Supprimer cette personne"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleEditPerson(person.id, '')
                }}
                className="p-1 bg-blue-950 text-white rounded-full hover:bg-blue-600 transition-colors"
                title="Nommer cette personne"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
            {/* Image de la personne */}
            <Link
              href={`/personnes/}`}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-blue-500">
                <Image
                  src={person.image}
                  alt={ 'Person'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              
            </Link>
            {/* Modal d'édition du nom */}
            {editingPerson === person.id && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setEditingPerson(null)
                  }
                }}
              >
                <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-xl">
                  <div className="p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">Nommer cette personne</h3>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Entrez un nom"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') setEditingPerson(null)
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingPerson(null)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveName}
                        disabled={!newName.trim()}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
