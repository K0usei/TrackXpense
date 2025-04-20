'use client'

import { Socket } from 'socket.io-client'
import io from 'socket.io-client'

// Define types for the events we'll be handling
interface SocketEvents {
  'receipt:processed': {
    receiptId: string
    userId: string
    status: 'success' | 'error'
    data?: {
      amount: number
      date: string
      merchant: string
      category: string
    }
    error?: string
  }
  'expense:created': {
    expenseId: string
    userId: string
    amount: number
    category: string
    date: string
  }
  // Add other event types as needed
}

class SocketService {
  private socket: typeof Socket | null = null

  initialize(userId: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { userId }
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
    })
  }

  emit<K extends keyof SocketEvents>(event: K, data: SocketEvents[K]) {
    if (!this.socket) return
    this.socket.emit(event, data)
  }

  subscribe<K extends keyof SocketEvents>(event: K, callback: (data: SocketEvents[K]) => void) {
    if (!this.socket) return
    this.socket.on(event, callback)
  }

  unsubscribe(event: string) {
    if (!this.socket) return
    this.socket.off(event)
  }

  disconnect() {
    if (!this.socket) return
    this.socket.disconnect()
  }
}

export const socket = new SocketService()

export default SocketService



