"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { useToast } from "@/components/ui/use-toast"
import { FirebaseError } from 'firebase/app'
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { Eye, EyeOff } from 'lucide-react'
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider } from '@/lib/firebase'
import { UserProfile } from '@/types/user'

export function LoginForm() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Check for redirect result when component mounts
  React.useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          // User was redirected back from Google sign-in
          console.log('Google sign-in redirect result:', result)

          // Get user profile from Firestore
          const db = getFirestore()
          const userDoc = await getDoc(doc(db, 'users', result.user.uid))

          // Show success toast
          toast({
            title: "Success",
            description: "Successfully signed in with Google",
            duration: 2000,
          })

          // Check if this is a new user
          const isNewUser = !userDoc.exists() || (
            userDoc.data()?.settings?.monthlyBudget === 0 &&
            Object.values(userDoc.data()?.settings?.budgetLimits || {}).every(val => val === 0)
          )

          // Redirect based on user status
          const baseUrl = window.location.origin
          if (isNewUser) {
            console.log('New Google user detected from redirect, going to profile settings')
            window.location.href = `${baseUrl}/profile-settings`
          } else {
            window.location.href = `${baseUrl}/dashboard`
          }
        }
      } catch (error) {
        console.error('Error checking redirect result:', error)
      }
    }

    checkRedirectResult()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log('Starting login process...')

    try {
      const userProfile = await signIn(email, password)
      console.log('Login successful:', userProfile)

      toast({
        title: "Success",
        description: "Successfully signed in",
        duration: 2000,
      })

      // Check if this is a new user (budget values are 0)
      const isNewUser = userProfile.settings.monthlyBudget === 0 &&
        Object.values(userProfile.settings.budgetLimits).every(val => val === 0)

      // Use relative path and current origin for redirect
      const baseUrl = window.location.origin

      // Redirect new users to profile settings, others to dashboard
      if (isNewUser) {
        console.log('New user detected, redirecting to profile settings')
        window.location.href = `${baseUrl}/profile-settings`
      } else {
        window.location.href = `${baseUrl}/dashboard`
      }

    } catch (error: unknown) {
      console.error("Login error:", error)
      const errorMessage = error instanceof FirebaseError
        ? error.message
        : "Invalid email or password"

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // Try popup first
      let userProfile;
      try {
        const result = await signInWithPopup(auth, googleProvider)
        // Get user profile from Firestore
        const db = getFirestore()
        const userDoc = await getDoc(doc(db, 'users', result.user.uid))

        // If the user document exists, use it
        if (userDoc.exists()) {
          userProfile = userDoc.data() as UserProfile
        } else {
          // This is a new user (first time signing in with Google)
          console.log('New Google user, no profile found in Firestore')
          userProfile = null
        }
      } catch (popupError: unknown) {
        // If popup fails, try redirect
        if (popupError instanceof FirebaseError &&
          (popupError.code === 'auth/network-request-failed' ||
            popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/popup-closed-by-user')) {
          await signInWithRedirect(auth, googleProvider)
          return // Don't proceed as redirect will reload the page
        }
        throw popupError // Re-throw if it's a different error
      }

      toast({
        title: "Success",
        description: "Successfully signed in with Google",
        duration: 2000,
      })

      // Check if this is a new user (userProfile is null or budget values are 0)
      const isNewUser = userProfile === null || (
        userProfile?.settings?.monthlyBudget === 0 &&
        Object.values(userProfile?.settings?.budgetLimits || {}).every(val => val === 0)
      )

      // Use relative path and current origin for redirect
      const baseUrl = window.location.origin

      // Redirect new users to profile settings, others to dashboard
      if (isNewUser) {
        console.log('New user detected, redirecting to profile settings')
        window.location.href = `${baseUrl}/profile-settings`
      } else {
        window.location.href = `${baseUrl}/dashboard`
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to sign in with Google"

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again"
            break
          case 'auth/popup-blocked':
            errorMessage = "Popup was blocked. Please enable popups or try again"
            break
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign in cancelled"
            break
          case 'auth/third-party-cookies-blocked':
            errorMessage = "Third-party cookies are blocked. Please enable them in your browser settings"
            break
          default:
            errorMessage = error.message
        }
      }

      console.error("Google sign-in error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </>
        )}
      </Button>
    </form>
  )
}

















