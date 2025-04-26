import { useState, useEffect } from 'react'
import { checkAndEnableNetwork } from '@/lib/firebase'

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    const initialStatus = navigator?.onLine ?? true
    setIsOnline(initialStatus)

    if (process.env.NODE_ENV === 'development') {
      console.log('Initial network status:', initialStatus ? 'Online' : 'Offline')
    }

    const handleOnline = () => {
      setIsOnline(true)
      checkAndEnableNetwork()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}


