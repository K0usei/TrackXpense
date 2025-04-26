import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : []
})

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = db
}

export type {
  User,
  Expense,
  Budget,
  Category,
  ChatMessage,
  FinancialInsight
} from '@prisma/client'







