'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Smartphone, Shield, Zap } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  // Auto redirect to login after showing this page briefly
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to OneTapStay</h1>
          <p className="text-gray-600">Get started with contactless hotel experience</p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Registration Required!</h2>
            <p className="text-gray-600 text-sm">
              OneTapStay uses phone-based authentication. Simply enter your phone number to get started.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-gray-700">Secure SMS verification</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-700">Instant access to rooms</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">All features in one app</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/auth/login"
            className="w-full btn-primary text-center block py-3 text-lg font-semibold"
          >
            Continue to Login
          </Link>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Redirecting automatically in 3 seconds...
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}