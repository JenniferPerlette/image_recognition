"use client"

import { Bell, Check, X } from 'lucide-react'
import { useState } from 'react'
import { Notification } from '../app/types/media'

interface NotificationBellProps {
  notifications?: Notification[]
  onNotificationClick?: (id: string) => void
  onMarkAllAsRead?: () => void
}

export function NotificationBell({ 
  notifications = [], 
  onNotificationClick = () => {},
  onMarkAllAsRead = () => {}
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex space-x-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAllAsRead()
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Tout marquer comme lu
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    onNotificationClick(notification.id)
                    setIsOpen(false)
                  }}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}