"use client"

import { Card, CardContent, CardHeader } from "./card"
import { Skeleton } from "./skeleton"

// ✅ EXPENSE CARD SKELETON
export function ExpenseCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ✅ EXPENSE LIST SKELETON
export function ExpenseListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ExpenseCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ✅ CHART SKELETON
export function ChartSkeleton() {
  // Alturas fijas para evitar problemas de hidratación
  const barHeights = [120, 80, 150, 100, 90]
  
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <div className="space-y-4 w-full">
            <div className="flex items-end justify-between h-48">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <Skeleton 
                    className="w-12 bg-slate-200 dark:bg-slate-700" 
                    style={{ height: `${barHeights[i]}px` }}
                  />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ✅ PIE CHART SKELETON
export function PieChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="h-64 w-64 relative">
          <div className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-white dark:bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  )
}

// ✅ HEADER SKELETON
export function HeaderSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ✅ FORM SKELETON
export function FormSkeleton() {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
      <Skeleton className="h-5 w-24 mb-4" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      </div>
    </div>
  )
}

// ✅ DASHBOARD SKELETON
export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <HeaderSkeleton />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <ExpenseListSkeleton count={4} />
      </div>
    </div>
  )
}

// ✅ HISTORY SKELETON
export function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="pt-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        <ChartSkeleton />
        <PieChartSkeleton />
        <ChartSkeleton />
        
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ✅ LOADING STATES
export const LoadingStates = {
  ExpenseCard: ExpenseCardSkeleton,
  ExpenseList: ExpenseListSkeleton,
  Chart: ChartSkeleton,
  PieChart: PieChartSkeleton,
  Header: HeaderSkeleton,
  Form: FormSkeleton,
  Dashboard: DashboardSkeleton,
  History: HistorySkeleton,
}
