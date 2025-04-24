import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { auth as adminAuth } from 'firebase-admin/auth'
import { getFirebaseAdminApp } from './firebase-admin'

// Initialize Firebase Admin if it hasn't been initialized yet
const getAdminAuth = () => {
  const app = getFirebaseAdminApp()
  if (!app) {
    return null
  }
  return adminAuth(app)
}

export interface ServerSession {
  user: {
    id: string
    email: string | null
    name: string | null
  } | null
}

/**
 * Get the user session from the request cookies
 */
export async function getServerSession(req?: NextRequest): Promise<ServerSession> {
  try {
    // Get the session token from cookies
    const cookieStore = cookies()
    const sessionCookie = req
      ? req.cookies.get('__session')?.value
      : cookieStore.get('__session')?.value

    if (!sessionCookie) {
      return { user: null }
    }

    // Get the admin auth instance
    const adminAuthInstance = getAdminAuth()

    // If Firebase Admin is not available, use a development mode
    if (!adminAuthInstance) {
      console.warn('Using development mode for authentication')

      // In development mode, we'll use a mock user for testing
      // This allows the notifications feature to work without Firebase Admin
      if (process.env.NODE_ENV === 'development') {
        return {
          user: {
            id: 'dev-user-123',
            email: 'dev@example.com',
            name: 'Development User'
          }
        }
      }

      return { user: null }
    }

    // Verify the session cookie
    const decodedClaims = await adminAuthInstance.verifySessionCookie(sessionCookie, true)

    // Get the user from the decoded claims
    const user = await adminAuthInstance.getUser(decodedClaims.uid)

    return {
      user: {
        id: user.uid,
        email: user.email || null,
        name: user.displayName || null
      }
    }
  } catch (error) {
    console.error('Error verifying session cookie:', error)

    // In development mode, use a mock user for testing
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using development mode for authentication after error')
      return {
        user: {
          id: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Development User'
        }
      }
    }

    return { user: null }
  }
}
