'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, PlusCircle, Bot, User, Loader2, MessageSquare, Pencil, Trash } from "lucide-react"
import { XpenserLogo } from "@/components/ui/xpenser-logo"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSwipeable } from "react-swipeable"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  type?: 'budget' | 'analysis' | 'recommendation' | 'query' | 'general'
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  content: "Hello! I'm your AI financial assistant. I can help you with budget planning, investment strategies, debt management, tax planning, and other financial topics. What would you like to know about your finances today?",
  role: 'assistant',
  timestamp: new Date(),
  type: 'general'
}

export default function AssistantPage() {
  const [message, setMessage] = useState('')
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    // Create a default conversation
    const defaultConversation: Conversation = {
      id: '1',
      title: 'New Conversation',
      messages: [INITIAL_MESSAGE],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    return [defaultConversation]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [editingConversation, setEditingConversation] = useState<string | null>(null)
  const [newConversationTitle, setNewConversationTitle] = useState('')
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Set the first conversation as active by default
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id)
    }
  }, [conversations, activeConversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversations])

  // Handle Firestore errors
  useEffect(() => {
    // Add a global error handler for Firestore errors
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message && event.error.message.includes('FIRESTORE')) {
        console.warn('Caught Firestore error:', event.error.message)
        event.preventDefault()
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Setup swipe handlers for sidebar
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => setShowSidebar(true),
    onSwipedLeft: () => setShowSidebar(false),
    trackMouse: false,
    delta: 50
  })

  // Function to delete a conversation
  const deleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== id)
    setConversations(updatedConversations)

    // If we deleted the active conversation, set a new active one
    if (id === activeConversationId && updatedConversations.length > 0) {
      setActiveConversationId(updatedConversations[0].id)
    }

    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed.",
      duration: 3000
    })
  }

  // Function to rename a conversation
  const renameConversation = () => {
    if (!editingConversation || !newConversationTitle.trim()) return

    setConversations(prevConversations =>
      prevConversations.map(conv => {
        if (conv.id === editingConversation) {
          return {
            ...conv,
            title: newConversationTitle.trim()
          }
        }
        return conv
      })
    )

    setShowRenameDialog(false)
    setEditingConversation(null)
    setNewConversationTitle('')

    toast({
      title: "Conversation renamed",
      description: "The conversation title has been updated.",
      duration: 3000
    })
  }

  // Get the current conversation
  const currentConversation = conversations.find(c => c.id === activeConversationId) || conversations[0]
  const messages = currentConversation?.messages || []

  // Generate a title from the first user message
  const generateTitle = (content: string): string => {
    // Truncate to first 30 characters or first sentence
    const title = content.split('.')[0].substring(0, 30)
    return title.length < content.length ? `${title}...` : title
  }

  // Start a new conversation
  const startNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [INITIAL_MESSAGE],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setConversations([newConversation, ...conversations])
    setActiveConversationId(newConversation.id)
    setMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit button clicked, message:', message)
    if (!message.trim() || isLoading || !currentConversation) {
      console.log('Submission blocked:', { isEmpty: !message.trim(), isLoading, noConversation: !currentConversation })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date()
    }
    console.log('Created user message:', userMessage)

    // First update the UI with the user message
    const updatedConversations = conversations.map(conv => {
      if (conv.id === currentConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage],
          updatedAt: new Date(),
          // Update title for new conversations with only the initial message
          title: conv.messages.length === 1 ? generateTitle(message.trim()) : conv.title
        }
      }
      return conv
    })

    // Clear the input and show loading state
    const userInput = message.trim() // Save for API call
    setConversations(updatedConversations)
    setMessage('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Use relative path instead of absolute URL
      const response = await fetch('/api/chat/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput, // Use the saved user input
          messageHistory: currentConversation.messages.slice(-5)
        })
      })

      console.log('API response status:', response.status);

      // Parse the response
      let data;
      try {
        data = await response.json();
        console.log('API response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse API response');
      }

      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.error || data.details || `Failed to get response: ${response.status}`);
      }

      if (!data || !data.response) {
        console.error('Invalid response format:', data);
        throw new Error('Received invalid response format from server');
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        type: data.type
      }

      // Update the conversation with the AI response
      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.id === currentConversation.id) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date()
            }
          }
          return conv
        })
      )
    } catch (error) {
      console.error('Chat error:', error)

      // Create a fallback assistant message
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Could you please try again?",
        role: 'assistant',
        timestamp: new Date(),
        type: 'general'
      }

      // Add the fallback message to the conversation
      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.id === currentConversation.id) {
            return {
              ...conv,
              messages: [...conv.messages, fallbackMessage],
              updatedAt: new Date()
            }
          }
          return conv
        })
      )

      // Show error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. A fallback response has been provided.",
        duration: 3000
      })
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Render rename dialog
  const renderRenameDialog = () => (
    <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Conversation</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newConversationTitle}
            onChange={(e) => setNewConversationTitle(e.target.value)}
            placeholder="Enter new title"
            className="w-full"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
          <Button onClick={renameConversation}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Add the rename dialog to the JSX
  const dialog = renderRenameDialog();

  return (
    <>
      {dialog}
      <div className="flex h-[calc(100vh-4rem-3rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] overflow-hidden relative" {...swipeHandlers}>
        {/* Sidebar with conversation history */}
        <div
          className={`${showSidebar ? 'w-64 md:w-72 lg:w-80' : 'w-0'} border-r bg-background flex flex-col h-full transition-all duration-300 overflow-hidden`}
        >
          <div className="p-4 border-b relative">
            {/* Dismiss button at top-right of sidebar */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSidebar(false)}
              className="absolute top-2 right-2 h-7 w-7 text-foreground border border-border rounded-full hover:bg-muted"
              title="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>

            <Button
              onClick={startNewConversation}
              className="w-[calc(100%-2rem)] justify-start gap-1.5 py-1.5 px-2 text-sm h-auto"
              variant="outline"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {conversations.map(conversation => (
                <div key={conversation.id} className="group relative">
                  <Button
                    variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto py-3 px-4 pr-16"
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="flex items-start gap-2 w-full overflow-hidden">
                      <MessageSquare className="h-4 w-4 flex-shrink-0 mt-1" />
                      <div className="truncate">
                        <span className="block truncate">{conversation.title}</span>
                        <span className="text-xs text-muted-foreground block truncate">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Button>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConversation(conversation.id);
                        setNewConversationTitle(conversation.title);
                        setShowRenameDialog(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Swipe indicator for mobile - only visible when sidebar is closed */}
        {!showSidebar && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-muted/80 hover:bg-muted rounded-r-full p-1 cursor-pointer transition-all duration-200 z-10 md:hidden"
            onClick={() => setShowSidebar(true)}
          >
            <div className="w-1 h-16 flex flex-col justify-center items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-foreground/50"></div>
              <div className="w-1 h-1 rounded-full bg-foreground/50"></div>
              <div className="w-1 h-1 rounded-full bg-foreground/50"></div>
            </div>
          </div>
        )}

        {/* Desktop toggle button - only visible when sidebar is closed */}
        {!showSidebar && (
          <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 z-20 transition-all duration-300">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="h-10 w-10 rounded-full bg-background border-2 border-border shadow-md flex items-center justify-center p-0 -ml-5"
              title="Open sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full relative">
          {/* Messages container - scrollable area */}
          <div className="absolute inset-0 pb-[70px] md:pb-[70px] overflow-hidden">
            <div className="h-full overflow-y-auto px-4 py-6" ref={chatContainerRef}>
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.length <= 1 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4 text-center max-w-md">
                      <XpenserLogo size="lg" />
                      <p className="text-muted-foreground text-sm">
                        Your Personal AI Financial Advisor
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-8 w-8 mt-1">
                            {msg.role === 'assistant' ? (
                              <>
                                <AvatarImage src="/xpenser-avatar.png" alt="Assistant" />
                                <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                              </>
                            ) : (
                              <>
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div
                            className={`rounded-lg p-3 ${msg.role === 'user'
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-muted shadow-sm border border-border/30'
                              }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            {msg.type && (
                              <div className="text-xs mt-2 opacity-70">
                                #{msg.type}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 max-w-[80%]">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/xpenser-avatar.png" alt="Assistant" />
                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg p-3 bg-muted">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-typing-dot"></span>
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-typing-dot animation-delay-200"></span>
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-typing-dot animation-delay-400"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed message input at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background z-10 shadow-sm mb-0 sm:mb-0">
              <form
                onSubmit={handleSubmit}
                className="flex gap-2 max-w-3xl mx-auto"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about your finances..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="px-3 bg-[#0066ff] hover:bg-[#0052cc] text-white shadow-md"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
