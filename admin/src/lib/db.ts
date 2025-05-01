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

// Mock data for development
const mockNotifications = [
  {
    id: '1',
    userId: 'dev-user-123',
    title: 'Welcome to TrackXpense',
    message: 'Thank you for using TrackXpense. Start tracking your expenses today!',
    type: 'info',
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'dev-user-123',
    title: 'Budget Alert',
    message: 'You have reached 80% of your monthly budget for Food & Dining.',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000)
  }
];

// Mock database client
export const db = {
  notification: {
    count: async ({ where = {} } = {}) => {
      console.log('Mock DB: Counting notifications with filter:', where);
      if (process.env.NODE_ENV === 'development') {
        // Filter mock notifications based on where clause
        const filtered = mockNotifications.filter(n => {
          // Match all conditions in where
          return Object.entries(where).every(([key, value]) => n[key] === value);
        });
        return filtered.length;
      }
      throw new Error('Database operation not implemented');
    },

    findMany: async ({ where = {}, orderBy = {}, take = 10, skip = 0 } = {}) => {
      console.log('Mock DB: Finding notifications with filter:', where);
      if (process.env.NODE_ENV === 'development') {
        // Filter mock notifications based on where clause
        let filtered = mockNotifications.filter(n => {
          // Match all conditions in where
          return Object.entries(where).every(([key, value]) => n[key] === value);
        });

        // Sort based on orderBy
        if (orderBy.createdAt === 'desc') {
          filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (orderBy.createdAt === 'asc') {
          filtered = filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        // Apply pagination
        return filtered.slice(skip, skip + take);
      }
      throw new Error('Database operation not implemented');
    },

    create: async ({ data }) => {
      console.log('Mock DB: Creating notification with data:', data);
      if (process.env.NODE_ENV === 'development') {
        const newNotification = {
          id: String(mockNotifications.length + 1),
          ...data,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockNotifications.push(newNotification);
        return newNotification;
      }
      throw new Error('Database operation not implemented');
    },

    deleteMany: async ({ where = {} } = {}) => {
      console.log('Mock DB: Deleting notifications with filter:', where);
      if (process.env.NODE_ENV === 'development') {
        // In a real implementation, we would delete from the database
        // For mock, we'll just return a success count
        return { count: 2 };
      }
      throw new Error('Database operation not implemented');
    }
  },

  user: {
    findUnique: async ({ where = {} } = {}) => {
      console.log('Mock DB: Finding user with filter:', where);
      if (process.env.NODE_ENV === 'development') {
        if (where.id === 'dev-user-123') {
          return {
            id: 'dev-user-123',
            email: 'dev@example.com',
            name: 'Development User',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        return null;
      }
      throw new Error('Database operation not implemented');
    },

    create: async ({ data }) => {
      console.log('Mock DB: Creating user with data:', data);
      if (process.env.NODE_ENV === 'development') {
        return {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      throw new Error('Database operation not implemented');
    }
  }
}
