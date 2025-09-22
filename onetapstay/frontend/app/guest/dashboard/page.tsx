'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Key, 
  Wallet, 
  Star, 
  Wifi, 
  MapPin, 
  Clock, 
  QrCode,
  CreditCard,
  Bell,
  Phone,
  Calendar,
  Users,
  Bed,
  Coffee,
  Utensils,
  Dumbbell,
  Car,
  Waves,
  Activity,
  ShoppingBag,
  Timer,
  LogOut,
  Gift
} from 'lucide-react'

interface GuestProfile {
  guestName: string
  email: string
  bookingId: string
  hotel: {
    id: string
    name: string
    address: string
    phone: string
    checkInTime: string
    checkOutTime: string
  }
  booking: {
    confirmationCode: string
    checkIn: string
    checkOut: string
    guests: number
    status: string
    room: {
      number: string
      type: string
      floor: number
      beds: number
      capacity: number
      amenities: string[]
    }
    totalAmount: number
    currency: string
  }
  loyaltyPoints: {
    current: number
    tier: string
    pointsToNextTier: number
  }
  specialRequests?: string
  accessInfo: {
    roomKeyActive: boolean
    wifiCredentialsAvailable: boolean
    digitalKeyExpiry: string
  }
}

export default function GuestDashboard() {
  const router = useRouter()
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null)
  const [journeyEvents, setJourneyEvents] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGuestProfile()
  }, [])

  const fetchGuestProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to continue')
        router.push('/auth/login')
        return
      }

      const response = await fetch('http://localhost:5000/api/auth/guest-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setGuestProfile(result.data)
        
        // Fetch journey events
        if (result.data.bookingId) {
          fetchJourneyEvents(result.data.bookingId)
          fetchFacilities(result.data.hotel.id || result.data.hotelId)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch profile data')
        
        if (response.status === 401) {
          toast.error('Session expired. Please login again.')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
        }
      }
    } catch (error) {
      console.error('Failed to fetch guest profile:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJourneyEvents = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`http://localhost:5000/api/journey/guest/${bookingId}/journey`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setJourneyEvents(result.data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch journey events:', error)
    }
  }

  const fetchFacilities = async (hotelId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`http://localhost:5000/api/facility/guest/${hotelId}/facilities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setFacilities(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch facilities:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800'
      case 'upcoming':
        return 'bg-warning-100 text-warning-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze':
        return 'text-amber-600'
      case 'Silver':
        return 'text-gray-500'
      case 'Gold':
        return 'text-yellow-500'
      case 'Platinum':
        return 'text-purple-600'
      default:
        return 'text-gray-500'
    }
  }

  const getFacilityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dining':
      case 'restaurant':
        return <Utensils className="h-5 w-5" />
      case 'recreation':
      case 'pool':
        return <Waves className="h-5 w-5" />
      case 'wellness':
      case 'spa':
      case 'gym':
        return <Dumbbell className="h-5 w-5" />
      case 'entertainment':
        return <Activity className="h-5 w-5" />
      case 'parking':
        return <Car className="h-5 w-5" />
      default:
        return <Coffee className="h-5 w-5" />
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'check_in':
        return <Key className="h-4 w-4" />
      case 'door_access':
        return <Key className="h-4 w-4" />
      case 'facility_visit':
        return <MapPin className="h-4 w-4" />
      case 'purchase':
        return <ShoppingBag className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !guestProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error || 'Failed to load profile'}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {guestProfile.guestName}! 👋
              </h1>
              <p className="text-gray-600">Manage your stay at {guestProfile.hotel.name}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="btn-secondary flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Current Stay Summary */}
        <div className="card mb-8 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Current Stay</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(guestProfile.booking.status)}`}>
              {guestProfile.booking.status.charAt(0).toUpperCase() + guestProfile.booking.status.slice(1)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hotel & Room Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{guestProfile.hotel.name}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary-600" />
                    {guestProfile.hotel.address}
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-primary-600" />
                    {guestProfile.hotel.phone}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Room Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-2 text-primary-600" />
                    Room {guestProfile.booking.room.number}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-primary-600" />
                    {guestProfile.booking.guests} guests
                  </div>
                  <div className="col-span-2 text-gray-600">
                    {guestProfile.booking.room.type} • Floor {guestProfile.booking.room.floor}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stay Details */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Stay Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{new Date(guestProfile.booking.checkIn).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{new Date(guestProfile.booking.checkOut).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Confirmation:</span>
                    <span className="font-medium">{guestProfile.booking.confirmationCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">
                      ${guestProfile.booking.totalAmount} {guestProfile.booking.currency}
                    </span>
                  </div>
                </div>
              </div>
              
              {guestProfile.specialRequests && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                  <p className="text-sm text-gray-600">{guestProfile.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Room Amenities */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Room Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {guestProfile.booking.room.amenities.map((amenity, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
          
          {/* Quick Access Buttons */}
          <div className="flex gap-3">
            <Link 
              href={`/unlock/${guestProfile.bookingId}`} 
              className="btn-primary flex-1 text-center"
              style={{ opacity: guestProfile.accessInfo.roomKeyActive ? 1 : 0.5 }}
            >
              <Key className="h-4 w-4 mr-2 inline" />
              {guestProfile.accessInfo.roomKeyActive ? 'Unlock Room' : 'Key Inactive'}
            </Link>
            <Link 
              href={`/wifi/${guestProfile.bookingId}`} 
              className="btn-secondary flex-1 text-center"
              style={{ opacity: guestProfile.accessInfo.wifiCredentialsAvailable ? 1 : 0.5 }}
            >
              <Wifi className="h-4 w-4 mr-2 inline" />
              {guestProfile.accessInfo.wifiCredentialsAvailable ? 'Get WiFi' : 'WiFi Unavailable'}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Loyalty & Payment */}
          <div className="lg:col-span-1 space-y-6">
            {/* Loyalty Points */}
            <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Loyalty Points</h3>
                <Star className={`h-6 w-6 ${getTierColor(guestProfile.loyaltyPoints.tier)}`} />
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900">{guestProfile.loyaltyPoints.current.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Available Points</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-amber-100 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <span className={`text-sm font-semibold ${getTierColor(guestProfile.loyaltyPoints.tier)}`}>
                    {guestProfile.loyaltyPoints.tier}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(100, (guestProfile.loyaltyPoints.current / (guestProfile.loyaltyPoints.current + guestProfile.loyaltyPoints.pointsToNextTier)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {guestProfile.loyaltyPoints.pointsToNextTier} points to next tier
                </div>
              </div>
              
              <Link href="/loyalty" className="btn-secondary w-full">
                <Star className="h-4 w-4 mr-2" />
                View Rewards
              </Link>
            </div>

            {/* Payment & Billing */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment & Billing</h3>
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Stay</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${guestProfile.booking.totalAmount} {guestProfile.booking.currency}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Total booking amount</div>
              </div>
              
              <div className="flex gap-2">
                <Link 
                  href="/guest/payment" 
                  className="btn-primary flex-1 text-center"
                >
                  <CreditCard className="h-4 w-4 mr-2 inline" />
                  Pay Bills
                </Link>
                <button className="btn-secondary flex-1">
                  <QrCode className="h-4 w-4 mr-2 inline" />
                  QR Pay
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href={`/wifi/${guestProfile.bookingId}`} 
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <Wifi className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 text-center">WiFi Access</span>
                </Link>

                <Link 
                  href="/guest/payment" 
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 text-center">Payments</span>
                </Link>

                <Link 
                  href="/guest/rewards" 
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
                    <Gift className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 text-center">Rewards</span>
                </Link>
                
                <Link 
                  href="/support" 
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                    <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 text-center">Support</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Content - Journey & Facilities */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journey Timeline */}
            <div className="card min-h-[540px] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Journey Timeline</h2>
                <Timer className="h-6 w-6 text-gray-400" />
              </div>
              
              {journeyEvents.length > 0 ? (
                <div className="space-y-4">
                  {journeyEvents.slice(0, 8).map((event, index) => (
                    <div key={event.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <div className="text-primary-600">
                          {getEventIcon(event.eventType)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900">
                            {event.title}
                          </div>
                          {event.amount && (
                            <div className="text-sm font-bold text-success-600">
                              ${event.amount} {event.currency || 'USD'}
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {journeyEvents.length > 8 && (
                    <div className="text-center pt-4">
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        View all {journeyEvents.length} events
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Your Journey Starts Here</p>
                  <p className="text-sm">Activity will appear as you use hotel services</p>
                </div>
              )}
            </div>

            {/* Hotel Facilities */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Hotel Facilities</h2>
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              
              {facilities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facilities.map((facility) => (
                    <div key={facility.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <div className="text-blue-600">
                            {getFacilityIcon(facility.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {facility.name}
                          </h3>
                          {facility.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {facility.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {facility.location && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {facility.location}
                              </span>
                            )}
                            {facility.services && facility.services.length > 0 && (
                              <span>
                                {facility.services.length} service{facility.services.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {facility.requiresPayment && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Payment Required
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Coffee className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Facilities Loading...</p>
                  <p className="text-sm">Hotel facilities will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}