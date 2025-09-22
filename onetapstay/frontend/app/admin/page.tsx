'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, Edit, Trash2, Eye } from 'lucide-react'
import TimeoutAlarmPanel from '@/components/TimeoutAlarmPanel'

interface Booking {
  id: string
  externalBookingId: string
  guestName: string
  guestEmail: string
  room: {
    number: string
    type: string
  }
  hotel: {
    name: string
  }
  checkIn: string
  checkOut: string
  status: string
  isTimeoutActive: boolean
  createdAt: string
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState<'bookings' | 'alarms'>('bookings')

  // Check if user is authorized to access this page
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    console.log('Admin page - checking auth:', { token: !!token, user })
    
    if (!token || !user) {
      console.log('Admin page - no token or user, redirecting to login')
      window.location.href = '/auth/login'
      return
    }

    try {
      const userData = JSON.parse(user)
      console.log('Admin page - parsed user data:', userData)
      if (userData.role !== 'STAFF' && userData.role !== 'ADMIN') {
        console.log('Admin page - unauthorized role:', userData.role)
        window.location.href = '/auth/login'
        return
      }
      console.log('Admin page - authorization passed')
    } catch (error) {
      console.error('Error parsing user data:', error)
      window.location.href = '/auth/login'
      return
    }
  }, [])

  const fetchBookings = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      })
      
      const response = await fetch(`http://localhost:5000/api/admin/bookings?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setBookings(data.bookings)
        setTotalPages(data.pagination.pages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchBookings(currentPage, searchTerm)
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchBookings(1, searchTerm)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'checked-in': return 'bg-blue-100 text-blue-800'
      case 'checked-out': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage hotel bookings and timeout monitoring</p>
        </div>
        <Link 
          href="/admin/bookings/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add New Booking
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Bookings Management
          </button>
          <button
            onClick={() => setActiveTab('alarms')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'alarms'
                ? 'border-red-500 text-red-600 bg-red-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🚨 Timeout Alarms
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'bookings' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="p-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by booking ID, guest name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button 
                  type="submit" 
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Bookings List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <p className="text-gray-600 mt-1">Manage bookings from external booking platforms</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings found. <Link href="/admin/bookings/new" className="text-blue-600 hover:underline">Add your first booking</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{booking.guestName}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.isTimeoutActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-100 border border-orange-200">
                            Timeout Active
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Booking ID:</span>
                          <br />
                          {booking.externalBookingId}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>
                          <br />
                          {booking.guestEmail}
                        </div>
                        <div>
                          <span className="font-medium">Room:</span>
                          <br />
                          {booking.room.number} ({booking.room.type})
                        </div>
                        <div>
                          <span className="font-medium">Stay Period:</span>
                          <br />
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button 
                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/admin/bookings/edit/${booking.id}`}
                        className="p-2 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 text-blue-600 transition-colors"
                        title="Edit Booking"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => deleteBooking(booking.id)}
                        className="p-2 border border-gray-300 rounded-md text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchBookings(page, searchTerm)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {activeTab === 'alarms' && (
        <TimeoutAlarmPanel />
      )}
    </div>
  )
}