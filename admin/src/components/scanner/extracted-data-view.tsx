'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExtractedData, ReceiptData, ReceiptItem } from '@/types/receipt'
import { formatCurrency } from '@/lib/utils'
import { Save, RotateCcw, Plus, Trash2, FileText, Image as ImageIcon } from 'lucide-react'
import { generateComputerizedTextImage } from '@/lib/utils/receipt-text-renderer'

// Function to calculate container height based on number of items
const getItemsContainerHeight = (itemCount: number): string => {
  if (itemCount <= 2) return 'h-auto max-h-20';
  if (itemCount <= 4) return 'h-auto max-h-32';
  if (itemCount <= 6) return 'h-auto max-h-48';
  return 'max-h-60'; // For more than 6 items
}

interface ExtractedDataViewProps {
  data: ExtractedData
  scannedImageUrl: string
  additionalImages?: string[] // Additional receipt section images
  onSave: (data: ReceiptData) => void
  onRescan: () => void
}

export function ExtractedDataView({
  data,
  scannedImageUrl,
  additionalImages = [],
  onSave,
  onRescan
}: ExtractedDataViewProps) {
  // Track which image is currently being displayed
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Track view mode (original image or computerized text)
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image')

  // Store the computerized text image URL
  const [computerizedTextImageUrl, setComputerizedTextImageUrl] = useState<string>('')

  // Combine all images into a single array
  const allImages = [scannedImageUrl, ...additionalImages].filter(Boolean)
  const [editedData, setEditedData] = useState<ExtractedData>({
    ...data,
    store: data.store || { name: '', address: '' },
    total: data.total || { subtotal: 0, tax: 0, discount: 0, change: 0, amount: 0 },
    category: data.category || 'Others',
    items: data.items && data.items.length > 0 ? data.items : [{ name: '', quantity: 0, price: 0 }],
    rawText: data.rawText || ''
  })

  // Generate computerized text image when raw text changes
  useEffect(() => {
    if (editedData.rawText) {
      // Format the raw text into a more structured receipt format
      const formattedText = formatReceiptText(editedData);

      // Generate the computerized text image
      const imageUrl = generateComputerizedTextImage(formattedText, {
        width: 350,
        maxHeight: 600,
        fontSize: 12,
        lineHeight: 1.3
      });

      setComputerizedTextImageUrl(imageUrl);
    }
  }, [editedData.rawText]);

  // Format raw text into a structured receipt format
  const formatReceiptText = (data: ExtractedData): string => {
    // Start with store information
    let text = '';

    if (data.store?.name) {
      text += `${data.store.name.toUpperCase()}\n`;
    }

    if (data.store?.address) {
      text += `${data.store.address}\n`;
    }

    // Add date and time
    text += '\n';
    if (data.date) {
      text += `Date: ${data.date}\n`;
    }

    if (data.time) {
      text += `Time: ${data.time}\n`;
    }

    // Add separator
    text += '\n' + '-'.repeat(40) + '\n\n';

    // Add items
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        if (item.name) {
          const price = formatCurrency(item.price);
          const quantity = item.quantity || 1;
          const total = formatCurrency(item.price * quantity);

          // Format: Item name    Qty x Price    Total
          text += `${item.name.padEnd(20)} ${quantity} x ${price.padStart(6)}  ${total.padStart(8)}\n`;
        }
      });

      text += '\n';
    }

    // Add totals
    text += '-'.repeat(40) + '\n\n';

    if (data.total) {
      if (data.total.subtotal > 0) {
        text += `Subtotal:${formatCurrency(data.total.subtotal).padStart(32)}\n`;
      }

      if (data.total.tax > 0) {
        text += `Tax:${formatCurrency(data.total.tax).padStart(37)}\n`;
      }

      if (data.total.discount > 0) {
        text += `Discount:${formatCurrency(data.total.discount).padStart(32)}\n`;
      }

      if (data.total.change > 0) {
        text += `Change:${formatCurrency(data.total.change).padStart(34)}\n`;
      }

      text += `\nTOTAL:${formatCurrency(data.total.amount).padStart(35)}\n`;
    }

    // Add footer
    text += '\n' + '-'.repeat(40) + '\n\n';
    text += 'Thank you for your purchase!\n';

    return text;
  }

  const handleInputChange = (field: keyof ExtractedData, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const updatedItems = [...editedData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setEditedData({ ...editedData, items: updatedItems })
  }

  const addNewItem = () => {
    const newItem: ReceiptItem = {
      name: '',
      quantity: 0,
      price: 0
    }
    setEditedData({ ...editedData, items: [...editedData.items, newItem] })
  }

  const removeItem = (index: number) => {
    const updatedItems = [...editedData.items]
    updatedItems.splice(index, 1)
    setEditedData({ ...editedData, items: updatedItems })
  }

  const handleSave = () => {
    // Calculate total from items
    const calculatedTotal = editedData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Update the total amount
    const updatedTotal = {
      ...editedData.total,
      amount: calculatedTotal,
      // If subtotal is 0, use the calculated total
      subtotal: editedData.total.subtotal || calculatedTotal
    }

    // Filter out items with empty names or zero prices
    const validItems = editedData.items.filter(item =>
      item.name.trim() !== '' && (item.price > 0 || item.quantity > 0)
    )

    // If no valid items, add a default item based on the store name
    if (validItems.length === 0) {
      validItems.push({
        name: editedData.store.name || 'Purchase',
        quantity: 1,
        price: calculatedTotal
      })
    }

    // Create a ReceiptData object from the edited data
    const receiptData: ReceiptData = {
      ...editedData,
      id: crypto.randomUUID(),
      category: editedData.category || 'Others',
      total: updatedTotal,
      items: validItems,
      time: new Date().toLocaleTimeString(), // Add current time if not present
      // Include all images in the receipt data
      imageUrls: allImages
    }

    onSave(receiptData)
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl mx-auto bg-background border shadow-sm max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">Extracted Receipt Data</h2>
            {editedData.confidence === 0 ? (
              <p className="text-amber-500 text-sm sm:text-base mt-1">
                OCR service unavailable. Please enter the receipt details manually.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm sm:text-base">
                Review and edit the extracted information
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Scanned Document Image with Tabs */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Scanned Receipt</Label>
                {allImages.length > 1 && viewMode === 'image' && (
                  <div className="text-sm text-muted-foreground">
                    Section {currentImageIndex + 1} of {allImages.length}
                  </div>
                )}
              </div>

              {/* View Mode Tabs */}
              <Tabs defaultValue="image" className="w-full" onValueChange={(value) => setViewMode(value as 'image' | 'text')}>
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="image" className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>Original</span>
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Digital Text</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="image" className="mt-0">
                  <div className="relative aspect-[9/16] w-full border rounded-md overflow-hidden">
                    <Image
                      src={allImages[currentImageIndex] || scannedImageUrl}
                      alt={`Receipt Section ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Image navigation controls */}
                  {allImages.length > 1 && (
                    <div className="flex justify-between mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentImageIndex === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentImageIndex(prev => Math.min(allImages.length - 1, prev + 1))}
                        disabled={currentImageIndex === allImages.length - 1}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="mt-0">
                  <div className="flex flex-col gap-2">
                    <div className="relative aspect-[9/16] w-full border rounded-md overflow-hidden bg-white">
                      {computerizedTextImageUrl ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={computerizedTextImageUrl}
                            alt="Computerized Receipt Text"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No text data available
                        </div>
                      )}
                    </div>

                    {/* Toggle to show/edit raw text */}
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                          View/Edit Raw Text
                        </summary>
                        <div className="mt-2">
                          <textarea
                            value={editedData.rawText}
                            onChange={(e) => handleInputChange('rawText', e.target.value)}
                            className="w-full h-32 p-2 text-xs font-mono border rounded-md"
                            placeholder="Raw receipt text"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Edit the raw text to improve the digital receipt display
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Extracted Data Form */}
            <div className="space-y-4">
              {/* Store Information */}
              <div className="space-y-2">
                <Label htmlFor="store-name">Store</Label>
                <Input
                  id="store-name"
                  value={editedData.store.name}
                  onChange={(e) => setEditedData(prev => ({
                    ...prev,
                    store: { ...prev.store, name: e.target.value }
                  }))}
                  className="bg-background"
                  placeholder="Store name"
                />
              </div>

              {/* Date and Category in a grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editedData.date}
                    onChange={(e) => setEditedData(prev => ({
                      ...prev,
                      date: e.target.value
                    }))}
                    className="bg-background h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={editedData.category || 'Others'}
                    onChange={(e) => setEditedData(prev => ({
                      ...prev,
                      category: e.target.value
                    }))}
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills & Utilities">Bills & Utilities</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              {/* Always show the items section, even if there are no items */}
              {
                <div>
                  <Label>Items</Label>
                  <div className="mt-2 border rounded-md p-2 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-7 gap-2 pb-2 border-b text-sm font-medium">
                      <div className="col-span-3">Item</div>
                      <div className="col-span-1 text-center">Qty</div>
                      <div className="col-span-2 text-right">Price</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Table Body */}
                    <div className={`overflow-y-auto py-1 ${getItemsContainerHeight(editedData.items.length)}`}>
                      {editedData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-7 gap-2 py-1 text-sm items-center">
                          <div className="col-span-3">
                            <Input
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="h-7 text-sm"
                              placeholder="Item name"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="h-7 text-sm text-center"
                              min="0"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                              className="h-7 text-sm text-right"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Button */}
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={addNewItem}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </div>

                    {/* Totals Section */}
                    <div className="space-y-1 pt-2 border-t mt-1 font-medium">
                      {/* Subtotal Row */}
                      <div className="grid grid-cols-7 gap-2">
                        <div className="col-span-4 text-right">Subtotal:</div>
                        <div className="col-span-2 text-right">
                          <Input
                            type="number"
                            value={editedData.total.subtotal || ''}
                            onChange={(e) => setEditedData(prev => ({
                              ...prev,
                              total: { ...prev.total, subtotal: parseFloat(e.target.value) || 0 }
                            }))}
                            className="h-7 text-sm text-right"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Tax Row */}
                      <div className="grid grid-cols-7 gap-2">
                        <div className="col-span-4 text-right">Tax:</div>
                        <div className="col-span-2 text-right">
                          <Input
                            type="number"
                            value={editedData.total.tax || ''}
                            onChange={(e) => setEditedData(prev => ({
                              ...prev,
                              total: { ...prev.total, tax: parseFloat(e.target.value) || 0 }
                            }))}
                            className="h-7 text-sm text-right"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Discount Row */}
                      <div className="grid grid-cols-7 gap-2">
                        <div className="col-span-4 text-right">Discount:</div>
                        <div className="col-span-2 text-right">
                          <Input
                            type="number"
                            value={editedData.total.discount || ''}
                            onChange={(e) => setEditedData(prev => ({
                              ...prev,
                              total: { ...prev.total, discount: parseFloat(e.target.value) || 0 }
                            }))}
                            className="h-7 text-sm text-right"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Change Row */}
                      <div className="grid grid-cols-7 gap-2">
                        <div className="col-span-4 text-right">Change:</div>
                        <div className="col-span-2 text-right">
                          <Input
                            type="number"
                            value={editedData.total.change || ''}
                            onChange={(e) => setEditedData(prev => ({
                              ...prev,
                              total: { ...prev.total, change: parseFloat(e.target.value) || 0 }
                            }))}
                            className="h-7 text-sm text-right"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Total Row */}
                      <div className="grid grid-cols-7 gap-2 pt-2 border-t mt-1 font-bold">
                        <div className="col-span-4 text-right">Total Amount:</div>
                        <div className="col-span-2 text-right">
                          {formatCurrency(editedData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                        </div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <Separator className="mt-auto" />

        {/* Action Buttons */}
        <div className="p-3 sm:p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={onRescan}
            size="sm"
            className="flex items-center h-9 text-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Scan Again
          </Button>

          <Button
            onClick={handleSave}
            size="sm"
            className="flex items-center h-9 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Receipt
          </Button>
        </div>
      </Card>
    </div>
  )
}
