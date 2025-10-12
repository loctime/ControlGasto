"use client"

import { useAuth } from '@/components/auth-provider'
import { BottomNav } from '@/components/bottom-nav'
import { RecurringItemsManager } from '@/components/recurring-items-manager'
import { UnifiedHeader } from '@/components/unified-header'
import { useAutoScheduler } from '@/lib/auto-scheduler'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RecurringItemsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Ejecutar auto-scheduler
  useAutoScheduler()

  useEffect(() => {
    if (!user && !loading) {
      router.push('/')
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
      <UnifiedHeader title="Items Recurrentes" />
      <div className="container mx-auto p-4 max-w-6xl">
        <RecurringItemsManager />
      </div>
      <BottomNav />
    </div>
  )
}

