'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-hot-toast'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import OneTapStayLogo from '../../../components/OneTapStayLogo'

// Schema for guest login
const guestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  email: z.string().email('Please enter a valid email address'),
})

// Schema for admin login  
const adminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type GuestForm = z.infer<typeof guestSchema>
type AdminForm = z.infer<typeof adminSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<'guest' | 'admin'>('guest')
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [bookingId, setBookingId] = useState('')

  // Prevent body scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Form handlers
  const {
    register: registerGuest,
    handleSubmit: handleSubmitGuest,
    formState: { errors: guestErrors },
  } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
  })

  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    formState: { errors: adminErrors },
  } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
  })

  // Guest OTP flow
  const sendOTP = async (data: GuestForm) => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          bookingId: data.bookingId,
        }),
      })

      if (response.ok) {
        setEmail(data.email)
        setBookingId(data.bookingId)
        setStep('otp')
        toast.success('📧 OTP sent to your email!')
      } else {
        const error = await response.json()
        let errorMessage = error.message || 'Failed to send OTP'
        
        if (response.status === 404) {
          errorMessage = '❌ Booking not found. Please check your Booking ID and email address.'
        } else if (response.status === 400) {
          errorMessage = '⚠️ Invalid booking details. Please verify your information.'
        } else if (response.status === 429) {
          errorMessage = '⏳ Too many requests. Please wait before trying again.'
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Network error during OTP send:', error)
      setError('🌐 Network error: Unable to connect to server. Please check your internet connection and try again.')
    } finally {
      setIsLoading(false) 
    }
  }

  const verifyOTP = async () => {
    if (otp.length !== 6) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          bookingId,
          otp,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store token
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        toast.success('Login successful!')
        
        // Redirect based on user type
        if (data.user.type === 'hotel') {
          router.push('/hotel/dashboard')
        } else {
          router.push('/guest/dashboard')
        }
      } else {
        const error = await response.json()
        let errorMessage = error.message || 'Invalid OTP'
        
        if (response.status === 400) {
          if (error.message && error.message.includes('expired')) {
            errorMessage = '⏰ OTP has expired. Please request a new one.'
          } else if (error.message && error.message.includes('invalid')) {
            errorMessage = '❌ Invalid OTP. Please check and try again.'
          }
        } else if (response.status === 429) {
          errorMessage = '⏳ Too many attempts. Please wait before trying again.'
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Network error during OTP verification:', error)
      setError('🌐 Network error: Unable to connect to server. Please check your internet connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, bookingId }),
      })

      if (response.ok) {
        toast.success('OTP sent again!')
      } else {
        toast.error('Failed to resend OTP')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Admin direct login
  const handleAdminLogin = async (data: AdminForm) => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: 'ADMIN'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        console.log('Login successful, storing data:', result)
        
        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        console.log('Data stored in localStorage:', {
          token: localStorage.getItem('token'),
          user: localStorage.getItem('user')
        })
        
        toast.success(`Welcome back, ${result.user.firstName || result.user.name}!`)
        
        // Redirect based on role
        if (result.user.role === 'ADMIN' || result.user.role === 'STAFF') {
          console.log('Redirecting to admin dashboard')
          router.push('/admin')
        } else {
          console.log('Unknown role, redirecting to admin')
          router.push('/admin')
        }
      } else {
        const error = await response.json()
        setError(error.message || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-cyan-50 to-teal-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-md w-full h-fit max-h-[90vh] bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 overflow-hidden">
        <div>
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-full flex items-center justify-center p-3">
            <OneTapStayLogo width={40} height={40} variant="white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            Welcome to OneTapStay
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {step === 'login' && (
          <>
            {/* Login Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginType('guest')
                  setError('')
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'guest'
                    ? 'bg-white text-cyan-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👤 Guest Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('admin')
                  setError('')
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'admin'
                    ? 'bg-white text-cyan-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👑 Admin Login
              </button>
            </div>

            <form className="mt-8 space-y-6" onSubmit={loginType === 'guest' ? handleSubmitGuest(sendOTP) : handleSubmitAdmin(handleAdminLogin)}>
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...(loginType === 'guest' ? registerGuest('email') : registerAdmin('email'))}
                      type="email"
                      autoComplete="email"
                      className={`mt-1 appearance-none relative block w-full pl-3 pr-3 py-2 border ${
                        (loginType === 'guest' ? guestErrors.email : adminErrors.email) 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {(loginType === 'guest' ? guestErrors.email : adminErrors.email) && (
                    <p className="mt-1 text-sm text-red-600">
                      {(loginType === 'guest' ? guestErrors.email?.message : adminErrors.email?.message)}
                    </p>
                  )}
                  {loginType === 'guest' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Use the same email address from your booking confirmation
                    </p>
                  )}
                </div>

                {/* Admin Password Field */}
                {loginType === 'admin' && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      {...registerAdmin('password')}
                      type="password"
                      autoComplete="current-password"
                      className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                        adminErrors.password ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                      placeholder="Enter your password"
                    />
                    {adminErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{adminErrors.password.message}</p>
                    )}
                  </div>
                )}

                {/* Guest Booking ID Field */}
                {loginType === 'guest' && (
                  <div>
                    <label htmlFor="bookingId" className="block text-sm font-medium text-gray-700">
                      Booking ID
                    </label>
                    <input
                      {...registerGuest('bookingId')}
                      type="text"
                      className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                        guestErrors.bookingId ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                      placeholder="Enter your booking ID"
                    />
                    {guestErrors.bookingId && (
                      <p className="mt-1 text-sm text-red-600">{guestErrors.bookingId.message}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      This was provided when you made your reservation
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      {loginType === 'admin' ? 'Signing in...' : 'Sending OTP...'}
                    </div>
                  ) : (
                    <>
                      {loginType === 'admin' ? (
                        <>
                          🏢 Sign in as Admin
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send OTP
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <div className="text-center space-y-2">
                {loginType === 'guest' && (
                  <p className="text-xs text-gray-500">
                    Don't have a booking ID? Contact the hotel admin to add your reservation.
                  </p>
                )}
                
                {loginType === 'admin' && (
                  <p className="text-xs text-gray-500">
                    Admin accounts are created by system administrators.
                  </p>
                )}
              </div>
            </form>
          </>
        )}

        {step === 'otp' && (
          <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
              <p className="text-sm text-gray-600 mb-4">
                We sent a verification code to
              </p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={6}
              />
            </div>

            {/* Error Message for OTP step */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}

            <button
              onClick={verifyOTP}
              disabled={isLoading || otp.length !== 6}
              className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                isLoading || otp.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Verifying...
                </div>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  onClick={resendOTP}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Resend
                </button>
              </p>
              <button
                onClick={() => setStep('login')}
                className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Change email address
              </button>
            </div>
          </div>
        )}

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="text-sm">
            <span className="text-gray-600">
              Don't have an account?{' '}
              <a 
                href="mailto:admin@onetapstay.com?subject=Account%20Request&body=Hi,%0D%0A%0D%0AI%20would%20like%20to%20request%20an%20account%20for%20OneTapStay.%0D%0A%0D%0AThank%20you."
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact admin
              </a>
            </span>
          </div>
          
          <p className="text-xs text-gray-400">
            OneTapStay Hotel Management System
          </p>
          
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}