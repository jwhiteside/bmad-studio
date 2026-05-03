import websocket from '@fastify/websocket'

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import type { WebSocketEvent, V65WsEvent } from '@bmad-studio/shared'

export class WebSocketManager {
  private clients = new Set<WebSocket>()

  addClient(socket: WebSocket) {
    this.clients.add(socket)
    socket.on('close', () => {
      this.clients.delete(socket)
    })
  }

  broadcast(event: WebSocketEvent | V65WsEvent) {
    const data = JSON.stringify(event)
    for (const client of this.clients) {
      if (client.readyState === 1) {
        client.send(data)
      }
    }
  }

  get clientCount() {
    return this.clients.size
  }
}

export async function registerWebSocket(app: FastifyInstance) {
  const manager = new WebSocketManager()

  await app.register(websocket)

  app.get('/ws', { websocket: true }, (socket) => {
    manager.addClient(socket)
    socket.send(JSON.stringify({ type: 'protocol:version', version: 1 }))
  })

  app.decorate('ws', manager)
}

declare module 'fastify' {
  interface FastifyInstance {
    ws: WebSocketManager
  }
}
