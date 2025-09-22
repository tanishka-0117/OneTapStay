'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { QrCode, Camera, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react'

interface QRUnlockProps {
  bookingId: string
  roomNumber: string
  onUnlockSuccess: () => void
  onUnlockError: (error: string) => void
}

export default function QRUnlock({ bookingId, roomNumber, onUnlockSuccess, onUnlockError }: QRUnlockProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [unlockStatus, setUnlockStatus] = useState<'idle' | 'unlocking' | 'success' | 'failed'>('idle')
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraSupported, setIsCameraSupported] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    checkCameraSupport()
    return () => {
      stopCamera()
    }
  }, [])

  const checkCameraSupport = async () => {
    try {
      if (typeof navigator !== 'undefined' && 
          'mediaDevices' in navigator && 
          'getUserMedia' in navigator.mediaDevices) {
        // Test if we can enumerate devices
        await navigator.mediaDevices.enumerateDevices()
        setIsCameraSupported(true)
      }
    } catch (error) {
      console.log('Camera not supported:', error)
      setIsCameraSupported(false)
    }
  }

  const generateQRCode = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      setIsGenerating(true)
      const response = await fetch(`http://localhost:5000/api/keys/generate/qr/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setQrCode(result.data.qrCode)
        toast.success('QR code generated successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to generate QR code')
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const unlockWithQR = async (qrData?: string) => {
    try {
      setUnlockStatus('unlocking')
      
      let tokenData
      if (qrData) {
        // From scanned QR code
        tokenData = JSON.parse(qrData)
      } else if (qrCode) {
        // From generated QR code - extract data from base64 image
        const base64Data = qrCode.split(',')[1]
        if (base64Data) {
          // Note: In a real implementation, you'd need a QR code decoder
          // For demo purposes, we'll use the token stored when generating the QR
          tokenData = { token: 'demo-token-from-qr' }
        }
      }

      if (!tokenData?.token && qrCode) {
        // Fallback: extract token from QR code metadata (simulated)
        const response = await fetch(`http://localhost:5000/api/keys/access/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          const qrKey = result.data.keys.find((key: any) => key.keyType === 'QR')
          if (qrKey) {
            tokenData = { token: qrKey.id } // Use key ID as token for demo
          }
        }
      }

      if (!tokenData?.token) {
        toast.error('Invalid QR code data')
        setUnlockStatus('failed')
        return
      }

      const response = await fetch('http://localhost:5000/api/keys/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: tokenData.token,
          method: 'QR',
          deviceInfo: navigator.userAgent,
          location: 'GPS coordinates if available'
        })
      })

      if (response.ok) {
        const result = await response.json()
        setUnlockStatus('success')
        toast.success(result.message || 'Room unlocked successfully!')
        onUnlockSuccess()
      } else {
        const errorData = await response.json()
        setUnlockStatus('failed')
        toast.error(errorData.message || 'Failed to unlock room')
        onUnlockError(errorData.message || 'Failed to unlock room')
      }
    } catch (error) {
      console.error('QR unlock failed:', error)
      setUnlockStatus('failed')
      toast.error('Failed to process QR code')
      onUnlockError('Failed to process QR code')
    }
  }

  const startCamera = async () => {
    if (!isCameraSupported) {
      toast.error('Camera not supported on this device')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setIsScanning(true)
      toast('Point your camera at a QR code to scan', { icon: '📷' })
    } catch (error) {
      console.error('Failed to start camera:', error)
      toast.error('Failed to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const captureAndScanQR = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    // In a real implementation, you would use a QR code scanning library here
    // For demo purposes, we'll simulate a successful scan
    toast.success('QR code detected! Processing...')
    stopCamera()
    
    // Simulate QR code data
    const simulatedQRData = JSON.stringify({
      type: 'ROOM_ACCESS',
      token: 'demo-scanned-token',
      bookingId: bookingId,
      roomNumber: roomNumber
    })
    
    await unlockWithQR(simulatedQRData)
  }

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <QrCode className="h-6 w-6 text-primary-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">QR Code Unlock</h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        Generate a QR code or scan one at the door to unlock your room
      </p>

      {/* Status Display */}
      {unlockStatus !== 'idle' && (
        <div className={`p-4 rounded-lg mb-4 ${
          unlockStatus === 'success' ? 'bg-green-50 border border-green-200' :
          unlockStatus === 'failed' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {unlockStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mr-3" />}
            {unlockStatus === 'failed' && <AlertCircle className="h-5 w-5 text-red-600 mr-3" />}
            {unlockStatus === 'unlocking' && <RefreshCw className="h-5 w-5 text-blue-600 mr-3 animate-spin" />}
            <p className={`font-medium ${
              unlockStatus === 'success' ? 'text-green-800' :
              unlockStatus === 'failed' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {unlockStatus === 'success' && '🎉 Room unlocked successfully!'}
              {unlockStatus === 'failed' && '❌ Failed to unlock room'}
              {unlockStatus === 'unlocking' && '🔓 Unlocking room...'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* QR Code Display */}
        {qrCode && (
          <div className="text-center bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
            <img 
              src={qrCode} 
              alt="Room Access QR Code" 
              className="mx-auto mb-4 border rounded-lg shadow-sm"
              style={{ maxWidth: '200px', height: 'auto' }}
            />
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code at your door or use the unlock button below
            </p>
            <button 
              onClick={() => unlockWithQR()}
              disabled={unlockStatus === 'unlocking'}
              className="btn-success w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {unlockStatus === 'unlocking' ? 'Unlocking...' : 'Unlock with This QR Code'}
            </button>
          </div>
        )}

        {/* Camera Scanner */}
        {isScanning && (
          <div className="bg-black rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              autoPlay
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg"></div>
            </div>
            <div className="absolute top-4 right-4">
              <button
                onClick={stopCamera}
                className="bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={captureAndScanQR}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg"
              >
                Scan QR Code
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          {!qrCode && (
            <button 
              onClick={generateQRCode}
              disabled={isGenerating}
              className="btn-primary"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </button>
          )}
          
          {qrCode && (
            <button 
              onClick={generateQRCode}
              disabled={isGenerating}
              className="btn-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New QR Code
            </button>
          )}

          {isCameraSupported && !isScanning && (
            <button 
              onClick={startCamera}
              className="btn-secondary"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan Door QR Code
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use QR unlock:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Method 1: Generate QR</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Click "Generate QR Code"</li>
                <li>Show QR to door scanner</li>
                <li>Door unlocks automatically</li>
              </ol>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Method 2: Scan Door QR</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Click "Scan Door QR Code"</li>
                <li>Point camera at door QR</li>
                <li>App unlocks door automatically</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}