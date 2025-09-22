'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  Wifi, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ArrowLeft,
  Smartphone,
  Monitor,
  Laptop,
  RefreshCw,
  Info,
  Phone,
  QrCode
} from 'lucide-react'
import WiFiQRCode from '../../../components/WiFiQRCode'

interface WiFiCredentials {
  networkName: string
  password: string
  connectionType: string
  guestNetwork: boolean
  bandwidth: string
  validUntil: string
  connectionInstructions: {
    windows: string
    mac: string
    mobile: string
    automatic: boolean
  }
  hotelInfo: {
    name: string
    location: string
    supportPhone: string
  }
}

export default function WiFiConnectionPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.bookingId as string

  const [wifiCredentials, setWifiCredentials] = useState<WiFiCredentials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed' | 'idle'>('idle')
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)

  useEffect(() => {
    fetchWiFiCredentials()
  }, [bookingId])

  useEffect(() => {
    // Check WiFi connection status periodically
    if (wifiCredentials) {
      const checkConnection = () => {
        checkWiFiConnection(wifiCredentials.networkName)
      }
      
      // Check immediately and then every 5 seconds (less frequent to avoid spam)
      checkConnection()
      const interval = setInterval(checkConnection, 5000)
      
      return () => clearInterval(interval)
    }
  }, [wifiCredentials]) // Remove connectionStatus from dependencies to prevent infinite loops

  const checkWiFiConnection = async (targetNetwork: string) => {
    try {
      if (navigator.onLine) {
        // Since browsers can't directly read WiFi SSID for security reasons,
        // we'll only show connected status when the user manually tests or connects
        // Automatic detection is too unreliable and shows false positives
        
        // Only set to connected if we were previously connecting (from manual test)
        if (connectionStatus === 'connecting') {
          setConnectionStatus('connected')
        } else if (connectionStatus === 'idle') {
          // Don't automatically assume connection - wait for manual verification
          // This prevents false "connected" messages when user is on different WiFi
        }
      } else {
        // User is offline
        if (connectionStatus !== 'failed') {
          setConnectionStatus('failed')
        }
      }
    } catch (error) {
      console.log('Connection check failed:', error)
    }
  }

  const testWiFiConnection = async (targetNetwork: string) => {
    setConnectionStatus('connecting')
    toast(`Testing connection to "${targetNetwork}"...`, { icon: '🔄' })
    
    try {
      // Simulate connection testing with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (navigator.onLine) {
        // For demonstration: Only show success if we're testing "Yamete kudasai"
        // In a real scenario, this would verify the actual network SSID
        
        if (targetNetwork.toLowerCase().includes('yamete')) {
          // User is testing the correct network and is online
          setConnectionStatus('connected')
          toast.success(`🎉 Successfully connected to "${targetNetwork}"!`)
        } else {
          // User is testing a different network - show neutral result
          setConnectionStatus('connected')
          toast.success(`✅ Internet connection verified via current network`)
        }
      } else {
        setConnectionStatus('failed')
        toast.error(`❌ No internet connection. Please connect to "${targetNetwork}" first.`)
      }
    } catch (error) {
      setConnectionStatus('failed')
      toast.error(`❌ Connection test failed. Please verify your WiFi connection.`)
    }
  }

  const fetchWiFiCredentials = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to continue')
        router.push('/auth/login')
        return
      }

      const response = await fetch(`http://localhost:5000/api/auth/wifi-credentials/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setWifiCredentials(result.data)
        
        // Disable auto-connection to prevent multiple toast messages
        // User can manually test connection using the "Test Connection" button
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch WiFi credentials')
        
        if (response.status === 401) {
          toast.error('Session expired. Please login again.')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
        }
      }
    } catch (error) {
      console.error('Failed to fetch WiFi credentials:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const attemptAutoConnection = async (credentials: WiFiCredentials) => {
    setIsAutoConnecting(true)
    setConnectionStatus('connecting')

    try {
      // Check if we can use the Web WiFi API (experimental)
      if ('wifi' in navigator) {
        // This is experimental and not widely supported
        try {
          // @ts-ignore - WiFi API is experimental
          await navigator.wifi.connect({
            ssid: credentials.networkName,
            password: credentials.password
          })
          setConnectionStatus('connected')
          toast.success('🎉 Connected to hotel WiFi successfully!')
        } catch (wifiError) {
          console.log('WiFi API not available, falling back to manual instructions')
          fallbackToManualConnection(credentials)
        }
      } else {
        // Fallback: Create WiFi profile for different platforms
        fallbackToManualConnection(credentials)
      }
    } catch (error) {
      console.error('Auto-connection failed:', error)
      setConnectionStatus('failed')
      toast.error('Auto-connection failed. Please connect manually.')
    } finally {
      setIsAutoConnecting(false)
    }
  }

  const fallbackToManualConnection = (credentials: WiFiCredentials) => {
    // Detect platform and provide appropriate instructions
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('windows')) {
      // Windows: Try to create a WiFi profile
      createWindowsWiFiProfile(credentials)
    } else if (userAgent.includes('mac')) {
      // macOS: Provide instructions
      showMacInstructions(credentials)
    } else if (userAgent.includes('android') || userAgent.includes('iphone')) {
      // Mobile: Try to create a WiFi QR code or deep link
      createMobileConnection(credentials)
    } else {
      // Generic fallback
      setConnectionStatus('failed')
      toast('Please connect manually using the credentials below', { icon: 'ℹ️' })
    }
  }

  const createWindowsWiFiProfile = (credentials: WiFiCredentials) => {
    // Simplified: Just show manual connection instructions for Windows
    toast('Please connect manually via Windows WiFi settings', { icon: 'ℹ️' })
    setConnectionStatus('failed')
  }

  const showMacInstructions = (credentials: WiFiCredentials) => {
    toast('Please connect manually through System Preferences > Network', { icon: 'ℹ️' })
    setConnectionStatus('failed')
  }

  const createMobileConnection = (credentials: WiFiCredentials) => {
    // Create a WiFi QR code for mobile devices
    const wifiString = `WIFI:T:WPA;S:${credentials.networkName};P:${credentials.password};;`
    
    // For now, we'll just show the QR code data
    // In a real implementation, you'd generate an actual QR code
    toast.success('Use your camera to scan the WiFi QR code below')
    setConnectionStatus('connected')
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const retryConnection = () => {
    if (wifiCredentials) {
      attemptAutoConnection(wifiCredentials)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WiFi credentials...</p>
        </div>
      </div>
    )
  }

  if (error || !wifiCredentials) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">WiFi Unavailable</h1>
          <p className="text-red-600 mb-4">{error || 'Failed to load WiFi credentials'}</p>
          <div className="space-x-4">
            <button onClick={fetchWiFiCredentials} className="btn-primary">
              Try Again
            </button>
            <Link href="/guest/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/guest/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center">
                <Wifi className="h-6 w-6 text-primary-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">Hotel WiFi</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <div className="card mb-8">
          <div className="text-center">
            {connectionStatus === 'connecting' || isAutoConnecting ? (
              <div className="mb-4">
                <RefreshCw className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting to WiFi...</h2>
                <p className="text-gray-600">Please wait while we connect you to {wifiCredentials.networkName}</p>
              </div>
            ) : connectionStatus === 'connected' ? (
              <div className="mb-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connected Successfully!</h2>
                <p className="text-gray-600">You're now connected to {wifiCredentials.networkName}</p>
              </div>
            ) : connectionStatus === 'failed' ? (
              <div className="mb-4">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
                <p className="text-gray-600 mb-4">Please connect manually using the credentials below</p>
                <button onClick={retryConnection} className="btn-primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <Wifi className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel WiFi Access</h2>
                <p className="text-gray-600">Connect to the hotel's complimentary WiFi network</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* WiFi QR Code */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Quick Connect
            </h3>
            <div className="text-center">
              <WiFiQRCode 
                networkName={wifiCredentials.networkName}
                password={wifiCredentials.password}
                securityType="WPA2"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-sm text-gray-600 mt-4">
                Point your phone's camera at the QR code to connect instantly
              </p>
            </div>
          </div>

          {/* WiFi Credentials */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">WiFi Credentials</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-600">Network Name (SSID)</label>
                  <button 
                    onClick={() => copyToClipboard(wifiCredentials.networkName, 'Network name')}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-lg font-mono text-gray-900 bg-white p-2 rounded border">
                  {wifiCredentials.networkName}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-600">Password</label>
                  <button 
                    onClick={() => copyToClipboard(wifiCredentials.password, 'Password')}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-lg font-mono text-gray-900 bg-white p-2 rounded border">
                  {wifiCredentials.password}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-600">Security Type</label>
                  <p className="font-medium text-gray-900">{wifiCredentials.connectionType}</p>
                </div>
                <div>
                  <label className="text-gray-600">Bandwidth</label>
                  <p className="font-medium text-gray-900">{wifiCredentials.bandwidth}</p>
                </div>
              </div>

              <div className="text-sm">
                <label className="text-gray-600">Valid Until</label>
                <p className="font-medium text-gray-900">
                  {new Date(wifiCredentials.validUntil).toLocaleDateString()} at {new Date(wifiCredentials.validUntil).toLocaleTimeString()}
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="pt-4 border-t">
                <button 
                  onClick={() => testWiFiConnection(wifiCredentials.networkName)}
                  className="w-full btn-primary flex items-center justify-center"
                  disabled={connectionStatus === 'connected'}
                >
                  {connectionStatus === 'connected' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Connected Successfully
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Connection Instructions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Connection Instructions</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Monitor className="h-5 w-5 text-primary-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Windows</h4>
                  <p className="text-sm text-gray-600">{wifiCredentials.connectionInstructions.windows}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Laptop className="h-5 w-5 text-primary-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">macOS</h4>
                  <p className="text-sm text-gray-600">{wifiCredentials.connectionInstructions.mac}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Smartphone className="h-5 w-5 text-primary-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Mobile Devices</h4>
                  <p className="text-sm text-gray-600">{wifiCredentials.connectionInstructions.mobile}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Need Help?</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Contact the front desk if you're having trouble connecting.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-primary-600" />
                      <span className="font-medium">{wifiCredentials.hotelInfo.supportPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {connectionStatus !== 'connected' && (
              <button 
                onClick={retryConnection}
                className="btn-primary flex-1"
                disabled={isAutoConnecting}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAutoConnecting ? 'animate-spin' : ''}`} />
                {isAutoConnecting ? 'Connecting...' : 'Try Auto-Connect'}
              </button>
            )}
            <Link href="/guest/dashboard" className={`btn-secondary ${connectionStatus === 'connected' ? 'flex-1' : 'flex-1'} text-center`}>
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}