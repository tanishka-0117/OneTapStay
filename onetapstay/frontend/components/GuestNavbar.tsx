'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Bell, User, LogOut } from 'lucide-react'
import OneTapStayLogo from './OneTapStayLogo'

interface GuestNavbarProps {
  userEmail?: string
}

export default function GuestNavbar({ userEmail }: GuestNavbarProps) {
  const router = useRouter()
  const [email, setEmail] = useState(userEmail || '')

  useEffect(() => {
    // If email not provided as prop, try to get it from localStorage or token
    if (!email) {
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          setEmail(userData.email || '')
        } catch (e) {
          console.log('Failed to parse user data')
        }
      }
    }
  }, [email])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <OneTapStayLogo width={32} height={32} />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                OneTapStay
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {email}
            </span>
            <button className="p-2 text-gray-400 hover:text-cyan-600 transition-colors rounded-md hover:bg-cyan-50">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-cyan-600 transition-colors rounded-md hover:bg-cyan-50">
              <User className="h-5 w-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}