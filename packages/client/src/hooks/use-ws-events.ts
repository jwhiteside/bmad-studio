import { useEffect, useRef, useCallback } from 'react'

import type { V65WsEvent } from '@bmad-studio/shared'

import { WebSocketClient } from '../lib/websocket-client.js'

function getWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

// Module-level singleton so multiple calls share one connection
let sharedClient: WebSocketClient | null = null
let refCount = 0

function getSharedClient(): WebSocketClient {
  if (!sharedClient) {
    sharedClient = new WebSocketClient(getWsUrl())
    sharedClient.connect()
  }
  return sharedClient
}

function releaseSharedClient() {
  refCount -= 1
  if (refCount <= 0) {
    sharedClient?.close()
    sharedClient = null
    refCount = 0
  }
}

export function useV65WsEvent<T extends V65WsEvent>(
  type: T['type'],
  handler: (event: T) => void,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const stableHandler = useCallback(
    (raw: unknown) => {
      const event = raw as V65WsEvent
      if (event.type === type) {
        handlerRef.current(event as T)
      }
    },
    [type],
  )

  useEffect(() => {
    const client = getSharedClient()
    refCount += 1

    // onMessage accepts WebSocketEvent but we cast since the wire format
    // is the same discriminated-union JSON for both legacy and V65 events.
    const unsubscribe = client.onMessage(stableHandler as Parameters<typeof client.onMessage>[0])

    return () => {
      unsubscribe()
      releaseSharedClient()
    }
  }, [stableHandler])
}
