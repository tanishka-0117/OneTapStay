'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import OneTapStayLogo from './OneTapStayLogo'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{name: string, role: string} | null>(null)

  // Show different navbar styles based on page
  const isAuthPage = pathname?.startsWith('/auth/')
  const isHomePage = pathname === '/'
  const isAdminPage = pathname?.startsWith('/admin')

  useEffect(() => {
    // Get user info from localStorage
    const token = localStorage.getItem('token')
    const firstName = localStorage.getItem('firstName')
    const lastName = localStorage.getItem('lastName')
    const role = localStorage.getItem('role')

    if (token && firstName && role) {
      setUser({
        name: `${firstName} ${lastName}`,
        role
      })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('firstName')
    localStorage.removeItem('lastName')
    localStorage.removeItem('role')
    setUser(null)
    router.push('/auth/login')
  }

  // Different navbar for different pages
  if ((isAuthPage && !isHomePage) || isAdminPage) {
    return (
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <OneTapStayLogo width={32} height={32} />
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  OneTapStay
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  if (!user) {
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
            {!isAdminPage && (
              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-gray-700 hover:text-cyan-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-cyan-50">
                  Features
                </Link>
                <Link href="#properties" className="text-gray-700 hover:text-cyan-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-cyan-50">
                  Solutions
                </Link>
                <Link href="#contact" className="text-gray-700 hover:text-cyan-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-cyan-50">
                  Contact
                </Link>
                <Link 
                  href="/auth/login" 
                  className="text-cyan-600 hover:text-cyan-700 px-4 py-2 rounded-md text-sm font-medium border border-cyan-600 hover:bg-cyan-50 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Link 
                href="/auth/login" 
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <OneTapStayLogo width={28} height={28} />
              <span className="text-xl font-bold text-cyan-600">
                OneTapStay
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {/* Back to Home link for admin pages */}
            {isAdminPage && (
              <div className="flex items-center">
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-cyan-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            )}
            
            {/* Navigation Links - Only show for guests and not on admin pages */}
            {!isAdminPage && (
              <div className="hidden md:flex items-center space-x-4">
                {user.role === 'GUEST' && (
                  <>
                    <Link 
                      href="/guest" 
                      className="text-gray-700 hover:text-cyan-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      🏠 My Stay
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Welcome,</span>
                <span className="font-medium text-gray-900 ml-1">{user.name}</span>
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : user.role === 'STAFF'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}