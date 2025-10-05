"use client"

import type React from "react"

import { auth } from "@/lib/firebase"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { createContext, useContext, useEffect, useState } from "react"

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

// Componente interno que maneja la sincronización automática
function AuthProviderWithSync({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  // Activar sincronización automática con ControlFile

  return <>{children}</>
}

// Wrapper que combina AuthProvider con sincronización automática
export function AuthProviderWithControlFileSync({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthProviderWithSync>
        {children}
      </AuthProviderWithSync>
    </AuthProvider>
  )
}

export const useAuth = () => useContext(AuthContext)
