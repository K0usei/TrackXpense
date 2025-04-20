import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value
  console.log('Middleware - Token:', token)
  console.log('Middleware - Path:', request.nextUrl.pathname)

  // Public paths that don't require authentication
  const publicPaths = ['/', '/auth', '/login', '/signup']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path)
  )

  // Protected paths that require authentication
  const protectedPaths = [
    '/dashboard',
    '/reports',
    '/scanner',
    '/assistant',
    '/profile',
    '/profile-settings',
    '/settings'
  ]
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // If no token and trying to access protected route, redirect to auth page
  if (!token && isProtectedPath) {
    console.log('Middleware - Redirecting to auth page')
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/reports/:path*',
    '/scanner/:path*',
    '/assistant/:path*',
    '/auth/:path*',
    '/profile/:path*',
    '/profile-settings/:path*',
    '/settings/:path*',
    '/receipts/:path*',
  ],
}







