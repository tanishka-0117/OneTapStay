'use client'

import { useState, useEffect } from 'react'
import StaffLayout from '../layout'
import GuestLookup from '../../../components/GuestLookup'
import ServiceAddition from '../../../components/ServiceAddition'
import { Utensils, TrendingUp, Users, DollarSign, Clock } from 'lucide-react'

interface Transaction {
  id: string
  guest: {
    firstName: string
    lastName: string
    booking: {
      room: {
        number: string
      }
    }
  }
  service: {
    name: string
    price: number
  }
  quantity: number
  totalAmount: number
  paymentStatus: string
  notes?: string
  createdAt: string
}

interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  pendingPayments: number
  activeGuests: number
}

export default function RestaurantDashboard() {
  const [selectedGuest, setSelectedGuest] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    pendingPayments: 0,
    activeGuests: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch recent transactions
      const transactionsResponse = await fetch('http://localhost:5000/api/facility/transactions?facility=restaurant&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (transactionsResponse.ok) {
        const transactionsResult = await transactionsResponse.json()
        setRecentTransactions(transactionsResult.data)
      }

      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/facility/stats?facility=restaurant', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json()
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestFound = (guest: any) => {
    setSelectedGuest(guest)
  }

  const handleServiceAdded = () => {
    fetchDashboardData() // Refresh data after adding a service
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'dues':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <StaffLayout facilityName="Restaurant" facilityType="restaurant">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todayOrders}</p>
              </div>
              <Utensils className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.pendingPayments)}</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Guests</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activeGuests}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Guest Lookup & Service Addition */}
          <div className="space-y-6">
            <GuestLookup onGuestFound={handleGuestFound} />
            <ServiceAddition 
              facilityType="restaurant" 
              guestInfo={selectedGuest}
              onServiceAdded={handleServiceAdded}
            />
          </div>

          {/* Right Column - Recent Transactions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Orders
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">
                            {transaction.guest.firstName} {transaction.guest.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            Room {transaction.guest.booking.room.number}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatTime(transaction.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">
                              {transaction.service.name} × {transaction.quantity}
                            </p>
                            {transaction.notes && (
                              <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(transaction.totalAmount)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                              {transaction.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  )
}