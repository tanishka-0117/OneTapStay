import { useEffect, useRef } from 'react'
import QRCode from 'qrcode-generator'

interface WiFiQRCodeProps {
  networkName: string
  password: string
  securityType?: string
  hidden?: boolean
  className?: string
}

export default function WiFiQRCode({ 
  networkName, 
  password, 
  securityType = 'WPA', 
  hidden = false,
  className = "w-48 h-48" 
}: WiFiQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create WiFi QR code string
    const wifiString = `WIFI:T:${securityType};S:${networkName};P:${password};H:${hidden};;`
    
    try {
      // Generate QR code
      const qr = QRCode(0, 'M')  // Type 0 = auto, Error correction level M
      qr.addData(wifiString)
      qr.make()

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const modules = qr.getModuleCount()
      const cellSize = Math.floor(canvas.width / modules)
      const margin = Math.floor((canvas.width - cellSize * modules) / 2)

      // Clear canvas
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw QR code
      ctx.fillStyle = '#000000'
      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(
              margin + col * cellSize,
              margin + row * cellSize,
              cellSize,
              cellSize
            )
          }
        }
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }, [networkName, password, securityType, hidden])

  return (
    <div className="flex flex-col items-center space-y-2">
      <canvas 
        ref={canvasRef}
        width={200}
        height={200}
        className={className}
        style={{ border: '1px solid #e5e7eb' }}
      />
      <p className="text-xs text-gray-500 text-center max-w-48">
        Scan with your phone's camera to connect automatically
      </p>
    </div>
  )
}