'use client'

import React, { createContext, useContext, useCallback } from 'react'
import {
  createNotification,
  NotificationType,
  NotificationCategory
} from '@/lib/services/notification-service'

interface NotificationContextType {
  notify: (
    title: string,
    message: string,
    type?: NotificationType,
    showToast?: boolean
  ) => Promise<void>
  notifyBudget: (title: string, message: string, type?: NotificationType) => Promise<void>
  notifyExpense: (title: string, message: string, type?: NotificationType) => Promise<void>
  notifyReceipt: (title: string, message: string, type?: NotificationType) => Promise<void>
  notifySystem: (title: string, message: string, type?: NotificationType) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  // Generic notification function
  const notify = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    showToast: boolean = false
  ) => {
    await createNotification(title, message, type, showToast)
  }, [])

  // Category-specific notification functions
  const notifyBudget = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO
  ) => {
    console.log('notifyBudget called with:', { title, message, type })
    const budgetTitle = `Budget: ${title}`
    const notification = await createNotification(budgetTitle, message, type, true)
    console.log('Budget notification result:', notification)
    return notification
  }, [])

  const notifyExpense = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO
  ) => {
    const expenseTitle = `Expense: ${title}`
    await createNotification(expenseTitle, message, type, true)
  }, [])

  const notifyReceipt = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO
  ) => {
    const receiptTitle = `Receipt: ${title}`
    await createNotification(receiptTitle, message, type, true)
  }, [])

  const notifySystem = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO
  ) => {
    const systemTitle = `System: ${title}`
    await createNotification(systemTitle, message, type, true)
  }, [])

  return (
    <NotificationContext.Provider value={{
      notify,
      notifyBudget,
      notifyExpense,
      notifyReceipt,
      notifySystem
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
