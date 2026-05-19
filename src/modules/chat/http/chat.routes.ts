import type { FastifyInstance } from "fastify"
import ChatService from "../application/chat.service.js"
import { sendChatSSE } from "@shared/core/sse-chat.js";

const chatBodySchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, maxLength: 4096 }
  },
  additionalProperties: false
}

const chatService = new ChatService();

/** @param {import('fastify').FastifyInstance} app */
export async function chatRoute(app: FastifyInstance) {
  // ── Étape 1 : réponse complète ──────────────────────────────────────────
  app.post<{Body: {message: string}}>('/chat', {
    schema: {
      body: chatBodySchema,
      response: {
        200: {
          type: 'object',
          properties: { response: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const { message } = request.body

    
    try {
        const response = chatService.sendChat(message);
        return response;

    } catch (e: any) {
        request.log.error({ status: 502, body: e }, 'Ollama error')
      return reply.status(502).send({ error: 'Ollama request failed' })
    }
  })

  // ── Étape 2 : streaming SSE ─────────────────────────────────────────────
  app.post<{Body: {message: string}}>('/chat/stream', {
    schema: { body: chatBodySchema }
  }, async (request, reply) => {
    const { message } = request.body
    const controller = new AbortController()

    try {
        request.raw.once('close', () => {
            request.log.info('Client disconnected — aborting Ollama stream')
            controller.abort()
        })

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'  // désactive le buffering nginx
        })

        for (const payload in sendChatSSE(message, controller))
        {
            reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
        }

    } catch (e: any) {
        request.log.error({ status: 502, body: e }, 'Ollama error')
      return reply.status(502).send({ error: 'Ollama request failed' })
    } finally {
        reply.raw.end()
    }
  })
}
