import type { Metadata } from 'next'
import { Providers } from '../providers'
import { Toaster } from 'react-hot-toast'
import GuestNavbar from '../../components/GuestNavbar'

export const metadata: Metadata = {
  title: 'Guest Dashboard - OneTapStay',
  description: 'Manage your stay with OneTapStay - Smart Hospitality Platform',
}

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <GuestNavbar />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}