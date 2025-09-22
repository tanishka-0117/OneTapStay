'use client'

import { useEffect } from 'react'
import { soundAlarmService } from '@/lib/soundAlarmService'

export default function AlarmTestPage() {
  useEffect(() => {
    // Auto-start the alarm monitoring when page loads
    soundAlarmService.startPolling(10000) // Check every 10 seconds for testing

    return () => {
      soundAlarmService.stopPolling()
    }
  }, [])

  const testAlarm = () => {
    soundAlarmService.playAlarm(3, 800)
  }

  const testNotification = () => {
    soundAlarmService.playNotification()
  }

  const requestNotificationPermission = async () => {
    const granted = await soundAlarmService.requestNotificationPermission()
    if (granted) {
      alert('Notification permission granted!')
    } else {
      alert('Notification permission denied.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🚨 Timeout Alarm System Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Sound & Notification Tests</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={testAlarm}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
            >
              🚨 Test Alarm Sound
            </button>
            
            <button
              onClick={testNotification}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
            >
              🔔 Test Notification Sound
            </button>
            
            <button
              onClick={requestNotificationPermission}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
            >
              🔔 Enable Browser Notifications
            </button>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🎯 How It Works:</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Automatic Monitoring:</strong> The system polls the backend every 10 seconds for timeout alarms</li>
              <li>• <strong>Sound Alerts:</strong> When a guest exceeds checkout time, the browser plays alarm sounds</li>
              <li>• <strong>Browser Notifications:</strong> Desktop notifications appear even when the tab isn't active</li>
              <li>• <strong>Visual Alerts:</strong> The interface shows active alarms with guest details</li>
              <li>• <strong>Staff Acknowledgment:</strong> Staff can acknowledge alarms to stop repeat notifications</li>
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">📋 To Test Timeout Alarms:</h4>
            <ol className="text-yellow-700 space-y-1">
              <li>1. Go to Staff Dashboard → Bookings Management</li>
              <li>2. Create a booking with checkout time in the past</li>
              <li>3. Switch to "Timeout Alarms" tab</li>
              <li>4. Click "Start Monitoring" and "Manual Check"</li>
              <li>5. Listen for alarm sounds and see visual alerts</li>
            </ol>
          </div>
        </div>
        
        <div className="text-center">
          <a
            href="/staff"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            🏨 Go to Staff Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}