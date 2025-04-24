'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useToast } from '@/components/ui/use-toast'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  type?: 'budget' | 'analysis' | 'recommendation' | 'query' | 'general'
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load conversations from Firestore
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadConversations = async () => {
      try {
        setLoading(true)
        const conversationsRef = collection(db, 'users', userId, 'conversations')
        const q = query(conversationsRef, orderBy('updatedAt', 'desc'))
        const querySnapshot = await getDocs(q)

        const loadedConversations: Conversation[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()

          // Convert Firestore timestamps to Date objects
          const conversation: Conversation = {
            id: doc.id,
            title: data.title,
            messages: data.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp.toDate()
            })),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          }

          loadedConversations.push(conversation)
        })

        setConversations(loadedConversations)

        // If no conversations exist, create a default one
        if (loadedConversations.length === 0) {
          const defaultConversation: Conversation = {
            id: Date.now().toString(),
            title: 'New Conversation',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }

          await saveConversation(defaultConversation)
          setConversations([defaultConversation])
        }
      } catch (err) {
        console.error('Error loading conversations:', err)
        setError('Failed to load conversations')
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load conversations. Some features may not work properly."
        })

        // Fallback to a local conversation if loading fails
        const defaultConversation: Conversation = {
          id: Date.now().toString(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setConversations([defaultConversation])
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [userId, toast])

  // Save a conversation to Firestore
  const saveConversation = async (conversation: Conversation) => {
    if (!userId) return false

    try {
      console.log('Saving conversation to Firestore:', conversation.id)
      const conversationRef = doc(db, 'users', userId, 'conversations', conversation.id)

      // Prepare data for Firestore (handle Date objects)
      const conversationData = {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          type: msg.type || 'general'
        })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }

      console.log('Prepared conversation data for Firestore:', conversationData)
      await setDoc(conversationRef, conversationData)
      console.log('Conversation saved successfully')
      return true
    } catch (err) {
      console.error('Error saving conversation:', err)
      setError('Failed to save conversation')
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save conversation. Your changes may not persist."
      })
      return false
    }
  }

  // Delete a conversation from Firestore
  const deleteConversation = async (conversationId: string) => {
    if (!userId) return false

    try {
      await deleteDoc(doc(db, 'users', userId, 'conversations', conversationId))

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      return true
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError('Failed to delete conversation')
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation."
      })
      return false
    }
  }

  // Update conversations in local state and save to Firestore
  const updateConversations = async (newConversations: Conversation[]) => {
    // First find the updated conversation before updating state
    const updatedConversation = newConversations.find(
      conv => {
        const oldConv = conversations.find(old => old.id === conv.id)
        if (!oldConv) return true

        // Check if message count changed
        if (oldConv.messages.length !== conv.messages.length) return true

        // Check if any message content changed
        for (let i = 0; i < conv.messages.length; i++) {
          if (i >= oldConv.messages.length) return true
          if (conv.messages[i].content !== oldConv.messages[i].content) return true
          if (conv.messages[i].role !== oldConv.messages[i].role) return true
        }

        return false
      }
    )

    console.log('Found updated conversation:', updatedConversation?.id)

    // Update local state first
    setConversations(newConversations)

    // Save the updated conversation to Firestore
    if (updatedConversation) {
      console.log('Saving updated conversation to Firestore')
      const success = await saveConversation(updatedConversation)
      console.log('Save result:', success)

      // If save failed, refresh the conversations from Firestore
      if (!success && userId) {
        console.log('Save failed, refreshing conversations from Firestore')
        const conversationsRef = collection(db, 'users', userId, 'conversations')
        const q = query(conversationsRef, orderBy('updatedAt', 'desc'))
        const querySnapshot = await getDocs(q)

        const loadedConversations: Conversation[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()

          // Convert Firestore timestamps to Date objects
          const conversation: Conversation = {
            id: doc.id,
            title: data.title,
            messages: data.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp.toDate()
            })),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          }

          loadedConversations.push(conversation)
        })

        if (loadedConversations.length > 0) {
          setConversations(loadedConversations)
        }
      }
    }
  }

  // Create a new conversation
  const createConversation = async () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const success = await saveConversation(newConversation)

    if (success) {
      setConversations([newConversation, ...conversations])
      return newConversation.id
    }

    return null
  }

  return {
    conversations,
    loading,
    error,
    updateConversations,
    saveConversation,
    deleteConversation,
    createConversation
  }
}
