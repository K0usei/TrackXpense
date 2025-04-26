'use client'

import { useNetwork } from '@/hooks/useNetwork'

export function OfflineIndicator() {
  const isOnline = useNetwork()

  if (process.env.NODE_ENV === 'development') {
    console.log('OfflineIndicator status:', isOnline ? 'Online' : 'Offline')
  }

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg">
      You are offline
    </div>
  )
}

