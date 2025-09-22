export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 overflow-hidden">
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl tracking-tight font-extrabold">
                <span className="block text-gray-900">Welcome to</span>
                <span className="block bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  OneTapStay
                </span>
              </h1>
              <div className="mt-6 relative">
                <p className="max-w-4xl mx-auto text-xl sm:text-2xl text-gray-600 leading-relaxed">
                  Your seamless hotel booking experience starts here. Book, manage, and enjoy your stay with just 
                  <span className="text-cyan-600 font-semibold"> one tap</span>.
                </p>
              </div>
            </div>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/auth/login"
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 hover:from-cyan-700 hover:to-teal-700"
              >
                <span className="relative flex items-center">
                  🚀 Get Started Now
                </span>
              </a>
              <a
                href="#features"
                className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-cyan-300 hover:text-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Quick Access Section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quick Access</h3>
              <p className="text-gray-600">Choose your access type to get started</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <a
                href="/auth/login"
                className="group p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">👤</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Guest Login</h4>
                  <p className="text-sm text-gray-600">Access your booking and guest services</p>
                </div>
              </a>
              
              <a
                href="/staff/auth"
                className="group p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-green-300"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">👨‍💼</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Staff Login</h4>
                  <p className="text-sm text-gray-600">Facility staff dashboard access</p>
                </div>
              </a>
              
              <a
                href="/auth/login"
                className="group p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-purple-300"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">⚙️</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Admin Login</h4>
                  <p className="text-sm text-gray-600">Hotel management dashboard</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose OneTapStay?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">Experience the future of hotel booking with our innovative features</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Book your perfect stay in seconds with our streamlined process</p>
              </div>
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Safe</h3>
                <p className="text-gray-600">Your data and payments are protected with enterprise-grade security</p>
              </div>
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized</h3>
                <p className="text-gray-600">Get recommendations tailored to your preferences and travel style</p>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Features Section */}
        <section id="properties" className="py-20 bg-gradient-to-r from-cyan-50 to-teal-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">One ID. Every Experience.</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">From check-in to check-out - everything, everywhere, all in one unified digital identity</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                  <span className="text-5xl text-white">📱</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Guest Dashboard</h3>
                  <p className="text-gray-600 mb-4">Single ID hub with QR/NFC access to room, dining, spa, and all services</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">✓ Contactless Access</span>
                    <span className="text-yellow-400">⚡ Instant</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <span className="text-5xl text-white">🤖</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Personalization</h3>
                  <p className="text-gray-600 mb-4">Smart recommendations and 24/7 bot assistance tailored to guest preferences</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">✓ Smart Assistant</span>
                    <span className="text-yellow-400">🧠 AI-Driven</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <span className="text-5xl text-white">💳</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Integrated Digital Wallet</h3>
                  <p className="text-gray-600 mb-4">Seamless payments and real-time loyalty tracking across all hotel services</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">✓ Unified Billing</span>
                    <span className="text-yellow-400">🔒 Secure</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-16">
              <div className="max-w-4xl mx-auto mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Benefits</h3>
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center mb-2">
                      <span className="text-green-500 mr-2">⏱️</span>
                      <span className="font-semibold text-gray-900">Time Saved</span>
                    </div>
                    <p className="text-sm text-gray-600">Faster check-in/out with QR codes and unified platform access</p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center mb-2">
                      <span className="text-blue-500 mr-2">💰</span>
                      <span className="font-semibold text-gray-900">Cost Reduced</span>
                    </div>
                    <p className="text-sm text-gray-600">Efficient resource management and reduced operational costs</p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center mb-2">
                      <span className="text-purple-500 mr-2">😊</span>
                      <span className="font-semibold text-gray-900">Guest Satisfaction</span>
                    </div>
                    <p className="text-sm text-gray-600">Personalized AI recommendations and smooth experience</p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center mb-2">
                      <span className="text-indigo-500 mr-2">⚙️</span>
                      <span className="font-semibold text-gray-900">Operational Efficiency</span>
                    </div>
                    <p className="text-sm text-gray-600">Data-driven decisions and optimized staffing allocation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Join thousands of travelers who trust OneTapStay for their perfect stays
              </p>
              <a
                href="mailto:support@onetapstay.com"
                className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 hover:from-cyan-700 hover:to-teal-700"
              >
                📧 Contact Support
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}