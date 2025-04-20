"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from '@/components/ui/logo'

export function SplashScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      const baseUrl = window.location.origin
      if (user) {
        window.location.href = `${baseUrl}/dashboard`
      } else {
        window.location.href = `${baseUrl}/auth`
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [loading, user])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-background"
    >
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="space-y-2">
          <Logo size="lg" />
          <p className="text-muted-foreground text-lg">Smart Expense Tracker & Financial Advisor</p>
        </div>
      </motion.div>
    </motion.div>
  )
}




