import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Offline - TrackXpense'
}

export default function OfflinePage() {
    const handleRetry = () => {
        window.location.reload()
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">You're Offline</h1>
            <p className="text-center mb-6">
                Please check your internet connection and try again.
                Some features may be available in offline mode.
            </p>
            <Button onClick={handleRetry}>
                Retry Connection
            </Button>
        </div>
    )
}

