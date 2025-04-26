'use client'

import { useEffect, useState } from 'react'
import { fixFirestoreConnection } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function FirebaseErrorHandler() {
  const [hasError, setHasError] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isFixed, setIsFixed] = useState(false)

  useEffect(() => {
    // Listen for Firebase/Firestore errors
    const handleError = (event: PromiseRejectionEvent | ErrorEvent) => {
      const errorMessage = event instanceof PromiseRejectionEvent 
        ? event.reason?.toString() 
        : event.error?.toString()
      
      if (errorMessage && (
        errorMessage.includes('FIRESTORE') || 
        errorMessage.includes('FIREBASE') ||
        errorMessage.includes('FirebaseError')
      )) {
        console.error('Firebase error detected:', errorMessage)
        setHasError(true)
        setIsFixed(false)
      }
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleError)
    window.addEventListener('error', handleError)

    return () => {
      // Remove event listeners
      window.removeEventListener('unhandledrejection', handleError)
      window.removeEventListener('error', handleError)
    }
  }, [])

  const handleFixConnection = async () => {
    setIsFixing(true)
    try {
      const success = await fixFirestoreConnection()
      setIsFixed(success)
      if (success) {
        setHasError(false)
        // Hide the success message after 3 seconds
        setTimeout(() => {
          setIsFixed(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Error fixing connection:', error)
    } finally {
      setIsFixing(false)
    }
  }

  if (!hasError && !isFixed) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-sm">
      {hasError ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Firebase connection issue detected</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This might affect data loading and saving. Try fixing the connection.
          </p>
          <Button 
            onClick={handleFixConnection} 
            disabled={isFixing}
            className="mt-2"
            size="sm"
          >
            {isFixing ? 'Fixing...' : 'Fix Connection'}
          </Button>
        </div>
      ) : isFixed ? (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">Connection fixed successfully!</p>
        </div>
      ) : null}
    </div>
  )
}
