"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5" />
          Algo salió mal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-red-700 dark:text-red-300">
          Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-xs text-red-600 dark:text-red-400">
            <summary className="cursor-pointer font-medium">Detalles del error</summary>
            <pre className="mt-2 whitespace-pre-wrap bg-red-100 dark:bg-red-800 p-2 rounded">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <div className="flex gap-2">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
          <Button onClick={() => window.location.reload()} size="sm">
            Recargar página
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Error fallback específico para gráficos
export function ChartErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-slate-600 dark:text-slate-400">Error al cargar gráfico</p>
        <Button onClick={resetError} size="sm" variant="outline">
          Reintentar
        </Button>
      </div>
    </div>
  )
}

// Hook para manejo de errores
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('Error handled:', error)
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
