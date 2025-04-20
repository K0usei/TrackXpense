import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
})

export const receiptSchema = z.object({
  vendor: z.string().min(1, 'Vendor name is required'),
  date: z.date(),
  total: z.number().positive('Total must be positive'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  items: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive()
  })),
  category: z.string(),
  imageUrls: z.array(z.string().url())
})

export const validateReceipt = (data: unknown) => {
  return receiptSchema.parse(data)
}

export const validateUser = (data: unknown) => {
  return userSchema.parse(data)
}

export const validateAmount = (amount: string): string | null => {
  if (!amount) return "Amount is required"
  const num = parseFloat(amount)
  if (isNaN(num)) return "Must be a valid number"
  if (num < 0) return "Amount cannot be negative"
  return null
}

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return "Email is required"
  if (!emailRegex.test(email)) return "Invalid email format"
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
  if (!/[0-9]/.test(password)) return "Password must contain at least one number"
  return null
}


