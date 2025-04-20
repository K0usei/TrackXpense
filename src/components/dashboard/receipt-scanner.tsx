'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Upload } from 'lucide-react'
import Scanner from '@/components/common/scanner'

interface ReceiptScannerProps {
  onScanComplete?: (data: {
    vendor: string
    date: string
    total: number
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
  }) => void
}

export function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleScanComplete = (data: {
    vendor: string
    date: string
    total: number
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
  }) => {
    setLoading(false)
    setIsScanning(false)
    onScanComplete?.(data)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Receipt Scanner</h3>
        {!isScanning && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScanning(true)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Scan Receipt
              </>
            )}
          </Button>
        )}
      </div>

      {isScanning && (
        <div className="mt-4">
          <Scanner onScanComplete={handleScanComplete} />
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setIsScanning(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </Card>
  )
}





