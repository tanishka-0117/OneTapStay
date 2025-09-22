'use client'

import { useState } from 'react'
import { Search, User, MapPin, Calendar, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface GuestInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  booking: {
    id: string
    room: {
      number: string
      type: string
    }
    checkIn: string
    checkOut: string
    status: string
  }
}

interface GuestLookupProps {
  onGuestFound: (guest: GuestInfo) => void
}

export default function GuestLookup({ onGuestFound }: GuestLookupProps) {
  const [bookingId, setBookingId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)

  const searchGuest = async () => {
    if (!bookingId.trim()) {
      toast.error('Please enter a booking ID')
      return
    }

    setIsSearching(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/facility/guest/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setGuestInfo(result.data)
        onGuestFound(result.data)
        toast.success('Guest found!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Guest not found')
        setGuestInfo(null)
      }
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed. Please try again.')
      setGuestInfo(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchGuest()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'checked_in':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Search className="h-5 w-5 mr-2" />
        Guest Lookup
      </h2>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Enter Booking ID"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={searchGuest}
          disabled={isSearching}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSearching ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Search</span>
        </button>
      </div>

      {guestInfo && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-500 mr-2" />
                <span className="font-medium">
                  {guestInfo.firstName} {guestInfo.lastName}
                </span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                <span>Room {guestInfo.booking.room.number} ({guestInfo.booking.room.type})</span>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                <span>Booking: {guestInfo.booking.id}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <span>
                  {formatDate(guestInfo.booking.checkIn)} - {formatDate(guestInfo.booking.checkOut)}
                </span>
              </div>
              
              <div className="flex items-center">
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(guestInfo.booking.status)}`}
                >
                  {guestInfo.booking.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}