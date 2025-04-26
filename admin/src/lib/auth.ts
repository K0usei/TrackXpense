import { User, onAuthStateChanged } from 'firebase/auth'
import { auth as firebaseAuth } from '@/lib/firebase'

export interface Session {
  user: {
    id: string
    email: string | null
    name: string | null
  } | null
}

export async function auth(): Promise<Session> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: User | null) => {
      unsubscribe()
      if (!user) {
        resolve({ user: null })
        return
      }

      resolve({
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName
        }
      })
    })
  })
}

export async function getServerSession() {
  const session = await auth()
  return session
}

