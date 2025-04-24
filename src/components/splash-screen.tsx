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
        className="text-center w-full"
      >
        <div className="space-y-3 sm:space-y-4 px-4 sm:px-6 max-w-xs sm:max-w-sm mx-auto">
          <Logo size="lg" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed"
          >
            Smart Expense Tracker & Financial Advisor
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  )
}




