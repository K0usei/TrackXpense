import { useEffect } from 'react'
import { socket } from '@/lib/services/socket-service'
import { useAuth as useFirebaseAuth } from '@/hooks/useAuth'

export function useAuth() {
  const { user } = useFirebaseAuth()

  useEffect(() => {
    if (user?.uid) {
      socket.initialize(user.uid)
    }
    return () => {
      socket.disconnect()
    }
  }, [user?.uid])

  return { user }
}

