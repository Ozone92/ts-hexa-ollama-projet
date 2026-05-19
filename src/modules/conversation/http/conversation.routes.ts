import type { FastifyInstance } from "fastify"
import ConversationService from "../application/conversation.service.js"
import MessageService from "../application/message.service.js"
import { sendChattSSEHisotry } from "@shared/core/sse-chat.js"

// Schémas réutilisables enregistrés sur l'instance Fastify
const messageSchema = {
  $id: 'Message',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    conversationId: { type: 'integer' },
    role: { type: 'string' },
    content: { type: 'string' },
    createdAt: { type: 'string' }
  }
}

const conversationSchema = {
  $id: 'Conversation',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    createdAt: { type: 'string' },
    messageCount: { type: 'integer' }
  }
}

/** @param {import('fastify').FastifyInstance} app */
export async function conversationsRoute(app: FastifyInstance) {
  // Enregistrement des schémas réutilisables ($ref)
  app.addSchema(messageSchema)
  app.addSchema(conversationSchema)

  const conversationService = new ConversationService();
  const messageService = new MessageService();

  // POST /conversations — crée une nouvelle conversation
  app.post('/conversations', {
    schema: {
      response: { 201: { $ref: 'Conversation#' } }
    }
  }, async (_, reply) => {
    const conv = conversationService.createConversation('Nouvelle conversation');
    return reply.status(201).send(conv)
  })

  // GET /conversations — liste toutes les conversations
  app.get('/conversations', {
    schema: {
      response: { 200: { type: 'array', items: { $ref: 'Conversation#' } } }
    }
  }, async () => {
    return conversationService.getAllConversations();
  })

  // GET /conversations/:id — détail + messages
  app.get<{Params: {id: number}}>('/conversations/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            createdAt: { type: 'string' },
            messages: { type: 'array', items: { $ref: 'Message#' } }
          }
        }
      }
    }
  }, async (request, reply) => {
    const conv = conversationService.getById(request.params.id)
    if (!conv) return reply.notFound(`Conversation ${request.params.id} introuvable`)

    const messages = messageService.getAll(conv.id)
    return { ...conv, messages }
  })

  // DELETE /conversations/:id — supprime conversation et messages (CASCADE)
  app.delete<{Params: {id: number}}>('/conversations/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'integer' } } }
    }
  }, async (request, reply) => {
    const haveDeleted = conversationService.deleteById(request.params.id)
    if (haveDeleted) return reply.notFound(`Conversation ${request.params.id} introuvable`)
    return reply.status(204).send()
  })

  // POST /conversations/:id/messages — message user + réponse assistant en SSE
  app.post<{Params: {id: number}, Body: {message: string}}>('/conversations/:id/messages', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 4096 }
        },
        additionalProperties: false
      }
    }
  }, async (request, reply) => {
    const convId = request.params.id
    const { message } = request.body
    const controller = new AbortController()

    // Mise à jour du titre si c'est le premier message (tronqué à 60 chars)
    const history = messageService.getAll(convId)
    if (history.length === 0) {
      conversationService.update(convId, message.slice(0, 60))
    }

    // Sauvegarde du message utilisateur
    messageService.addMessage(convId, 'user', message)

    // Construction du contexte complet pour le LLM
    const updatedHistory = messageService.getAll(convId)
    const ollamaMessages = updatedHistory.map(m => ({ role: m.role, content: m.content }))

    let fullResponse = ''
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

        for (const payload in sendChattSSEHisotry(ollamaMessages, controller))
        {
            fullResponse += payload;
            reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
        }

    } catch (e: any) {
        request.log.error({ status: 502, body: e }, 'Ollama error')
      return reply.status(502).send({ error: 'Ollama request failed' })
    } finally {
        messageService.addMessage(convId, 'assistant', fullResponse);
        reply.raw.end()
    }
  })
}
