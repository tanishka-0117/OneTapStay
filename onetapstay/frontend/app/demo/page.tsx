import Link from 'next/link'
import { ArrowLeft, Play, Smartphone, CreditCard, Key, Wifi } from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-primary-600">OneTapStay Demo</h1>
            <Link href="/auth/login" className="btn-primary">
              Try It Now
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            See OneTapStay in Action
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Experience the future of contactless hotel stays
          </p>
          
          {/* Demo Video Placeholder */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Play className="h-8 w-8 text-primary-600 ml-1" />
                </div>
                <p className="text-primary-700 font-medium">Demo Video Coming Soon</p>
                <p className="text-primary-600 text-sm">Interactive demo available below</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo Steps */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <Smartphone className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">1. Check-in via Phone</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Simply enter your phone number to receive a secure SMS verification code. No front desk required!
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-full bg-white border rounded px-3 py-2 text-sm">
                  +1 (555) 123-4567
                </div>
                <button className="btn-primary text-sm">Send OTP</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Key className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">2. Instant Room Access</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Get your digital room key instantly. Unlock your room with a simple QR code scan.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="w-24 h-24 bg-gray-900 rounded-lg mx-auto flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded grid grid-cols-3 gap-px">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-gray-900 rounded-sm"></div>
                  ))}
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">Digital Room Key</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">3. Seamless Payments</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Automatic payments via Stripe. No cash, no cards at checkout - just walk out when ready.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Room 205 (2 nights)</span>
                <span className="text-sm font-bold">$240.00</span>
              </div>
              <div className="text-xs text-green-600 mt-1">✓ Payment processed automatically</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <Wifi className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">4. Smart Features</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Automatic WiFi access, loyalty points, and personalized service - all through the app.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                WiFi: OneTapStay_Guest
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Loyalty: +150 points earned
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Experience OneTapStay?
          </h2>
          <p className="text-gray-600 mb-6">
            Join the future of contactless hospitality today
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/login" className="btn-primary text-lg px-8 py-3">
              Start Your Stay
            </Link>
            <Link href="/" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}