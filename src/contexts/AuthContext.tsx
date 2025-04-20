'use client'

import { createContext, useContext } from 'react'
import { useAuth as useFirebaseAuth } from '@/hooks/useAuth'
import type { UserProfile, UserSettings, CurrencyCode } from '@/types/user'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserProfile>
  signUp: (
    email: string,
    password: string,
    settings: Partial<Omit<UserSettings, 'currency'>> & { currency: CurrencyCode }
  ) => Promise<UserProfile>
  signInWithGoogle: () => Promise<UserProfile>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useFirebaseAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}




