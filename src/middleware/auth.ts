import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase-admin'

export async function authMiddleware(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decodedToken = await auth.verifyIdToken(token)
    const user = await auth.getUser(decodedToken.uid)
    
    // Add user info to request
    request.headers.set('x-user-id', user.uid)
    request.headers.set('x-user-email', user.email || '')
    
    return NextResponse.next()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}