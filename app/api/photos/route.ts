import { NextRequest } from 'next/server'

type Photo = {
  id: string
  url: string
  alt?: string
  createdAt: string
}

// Simple in-memory cache to reduce external API calls during development
const CACHE_TTL = 60 * 1000 // 60 seconds
const photosCache: Map<string, { ts: number; data: any }> = new Map()

// Redis helper (optional). Uses `ioredis` when `REDIS_URL` is provided.
const REDIS_URL = process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL
async function getRedisClient() {
  if (!REDIS_URL) return null
  const g = global as any
  if (g.__redis) return g.__redis
  try {
    const IORedis = (await import('ioredis')).default
    const client = new IORedis(REDIS_URL)
    // simple ping to ensure connection
    await client.ping()
    g.__redis = client
    return client
  } catch (err) {
    console.warn('Redis client unavailable:', err)
    return null
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const count = Number(url.searchParams.get('count')) || 30
  const days = Number(url.searchParams.get('days')) || 5
  const queryParam = url.searchParams.get('query') || 'portrait'

  const cacheKey = `count=${count}&days=${days}&q=${queryParam}`
  // Try Redis first
  try {
    const redis = await getRedisClient()
    if (redis) {
      const s = await redis.get(cacheKey)
      if (s) {
        return new Response(s, {
          headers: { 'Content-Type': 'application/json', 'x-cache': 'HIT-redis' },
        })
      }
    }
  } catch (err) {
    console.warn('Redis read failed', err)
  }

  const cached = photosCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json', 'x-cache': 'HIT-memory' },
    })
  }

  const photos: Photo[] = []
  const now = new Date()
  const UNSPLASH_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

  if (UNSPLASH_KEY) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?count=${count}&query=${encodeURIComponent(
          queryParam
        )}&client_id=${UNSPLASH_KEY}`
      )
      if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`)
      const data = await res.json()

      const items = Array.isArray(data) ? data : [data]
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const dayOffset = Math.floor(Math.random() * days) // 0..days-1
        const d = new Date(now)
        d.setDate(now.getDate() - dayOffset)

        photos.push({
          id: item.id || `unsplash-${i}`,
          url: item.urls?.regular || item.urls?.full || item.urls?.small || `https://source.unsplash.com/random/800x600?sig=${i}`,
          alt: item.alt_description || item.description || `Unsplash photo ${i}`,
          createdAt: d.toISOString(),
        })
      }
      // cache the response
      photosCache.set(cacheKey, { ts: Date.now(), data: { photos } })
      try {
        const redis = await getRedisClient()
        if (redis) {
          await redis.set(cacheKey, JSON.stringify({ photos }), 'EX', Math.floor(CACHE_TTL / 1000))
        }
      } catch (err) {
        console.warn('Redis write failed', err)
      }
    } catch (err) {
      // If Unsplash API fails, fall back to random source URLs
      for (let i = 0; i < count; i++) {
        const dayOffset = Math.floor(Math.random() * days) // 0..days-1
        const d = new Date(now)
        d.setDate(now.getDate() - dayOffset)
        const urlImg = `https://source.unsplash.com/random/800x600?sig=${i}&${encodeURIComponent(
          queryParam
        )}`

        photos.push({
          id: `unsplash-${i}`,
          url: urlImg,
          alt: `Unsplash photo ${i}`,
          createdAt: d.toISOString(),
        })
      }
      photosCache.set(cacheKey, { ts: Date.now(), data: { photos } })
      try {
        const redis = await getRedisClient()
        if (redis) {
          await redis.set(cacheKey, JSON.stringify({ photos }), 'EX', Math.floor(CACHE_TTL / 1000))
        }
      } catch (err) {
        console.warn('Redis write failed', err)
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      const dayOffset = Math.floor(Math.random() * days) // 0..days-1
      const d = new Date(now)
      d.setDate(now.getDate() - dayOffset)

      // Use Unsplash Source to provide random images without an API key
      const urlImg = `https://source.unsplash.com/random/800x600?sig=${i}&photo`

      photos.push({
        id: `unsplash-${i}`,
        url: urlImg,
        alt: `Unsplash photo ${i}`,
        createdAt: d.toISOString(),
      })
    }
    photosCache.set(cacheKey, { ts: Date.now(), data: { photos } })
    try {
      const redis = await getRedisClient()
      if (redis) {
        await redis.set(cacheKey, JSON.stringify({ photos }), 'EX', Math.floor(CACHE_TTL / 1000))
      }
    } catch (err) {
      console.warn('Redis write failed', err)
    }
  }

  return new Response(JSON.stringify({ photos }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
