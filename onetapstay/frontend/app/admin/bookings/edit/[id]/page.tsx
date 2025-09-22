'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

interface BookingData {
  id: string
  externalBookingId: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  status: string
  room: {
    number: string
    type: string
  }
  hotel: {
    name: string
  }
}

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    status: 'confirmed'
  })
  const [originalData, setOriginalData] = useState<BookingData | null>(null)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      router.push('/auth/login')
      return
    }

    try {
      const userData = JSON.parse(user)
      if (userData.role !== 'STAFF' && userData.role !== 'ADMIN') {
        router.push('/auth/login')
        return
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/auth/login')
      return
    }
  }, [router])

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      const result = await response.json()

      if (result.success) {
        const booking = result.booking
        setOriginalData(booking)
        
        // Convert datetime strings to datetime-local format
        const checkInDate = new Date(booking.checkIn)
        const checkOutDate = new Date(booking.checkOut)
        
        setFormData({
          guestName: booking.guestName || '',
          guestEmail: booking.guestEmail || '',
          roomNumber: booking.room?.number || '',
          checkIn: checkInDate.toISOString().slice(0, 16), // Format for datetime-local input
          checkOut: checkOutDate.toISOString().slice(0, 16),
          status: booking.status || 'confirmed'
        })
      } else {
        setError('Failed to load booking details')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Convert datetime-local to ISO 8601 format
      const submissionData = {
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        roomNumber: formData.roomNumber,
        checkIn: formData.checkIn ? new Date(formData.checkIn).toISOString() : undefined,
        checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : undefined,
        status: formData.status
      }

      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData),
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      const result = await response.json()

      if (result.success) {
        alert('✅ Booking updated successfully!')
        router.push('/admin')
      } else {
        setError(result.message || 'Failed to update booking')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      setError('Failed to update booking. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading booking details...</span>
        </div>
      </div>
    )
  }

  if (error && !originalData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
          <p className="text-gray-600 mt-1">
            Update booking details for {originalData?.externalBookingId || 'this booking'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
          <p className="text-gray-600 mt-1">Update the booking information as needed</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Booking Info (Read-only) */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Booking ID:</span>
                  <p className="text-gray-900">{originalData?.externalBookingId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Hotel:</span>
                  <p className="text-gray-900">{originalData?.hotel?.name || 'OneTapStay Hotel'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-900">
                    {originalData ? new Date(originalData.id).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Name *
                </label>
                <input
                  type="text"
                  id="guestName"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Email *
                </label>
                <input
                  type="email"
                  id="guestEmail"
                  name="guestEmail"
                  value={formData.guestEmail}
                  onChange={handleInputChange}
                  required
                  placeholder="guest@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Room and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  id="roomNumber"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked-in">Checked In</option>
                  <option value="checked-out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Stay Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="checkIn"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="checkOut"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end gap-4">
                <Link
                  href="/admin"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}