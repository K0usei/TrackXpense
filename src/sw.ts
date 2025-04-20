/// <reference lib="webworker" />

import { defaultCache } from '@/lib/serwist/browser'
import { precacheAndRoute } from '@serwist/precaching'
import { registerRoute } from '@serwist/routing'
import type { PrecacheEntry } from '@serwist/precaching'

declare let self: ServiceWorkerGlobalScope

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[]
  }
}

precacheAndRoute(self.__SW_MANIFEST)

// Register runtime cache routes
defaultCache.forEach(({ urlPattern, handler }) => {
  registerRoute(urlPattern, handler)
})
