"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  Clock, 
  BarChart2, 
  MessageSquare, 
  Users, 
  CheckSquare, 
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Trash,
  Album,
  BookImage,
  User,
  LogOut,
  Archive,
  BookMarked,
} from 'lucide-react'
import Image from 'next/image'

interface MenuItem {
  icon: React.ReactNode
  label: string
  badge?: number
  active?: boolean
  onClick?: () => void
  path?: string
}

export function Sidebar() {
  const router = useRouter();  // Ajoutez cette ligne
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'blue'>('light');

  const menuItems: MenuItem[] = [
    { 
      icon: <Home size={20} />, 
      label: 'Photos', 
      path: '/'
    },
    { 
      icon: <BookImage size={20} />, 
      label: 'Album',
      path: '/albums' 
    },
    { 
      icon: <Trash size={20} />, 
      label: 'Corbeille',
      path: '/trash' 
    },
    { 
      icon: <Archive size={20} />, 
      label: 'Archive',
      path: '/archive' 
    },
    /*{ 
      icon: <BookMarked size={20} />, 
      label: 'Collection',
      path: '/collection' 
    },*/
  ]
  const handleNavigation = (path: string) => {
    router.push(path)
  }
  const toggleSidebar = () => setCollapsed(!collapsed)
  const toggleDarkMode = () => setDarkMode(!darkMode)

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-white'
      case 'blue':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-white text-gray-800'
    }
  }

  return (
    
        <div className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${
            collapsed ? 'w-22' : 'w-64'
            } ${getThemeClasses()}`}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div 
                className="flex items-center space-x-2 cursor-pointer" 
                onClick={() => {
                    if (collapsed) {
                    setCollapsed(false);
                    }
                }}
                >
                <div className="w-8 h-8 bg-green-400 rounded flex items-center justify-center text-white font-bold"
                    onClick={() => {
                        setCollapsed(true);
                    }}
                >
                    UX
                </div> 
                {!collapsed && <span className="font-semibold">UX Pro</span>}
                </div>
                <button 
                onClick={(e) => {
                    e.stopPropagation();
                    toggleSidebar();
                }}
                className={`p-1 rounded-full ${!collapsed ? 'bg-opacity-20 bg-gray-200' : ' ml-2 bg-opacity-20 bg-gray-200'}`}
                >
                {collapsed ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                </button>
            </div>

            {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-4">
                {menuItems.map((item, index) => (
                    <li
                    key={index}
                    className={`flex items-center p-2  hover:bg-opacity-10 hover:bg-gray-200 rounded-lg cursor-pointer ${
                        item.active 
                    }`}
                    onClick={() => item.path && handleNavigation(item.path)}
                    >
                    <span className="mr-3">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                    {item.badge && !collapsed && (
                        <span className="ml-auto bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                        </span>
                    )}
                    </li>
                ))}
                </ul>
             </nav>
            {/* Theme Toggle - Toujours visible mais en mode icône seulement quand réduit */}
            <div className="border-t border-gray-200 mt-2">
                {!collapsed && (
                <div className=" px-4 py-4 text-xs font-semibold text-gray-400 uppercase">
                    Thème
                </div>
                )}
                <ul className="space-y-1 px-2 pb-4">
                <li>
                    <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setTheme('light');
                        setDarkMode(false);
                    }}
                    className="flex items-center p-3 rounded-lg hover:bg-opacity-10 hover:bg-gray-200"
                    >
                    <Sun size={20} />
                    {!collapsed && <span className="ml-3">Clair</span>}
                    </a>
                </li>
                <li>
                    <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setTheme('dark');
                        setDarkMode(true);
                    }}
                    className="flex items-center p-3 rounded-lg hover:bg-opacity-10 hover:bg-gray-200"
                    >
                    <Moon size={20} />
                    {!collapsed && <span className="ml-3">Sombre</span>}
                    </a>
                </li>
                </ul>
            </div>
        </div>
  )
}