import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth as firebaseAuth, googleProvider } from '@/lib/firebase'
import { IPAuthProvider } from '@/lib/auth/ip-auth-provider'
import type { UserProfile, UserSettings, CurrencyCode } from '@/types/user'
import { DEFAULT_USER_SETTINGS } from '@/types/user'

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userProfile = await getUserProfile(firebaseUser)
          setUser(userProfile)
          // Get the ID token and set it as a cookie
          const idToken = await firebaseUser.getIdToken()
          document.cookie = `__session=${idToken}; path=/`

          // Check if this is a new user (all budget values are 0)
          const isNewUser = userProfile.settings.monthlyIncome === 0 &&
            userProfile.settings.monthlyBudget === 0 &&
            Object.values(userProfile.settings.budgetLimits).every(val => val === 0)

          // Redirect new users to profile settings page
          if (isNewUser && typeof window !== 'undefined') {
            // Only redirect if we're not already on the profile settings page
            const currentPath = window.location.pathname
            if (currentPath !== '/profile-settings' && currentPath !== '/auth') {
              window.location.href = '/profile-settings'
            }
          }
        } else {
          setUser(null)
          // Clear the session cookie
          document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const getUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }

    // Default profile if not exists
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      settings: DEFAULT_USER_SETTINGS
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      const userProfile = await getUserProfile(userCredential.user)
      setUser(userProfile)
      return userProfile
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (
    email: string,
    password: string,
    settings: Partial<Omit<UserSettings, 'currency'>> & { currency: CurrencyCode }
  ) => {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    const userProfile: UserProfile = {
      uid: userCredential.user.uid,
      email: email,
      displayName: email.split('@')[0],
      photoURL: '',
      settings: {
        monthlyIncome: settings.monthlyIncome || 0,
        monthlyBudget: settings.monthlyBudget || 0,
        currency: settings.currency,
        budgetLimits: {
          food_dining: settings.budgetLimits?.food_dining || 0,
          transportation: settings.budgetLimits?.transportation || 0,
          bills_utilities: settings.budgetLimits?.bills_utilities || 0,
          groceries: settings.budgetLimits?.groceries || 0,
          entertainment: settings.budgetLimits?.entertainment || 0,
          healthcare: settings.budgetLimits?.healthcare || 0,
          shopping: settings.budgetLimits?.shopping || 0,
          others: settings.budgetLimits?.others || 0
        },
        notifications: true,
        theme: 'system'
      }
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile)
    return userProfile
  }

  const signInWithGoogle = async () => {
    try {
      // Check if we're on an IP address domain
      const isIpAddress = typeof window !== 'undefined' &&
        window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/) !== null;

      let userCredential;

      if (isIpAddress) {
        // Use our custom IP auth provider for IP addresses
        console.log('Using IP Auth Provider for Google sign-in')
        const ipAuthProvider = IPAuthProvider.getInstance()
        userCredential = await ipAuthProvider.signInWithGoogle()
      } else {
        // Use standard Firebase auth for localhost
        userCredential = await signInWithPopup(firebaseAuth, googleProvider)
      }

      const userProfile = await getUserProfile(userCredential.user)
      setUser(userProfile)
      return userProfile
    } catch (error) {
      console.error('Google sign in error:', error)

      // Check if it's an unauthorized domain error
      if (error.code === 'auth/unauthorized-domain' && typeof window !== 'undefined') {
        // Show a user-friendly message
        alert('This domain is not authorized for Firebase Authentication. Please use localhost instead.')

        // Redirect to localhost with the same path
        const currentPath = window.location.pathname + window.location.search
        window.location.href = `https://localhost:3000${currentPath}`

        // Throw a more descriptive error
        throw new Error('Authentication domain not authorized. Redirecting to localhost...')
      }

      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(firebaseAuth)
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  }
}

import { createContext, useContext } from 'react'

export const AuthContext = createContext<UserProfile | null>(null)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}







