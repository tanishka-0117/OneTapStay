'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, DollarSign, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentMethod {
  id: string
  last4: string
  brand: string
  exp_month: number
  exp_year: number
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  method_details: string
  createdAt: string
  description?: string
}

const PaymentPage: React.FC = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchPaymentMethods()
    fetchPaymentHistory()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-basic/methods')
      const data = await response.json()
      if (data.success) {
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payment-basic/history')
      const data = await response.json()
      if (data.success) {
        setPaymentHistory(data.payments || [])
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !selectedPaymentMethod) {
      setErrorMessage('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setPaymentStatus('processing')
    setErrorMessage('')

    try {
      const response = await fetch('/api/payment-basic/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount) * 100, // Convert to cents
          currency: 'usd',
          payment_method_id: selectedPaymentMethod,
          description: description || 'Payment'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentStatus('success')
        setAmount('')
        setDescription('')
        setSelectedPaymentMethod('')
        fetchPaymentHistory() // Refresh history
      } else {
        setPaymentStatus('error')
        setErrorMessage(data.message || 'Payment failed')
      }
    } catch (error) {
      setPaymentStatus('error')
      setErrorMessage('Network error occurred')
      console.error('Payment error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
                <p className="text-gray-600">Secure payment processing</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">USD</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Make Payment
            </h2>

            {paymentStatus === 'success' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700">Payment processed successfully!</span>
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Payment description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || paymentStatus === 'processing'}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? 'Processing...' : 'Pay Now'}
              </button>
            </form>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Payment History</h2>
            
            {paymentHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payment history available</p>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <p className="text-sm text-gray-600">{payment.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === 'succeeded' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{payment.method_details}</span>
                      <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage