'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  LogIn, 
  ShoppingBag, 
  CreditCard, 
  Calendar,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface JourneyEvent {
  id: string
  type: 'check_in' | 'facility_purchase' | 'payment' | 'door_access' | 'other'
  title: string
  description: string
  amount?: number
  paymentStatus?: 'completed' | 'pending' | 'dues'
  facility?: {
    name: string
    type: string
  }
  createdAt: string
}

interface JourneyTimelineProps {
  bookingId?: string
}

export default function JourneyTimeline({ bookingId }: JourneyTimelineProps) {
  const [events, setEvents] = useState<JourneyEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)

  useEffect(() => {
    if (bookingId) {
      fetchJourneyEvents()
    }
  }, [bookingId])

  const fetchJourneyEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/journey/timeline${bookingId ? `?bookingId=${bookingId}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setEvents(result.data.events || [])
        setTotalSpent(result.data.summary?.totalSpent || 0)
        setPendingAmount(result.data.summary?.pendingAmount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch journey events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'check_in':
        return <LogIn className="h-5 w-5 text-green-600" />
      case 'facility_purchase':
        return <ShoppingBag className="h-5 w-5 text-blue-600" />
      case 'payment':
        return <CreditCard className="h-5 w-5 text-purple-600" />
      case 'door_access':
        return <MapPin className="h-5 w-5 text-orange-600" />
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'check_in':
        return 'bg-green-100 border-green-200'
      case 'facility_purchase':
        return 'bg-blue-100 border-blue-200'
      case 'payment':
        return 'bg-purple-100 border-purple-200'
      case 'door_access':
        return 'bg-orange-100 border-orange-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  const getPaymentStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'dues':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'dues':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Your Journey Timeline
        </h2>
        
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Total Spent</p>
            <p className="font-semibold text-green-600">{formatCurrency(totalSpent)}</p>
          </div>
          {pendingAmount > 0 && (
            <div className="text-center">
              <p className="text-gray-600">Pending</p>
              <p className="font-semibold text-red-600">{formatCurrency(pendingAmount)}</p>
            </div>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Your journey timeline will appear here as you use hotel facilities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < events.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
              )}
              
              <div className={`border rounded-lg p-4 ${getEventColor(event.type)}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-2 bg-white rounded-full border">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {event.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(event.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </p>
                    
                    {event.facility && (
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.facility.name}
                      </div>
                    )}
                    
                    {event.amount && (
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {formatCurrency(event.amount)}
                          </span>
                        </div>
                        
                        {event.paymentStatus && (
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(event.paymentStatus)}`}>
                            {getPaymentStatusIcon(event.paymentStatus)}
                            <span className="font-medium">
                              {event.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}