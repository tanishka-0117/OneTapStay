'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  LogOut, 
  User, 
  Bell,
  Settings,
  Home
} from 'lucide-react'
import Link from 'next/link'

interface StaffLayoutProps {
  children: React.ReactNode
  facilityName: string
  facilityType: 'restaurant' | 'pool' | 'spa' | 'gym'
}

export default function StaffLayout({ children, facilityName, facilityType }: StaffLayoutProps) {
  const router = useRouter()
  const [staffInfo, setStaffInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkStaffAuth()
  }, [])

  const checkStaffAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (!token || !user) {
        toast.error('Please log in to continue')
        router.push('/staff/auth')
        return
      }

      const userData = JSON.parse(user)
      if (userData.role !== 'STAFF' && userData.role !== 'ADMIN') {
        toast.error('Access denied. Staff credentials required.')
        router.push('/staff/auth')
        return
      }

      setStaffInfo(userData)
    } catch (error) {
      console.error('Auth check failed:', error)
      toast.error('Authentication error')
      router.push('/staff/auth')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/')
  }

  const getFacilityIcon = () => {
    switch (facilityType) {
      case 'restaurant':
        return '🍽️'
      case 'pool':
        return '🏊‍♂️'
      case 'spa':
        return '💆‍♀️'
      case 'gym':
        return '💪'
      default:
        return '🏨'
    }
  }

  const getFacilityColor = () => {
    switch (facilityType) {
      case 'restaurant':
        return 'bg-orange-500'
      case 'pool':
        return 'bg-blue-500'
      case 'spa':
        return 'bg-purple-500'
      case 'gym':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`${getFacilityColor()} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{getFacilityIcon()}</span>
              <div>
                <h1 className="text-xl font-bold">{facilityName}</h1>
                <p className="text-sm opacity-90">Staff Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="text-sm">
                  {staffInfo?.firstName} {staffInfo?.lastName}
                </span>
              </div>
              
              <Link
                href="/admin"
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                title="Admin Dashboard"
              >
                <Home className="h-5 w-5" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}