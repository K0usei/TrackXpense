import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { db } from '@/lib/db'

// GET /api/notifications/[id] - Get a specific notification
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(req)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    let notification
    try {
      notification = await db.notification.findUnique({
        where: {
          id,
          userId,
        },
      })
    } catch (err) {
      console.error('Error finding notification:', err)
      // Return not found if table doesn't exist
      if (err.code === 'P2021') {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      throw err
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications/[id] - Update a notification (mark as read)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(req)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params
    const { read } = await req.json()

    let notification
    try {
      notification = await db.notification.findUnique({
        where: {
          id,
          userId,
        },
      })
    } catch (err) {
      console.error('Error finding notification:', err)
      // Return not found if table doesn't exist
      if (err.code === 'P2021') {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      throw err
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    let updatedNotification
    try {
      updatedNotification = await db.notification.update({
        where: {
          id,
        },
        data: {
          read,
        },
      })
    } catch (err) {
      console.error('Error updating notification:', err)
      // Return error if table doesn't exist
      if (err.code === 'P2021') {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      throw err
    }

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(req)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    let notification
    try {
      notification = await db.notification.findUnique({
        where: {
          id,
          userId,
        },
      })
    } catch (err) {
      console.error('Error finding notification:', err)
      // Return not found if table doesn't exist
      if (err.code === 'P2021') {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      throw err
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    try {
      await db.notification.delete({
        where: {
          id,
        },
      })
    } catch (err) {
      console.error('Error deleting notification:', err)
      // Return error if table doesn't exist
      if (err.code === 'P2021') {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      throw err
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
