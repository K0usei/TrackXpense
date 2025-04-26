import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getApp } from 'firebase/app'

/**
 * Custom authentication provider that handles IP-based authentication
 * This is a workaround for the Firebase Auth unauthorized domain issue
 */
export class IPAuthProvider {
  private static instance: IPAuthProvider
  private auth: ReturnType<typeof getAuth> | null = null
  private googleProvider: GoogleAuthProvider | null = null
  
  private constructor() {
    try {
      const app = getApp()
      if (app) {
        this.auth = getAuth(app)
        this.googleProvider = new GoogleAuthProvider()
        
        // Configure the Google provider
        this.googleProvider.setCustomParameters({
          // Force account selection even when one account is available
          prompt: 'select_account',
          // Allow localhost and IP addresses
          login_hint: 'use_local_ip'
        })
      }
    } catch (error) {
      console.error('Failed to initialize IP Auth Provider:', error)
    }
  }
  
  public static getInstance(): IPAuthProvider {
    if (!IPAuthProvider.instance) {
      IPAuthProvider.instance = new IPAuthProvider()
    }
    return IPAuthProvider.instance
  }
  
  /**
   * Sign in with Google using a popup
   * This method includes special handling for IP-based domains
   */
  public async signInWithGoogle() {
    if (!this.auth || !this.googleProvider) {
      throw new Error('Auth not initialized')
    }
    
    try {
      // Try to sign in with Google
      return await signInWithPopup(this.auth, this.googleProvider)
    } catch (error: any) {
      // Check if it's an unauthorized domain error
      if (error.code === 'auth/unauthorized-domain') {
        console.warn('Unauthorized domain error. Attempting workaround...')
        
        // Show a user-friendly message
        alert('This domain is not authorized for Firebase Authentication. Please use localhost instead.')
        
        // Redirect to localhost with the same path
        const currentPath = window.location.pathname + window.location.search
        window.location.href = `https://localhost:3000${currentPath}`
        
        // Throw a more descriptive error
        throw new Error('Authentication domain not authorized. Redirecting to localhost...')
      }
      
      // Re-throw other errors
      throw error
    }
  }
}
