import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { ExtractedData, ReceiptData } from '@/types/receipt'
import { OCRService } from '@/lib/services/ocr-service'
import { Loader2 } from 'lucide-react'

interface ReceiptFeedbackProps {
  receipt: ReceiptData
  onClose: () => void
  onFeedbackSubmitted?: () => void
}

export function ReceiptFeedback({ receipt, onClose, onFeedbackSubmitted }: ReceiptFeedbackProps) {
  const [correctedData, setCorrectedData] = useState<ExtractedData>({
    ...receipt,
    items: [...receipt.items]
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorrectedData(prev => ({ ...prev, vendor: e.target.value }))
  }
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorrectedData(prev => ({ ...prev, date: e.target.value }))
  }
  
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorrectedData(prev => ({ ...prev, total: parseFloat(e.target.value) || 0 }))
  }
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCorrectedData(prev => ({ ...prev, category: e.target.value }))
  }
  
  const handleItemNameChange = (index: number, value: string) => {
    setCorrectedData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], name: value }
      return { ...prev, items: newItems }
    })
  }
  
  const handleItemPriceChange = (index: number, value: string) => {
    setCorrectedData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], price: parseFloat(value) || 0 }
      return { ...prev, items: newItems }
    })
  }
  
  const handleItemQuantityChange = (index: number, value: string) => {
    setCorrectedData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], quantity: parseInt(value) || 1 }
      return { ...prev, items: newItems }
    })
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Submit feedback
      const result = await OCRService.submitFeedback(receipt, correctedData)
      
      toast({
        title: 'Feedback Submitted',
        description: result.message || 'Thank you for your feedback! This helps improve our receipt processing.',
        variant: 'default',
      })
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted()
      }
      
      onClose()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit feedback',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const categories = [
    'Food & Dining',
    'Transportation',
    'Bills & Utilities',
    'Groceries',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Others'
  ]
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Provide Feedback</CardTitle>
        <CardDescription>
          Help us improve our receipt processing by correcting any errors in the extracted data.
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mx-4">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="items">Items ({correctedData.items.length})</TabsTrigger>
        </TabsList>
        
        <CardContent className="pt-4">
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="vendor" className="text-sm font-medium">
                    Vendor/Store
                  </label>
                  <input
                    id="vendor"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={correctedData.vendor}
                    onChange={handleVendorChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={correctedData.date}
                    onChange={handleDateChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="total" className="text-sm font-medium">
                    Total Amount
                  </label>
                  <input
                    id="total"
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded-md"
                    value={correctedData.total}
                    onChange={handleTotalChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <select
                    id="category"
                    className="w-full p-2 border rounded-md"
                    value={correctedData.category || 'Others'}
                    onChange={handleCategoryChange}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="items">
            <div className="space-y-4">
              {correctedData.items.length === 0 ? (
                <p className="text-center text-gray-500">No items found in this receipt.</p>
              ) : (
                correctedData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-2 p-2 border rounded-md">
                    <div className="col-span-3">
                      <label htmlFor={`item-name-${index}`} className="text-xs font-medium">
                        Item Name
                      </label>
                      <input
                        id={`item-name-${index}`}
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={item.name}
                        onChange={(e) => handleItemNameChange(index, e.target.value)}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label htmlFor={`item-price-${index}`} className="text-xs font-medium">
                        Price
                      </label>
                      <input
                        id={`item-price-${index}`}
                        type="number"
                        step="0.01"
                        className="w-full p-2 border rounded-md"
                        value={item.price}
                        onChange={(e) => handleItemPriceChange(index, e.target.value)}
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <label htmlFor={`item-quantity-${index}`} className="text-xs font-medium">
                        Qty
                      </label>
                      <input
                        id={`item-quantity-${index}`}
                        type="number"
                        min="1"
                        className="w-full p-2 border rounded-md"
                        value={item.quantity}
                        onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
