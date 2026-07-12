#!/usr/bin/env node
/*
 * Lightweight pre-flight check: confirms Postgres is reachable before
 * starting the dev server, so a stopped DB (e.g. Colima not running,
 * "docker compose up -d" not run) fails fast with a clear message
 * instead of surfacing as confusing 401/500s once the app is loaded.
 */
const net = require('net')

function parseDatabaseUrl(url) {
  try {
    const u = new URL(url)
    return { host: u.hostname || 'localhost', port: Number(u.port) || 5432 }
  } catch {
    return { host: 'localhost', port: 5432 }
  }
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl || !dbUrl.startsWith('postgres')) {
  // Not using Postgres (e.g. sqlite) — nothing to check.
  process.exit(0)
}

const { host, port } = parseDatabaseUrl(dbUrl)
const socket = new net.Socket()
const timeout = 2000

socket.setTimeout(timeout)
socket.once('connect', () => {
  socket.destroy()
  process.exit(0)
})
socket.once('timeout', fail)
socket.once('error', fail)

function fail() {
  socket.destroy()
  console.warn('\n\x1b[33m⚠  Cannot reach Postgres at %s:%s\x1b[0m', host, port)
  console.warn('   The dev server will start, but API routes that use the DB will fail (401/500 errors).')
  console.warn('   If you use Docker/Colima locally, try:')
  console.warn('     colima start   (if using Colima instead of Docker Desktop)')
  console.warn('     docker compose up -d\n')
  process.exit(0) // don't block dev server startup — just warn
}

socket.connect(port, host)
