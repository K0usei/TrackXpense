/// <reference lib="webworker" />

import { defaultCache } from '@/lib/serwist/browser'
import type { PrecacheEntry } from '@serwist/precaching'
import { installSerwist } from '@serwist/sw'

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[]
}

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})














