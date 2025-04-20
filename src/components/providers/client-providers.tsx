'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Dynamically import providers to reduce initial bundle size
const NetworkProvider = dynamic(() => import('@/providers/network-provider'), {
  ssr: false,
  loading: () => <div>Loading Network Provider...</div>
})

const AuthProvider = dynamic(() => import('@/components/auth/auth-provider'), {
  ssr: false
})

const ThemeProvider = dynamic(() => import('@/components/providers/theme-provider'), {
  ssr: true
})

const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster))

const OfflineIndicator = dynamic(() => import('@/components/ui/offline-indicator').then(mod => mod.OfflineIndicator), {
  ssr: false
})

const FirebaseErrorHandler = dynamic(() => import('@/components/firebase/firebase-error-handler').then(mod => mod.FirebaseErrorHandler), {
  ssr: false
})

const FirebaseAuthDomainHandler = dynamic(() => import('@/components/firebase/firebase-auth-domain-handler').then(mod => mod.FirebaseAuthDomainHandler), {
  ssr: false
})

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        <NetworkProvider>
          {children}
          <Toaster />
          <OfflineIndicator />
          <FirebaseErrorHandler />
          <FirebaseAuthDomainHandler />
        </NetworkProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default ClientProviders
