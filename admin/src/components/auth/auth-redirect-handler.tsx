'use client'

import { useEffect } from 'react'
import { getAuth, getRedirectResult } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export function AuthRedirectHandler() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    console.log('AuthRedirectHandler mounted')
    const auth = getAuth()

    getRedirectResult(auth)
      .then((result) => {
        console.log('Redirect result:', result)
        if (result?.user) {
          console.log('User authenticated:', result.user)
          toast({
            title: 'Success',
            description: 'Successfully signed in with Google',
            duration: 3000,
          })
          const baseUrl = window.location.origin
          window.location.href = `${baseUrl}/dashboard`
        }
      })
      .catch((error) => {
        console.error('Redirect error:', error)
        if (error.code !== 'auth/redirect-cancelled-by-user') {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to complete sign-in. Please try again.',
            duration: 5000,
          })
        }
      })
  }, [router, toast])

  return null
}
function auth(): import("firebase/auth").Auth {
  return getAuth();
}


