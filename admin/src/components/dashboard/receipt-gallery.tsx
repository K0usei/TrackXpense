'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Search, X } from 'lucide-react'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { ReceiptData } from '@/types/receipt'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function ReceiptGallery() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const { toast } = useToast()

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true)
      const auth = getAuth()
      if (!auth.currentUser) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to view receipts.",
          variant: "destructive"
        })
        return
      }

      // Fetch receipts from PostgreSQL API
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000/api'
      const response = await fetch(`${API_BASE}/receipts?user_id=${auth.currentUser.uid}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch receipts: ${response.status}`)
      }

      const receiptData: ReceiptData[] = await response.json()

      // Also fetch from Firebase for backward compatibility
      const db = getFirestore()
      const receiptsRef = collection(db, 'receipts')

      // Create query with filters
      let q = query(
        receiptsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const firebaseReceipts: ReceiptData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ReceiptData
        firebaseReceipts.push({
          ...data,
          id: doc.id
        })
      })

      // Combine receipts from both sources
      const allReceipts = [...receiptData, ...firebaseReceipts]

      setReceipts(allReceipts)
    } catch (error) {
      console.error('Failed to load receipts:', error)
      toast({
        title: "Error",
        description: "Failed to load receipts. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadReceipts()
  }, [loadReceipts])

  // Filter receipts based on search term and date
  const filteredReceipts = receipts.filter(receipt => {
    // Filter by search term
    const searchMatch = !searchTerm ||
      receipt.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by date
    const dateMatch = !dateFilter ||
      (receipt.date && new Date(receipt.date).toDateString() === dateFilter.toDateString())

    return searchMatch && dateMatch
  })

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setDateFilter(undefined)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card/50 p-4 rounded-lg backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/80 border-muted focus:border-primary rounded-full"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-full sm:w-[240px] bg-background/80 border-muted hover:bg-background rounded-full",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 bg-background/95 backdrop-blur-sm border border-muted/50 shadow-lg rounded-lg"
            align="start"
          >
            <div className="p-3">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={(date) => {
                  setDateFilter(date)
                  setIsCalendarOpen(false)
                }}
                initialFocus
                className="rounded-md bg-background/50"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full",
                  day_today: "bg-accent/50 text-accent-foreground rounded-full",
                  day: "rounded-full hover:bg-accent/30 focus:bg-accent/30"
                }}
              />
            </div>
          </PopoverContent>
        </Popover>

        {(searchTerm || dateFilter) && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="bg-background/80 border-muted hover:bg-background rounded-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2"></span>
              Showing <span className="font-medium mx-1">{filteredReceipts.length}</span> of <span className="font-medium mx-1">{receipts.length}</span> receipts
            </span>
          )}
        </div>
      </div>

      {/* Receipts grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="p-4 space-y-3 bg-background/60 backdrop-blur-sm border-muted/50 overflow-hidden">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </Card>
          ))}
        </div>
      ) : filteredReceipts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredReceipts.map((receipt, index) => {
            // Generate a gradient based on category or index
            const gradients = [
              'from-violet-500/20 to-violet-500/5',
              'from-blue-500/20 to-blue-500/5',
              'from-cyan-500/20 to-cyan-500/5',
              'from-emerald-500/20 to-emerald-500/5',
              'from-amber-500/20 to-amber-500/5',
              'from-pink-500/20 to-pink-500/5',
            ];
            const gradientClass = gradients[index % gradients.length];

            return (
              <Card
                key={receipt.id}
                className={`p-4 overflow-hidden hover:shadow-md transition-all duration-300 bg-gradient-to-br ${gradientClass} backdrop-blur-sm border-0`}
              >
                <div className="aspect-[3/4] relative mb-3 bg-background/40 rounded-md overflow-hidden shadow-sm">
                  {receipt.imageUrls && receipt.imageUrls.length > 0 ? (
                    <Image
                      src={receipt.imageUrls[0]}
                      alt={`Receipt from ${receipt.vendor}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}

                  {receipt.imageUrls && receipt.imageUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      +{receipt.imageUrls.length - 1}
                    </div>
                  )}

                  {receipt.category && (
                    <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {receipt.category}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium truncate">{receipt.vendor || 'Unknown Vendor'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {receipt.date ? new Date(receipt.date).toLocaleDateString() : 'No date'}
                  </p>
                  <p className="text-lg font-semibold">{formatCurrency(receipt.total)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-background/60 backdrop-blur-sm rounded-lg border border-dashed border-muted p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No receipts found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search filters</p>
          <Button variant="outline" onClick={clearFilters} className="bg-background hover:bg-background/80">
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}


