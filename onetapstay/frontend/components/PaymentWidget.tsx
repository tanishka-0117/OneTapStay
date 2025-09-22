'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Plus, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentMethod {
  id: string
  last4: string
  brand: string
  exp_month: number
  exp_year: number
}

interface RecentPayment {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  description?: string
}

const PaymentWidget: React.FC = () => {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPaymentData()
  }, [])

  const fetchPaymentData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch payment methods
      const methodsResponse = await fetch('/api/payments/methods', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json()
        setPaymentMethods(methodsData.paymentMethods || [])
      }

      // Fetch recent payments
      const historyResponse = await fetch('/api/payments/history?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setRecentPayments(historyData.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-500" />
          Payment & Billing
        </h3>
        <button
          onClick={() => router.push('/guest/payment')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Payment Methods Section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Methods</h4>
        {paymentMethods.length > 0 ? (
          <div className="space-y-2">
            {paymentMethods.slice(0, 2).map((method) => (
              <div key={method.id} className="flex items-center gap-2 text-sm">
                <CreditCard className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">
                  {method.brand.toUpperCase()} •••• {method.last4}
                </span>
              </div>
            ))}
            {paymentMethods.length > 2 && (
              <p className="text-xs text-gray-500">+{paymentMethods.length - 2} more</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Plus className="w-3 h-3" />
            <span>No payment methods added</span>
          </div>
        )}
      </div>

      {/* Recent Payments Section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Payments</h4>
        {recentPayments.length > 0 ? (
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-green-500" />
                  <span className="text-gray-600">
                    {payment.description || 'Payment'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent payments</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => router.push('/guest/payment')}
          className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
        >
          Make Payment
        </button>
        <button
          onClick={() => router.push('/guest/payment')}
          className="px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
        >
          Add Card
        </button>
      </div>
    </div>
  )
}

export default PaymentWidget