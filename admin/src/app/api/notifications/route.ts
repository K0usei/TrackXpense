import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { db } from '@/lib/db'

// GET /api/notifications - Get all notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get query parameters
    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const skip = (page - 1) * limit

    let notifications = []
    let total = 0

    try {
      // Get total count for pagination
      total = await db.notification.count({
        where: { userId },
      })

      // Get paginated notifications
      notifications = await db.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: skip,
      })
    } catch (err: any) {
      console.error('Error querying notifications:', err)

      // Create empty response object
      const emptyResponse = {
        notifications: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      }

      // Return empty array if table doesn't exist or any other database error
      if (err && (
        (typeof err.code === 'string' && err.code === 'P2021') ||
        (typeof err.message === 'string' && err.message === 'Database operation not implemented')
      )) {
        return NextResponse.json(emptyResponse)
      }

      // For development mode, return empty data
      if ((process.env.NODE_ENV as string) === 'development') {
        console.log('Using mock notifications data for development')
        return NextResponse.json(emptyResponse)
      }

      // For any other error, return empty data in development mode
      // or throw the error in production
      if (typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV === 'development') {
        return NextResponse.json(emptyResponse)
      } else {
        throw err
      }
    }

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { title, message, type = 'info' } = await req.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    let notification
    try {
      // Check if we're in development mode with a mock user
      if (typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV === 'development' && userId === 'dev-user-123') {
        // Check if the development user exists in the database
        const devUser = await db.user.findUnique({
          where: { id: userId }
        })

        // If the development user doesn't exist, create it
        if (!devUser) {
          console.log('Creating development user in database')
          try {
            await db.user.create({
              data: {
                id: userId,
                email: 'dev@example.com',
                name: 'Development User',
              }
            })
            console.log('Development user created successfully')
          } catch (createErr) {
            console.error('Error creating development user:', createErr)
            // Continue anyway, as the user might have been created by another request
          }
        }
      }

      // Create the notification
      notification = await db.notification.create({
        data: {
          userId,
          title,
          message,
          type,
        },
      })
    } catch (err: any) {
      console.error('Error creating notification:', err)

      // Create mock notification response
      const mockNotification = {
        id: 'mock-notification-id',
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Return error if table doesn't exist
      if (err && (
        (typeof err.code === 'string' && err.code === 'P2021') ||
        (typeof err.message === 'string' && err.message === 'Database operation not implemented')
      )) {
        // In development mode, pretend it worked
        if (typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV === 'development') {
          console.log('Using mock notification creation for development')
          return NextResponse.json(mockNotification)
        }

        return NextResponse.json(
          { error: 'Notification feature is not available' },
          { status: 503 }
        )
      }

      // Return error if foreign key constraint is violated
      if (err && typeof err.code === 'string' && err.code === 'P2003') {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 400 }
        )
      }

      // For development mode, return mock data for any error
      if (typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV === 'development') {
        console.log('Using mock notification creation for development (fallback)')
        return NextResponse.json(mockNotification)
      }

      throw err
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete all notifications for the current user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    try {
      await db.notification.deleteMany({
        where: {
          userId,
        },
      })
    } catch (err: any) {
      console.error('Error deleting notifications:', err)

      // Return success if table doesn't exist (nothing to delete)
      if (err && (
        (typeof err.code === 'string' && err.code === 'P2021') ||
        (typeof err.message === 'string' && err.message === 'Database operation not implemented')
      )) {
        console.log('Table does not exist or operation not implemented, returning success')
        return NextResponse.json({ success: true })
      }

      // For development mode, always return success
      if (typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV === 'development') {
        console.log('Using mock notification deletion for development')
        return NextResponse.json({ success: true })
      }

      throw err
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
