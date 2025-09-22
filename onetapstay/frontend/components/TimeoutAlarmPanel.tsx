'use client'

import { useEffect, useState, useCallback } from 'react'
import { soundAlarmService } from '@/lib/soundAlarmService'

interface TimeoutAlarm {
  id: string
  bookingId: string
  guestName: string
  roomNumber: string
  checkoutTime: string
  currentTime: string
  overtimeMinutes: number
  isActive: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

interface AlarmStats {
  totalActiveAlarms: number
  totalTimeouts: number
  averageOvertimeMinutes: number
}

export default function TimeoutAlarmPanel() {
  const [alarms, setAlarms] = useState<TimeoutAlarm[]>([])
  const [stats, setStats] = useState<AlarmStats | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [serviceStatus, setServiceStatus] = useState(soundAlarmService.getStatus())
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch current alarms
  const fetchAlarms = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/timeout/alarms')
      const data = await response.json()
      
      if (data.success) {
        setAlarms(data.data.activeAlarms || [])
        setStats({
          totalActiveAlarms: data.data.totalActiveAlarms || 0,
          totalTimeouts: data.data.totalTimeouts || 0,
          averageOvertimeMinutes: data.data.averageOvertimeMinutes || 0
        })
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch alarms:', error)
    }
  }, [])

  // Handle timeout alarm events
  const handleTimeoutAlarm = useCallback((event: CustomEvent) => {
    const { alarms: newAlarms, totalActive } = event.detail
    console.log('🚨 Received timeout alarm event:', newAlarms)
    
    // Refresh alarm list
    fetchAlarms()
    
    // Show visual alert
    if (newAlarms.length > 0) {
      // You could add toast notifications, modal dialogs, etc.
      console.log(`⚠️ ${newAlarms.length} new timeout alarm(s) detected`)
    }
  }, [fetchAlarms])

  // Initialize component
  useEffect(() => {
    // Request notification permission on mount
    soundAlarmService.requestNotificationPermission().then(granted => {
      setNotificationsEnabled(granted)
    })

    // Listen for timeout alarm events
    window.addEventListener('timeoutAlarm', handleTimeoutAlarm as EventListener)

    // Initial data fetch
    fetchAlarms()

    return () => {
      window.removeEventListener('timeoutAlarm', handleTimeoutAlarm as EventListener)
    }
  }, [handleTimeoutAlarm, fetchAlarms])

  // Start/stop polling
  const togglePolling = useCallback(() => {
    if (isPolling) {
      soundAlarmService.stopPolling()
      setIsPolling(false)
    } else {
      soundAlarmService.startPolling(30000) // Poll every 30 seconds
      setIsPolling(true)
    }
    setServiceStatus(soundAlarmService.getStatus())
  }, [isPolling])

  // Acknowledge an alarm
  const acknowledgeAlarm = useCallback(async (alarmId: string) => {
    try {
      soundAlarmService.acknowledgeAlarm(alarmId, 'Staff Member')
      
      // Update local state
      setAlarms(prev => prev.map(alarm => 
        alarm.id === alarmId 
          ? { ...alarm, acknowledgedBy: 'Staff Member', acknowledgedAt: new Date().toISOString() }
          : alarm
      ))
      
      // Refresh data
      await fetchAlarms()
    } catch (error) {
      console.error('Failed to acknowledge alarm:', error)
    }
  }, [fetchAlarms])

  // Test alarm sound
  const testAlarmSound = useCallback(() => {
    if (soundEnabled) {
      soundAlarmService.playAlarm(2, 500)
    }
  }, [soundEnabled])

  // Test notification sound
  const testNotificationSound = useCallback(() => {
    if (soundEnabled) {
      soundAlarmService.playNotification()
    }
  }, [soundEnabled])

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled)
  }, [soundEnabled])

  // Manual check for timeouts
  const manualCheck = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/timeout/check', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchAlarms()
        console.log('✅ Manual timeout check completed')
      }
    } catch (error) {
      console.error('Failed to trigger manual check:', error)
    }
  }, [fetchAlarms])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const getOvertimeBadgeColor = (minutes: number) => {
    if (minutes <= 15) return 'bg-yellow-500 text-white'
    if (minutes <= 30) return 'bg-orange-500 text-white'
    return 'bg-red-500 text-white'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚨 Timeout Alarm System</h1>
          <p className="text-gray-600 mt-2">
            Monitor checkout timeouts and receive instant sound notifications
          </p>
        </div>
        
        <button
          onClick={togglePolling}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isPolling 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isPolling ? '🔇 Stop Monitoring' : '🔊 Start Monitoring'}
        </button>
      </div>

      {/* Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⚠️</div>
            <div>
              <p className="text-sm text-gray-600">Active Alarms</p>
              <p className="text-2xl font-bold text-red-600">{stats?.totalActiveAlarms || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⏰</div>
            <div>
              <p className="text-sm text-gray-600">Total Timeouts</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.totalTimeouts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">👤</div>
            <div>
              <p className="text-sm text-gray-600">Avg Overtime</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(stats?.averageOvertimeMinutes || 0)}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">
              {isPolling ? '🟢' : '🔴'}
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-green-600">
                {isPolling ? 'Monitoring' : 'Stopped'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">🎛️ Alarm Controls</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={toggleSound}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              soundEnabled 
                ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {soundEnabled ? '🔊 Sound Enabled' : '🔇 Sound Disabled'}
          </button>

          <button
            onClick={testAlarmSound}
            disabled={!soundEnabled}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            🚨 Test Alarm Sound
          </button>

          <button
            onClick={testNotificationSound}
            disabled={!soundEnabled}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            🔔 Test Notification
          </button>

          <button
            onClick={manualCheck}
            className="px-4 py-2 rounded-lg border border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
          >
            🔍 Manual Check
          </button>

          <button
            onClick={fetchAlarms}
            className="px-4 py-2 rounded-lg border border-gray-500 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {lastUpdate && (
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Active Alarms */}
      {alarms.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            ⚠️ Active Timeout Alarms ({alarms.length})
          </h3>
          <div className="space-y-4">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <span className="font-semibold text-lg">{alarm.guestName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏠</span>
                        <span className="font-medium">Room {alarm.roomNumber}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getOvertimeBadgeColor(alarm.overtimeMinutes)}`}>
                        +{alarm.overtimeMinutes} min overtime
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Checkout: {formatTime(alarm.checkoutTime)} | 
                      Current: {formatTime(alarm.currentTime)}
                    </div>
                    {alarm.acknowledgedBy && (
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <span>✅</span>
                        <span>Acknowledged by {alarm.acknowledgedBy} at {formatTime(alarm.acknowledgedAt!)}</span>
                      </div>
                    )}
                  </div>
                  
                  {!alarm.acknowledgedBy && (
                    <button
                      onClick={() => acknowledgeAlarm(alarm.id)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      ✅ Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Alarms */}
      {alarms.length === 0 && isPolling && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="space-y-4">
            <div className="text-8xl">✅</div>
            <h3 className="text-2xl font-semibold text-green-600">All Clear!</h3>
            <p className="text-gray-600 text-lg">
              No timeout alarms detected. All guests are within their checkout times.
            </p>
          </div>
        </div>
      )}

      {/* Service Status */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">🔧 System Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Audio:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              serviceStatus.isInitialized 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {serviceStatus.isInitialized ? 'Ready' : 'Not Available'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Polling:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              serviceStatus.isPolling 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {serviceStatus.isPolling ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Notifications:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              notificationsEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {notificationsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Acknowledged:</span>
            <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
              {serviceStatus.acknowledgedAlarmsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}