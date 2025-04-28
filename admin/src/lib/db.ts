// Types for database models
export interface User {
  id: string
  email: string
  name?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Expense {
  id: number
  amount: number
  description?: string | null
  date: Date
  categoryId: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: number
  limit: number
  period: string
  categoryId: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: number
  name: string
}

export interface ChatMessage {
  id: string
  content: string
  role: string
  type?: string | null
  userId: string
  createdAt: Date
}

export interface FinancialInsight {
  id: string
  userId: string
  type: string
  description: string
  metadata?: any
  createdAt: Date
}

// API client for database operations
import axios from 'axios'
import { getApiUrl } from './utils'

export const db = {
  // API methods will be implemented here
  // These methods will make API calls to the backend instead of using Prisma directly
}

