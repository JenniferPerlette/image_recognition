// components/profileModal.tsx
'use client'

import { X, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileModalProps {
  onClose: () => void
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [step, setStep] = useState<'profile' | 'email' | 'code'>('profile')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ici, vous pourriez ajouter la logique pour sauvegarder les modifications
    onClose()
  }

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email) {
      setError('Veuillez entrer votre adresse email')
      return
    }
    // Simuler l'envoi du code par email
    console.log('Code envoyé à', formData.email)
    setStep('code')
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ici, vous devriez valider le code avec votre backend
    // Pour l'exemple, on suppose que le code est "123456"
    if (formData.code === '123456') {
      setError('')
      // Rediriger vers la page d'accueil après validation
      router.push('/')
      onClose()
    } else {
      setError('Code incorrect, veuillez réessayer')
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 ">
          <h2 className="text-xl font-semibold">
            {step === 'profile' ? 'Modifier le profil' : 
             step === 'email' ? 'Réinitialiser le mot de passe' : 
             'Code de vérification'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {step === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre prénom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex items-center text-blue-800 hover:text-blue-950 text-sm"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
                </button>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          ) : step === 'email' ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Envoyer le code
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Un code de vérification a été envoyé à {formData.email}. 
                  Veuillez le saisir ci-dessous.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code de vérification
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Code à 6 chiffres"
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Valider
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}