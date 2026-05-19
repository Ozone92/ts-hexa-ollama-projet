import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import dbPlugin from '../shared/infrastructure/persistance/database.js'
import { healthRoute } from './routes/health.js'
import { chatRoute } from '../modules/chat/http/chat.routes.js'
import { conversationsRoute } from './routes/conversations.js'

export async function buildApp(opts = {}) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    },
    ...opts
  })

  // ── Plugins globaux ───────────────────────────────────────────────────────
  await app.register(sensible)  // reply.notFound(), reply.badRequest(), etc.
  await app.register(dbPlugin)  // app.db, app.stmts

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(healthRoute)
  await app.register(chatRoute)
  await app.register(conversationsRoute)

  return app
}
