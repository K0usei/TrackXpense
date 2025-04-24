import { toast as uiToast } from '@/components/ui/use-toast'
import { createNotification, NotificationType } from '@/lib/services/notification-service'

type ToastVariant = 'default' | 'destructive' | null | undefined

// Map toast variants to notification types
const variantToType = (variant: ToastVariant): NotificationType => {
  switch (variant) {
    case 'destructive':
      return NotificationType.ERROR
    default:
      return NotificationType.INFO
  }
}

// Custom toast function that also creates a notification
export const toast = async ({
  title,
  description,
  variant,
  storeAsNotification = true
}: {
  title: string
  description: string
  variant?: ToastVariant
  storeAsNotification?: boolean
}) => {
  // Show the toast notification
  uiToast({
    title,
    description,
    variant
  })

  // Store as a notification if requested
  if (storeAsNotification) {
    try {
      const type = variantToType(variant)
      await createNotification(title, description, type, false)
    } catch (error) {
      console.error('Failed to store toast as notification:', error)
      // Don't show an error toast to avoid infinite loops
      // Just log the error and continue
    }
  }
}

// For cases where we need to access the original toast function
export const originalToast = uiToast
