"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { ControlFileTest } from "@/components/controlfile-test"
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
      <div className="container mx-auto px-4 py-6">
        <ControlFileTest />
      </div>
      <BottomNav />
    </div>
  )
}
