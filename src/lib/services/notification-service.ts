import { toast } from '@/components/ui/use-toast'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface NotificationsResponse {
  notifications: Notification[]
  pagination: PaginationMetadata
}

// Notification types
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// Notification categories
export enum NotificationCategory {
  BUDGET = 'budget',
  EXPENSE = 'expense',
  RECEIPT = 'receipt',
  SYSTEM = 'system'
}

// Fetch all notifications for the current user
export async function fetchNotifications(limit: number = 50, page: number = 1): Promise<Notification[]> {
  try {
    const response = await fetch(`/api/notifications?limit=${limit}&page=${page}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      // If we get a 404 or 500, just return an empty array
      if (response.status === 404 || response.status === 500) {
        console.warn(`Notifications API returned ${response.status}, returning empty array`)
        return []
      }

      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch notifications')
    }

    const data: NotificationsResponse = await response.json()
    return data.notifications || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    // Don't show a toast here to avoid potential infinite loops
    // when used with our custom toast function
    return []
  }
}

// Mark a notification as read
export async function markNotificationAsRead(id: string): Promise<Notification | null> {
  try {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ read: true }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to mark notification as read')
    }

    return response.json()
  } catch (error) {
    console.error('Error marking notification as read:', error)
    toast({
      title: 'Error',
      description: 'Failed to mark notification as read. Please try again.',
      variant: 'destructive',
    })
    return null
  }
}

// Delete a notification
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete notification')
    }

    return true
  } catch (error) {
    console.error('Error deleting notification:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete notification. Please try again.',
      variant: 'destructive',
    })
    return false
  }
}

// Delete all notifications
export async function deleteAllNotifications(): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete all notifications')
    }

    return true
  } catch (error) {
    console.error('Error deleting all notifications:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete all notifications. Please try again.',
      variant: 'destructive',
    })
    return false
  }
}

// Create a new notification
export async function createNotification(
  title: string,
  message: string,
  type: NotificationType = NotificationType.INFO,
  showToast: boolean = false
): Promise<Notification | null> {
  console.log('createNotification called with:', { title, message, type, showToast })
  try {
    const requestBody = { title, message, type }
    console.log('Sending notification request:', requestBody)

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Notification API response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('API error response:', error)
      throw new Error(error.error || 'Failed to create notification')
    }

    const notification = await response.json()
    console.log('Notification created successfully:', notification)

    // Show toast if requested
    if (showToast) {
      toast({
        title,
        description: message,
        variant: type === NotificationType.ERROR ? 'destructive' : 'default',
      })
    }

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}
