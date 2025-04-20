'use client'

import { AdvancedReceiptScanner } from "@/components/scanner/advanced-receipt-scanner"
import { useRouter } from 'next/navigation'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { ReceiptData } from '@/types/receipt'
import { OCRService } from '@/lib/services/ocr-service'

export default function ScannerPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Handle scan completion
  const handleScanComplete = async (data: ReceiptData) => {
    if (!data) return

    try {
      // Save the receipt data to the database
      const savedReceipt = await OCRService.saveReceipt(data)

      console.log('Receipt saved successfully:', savedReceipt)

      // Navigate to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving receipt:', error)
      toast({
        title: "Error",
        description: "There was a problem saving your receipt. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-background overflow-hidden">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-50 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
        onClick={handleBack}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <AdvancedReceiptScanner onScanComplete={handleScanComplete} />
    </div>
  )
}





