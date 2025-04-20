"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/signup-form"
import { ForgotPasswordForm } from "@/components/auth/forgot-password"
import { Logo } from '@/components/ui/logo'

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <div className="text-center space-y-2 mb-6">
            <Logo size="md" />
            <p className="text-muted-foreground">
              {view === 'login' && "Sign in to your account"}
              {view === 'signup' && "Create your account"}
              {view === 'forgot' && "Reset your password"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <LoginForm />
                <div className="mt-4 text-center space-y-2">
                  <button
                    onClick={() => setView('forgot')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                  <div>
                    <button
                      onClick={() => setView('signup')}
                      className="text-sm text-primary hover:underline"
                    >
                      Don't have an account? Sign up
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <SignUpForm />
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setView('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ForgotPasswordForm />
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setView('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  )
}



