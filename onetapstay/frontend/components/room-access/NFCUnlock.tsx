'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Nfc, Smartphone, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface NFCUnlockProps {
  bookingId: string
  roomNumber: string
  onUnlockSuccess: () => void
  onUnlockError: (error: string) => void
}

export default function NFCUnlock({ bookingId, roomNumber, onUnlockSuccess, onUnlockError }: NFCUnlockProps) {
  const [isNFCSupported, setIsNFCSupported] = useState(false)
  const [nfcReader, setNfcReader] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [nfcToken, setNfcToken] = useState<string | null>(null)
  const [unlockStatus, setUnlockStatus] = useState<'idle' | 'unlocking' | 'success' | 'failed'>('idle')

  useEffect(() => {
    checkNFCSupport()
    return () => {
      if (nfcReader) {
        try {
          nfcReader.stop()
        } catch (error) {
          console.log('Error stopping NFC reader:', error)
        }
      }
    }
  }, [nfcReader])

  const checkNFCSupport = async () => {
    if ('NDEFReader' in window) {
      setIsNFCSupported(true)
      try {
        // Request NFC permissions
        const permission = await navigator.permissions.query({ name: 'nfc' as any })
        if (permission.state === 'denied') {
          toast.error('NFC permission denied. Please enable NFC access.')
        }
      } catch (error) {
        console.log('NFC permission check failed:', error)
      }
    } else {
      console.log('Web NFC is not supported on this device/browser')
    }
  }

  const generateNFCToken = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`http://localhost:5000/api/keys/generate/nfc/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setNfcToken(result.data.nfcToken)
        toast.success('NFC token generated successfully!')
        return result.data.nfcToken
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to generate NFC token')
        return null
      }
    } catch (error) {
      console.error('Failed to generate NFC token:', error)
      toast.error('Network error. Please try again.')
      return null
    }
  }

  const writeNFCTag = async (token: string) => {
    if (!isNFCSupported || !('NDEFReader' in window)) {
      toast.error('NFC not supported on this device')
      return
    }

    try {
      // @ts-ignore - NDEFReader is experimental
      const ndef = new NDEFReader()
      setIsScanning(true)
      
      toast('Hold your phone near an NFC tag to write...', { 
        icon: '📱',
        duration: 5000 
      })

      const roomAccessData = {
        type: 'ROOM_ACCESS',
        token: token,
        bookingId: bookingId,
        roomNumber: roomNumber,
        timestamp: Date.now()
      }

      await ndef.write({
        records: [
          {
            recordType: "text",
            data: JSON.stringify(roomAccessData)
          },
          {
            recordType: "url",
            data: `https://onetapstay.com/unlock/${bookingId}?token=${encodeURIComponent(token)}`
          }
        ]
      })

      toast.success('NFC tag written successfully!')
      setIsScanning(false)
    } catch (error) {
      console.error('NFC write failed:', error)
      setIsScanning(false)
      toast.error('Failed to write NFC tag. Please try again.')
    }
  }

  const readNFCTag = async () => {
    if (!isNFCSupported || !('NDEFReader' in window)) {
      toast.error('NFC not supported on this device')
      return
    }

    try {
      // @ts-ignore - NDEFReader is experimental
      const ndef = new NDEFReader()
      setNfcReader(ndef)
      setIsScanning(true)

      toast('Hold your phone near the door NFC reader...', { 
        icon: '🔓',
        duration: 8000 
      })

      await ndef.scan()

      ndef.addEventListener('reading', ({ message }: any) => {
        console.log('NFC tag read:', message)
        
        for (const record of message.records) {
          if (record.recordType === 'text') {
            try {
              const decoder = new TextDecoder()
              const data = JSON.parse(decoder.decode(record.data))
              
              if (data.type === 'ROOM_ACCESS' && data.token) {
                unlockRoomWithToken(data.token, 'NFC')
              }
            } catch (error) {
              console.error('Failed to parse NFC data:', error)
            }
          }
        }
        setIsScanning(false)
      })

      ndef.addEventListener('readingerror', () => {
        console.error('Cannot read data from the NFC tag.')
        toast.error('Failed to read NFC tag')
        setIsScanning(false)
      })

    } catch (error) {
      console.error('NFC scan failed:', error)
      setIsScanning(false)
      toast.error('Failed to start NFC scan. Please try again.')
    }
  }

  const unlockRoomWithToken = async (token: string, method: string = 'NFC') => {
    try {
      setUnlockStatus('unlocking')
      
      const response = await fetch('http://localhost:5000/api/keys/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          method: method,
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
      console.error('Room unlock failed:', error)
      setUnlockStatus('failed')
      toast.error('Network error. Please try again.')
      onUnlockError('Network error. Please try again.')
    }
  }

  const handleNFCUnlock = async () => {
    let token = nfcToken
    
    if (!token) {
      token = await generateNFCToken()
      if (!token) return
    }

    // For demo purposes, simulate the NFC unlock process
    // In a real implementation, this would interact with the door's NFC reader
    await unlockRoomWithToken(token, 'NFC')
  }

  if (!isNFCSupported) {
    return (
      <div className="card">
        <div className="flex items-center mb-4">
          <Nfc className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">NFC Unlock</h3>
          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            Not Supported
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">
          NFC is not supported on this device or browser. Please use the QR code method instead.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> NFC unlock requires a supported device and browser. 
            Most modern Android devices with Chrome support Web NFC.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <Nfc className="h-6 w-6 text-primary-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">NFC Unlock</h3>
        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Supported
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">
        Use your phone's NFC capability to unlock your room door
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
        {/* Main Unlock Button */}
        <button 
          onClick={handleNFCUnlock}
          disabled={isScanning || unlockStatus === 'unlocking'}
          className="btn-primary w-full disabled:opacity-50"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          {unlockStatus === 'unlocking' ? 'Unlocking...' : 
           isScanning ? 'Scanning...' : 
           nfcToken ? 'Unlock with NFC' : 'Generate & Unlock'}
        </button>

        {/* Advanced Options */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Advanced Options</p>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => generateNFCToken()}
              disabled={isScanning}
              className="btn-secondary text-sm"
            >
              Generate New NFC Token
            </button>
            <button 
              onClick={readNFCTag}
              disabled={isScanning || !nfcToken}
              className="btn-secondary text-sm"
            >
              {isScanning ? 'Scanning NFC...' : 'Scan Door NFC Tag'}
            </button>
            <button 
              onClick={() => nfcToken && writeNFCTag(nfcToken)}
              disabled={isScanning || !nfcToken}
              className="btn-secondary text-sm"
            >
              Write to NFC Tag
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use NFC unlock:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Click "Generate & Unlock" to create your NFC key</li>
            <li>Go to your room door</li>
            <li>Hold your phone near the NFC reader on the door</li>
            <li>Wait for the unlock confirmation</li>
          </ol>
          <p className="text-xs text-blue-700 mt-2">
            <strong>Note:</strong> Make sure NFC is enabled in your phone settings
          </p>
        </div>
      </div>
    </div>
  )
}