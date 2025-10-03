"use client"

import { Suspense, lazy } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorBoundary, ChartErrorFallback } from "@/components/ui/error-boundary"
import { ChartSkeleton, PieChartSkeleton } from "@/components/ui/skeleton-loaders"

// Lazy loading de gráficos
const BarChart = lazy(() => import("recharts").then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import("recharts").then(module => ({ default: module.Bar })))
const XAxis = lazy(() => import("recharts").then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import("recharts").then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import("recharts").then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import("recharts").then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import("recharts").then(module => ({ default: module.ResponsiveContainer })))
const PieChart = lazy(() => import("recharts").then(module => ({ default: module.PieChart })))
const Pie = lazy(() => import("recharts").then(module => ({ default: module.Pie })))
const Cell = lazy(() => import("recharts").then(module => ({ default: module.Cell })))

interface HistoryChartsProps {
  pieData: Array<{ name: string; value: number; color: string }>
  categoryChartData: Array<{ name: string; total: number; paid: number; pending: number }>
  itemsChartData: Array<{ 
    name: string; 
    fullName: string; 
    total: number; 
    paid: number; 
    pending: number; 
    count: number; 
    category: string 
  }>
}

export function HistoryCharts({ pieData, categoryChartData, itemsChartData }: HistoryChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Torta - Distribución Pagado/Pendiente */}
      <ErrorBoundary fallback={ChartErrorFallback}>
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<PieChartSkeleton />}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props
                      return `${name} ${(percent * 100).toFixed(0)}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Monto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Suspense>
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* Gráfico de Barras - Por Categorías */}
      <ErrorBoundary fallback={ChartErrorFallback}>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      return [
                        `$${value.toLocaleString()}`,
                        name === 'paid' ? 'Pagado' : 'Pendiente'
                      ]
                    }}
                  />
                  <Bar dataKey="paid" stackId="a" fill="#10b981" name="Pagado" />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pendiente" />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* Gráfico de Barras - Top Items */}
      <ErrorBoundary fallback={ChartErrorFallback}>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Gastos Individuales</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={itemsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      return [
                        `$${value.toLocaleString()}`,
                        name === 'paid' ? 'Pagado' : 'Pendiente'
                      ]
                    }}
                    labelFormatter={(label: any, payload: any) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload
                        return `${data.fullName} (${data.count} veces)`
                      }
                      return label
                    }}
                  />
                  <Bar dataKey="paid" stackId="a" fill="#10b981" name="Pagado" />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pendiente" />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
