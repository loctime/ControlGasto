import { useCallback, useMemo, useRef, useState } from 'react'

// ✅ DEBOUNCING: Hook para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ✅ DEBOUNCED CALLBACK: Hook para funciones con debounce
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )
}

// ✅ RETRY LOGIC: Hook para reintentos con backoff exponencial
export function useRetry() {
  const retryWithBackoff = useCallback(
    async <T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      baseDelay: number = 1000
    ): Promise<T> => {
      let lastError: Error

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn()
        } catch (error) {
          lastError = error as Error
          
          if (attempt === maxRetries) {
            throw lastError
          }

          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      throw lastError!
    },
    []
  )

  return { retryWithBackoff }
}

// ✅ RATE LIMITING: Hook para limitar requests
export function useRateLimit(maxRequests: number = 10, windowMs: number = 60000) {
  const [requests, setRequests] = useState<number[]>([])

  const canMakeRequest = useMemo(() => {
    const now = Date.now()
    const validRequests = requests.filter(time => now - time < windowMs)
    return validRequests.length < maxRequests
  }, [requests, maxRequests, windowMs])

  const makeRequest = useCallback(() => {
    const now = Date.now()
    setRequests(prev => [...prev.filter(time => now - time < windowMs), now])
  }, [windowMs])

  return { canMakeRequest, makeRequest }
}

// ✅ MEMOIZED CALCULATIONS: Hook para cálculos pesados
export function useMemoizedCalculations<T, R>(
  data: T[],
  calculator: (data: T[]) => R,
  deps: any[] = []
): R {
  return useMemo(() => calculator(data), [data, ...deps])
}

// ✅ LAZY LOADING: Hook para carga diferida
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (data || loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await loader()
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [loader, data, loading, ...deps])

  return { data, loading, error, load }
}

// ✅ PERFORMANCE MONITORING: Hook para monitorear performance
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    renderTime: number
    renderCount: number
  }>({ renderTime: 0, renderCount: 0 })

  const startRender = useCallback(() => {
    return performance.now()
  }, [])

  const endRender = useCallback((startTime: number) => {
    const renderTime = performance.now() - startTime
    setMetrics(prev => ({
      renderTime,
      renderCount: prev.renderCount + 1
    }))
  }, [])

  return { metrics, startRender, endRender }
}

// ✅ OPTIMIZATION UTILITIES
export const optimizationUtils = {
  // Memoizar objetos para evitar re-renders
  memoizeObject: <T extends Record<string, any>>(obj: T): T => {
    return useMemo(() => obj, Object.values(obj))
  },

  // Memoizar arrays para evitar re-renders
  memoizeArray: <T>(arr: T[]): T[] => {
    return useMemo(() => arr, arr)
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  },

  // Deep equality check
  deepEqual: (a: any, b: any): boolean => {
    if (a === b) return true
    if (a == null || b == null) return false
    if (typeof a !== typeof b) return false

    if (typeof a === 'object') {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)

      if (keysA.length !== keysB.length) return false

      for (let key of keysA) {
        if (!keysB.includes(key)) return false
        if (!optimizationUtils.deepEqual(a[key], b[key])) return false
      }

      return true
    }

    return false
  }
}
