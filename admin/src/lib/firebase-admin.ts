import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Check if Firebase Admin credentials are available
const hasFirebaseAdminCredentials = () => {
  return !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY
}

// Initialize Firebase Admin
export function getFirebaseAdminApp() {
  // Check if app is already initialized
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]
  }

  // Check if we have the required credentials
  if (!hasFirebaseAdminCredentials()) {
    console.warn('Firebase Admin credentials not found. Using development mode.')
    // Return null to indicate we're in development mode without credentials
    return null
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }

    return initializeApp({
      credential: cert(serviceAccount)
    })
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    return null
  }
}
