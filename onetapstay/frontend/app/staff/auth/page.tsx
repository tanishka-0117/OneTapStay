'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Loader2, ArrowLeft, User, Building2 } from 'lucide-react'
import Link from 'next/link'
import OneTapStayLogo from '../../../components/OneTapStayLogo'

const staffLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  facilityType: z.enum(['restaurant', 'spa', 'gym', 'pool'], {
    required_error: 'Please select your facility'
  })
})

type StaffLoginForm = z.infer<typeof staffLoginSchema>

export default function StaffLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<StaffLoginForm>({
    resolver: zodResolver(staffLoginSchema)
  })

  const handleStaffLogin = async (data: StaffLoginForm) => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: 'STAFF'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Store token and user info
        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify({
          ...result.user,
          facilityType: data.facilityType
        }))
        
        toast.success(`Welcome to ${getFacilityName(data.facilityType)}!`)
        
        // Redirect to specific facility dashboard
        router.push(`/staff/${data.facilityType}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getFacilityName = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'Restaurant'
      case 'spa':
        return 'Spa & Wellness'
      case 'gym':
        return 'Fitness Center'
      case 'pool':
        return 'Pool Bar'
      default:
        return 'Staff Area'
    }
  }

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return '🍽️'
      case 'spa':
        return '💆‍♀️'
      case 'gym':
        return '💪'
      case 'pool':
        return '🏊‍♂️'
      default:
        return '🏨'
    }
  }

  const selectedFacility = watch('facilityType')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="w-full px-4 py-6">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center mb-8">
            <OneTapStayLogo className="h-12 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Login</h1>
            <p className="text-gray-600">Access your facility dashboard</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit(handleStaffLogin)} className="space-y-6">
              {/* Facility Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Facility
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
                    { value: 'spa', label: 'Spa', icon: '💆‍♀️' },
                    { value: 'gym', label: 'Gym', icon: '💪' },
                    { value: 'pool', label: 'Pool Bar', icon: '🏊‍♂️' }
                  ].map((facility) => (
                    <label key={facility.value} className="relative">
                      <input
                        type="radio"
                        value={facility.value}
                        {...register('facilityType')}
                        className="sr-only"
                      />
                      <div className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                        ${selectedFacility === facility.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}>
                        <div className="text-2xl mb-2">{facility.icon}</div>
                        <div className="text-sm font-medium">{facility.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.facilityType && (
                  <p className="mt-1 text-sm text-red-600">{errors.facilityType.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Sign In to {selectedFacility ? getFacilityName(selectedFacility) : 'Facility'}
                  </>
                )}
              </button>
            </form>

            {/* Alternative Links */}
            <div className="mt-6 text-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Other Login Options</span>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4 text-sm">
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Guest Login
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}