'use client'

import { createContext, useContext, useEffect, useState } from 'react'
// Import the function lazily to avoid initialization issues
const getFirebaseNetworkFunctions = () => import('@/lib/firebase').then(mod => ({
  checkAndEnableNetwork: mod.checkAndEnableNetwork
}))

interface NetworkContextType {
  isOnline: boolean
  isOfflineCapable: boolean
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isOfflineCapable: false
})

function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true) // Default to true
  const [isOfflineCapable, setIsOfflineCapable] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    // Set initial state
    setIsOnline(navigator?.onLine ?? true)

    const handleOnline = async () => {
      setIsOnline(true)
      try {
        const { checkAndEnableNetwork } = await getFirebaseNetworkFunctions()
        checkAndEnableNetwork()
      } catch (error) {
        console.warn('Failed to enable network:', error)
      }
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial network check
    if (navigator?.onLine) {
      getFirebaseNetworkFunctions().then(({ checkAndEnableNetwork }) => {
        checkAndEnableNetwork()
      }).catch(error => {
        console.warn('Failed to enable network on init:', error)
      })
    }

    // Check IndexedDB availability
    const checkOfflineCapability = () => {
      const isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window
      setIsOfflineCapable(isIndexedDBAvailable)
    }
    checkOfflineCapability()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <NetworkContext.Provider value={{ isOnline, isOfflineCapable }}>
      {children}
    </NetworkContext.Provider>
  )
}

export const useNetworkContext = () => useContext(NetworkContext)

export { NetworkProvider }
export default NetworkProvider

