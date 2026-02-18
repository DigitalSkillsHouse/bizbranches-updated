import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: number // Stale while revalidate in milliseconds
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  isStale: boolean
}

const cache = new Map<string, CacheEntry<any>>()

export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 300000, staleWhileRevalidate = 600000 } = options // 5 min TTL, 10 min SWR
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    const cached = cache.get(key)

    // Return cached data if it's fresh and not forcing refresh
    if (!forceRefresh && cached && !cached.isStale) {
      setData(cached.data)
      setLoading(false)
      return cached.data
    }

    // If cached data is stale but within SWR window, return it and fetch in background
    if (!forceRefresh && cached && cached.isStale && (now - cached.timestamp) < staleWhileRevalidate) {
      setData(cached.data)
      setLoading(false)
      
      // Fetch fresh data in background
      try {
        const freshData = await fetcher()
        const newEntry: CacheEntry<T> = {
          data: freshData,
          timestamp: now,
          isStale: false
        }
        cache.set(key, newEntry)
        setData(freshData)
      } catch (err) {
        logger.warn('Background fetch failed:', err)
      }
      return cached.data
    }

    // Fetch fresh data
    try {
      setLoading(true)
      setError(null)
      const freshData = await fetcher()
      const newEntry: CacheEntry<T> = {
        data: freshData,
        timestamp: now,
        isStale: false
      }
      cache.set(key, newEntry)
      setData(freshData)
      setLoading(false)
      return freshData
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      throw err
    }
  }, [key, fetcher, ttl, staleWhileRevalidate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  return { data, loading, error, refresh }
}

// Utility function to clear cache
export function clearApiCache(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

// Utility function to preload data
export async function preloadApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 300000 } = options
  const now = Date.now()
  
  try {
    const data = await fetcher()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      isStale: false
    }
    cache.set(key, entry)
    return data
  } catch (err) {
    logger.warn('Preload failed:', err)
    throw err
  }
}
