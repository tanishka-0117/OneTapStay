// API utility for authenticated requests
export class ApiClient {
  private static baseURL = 'http://localhost:5000'
  private static isRefreshing = false
  private static refreshPromise: Promise<any> | null = null

  static async refreshToken(): Promise<string> {
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('No token to refresh')
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data.token
      }

      throw new Error('Invalid refresh response')
    } catch (error) {
      // If refresh fails, clear storage and redirect
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
      throw error
    }
  }

  static async request(endpoint: string, options: RequestInit = {}) {
    let token = localStorage.getItem('token')
    
    if (!token) {
      window.location.href = '/auth/login'
      throw new Error('No authentication token')
    }

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config)

      // Handle authentication errors with token refresh
      if (response.status === 401) {
        // Prevent multiple simultaneous refresh attempts
        if (!this.isRefreshing) {
          this.isRefreshing = true
          this.refreshPromise = this.refreshToken()
        }

        try {
          const newToken = await this.refreshPromise
          this.isRefreshing = false
          this.refreshPromise = null

          // Retry original request with new token
          const retryConfig: RequestInit = {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
              ...options.headers,
            },
          }

          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, retryConfig)
          const retryData = await retryResponse.json()
          
          if (!retryResponse.ok) {
            throw new Error(retryData.message || `HTTP error! status: ${retryResponse.status}`)
          }

          return retryData
        } catch (refreshError) {
          this.isRefreshing = false
          this.refreshPromise = null
          throw refreshError
        }
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Convenience methods
  static async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' })
  }

  static async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}