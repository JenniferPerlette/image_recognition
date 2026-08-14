"use client"

import { ChevronDownIcon } from '@heroicons/react/16/solid'
import {  User, Settings, LogOut,X } from 'lucide-react'
import ProfileModal from './profileModal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearToken } from '../lib/auth'

interface User {
  firstName: string
  lastName: string
  email: string
}

interface UserProfileProps {
  user: User
  onLogout?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export function UserProfile({ 
  user, 
  onLogout = () => {}, 
  onProfileClick = () => {},
  onSettingsClick = () => {}
}: UserProfileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const fullName = `${user.firstName} ${user.lastName}`
  const userInitial = user.firstName.charAt(0).toUpperCase()
  const [showProfileModal, setShowProfileModal] = useState(false)

  function handleLogoutClick() {
    try { clearToken() } catch (e) {}
    onLogout()
    setIsMenuOpen(false)
    router.push('/auth/login')
  }
  const handleProfileClick = () => {
  onProfileClick()
  setIsMenuOpen(false)
  setShowProfileModal(true)
}
  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="w-6 h-6 rounded-full bg-blue-950 flex items-center justify-center">
          <span className="text-white font-medium text-sm">{userInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
        </div>
        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
      </div>
    {isMenuOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-950 flex items-center justify-center">
                <span className="text-white font-medium text-lg">{userInitial}</span>
                </div>
                <div>
                <p className="text-sm font-medium text-gray-900">{fullName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                </div>
            </div>
            </div>
            <div className="p-2">
            <button 
                onClick={handleProfileClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md"
              >
                <User className="w-4 h-4 mr-3 text-blue-950" />
                Mon profil
              </button>
            <button 
              onClick={handleLogoutClick}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
            >
                <LogOut className="w-4 h-4 mr-3" />
                Déconnexion
            </button>
            </div>
        </div>
        )}
        {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Mon Profil</h2>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProfileModal onClose={() => setShowProfileModal(false)} />
          </div>
        </div>
    )}
    </div>
    
  )
}