import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import database from '../shared/infrastructure/persistance/database.js'
import { healthRoute } from '../modules/health/http/health.routes.js'
import { chatRoute } from '../modules/chat/http/chat.routes.js'
import { conversationsRoute } from '../modules/conversation/http/conversation.routes.js'

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

  app.addHook('onClose', () => database.db.close());

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(healthRoute)
  await app.register(chatRoute)
  await app.register(conversationsRoute)

  return app
}
