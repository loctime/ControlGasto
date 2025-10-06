"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { ExpensesDashboard } from "@/components/expenses-dashboard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function DashboardContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ExpensesDashboard />
      <BottomNav />
    </div>
  )
}
