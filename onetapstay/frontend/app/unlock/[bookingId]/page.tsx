'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Key,
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Wifi,
  RefreshCw,
  User,
  Calendar,
  QrCode,
  Smartphone,
  Copy,
  Download
} from 'lucide-react'

interface UnlockData {
  roomNumber: string
  hotelName: string
  unlockTime: string
  remainingUses: string | number
  keyValidUntil: string
}

interface BookingInfo {
  roomNumber: string
  hotelName: string
  guestName: string
  checkIn: string
  checkOut: string
  status: string
}

export default function UnlockRoomPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.bookingId as string

  const [isLoading, setIsLoading] = useState(false)
  const [unlockStatus, setUnlockStatus] = useState<'idle' | 'unlocking' | 'success' | 'failed'>('idle')
  const [unlockData, setUnlockData] = useState<UnlockData | null>(null)
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [error, setError] = useState('')
  const [deviceInfo, setDeviceInfo] = useState('')
  const [lastUnlockTime, setLastUnlockTime] = useState<string | null>(null)
  
  // QR and NFC states
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [nfcToken, setNfcToken] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showNFCModal, setShowNFCModal] = useState(false)

  useEffect(() => {
    // Detect device info
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    setDeviceInfo(`${platform} - ${userAgent.split(' ')[0]}`)
    
    // Check for existing unlock data
    const savedUnlockData = localStorage.getItem(`unlock_${bookingId}`)
    if (savedUnlockData) {
      const parsed = JSON.parse(savedUnlockData)
      setLastUnlockTime(parsed.unlockTime)
    }
  }, [bookingId])

  const handleUnlockRoom = async () => {
    setIsLoading(true)
    setUnlockStatus('unlocking')
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to continue')
        router.push('/auth/login')
        return
      }

      // Get user location if available
      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          location = `${position.coords.latitude},${position.coords.longitude}`
        } catch (error) {
          console.log('Could not get location:', error)
        }
      }

      const response = await fetch(`http://localhost:5000/api/auth/unlock-room/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceInfo,
          location
        })
      })

      const result = await response.json()

      if (response.ok) {
        setUnlockStatus('success')
        setUnlockData(result.data)
        
        // Save unlock data to localStorage
        localStorage.setItem(`unlock_${bookingId}`, JSON.stringify({
          ...result.data,
          unlockTime: new Date().toISOString()
        }))
        
        setLastUnlockTime(new Date().toISOString())
        toast.success(result.message)
      } else {
        setUnlockStatus('failed')
        setError(result.message || 'Failed to unlock room')
        toast.error(result.message || 'Failed to unlock room')
      }

    } catch (error) {
      console.error('Unlock error:', error)
      setUnlockStatus('failed')
      setError('Network error. Please check your connection.')
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetUnlockStatus = () => {
    setUnlockStatus('idle')
    setUnlockData(null)
    setError('')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeSince = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  const handleGenerateQR = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to continue')
        router.push('/auth/login')
        return
      }

      const response = await fetch(`http://localhost:5000/api/keys/qr/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setQrCodeData(result.data.qrCode)
        setShowQRModal(true)
        toast.success('QR code generated successfully!')
      } else {
        toast.error(result.message || 'Failed to generate QR code')
      }
    } catch (error) {
      console.error('QR generation error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateNFC = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to continue')
        router.push('/auth/login')
        return
      }

      const response = await fetch(`http://localhost:5000/api/keys/nfc/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setNfcToken(result.data.nfcToken)
        setShowNFCModal(true)
        toast.success('NFC token generated successfully!')
      } else {
        toast.error(result.message || 'Failed to generate NFC token')
      }
    } catch (error) {
      console.error('NFC generation error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy to clipboard')
    })
  }

  const downloadQRCode = () => {
    if (qrCodeData) {
      const link = document.createElement('a')
      link.href = qrCodeData
      link.download = `room-${bookingId}-qr.png`
      link.click()
      toast.success('QR code downloaded!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/guest/dashboard" 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Digital Room Key</h1>
            <p className="text-sm text-gray-500">Booking: {bookingId}</p>
          </div>
          <div></div>
        </div>

        {/* Unlock Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            {unlockStatus === 'idle' && (
              <>
                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Key className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Unlock</h2>
                <p className="text-gray-600 mb-6">Tap the button below to unlock your room</p>
              </>
            )}

            {unlockStatus === 'unlocking' && (
              <>
                <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="h-10 w-10 text-yellow-600 animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Unlocking Room...</h2>
                <p className="text-gray-600 mb-6">Please wait while we communicate with the smart lock</p>
              </>
            )}

            {unlockStatus === 'success' && unlockData && (
              <>
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Unlock className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Room Unlocked! 🎉</h2>
                <p className="text-gray-600 mb-4">Your room is now unlocked and ready for entry</p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room:</span>
                      <span className="font-semibold text-gray-900">{unlockData.roomNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hotel:</span>
                      <span className="font-semibold text-gray-900">{unlockData.hotelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unlocked:</span>
                      <span className="font-semibold text-gray-900">{formatDateTime(unlockData.unlockTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Uses:</span>
                      <span className="font-semibold text-gray-900">{unlockData.remainingUses}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {unlockStatus === 'failed' && (
              <>
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Unlock Failed</h2>
                <p className="text-red-600 mb-6">{error}</p>
              </>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {unlockStatus === 'idle' && (
                <>
                  <button
                    onClick={handleUnlockRoom}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Unlock className="h-5 w-5" />
                    <span>Unlock Room</span>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleGenerateQR}
                      disabled={isLoading}
                      className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>QR Code</span>
                    </button>
                    
                    <button
                      onClick={handleGenerateNFC}
                      disabled={isLoading}
                      className="bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      <span>NFC Token</span>
                    </button>
                  </div>
                </>
              )}

              {unlockStatus === 'success' && (
                <button
                  onClick={resetUnlockStatus}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <Key className="h-5 w-5" />
                  <span>Unlock Again</span>
                </button>
              )}

              {unlockStatus === 'failed' && (
                <div className="space-y-3">
                  <button
                    onClick={handleUnlockRoom}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={resetUnlockStatus}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last Unlock Info */}
        {lastUnlockTime && unlockStatus === 'idle' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Last unlocked {getTimeSince(lastUnlockTime)}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href={`/wifi/${bookingId}`}
            className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center space-y-2 text-center"
          >
            <Wifi className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">WiFi Access</span>
          </Link>
          <Link
            href="/guest/support"
            className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center space-y-2 text-center"
          >
            <Phone className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Support</span>
          </Link>
        </div>

        {/* Security Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Security Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>All unlock attempts are logged</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Digital key expires at checkout</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Encrypted communication with smart lock</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Room Access QR Code</h3>
              
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                <img 
                  src={qrCodeData} 
                  alt="Room Access QR Code" 
                  className="w-full h-auto"
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Scan this QR code at the smart lock to unlock your room
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NFC Token Modal */}
      {showNFCModal && nfcToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">NFC Access Token</h3>
              
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                <Smartphone className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <p className="text-sm text-purple-800 font-medium">
                  NFC Token Generated
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-gray-600 mb-1">Token:</p>
                <p className="text-xs font-mono text-gray-800 break-all">
                  {nfcToken.substring(0, 50)}...
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Use your NFC-enabled device to tap the smart lock
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => copyToClipboard(nfcToken)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Token</span>
                </button>
                
                <button
                  onClick={() => setShowNFCModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
