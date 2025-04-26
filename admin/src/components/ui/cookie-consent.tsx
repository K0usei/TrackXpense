"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50">
      <CardHeader>
        <CardTitle>Cookie Notice</CardTitle>
        <CardDescription>
          We use cookies to enable features like Google Sign-in and improve your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        This site requires third-party cookies for authentication. Please enable them in your browser settings.
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowBanner(false)}>
          Later
        </Button>
        <Button onClick={handleAccept}>
          Accept
        </Button>
      </CardFooter>
    </Card>
  )
}
