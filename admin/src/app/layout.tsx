import { Suspense } from 'react'
import type { Metadata, Viewport } from "next"
import { ClientProviders } from '@/components/providers/client-providers'
import "./globals.css"


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: "TrackXpense",
  description: "Track your expenses easily",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientProviders>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </ClientProviders>
      </body>
    </html>
  )
}

