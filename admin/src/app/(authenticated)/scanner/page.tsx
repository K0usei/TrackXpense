'use client'

import { AdvancedReceiptScanner } from "@/components/scanner/advanced-receipt-scanner"
import { useRouter } from 'next/navigation'
import { toast } from "@/lib/toast"
import type { ReceiptData } from '@/types/receipt'
import { OCRService } from '@/lib/services/ocr-service'
import { useNotification } from '@/contexts/NotificationContext'
import { NotificationType } from '@/lib/services/notification-service'

export default function ScannerPage() {
  const router = useRouter()
  const { notifyReceipt } = useNotification()

  // Handle scan completion
  const handleScanComplete = async (data: ReceiptData) => {
    if (!data) return

    try {
      // Save the receipt data to the database
      const savedReceipt = await OCRService.saveReceipt(data)

      console.log('Receipt saved successfully:', savedReceipt)

      // Create a notification for the receipt
      const storeName = data.store?.name || 'Unknown Store'
      const amount = data.total?.amount || 0
      const title = 'Receipt Processed'
      const message = `Receipt from ${storeName} for ${amount.toFixed(2)} has been processed and added to your expenses.`

      // Show success message (which will also create a notification)
      await toast({
        title: "Receipt Saved",
        description: `Your receipt for ${storeName} has been saved and added to your expenses. Redirecting to scanner...`,
        variant: "default"
      })

      // Add a small delay before redirecting to allow the toast to be seen
      setTimeout(() => {
        // Redirect back to the scanner page to start fresh
        router.push('/scanner')
      }, 1500)
    } catch (error) {
      console.error('Error saving receipt:', error)
      await toast({
        title: "Error",
        description: "There was a problem saving your receipt. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-background overflow-hidden">
      <AdvancedReceiptScanner onScanComplete={handleScanComplete} />
    </div>
  )
}





