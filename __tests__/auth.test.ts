import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

describe('Authentication', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!',
    displayName: 'Test User'
  }

  beforeEach(async () => {
    // Clean up any existing test user
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        testUser.email,
        testUser.password
      )
      await deleteDoc(doc(db, 'users', userCredential.user.uid))
      await userCredential.user.delete()
    } catch (error) {
      // Ignore if user doesn't exist
    }
  })

  afterEach(async () => {
    // Clean up after tests
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        testUser.email,
        testUser.password
      )
      await deleteDoc(doc(db, 'users', userCredential.user.uid))
      await userCredential.user.delete()
    } catch (error) {
      // Ignore if user doesn't exist
    }
  })

  it('should create a new user', async () => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      testUser.email,
      testUser.password
    )
    expect(userCredential.user).toBeTruthy()
    expect(userCredential.user.email).toBe(testUser.email)
  })

  it('should sign in existing user', async () => {
    // Create user first
    await createUserWithEmailAndPassword(
      auth,
      testUser.email,
      testUser.password
    )

    // Try signing in
    const userCredential = await signInWithEmailAndPassword(
      auth,
      testUser.email,
      testUser.password
    )
    expect(userCredential.user).toBeTruthy()
    expect(userCredential.user.email).toBe(testUser.email)
  })
})