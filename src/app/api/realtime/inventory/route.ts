import { broadcaster, type RealtimeChannel, type RealtimePayload } from '@/lib/realtime/broadcaster'
import { ensurePgListenerStarted } from '@/lib/realtime/pgListener'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HEARTBEAT_MS = 20000
const CHANNELS: RealtimeChannel[] = ['inventory_changed', 'hold_changed']

function sseEvent(channel: RealtimeChannel, payload: RealtimePayload): string {
  return `event: ${channel}\ndata: ${JSON.stringify(payload)}\n\n`
}

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  const unsubscribers: (() => void)[] = []
  let heartbeatId: ReturnType<typeof setInterval> | null = null

  // Lazily boot the dedicated LISTEN client on first subscriber. Cheap
  // no-op on subsequent connections (idempotent guard inside pgListener).
  ensurePgListenerStarted()

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          // Controller already closed (client disconnected mid-write) — ignore.
        }
      }

      // Initial comment so proxies flush headers immediately.
      send(': connected\n\n')

      for (const channel of CHANNELS) {
        const unsub = broadcaster.subscribe(channel, (payload) => {
          send(sseEvent(channel, payload))
        })
        unsubscribers.push(unsub)
      }

      heartbeatId = setInterval(() => {
        send(': heartbeat\n\n')
      }, HEARTBEAT_MS)

      const cleanup = () => {
        if (heartbeatId) clearInterval(heartbeatId)
        unsubscribers.forEach((fn) => fn())
        try { controller.close() } catch { /* already closed */ }
      }

      request.signal.addEventListener('abort', cleanup)
    },
    cancel() {
      if (heartbeatId) clearInterval(heartbeatId)
      unsubscribers.forEach((fn) => fn())
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
