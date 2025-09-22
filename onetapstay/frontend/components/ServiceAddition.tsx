'use client'

import { useState, useEffect } from 'react'
import { Plus, DollarSign, ShoppingCart, CreditCard, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
}

interface GuestInfo {
  id: string
  firstName: string
  lastName: string
  booking: {
    id: string
  }
}

interface ServiceAdditionProps {
  facilityType: string
  guestInfo: GuestInfo | null
  onServiceAdded: () => void
}

export default function ServiceAddition({ facilityType, guestInfo, onServiceAdded }: ServiceAdditionProps) {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending' | 'dues'>('completed')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingService, setIsAddingService] = useState(false)

  useEffect(() => {
    if (facilityType) {
      fetchServices()
    }
  }, [facilityType])

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/facility/services/${facilityType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setServices(result.data)
      } else {
        toast.error('Failed to load services')
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      toast.error('Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  const addService = async () => {
    if (!guestInfo || !selectedService) {
      toast.error('Please select a guest and service')
      return
    }

    setIsAddingService(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/facility/add-service', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: guestInfo.booking.id,
          serviceId: selectedService,
          quantity,
          paymentStatus,
          notes: notes.trim() || undefined
        })
      })

      if (response.ok) {
        toast.success('Service added successfully!')
        setSelectedService('')
        setQuantity(1)
        setPaymentStatus('completed')
        setNotes('')
        onServiceAdded()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add service')
      }
    } catch (error) {
      console.error('Failed to add service:', error)
      toast.error('Failed to add service')
    } finally {
      setIsAddingService(false)
    }
  }

  const selectedServiceDetails = services.find(s => s.id === selectedService)
  const totalAmount = selectedServiceDetails ? selectedServiceDetails.price * quantity : 0

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
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

  if (!guestInfo) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Please search for a guest first to add services</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Plus className="h-5 w-5 mr-2" />
        Add Service for {guestInfo.firstName} {guestInfo.lastName}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a service</option>
              {services.filter(s => s.isAvailable).map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {selectedServiceDetails && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">{selectedServiceDetails.description}</p>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'completed', label: 'Paid', icon: CreditCard },
                { value: 'pending', label: 'Pending', icon: Clock },
                { value: 'dues', label: 'Dues', icon: DollarSign }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentStatus(value as any)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    paymentStatus === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mx-auto mb-1" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Total Amount */}
          {totalAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-blue-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(paymentStatus)}`}>
                  {paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={addService}
            disabled={!selectedService || isAddingService}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAddingService ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}