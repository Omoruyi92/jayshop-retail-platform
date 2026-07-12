import { Client } from 'pg'
import { broadcaster, type RealtimeChannel, type RealtimePayload } from './broadcaster'

/**
 * Dedicated pg.Client for LISTEN/NOTIFY.
 *
 * Prisma's connection pool does not expose LISTEN (and pooled connections
 * can be recycled mid-listen), so this uses the standalone `pg` driver with
 * a single persistent connection, completely isolated from `src/lib/prisma.ts`.
 *
 * Started lazily on first SSE subscriber (see api/realtime/inventory/route.ts)
 * so it never runs during `next build` / static analysis. Reconnects with
 * exponential backoff on any connection loss (e.g. `docker restart` on the DB).
 */

const CHANNELS: RealtimeChannel[] = ['inventory_changed', 'hold_changed']
const INITIAL_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 15000

type ListenerState = {
  client: Client | null
  connecting: boolean
  backoffMs: number
  reconnectTimer: ReturnType<typeof setTimeout> | null
  started: boolean
}

const globalForListener = globalThis as unknown as {
  __pgListenerState: ListenerState | undefined
}

const state: ListenerState =
  globalForListener.__pgListenerState ?? {
    client: null,
    connecting: false,
    backoffMs: INITIAL_BACKOFF_MS,
    reconnectTimer: null,
    started: false,
  }

if (process.env.NODE_ENV !== 'production') {
  globalForListener.__pgListenerState = state
}

function scheduleReconnect() {
  if (state.reconnectTimer) return
  const delay = state.backoffMs
  state.backoffMs = Math.min(state.backoffMs * 2, MAX_BACKOFF_MS)
  state.reconnectTimer = setTimeout(() => {
    state.reconnectTimer = null
    void connect()
  }, delay)
}

async function connect() {
  if (state.connecting || state.client) return
  state.connecting = true

  const client = new Client({ connectionString: process.env.DATABASE_URL })

  client.on('error', (err) => {
    console.error('[pgListener] connection error:', err.message)
  })

  client.on('end', () => {
    if (state.client === client) state.client = null
    scheduleReconnect()
  })

  client.on('notification', (msg) => {
    if (!msg.channel || !msg.payload) return
    try {
      const payload = JSON.parse(msg.payload) as RealtimePayload
      broadcaster.publish(msg.channel as RealtimeChannel, payload)
    } catch (err) {
      console.error('[pgListener] failed to parse NOTIFY payload:', err)
    }
  })

  try {
    await client.connect()
    for (const channel of CHANNELS) {
      await client.query(`LISTEN ${channel}`)
    }
    state.client = client
    state.backoffMs = INITIAL_BACKOFF_MS
    console.log('[pgListener] connected and listening on', CHANNELS.join(', '))
  } catch (err) {
    console.error('[pgListener] failed to connect:', (err as Error).message)
    try { await client.end() } catch { /* ignore */ }
    scheduleReconnect()
  } finally {
    state.connecting = false
  }
}

/** Idempotent: safe to call from every SSE connection; only connects once. */
export function ensurePgListenerStarted() {
  if (state.started) return
  state.started = true
  void connect()
}
