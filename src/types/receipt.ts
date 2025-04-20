export interface ReceiptItem {
    name: string
    price: number
    quantity: number
    category?: string
}

export interface StoreInfo {
    name: string
    address?: string
}

export interface TotalInfo {
    subtotal: number
    tax: number
    discount: number
    change: number
    amount: number
}

export interface ExtractedData {
    // STORE section
    store: StoreInfo
    // ITEMS section
    items: ReceiptItem[]
    // TOTAL section
    total: TotalInfo
    // OTHERS section
    date: string
    time?: string
    // Additional metadata
    category?: string
    confidence?: number
    rawText: string
    originalResponse?: any // Original API response for feedback
    imageUrl?: string // URL for the receipt image (client-side only)
}

export interface ReceiptData extends ExtractedData {
    id: string
    imageUrls?: string[]
    userId?: string
    createdAt?: string
}

// Legacy flat structure for backward compatibility
export interface LegacyReceiptData {
    id: string
    vendor: string
    address?: string
    date: string
    time?: string
    total: number
    subtotal?: number
    tax?: number
    discount?: number
    change?: number
    items: ReceiptItem[]
    category?: string
    imageUrls?: string[]
    userId?: string
    createdAt?: string
    confidence?: number
    rawText?: string
}