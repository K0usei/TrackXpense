"use client"

import { AuthProvider as BaseAuthProvider } from "@/contexts/AuthContext"

function AuthProvider({ children }: { children: React.ReactNode }) {
  return <BaseAuthProvider>{children}</BaseAuthProvider>
}

export { AuthProvider }
export default AuthProvider