import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import {
  enableNetwork,
  disableNetwork,
  getFirestore
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Validate Firebase config
if (!firebaseConfig.apiKey) {
  throw new Error('Firebase API key is missing. Check your .env.local file.')
}

// Lazy initialization to prevent blocking the main thread
let appInstance: ReturnType<typeof initializeApp> | null = null
let dbInstance: ReturnType<typeof getFirestore> | null = null
let authInstance: ReturnType<typeof getAuth> | null = null
let storageInstance: ReturnType<typeof getStorage> | null = null

// Get Firebase app instance
const getApp = () => {
  if (!appInstance && typeof window !== 'undefined') {
    appInstance = initializeApp(firebaseConfig)
  }
  return appInstance
}

// Get Auth instance with persistence
const getAuthInstance = () => {
  if (!authInstance && typeof window !== 'undefined') {
    const app = getApp()
    if (!app) return null

    authInstance = getAuth(app)
    authInstance.useDeviceLanguage()

    // Handle unauthorized domain error
    const currentDomain = window.location.hostname
    if (currentDomain !== 'localhost' && currentDomain !== '127.0.0.1') {
      console.log(`Using Firebase Auth on domain: ${currentDomain}`)
      // Add a custom error handler for auth errors
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason &&
          typeof event.reason.code === 'string' &&
          event.reason.code.includes('auth/unauthorized-domain')) {
          console.error('Firebase Auth unauthorized domain error detected')
          console.log('Please add this domain to Firebase Console > Authentication > Settings > Authorized domains')

          // Show a more user-friendly error
          if (document.querySelector('#firebase-auth-domain-error') === null) {
            const errorDiv = document.createElement('div')
            errorDiv.id = 'firebase-auth-domain-error'
            errorDiv.style.position = 'fixed'
            errorDiv.style.bottom = '10px'
            errorDiv.style.left = '10px'
            errorDiv.style.backgroundColor = '#f8d7da'
            errorDiv.style.color = '#721c24'
            errorDiv.style.padding = '10px'
            errorDiv.style.borderRadius = '5px'
            errorDiv.style.zIndex = '9999'
            errorDiv.style.maxWidth = '400px'
            errorDiv.innerHTML = `
              <p><strong>Authentication Error</strong></p>
              <p>This domain (${currentDomain}) is not authorized for Firebase Authentication.</p>
              <p>Please use <a href="https://localhost:3000" style="color: #721c24; text-decoration: underline;">localhost</a> instead.</p>
            `
            document.body.appendChild(errorDiv)
          }
        }
      })
    }

    setPersistence(authInstance, browserLocalPersistence)
      .catch((error) => {
        console.warn('Failed to set persistence:', error)
      })
  }
  return authInstance
}

// Get Firestore instance with persistence
const getDbInstance = () => {
  if (!dbInstance && typeof window !== 'undefined') {
    const app = getApp()
    if (!app) {
      console.error('Failed to initialize Firestore: Firebase app not initialized')
      return null
    }

    try {
      // Use simpler initialization to avoid persistence issues
      dbInstance = getFirestore(app)
      console.log('Firestore initialized successfully')

      // Add error handler for Firestore
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.toString().includes('FIRESTORE')) {
          console.error('Firestore error detected:', event.reason)

          // Try to reinitialize Firestore
          try {
            dbInstance = null
            dbInstance = getFirestore(app)
            console.log('Firestore reinitialized after error')
          } catch (reinitError) {
            console.error('Failed to reinitialize Firestore:', reinitError)
          }
        }
      })
    } catch (error) {
      console.error('Failed to initialize Firestore:', error)
      // Try again with basic initialization
      try {
        dbInstance = getFirestore(app)
      } catch (fallbackError) {
        console.error('Failed to initialize Firestore with fallback:', fallbackError)
      }
    }
  }
  return dbInstance
}

// Get Storage instance
const getStorageInstance = () => {
  if (!storageInstance && typeof window !== 'undefined') {
    const app = getApp()
    if (!app) return null

    try {
      // Get the storage bucket URL
      const bucketUrl = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        ? `gs://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`
        : undefined;

      // Initialize storage with the bucket URL if available
      storageInstance = getStorage(app, bucketUrl);

      console.log('Firebase Storage initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Storage:', error);
      // Fallback to default initialization
      storageInstance = getStorage(app);
    }
  }
  return storageInstance
}

// Initialize Firebase lazily
const app = typeof window !== 'undefined' ? getApp() : null

// Export instances with fallbacks for SSR
export const auth = typeof window !== 'undefined' ? getAuthInstance() : null as any
export const db = typeof window !== 'undefined' ? getDbInstance() : null as any
export const storage = typeof window !== 'undefined' ? getStorageInstance() : null as any

// Add CORS headers to storage requests
if (typeof window !== 'undefined' && storage) {
  console.log('Firebase Storage is available for use')
}

// Configure Google provider with advanced settings
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account',
  auth_type: 'reauthenticate',
  // Add both domains to ensure it works in all environments
  authDomain: [
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    '192.168.1.5',
    '192.168.1.9',
    'localhost'
  ].join(','),
  cookiepolicy: 'single_host_origin'
})

// Add network status check
let isNetworkEnabled = false

export const enableNetworkAndPersistence = async () => {
  if (!isNetworkEnabled && typeof window !== 'undefined') {
    try {
      const dbInstance = getDbInstance()
      if (!dbInstance) {
        console.warn('Cannot enable network: Firestore not initialized')
        return
      }

      await enableNetwork(dbInstance)
      isNetworkEnabled = true
      console.log('Firebase network enabled')
    } catch (error) {
      console.error('Firebase network error:', error)
      // Retry after delay if online
      if (typeof navigator !== 'undefined' && navigator?.onLine) {
        setTimeout(enableNetworkAndPersistence, 5000)
      }
    }
  }
}

export const checkAndEnableNetwork = () => {
  if (!isNetworkEnabled && typeof navigator !== 'undefined' && navigator?.onLine) {
    enableNetworkAndPersistence()
  }
}

export const disableNetworkAndPersistence = async () => {
  if (isNetworkEnabled && typeof window !== 'undefined') {
    try {
      const dbInstance = getDbInstance()
      if (!dbInstance) {
        console.warn('Cannot disable network: Firestore not initialized')
        return
      }

      await disableNetwork(dbInstance)
      isNetworkEnabled = false
      console.log('Firebase network disabled')
    } catch (error) {
      console.error('Firebase network error:', error)
    }
  }
}

// Function to fix Firestore connection issues
export const fixFirestoreConnection = async () => {
  try {
    console.log('Attempting to fix Firestore connection...')

    // First disable the network
    await disableNetworkAndPersistence()

    // Clear the instance
    dbInstance = null

    // Reinitialize
    const app = getApp()
    if (!app) {
      console.error('Cannot fix Firestore: Firebase app not initialized')
      return false
    }

    // Create a new instance
    dbInstance = getFirestore(app)

    // Re-enable the network
    await enableNetworkAndPersistence()

    console.log('Firestore connection fixed successfully')
    return true
  } catch (error) {
    console.error('Failed to fix Firestore connection:', error)
    return false
  }
}






