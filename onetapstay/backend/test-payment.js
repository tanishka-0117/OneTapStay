// Simple test script for payment system
const testPaymentSystem = async () => {
  const baseUrl = 'http://localhost:5000/api/payments'
  
  console.log('🔧 Testing Payment System...')
  
  try {
    // Test 1: Get payment methods
    console.log('\n1️⃣  Testing GET /api/payments/methods')
    const methodsResponse = await fetch(`${baseUrl}/methods`)
    const methodsData = await methodsResponse.json()
    console.log('✅ Payment methods:', methodsData)
    
    // Test 2: Get payment history
    console.log('\n2️⃣  Testing GET /api/payments/history')
    const historyResponse = await fetch(`${baseUrl}/history`)
    const historyData = await historyResponse.json()
    console.log('✅ Payment history:', historyData)
    
    // Test 3: Create payment intent (requires Stripe keys)
    console.log('\n3️⃣  Testing POST /api/payments/create-intent')
    const intentResponse = await fetch(`${baseUrl}/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 1000, // $10.00 in cents
        currency: 'usd',
        description: 'Test payment'
      })
    })
    const intentData = await intentResponse.json()
    console.log('✅ Payment intent:', intentData)
    
    console.log('\n🎉 All payment system tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPaymentSystem()