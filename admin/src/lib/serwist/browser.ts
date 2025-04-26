import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from '@serwist/strategies'
import type { Strategy } from '@serwist/strategies'

type RuntimeCaching = {
  urlPattern: RegExp | string
  handler: Strategy
}

export const defaultCache: RuntimeCaching[] = [
  // Cache static assets (images, fonts, styles, scripts)
  {
    urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new CacheFirst({
      cacheName: 'static-images',
    }),
  },
  {
    urlPattern: /\.(?:js|css|woff2?|ttf|eot)$/i,
    handler: new CacheFirst({
      cacheName: 'static-resources',
    }),
  },

  // Cache API responses
  {
    urlPattern: /^https:\/\/api\./i,
    handler: new NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
    }),
  },

  // Cache other pages using Stale While Revalidate strategy
  {
    urlPattern: /\/$/,
    handler: new StaleWhileRevalidate({
      cacheName: 'pages-cache',
    }),
  },

  // Default cache strategy for everything else
  {
    urlPattern: /.*/i,
    handler: new NetworkFirst({
      cacheName: 'others',
    }),
  },
]

