'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  type?: 'budget' | 'analysis' | 'recommendation' | 'query'
  analysis?: any
  recommendations?: string[]
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  content: "Hi! I'm Xpenser, your AI financial advisor. I can help you with:\n• Budget planning and analysis\n• Spending insights and patterns\n• Money-saving recommendations\n\nWhat would you like to know about your finances?",
  role: 'assistant',
  timestamp: new Date(),
  type: 'budget'
}

export function XpenserChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (input: string) => {
    setIsLoading(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
      type: 'query'
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/chat/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          messageHistory: messages.slice(-5), // Send last 5 messages for context
          userProfile: {
            monthlyIncome: null, // Replace with actual user data
            monthlyBudget: null, // Replace with actual user data
            financialGoals: null // Replace with actual user data
          },
          expenses: {
            recentTransactions: [], // Replace with actual data or state
            categoryBreakdown: [] // Replace with actual expense categories data
          }
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        type: data.type,
        analysis: data.analysis,
        recommendations: data.recommendations
      }

      setMessages(prev => [...prev, assistantMessage])

      // If there are actionable recommendations, show them in a toast
      if (data.recommendations?.length > 0) {
        toast({
          title: "Financial Recommendations",
          description: data.recommendations[0],
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response from Xpenser. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] bg-background">
      <div className="p-4 border-b flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/xpenser-avatar.png" alt="Xpenser" />
          <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">Xpenser AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Your personal financial advisor</p>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8">
                  {message.role === 'assistant' ? (
                    <>
                      <AvatarImage src="/xpenser-avatar.png" alt="Xpenser" />
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`rounded-lg p-3 ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                    }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.type && (
                    <div className="text-xs mt-2 opacity-70">
                      #{message.type}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/xpenser-avatar.png" alt="Xpenser" />
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(input)
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  )
}


