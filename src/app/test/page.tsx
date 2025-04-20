'use client'

import Scanner from '@/components/common/scanner'
import type { ExtractedData } from '@/components/common/scanner'

export default function TestPage() {
    const handleScanComplete = (data: ExtractedData) => {
        console.log('Scan completed:', data)
    }

    return (
        <div className="container mx-auto p-4">
            <Scanner onScanComplete={handleScanComplete} />
        </div>
    )
}
