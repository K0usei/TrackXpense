'use client'

import { ReceiptGallery } from '@/components/dashboard/receipt-gallery'
import { Card } from '@/components/ui/card'

export default function ReceiptsPage() {
  return (
    <div className="space-y-4 pb-0 lg:pb-8">
      <div className="flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Receipt Gallery</h1>
        <p className="text-muted-foreground mt-2">View and manage your scanned receipts</p>
      </div>

      <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-blue-500/30 to-blue-500/5 backdrop-blur-sm border-0">
        <ReceiptGallery />
      </Card>
    </div>
  )
}