"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register as authRegister } from '../../../lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    setError(null)
    try {
      await authRegister(email.trim(), password)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center  bg-gray-800 opacity-95 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
           <div>
            <label className="text-sm text-gray-600">Nom </label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded" type="text" required />
          </div>
          <div>
            <label className="text-sm text-gray-600">Prénom</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded" type="text" required />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded" type="email" required />
          </div>
          <div>
            <label className="text-sm text-gray-600">Mot de passe</label>
            <input value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded" type="password" required />
          </div>
          <div>
            <label className="text-sm text-gray-600">Confirmer mot de passe</label>
            <input value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded" type="password" required />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center justify-between">
            <button className=" mt-4 px-4 py-2 bg-blue-900 text-white rounded" type="submit" disabled={loading}>{loading ? 'Création...' : 'Enregistrer'}</button>
            <Link href="/auth/login" className="mt-4 text-sm text-blue-600">Se connecter</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
