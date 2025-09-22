// Sound alarm service for timeout notifications
class SoundAlarmService {
  private audioContext: AudioContext | null = null
  private isInitialized = false
  private pollingInterval: NodeJS.Timeout | null = null
  private acknowledgedAlarms = new Set<string>()

  constructor() {
    this.initializeAudio()
  }

  /**
   * Initialize Web Audio API
   */
  private initializeAudio() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new AudioContext()
        this.isInitialized = true
        console.log('🔊 Sound alarm service initialized')
      } catch (error) {
        console.warn('⚠️ Web Audio API not supported:', error)
      }
    }
  }

  /**
   * Create an alarm sound using Web Audio API
   */
  private createAlarmSound() {
    if (!this.audioContext) return

    const duration = 0.5 // seconds
    const frequency1 = 800 // Hz
    const frequency2 = 1000 // Hz
    
    // Create oscillators for a two-tone alarm
    const oscillator1 = this.audioContext.createOscillator()
    const oscillator2 = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    // Configure oscillators
    oscillator1.type = 'sine'
    oscillator1.frequency.setValueAtTime(frequency1, this.audioContext.currentTime)
    
    oscillator2.type = 'sine'
    oscillator2.frequency.setValueAtTime(frequency2, this.audioContext.currentTime)

    // Configure gain (volume)
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    // Connect nodes
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // Play the sound
    oscillator1.start(this.audioContext.currentTime)
    oscillator1.stop(this.audioContext.currentTime + duration)
    
    oscillator2.start(this.audioContext.currentTime + 0.1)
    oscillator2.stop(this.audioContext.currentTime + duration + 0.1)
  }

  /**
   * Play alarm sound with repetition
   */
  public playAlarm(repetitions = 3, interval = 1000) {
    if (!this.isInitialized) {
      console.warn('⚠️ Sound alarm service not initialized')
      return
    }

    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }

    let count = 0
    const playSound = () => {
      this.createAlarmSound()
      count++
      
      if (count < repetitions) {
        setTimeout(playSound, interval)
      }
    }

    playSound()
    console.log(`🚨 Playing timeout alarm (${repetitions} times)`)
  }

  /**
   * Play a single notification sound
   */
  public playNotification() {
    if (!this.isInitialized) return

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }

    const oscillator = this.audioContext!.createOscillator()
    const gainNode = this.audioContext!.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(600, this.audioContext!.currentTime)
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext!.destination)

    oscillator.start()
    oscillator.stop(this.audioContext!.currentTime + 0.3)
  }

  /**
   * Start polling for timeout alarms
   */
  public startPolling(intervalMs = 30000) { // Check every 30 seconds
    if (this.pollingInterval) {
      console.log('⚠️ Polling already started')
      return
    }

    this.pollingInterval = setInterval(async () => {
      await this.checkForTimeoutAlarms()
    }, intervalMs)

    console.log(`🔍 Started polling for timeout alarms (every ${intervalMs / 1000}s)`)
  }

  /**
   * Stop polling for timeout alarms
   */
  public stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
      console.log('🛑 Stopped polling for timeout alarms')
    }
  }

  /**
   * Check for new timeout alarms from the backend
   */
  private async checkForTimeoutAlarms() {
    try {
      const response = await fetch('http://localhost:5000/api/timeout/alarms')
      
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch timeout alarms:', response.statusText)
        return
      }

      const data = await response.json()
      
      if (data.success && data.data.activeAlarms?.length > 0) {
        const newAlarms = data.data.activeAlarms.filter(
          (alarm: any) => !this.acknowledgedAlarms.has(alarm.id)
        )

        if (newAlarms.length > 0) {
          console.log(`🚨 Found ${newAlarms.length} new timeout alarm(s)`)
          
          // Play alarm sound
          this.playAlarm(5, 800) // 5 repetitions, 800ms apart
          
          // Show browser notification if supported
          this.showBrowserNotification(newAlarms)
          
          // Mark as acknowledged to prevent repeat alarms
          newAlarms.forEach((alarm: any) => {
            this.acknowledgedAlarms.add(alarm.id)
          })

          // Trigger custom event for UI components
          window.dispatchEvent(new CustomEvent('timeoutAlarm', {
            detail: { alarms: newAlarms, totalActive: data.data.totalActiveAlarms }
          }))
        }
      }
    } catch (error) {
      console.error('❌ Error checking timeout alarms:', error)
    }
  }

  /**
   * Show browser notification for timeout alarms
   */
  private showBrowserNotification(alarms: any[]) {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser notifications not supported')
      return
    }

    if (Notification.permission === 'granted') {
      const alarm = alarms[0] // Show notification for first alarm
      const notification = new Notification('🚨 OneTapStay - Checkout Timeout Alert', {
        body: `Guest ${alarm.guestName} has exceeded checkout time in room ${alarm.roomNumber} by ${alarm.overtimeMinutes} minutes`,
        icon: '/favicon.ico',
        tag: 'timeout-alarm',
        requireInteraction: true
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000)
    } else if (Notification.permission !== 'denied') {
      // Request permission for future notifications
      Notification.requestPermission()
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Acknowledge an alarm (prevents repeated notifications)
   */
  public acknowledgeAlarm(alarmId: string, staffMember?: string) {
    this.acknowledgedAlarms.add(alarmId)
    
    // Send acknowledgment to backend
    fetch(`http://localhost:5000/api/timeout/alarms/${alarmId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ staffMember }),
    }).catch(error => {
      console.error('❌ Failed to acknowledge alarm:', error)
    })

    console.log(`✅ Acknowledged timeout alarm: ${alarmId}`)
  }

  /**
   * Clear all acknowledged alarms (reset the service)
   */
  public clearAcknowledgedAlarms() {
    this.acknowledgedAlarms.clear()
    console.log('🔄 Cleared all acknowledged alarms')
  }

  /**
   * Get service status
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPolling: this.pollingInterval !== null,
      acknowledgedAlarmsCount: this.acknowledgedAlarms.size,
      audioContextState: this.audioContext?.state,
      notificationPermission: typeof window !== 'undefined' ? Notification.permission : 'unavailable'
    }
  }
}

// Create singleton instance
export const soundAlarmService = new SoundAlarmService()
export default SoundAlarmService