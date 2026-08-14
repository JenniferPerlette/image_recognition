"use client"

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login as authLogin } from '../../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await authLogin(email.trim(), password)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally { setLoading(false) }
  }

  function handleGoogle() {
    // Stub: in real app, redirect to OAuth2 flow
    // For demo we just simulate success and redirect
    setLoading(true)
    setTimeout(() => {
      // simulate token stored by provider
      localStorage.setItem('auth_token', 'google-demo-token')
      router.push('/')
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 opacity-95 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Se connecter</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded" type="email" required />
          </div>
          <div>
            <label className="text-sm text-gray-600">Mot de passe</label>
            <input value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded" type="password" required />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center justify-between">
            <button className=" mt-4 px-4 py-2 bg-blue-900 text-white rounded" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
            <Link href="/auth/register" className=" mt-4 text-sm text-blue-600">Créer un compte</Link>
          </div>
        </form>

        <div className="my-4 text-center text-sm text-gray-500">ou</div>
        <div>
          <button onClick={handleGoogle} className="w-full px-4 py-2 border rounded flex items-center justify-center gap-2">
            <div className="relative w-10 h-5">
              <Image src="/images/R.png" alt="Google" fill className="object-contain" />
            </div>
            <span>Se connecter avec Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}
