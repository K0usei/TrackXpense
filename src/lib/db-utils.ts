import { doc, getDocFromServer, getDocFromCache, DocumentReference } from 'firebase/firestore'
import { db } from './firebase'

// The persistence is now handled in firebase.ts configuration

export async function getDocumentWithOfflineSupport<T>(
  docRef: DocumentReference,
  defaultData?: T
): Promise<{ data: T | null; isOffline: boolean }> {
  // First try to get from server
  try {
    const docSnap = await getDocFromServer(docRef.withConverter({
      fromFirestore: (snap) => snap.data() as T,
      toFirestore: (data) => data as any,
    }))

    return {
      data: docSnap.exists() ? docSnap.data() : defaultData ?? null,
      isOffline: false
    }
  } catch (serverError) {
    // If server fetch fails, try cache
    try {
      const cachedDoc = await getDocFromCache(docRef.withConverter({
        fromFirestore: (snap) => snap.data() as T,
        toFirestore: (data) => data as any,
      }))

      if (cachedDoc.exists()) {
        return {
          data: cachedDoc.data(),
          isOffline: true
        }
      }
    } catch (cacheError) {
      console.warn('Cache retrieval failed:', cacheError)
    }

    // Return default data if both attempts fail
    return {
      data: defaultData ?? null,
      isOffline: true
    }
  }
}

// Call this function when your app initializes
// Persistence initialization is now in firebase.ts configuration

