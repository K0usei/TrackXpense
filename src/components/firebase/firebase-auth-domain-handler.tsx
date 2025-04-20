'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

export function FirebaseAuthDomainHandler() {
  const [showAlert, setShowAlert] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      setCurrentDomain(hostname)

      // Only show for non-localhost domains
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // Listen for Firebase Auth domain errors
        const handleError = (event: PromiseRejectionEvent) => {
          if (event.reason &&
            typeof event.reason.code === 'string' &&
            event.reason.code.includes('auth/unauthorized-domain')) {
            console.error('Firebase Auth unauthorized domain error detected:', event.reason)
            setShowAlert(true)
          }
        }

        window.addEventListener('unhandledrejection', handleError)

        return () => {
          window.removeEventListener('unhandledrejection', handleError)
        }
      }
    }
  }, [])

  if (!showAlert) return null

  return (
    <Alert
      variant="destructive"
      className="fixed bottom-4 left-4 z-50 max-w-md shadow-lg border border-red-200 dark:border-red-800"
    >
      <h4 className="mb-2 font-medium leading-none tracking-tight">Authentication Domain Error</h4>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          This domain (<strong>{currentDomain}</strong>) is not authorized for Firebase Authentication.
        </p>
        <p className="mb-4">
          You need to add this domain to your Firebase project's authorized domains list or use localhost instead.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://localhost:3000', '_self')}
          >
            Switch to localhost
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://console.firebase.google.com', '_blank')}
          >
            Open Firebase Console <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
