'use client'

import { useState, useEffect } from 'react'
import {
  fetchNotifications,
  deleteNotification,
  deleteAllNotifications,
  markNotificationAsRead,
  Notification,
  PaginationMetadata
} from '@/lib/services/notification-service'
import { Button } from '@/components/ui/button'
import { Trash2, Bell, Info, CheckCircle, AlertTriangle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10) // Number of notifications per page

  // Fetch notifications on component mount
  useEffect(() => {
    loadNotifications()
  }, [])

  // Load notifications from the API
  const loadNotifications = async (page = currentPage) => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchNotifications(limit, page)
      setNotifications(data)

      // Update pagination state
      setCurrentPage(page)

      // If we got fewer notifications than the limit and we're on page 1,
      // there's only one page
      if (data.length < limit && page === 1) {
        setTotalPages(1)
      } else if (data.length === 0 && page > 1) {
        // If we got no notifications and we're not on page 1,
        // go back to page 1
        setCurrentPage(1)
        loadNotifications(1)
        return
      } else {
        // Otherwise, estimate the total pages based on the limit
        // This is a fallback in case we don't get pagination metadata
        const estimatedTotalPages = Math.ceil(data.length / limit) + page - 1
        setTotalPages(Math.max(estimatedTotalPages, 1))
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Handle marking a notification as read
  const handleMarkAsRead = async (id: string) => {
    const updatedNotification = await markNotificationAsRead(id)
    if (updatedNotification) {
      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      ))
      console.log('Notification marked as read:', id)
    }
  }

  // Handle deleting a notification
  const handleDelete = async (id: string) => {
    const success = await deleteNotification(id)
    if (success) {
      setNotifications(notifications.filter(notification => notification.id !== id))
      toast({
        title: 'Notification deleted',
        description: 'The notification has been removed.',
      })
    }
  }

  // Handle deleting all notifications
  const handleDeleteAll = async () => {
    if (notifications.length === 0) return

    setDeleting(true)
    const success = await deleteAllNotifications()
    if (success) {
      setNotifications([])
      setTotalPages(1)
      setCurrentPage(1)
      toast({
        title: 'All notifications deleted',
        description: 'All notifications have been removed.',
      })
    }
    setDeleting(false)
  }

  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      loadNotifications(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      loadNotifications(currentPage - 1)
    }
  }



  // Get the appropriate icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
        <h3 className="text-lg font-medium">Notifications Unavailable</h3>
        <p className="text-sm text-muted-foreground mb-4">The notifications feature is currently unavailable.</p>
        <Button
          onClick={() => {
            setError(false)
            setLoading(true)
            loadNotifications()
          }}
          variant="outline"
          size="sm"
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    )
  }

  // Render empty state
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Bell className="h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No notifications</h3>
        <p className="text-sm text-muted-foreground">You don't have any notifications yet.</p>
      </div>
    )
  }

  // Render notifications list
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Notifications</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteAll}
          disabled={deleting || notifications.length === 0}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete All
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "p-3 rounded-lg border relative transition-colors",
              notification.read
                ? "bg-background"
                : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            )}
            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-red-500 -mt-1 -mr-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(notification.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
            </div>
            {!notification.read && (
              <div className="absolute top-3 right-10 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1 || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
