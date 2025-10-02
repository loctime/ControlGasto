"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si Firebase está configurado correctamente
    const isFirebaseConfigured = auth && typeof auth === 'object' && 'onAuthStateChanged' in auth
    
    if (isFirebaseConfigured) {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user)
          setLoading(false)
        })
        return () => unsubscribe()
      } catch (error) {
        console.warn('Firebase Auth error:', error)
        setLoading(false)
      }
    } else {
      // Modo desarrollo sin Firebase
      console.log('🔧 Using mock authentication for development')
      setUser(null)
      setLoading(false)
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
