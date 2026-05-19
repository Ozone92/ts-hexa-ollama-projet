import config from '@shared/core/config.js'

export async function* sendChatSSE(userMessage: string, controller: AbortController): AsyncGenerator<{type: string, value?: string, message?: string}> {        
        const res = await fetch(`${config.OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
            model: config.MODEL,
            messages: [{ role: 'user', content: userMessage }],
            stream: true
        })
        })

        if (!res.ok) {
            throw new Error();
        }

        try {
        // L'API Ollama renvoie du NDJSON — une ligne JSON par token
        for await (const chunk of res.body!!) {
            const lines = Buffer.from(chunk).toString('utf8').split('\n').filter(Boolean)
            for (const line of lines) {
            const parsed = JSON.parse(line)
            if (parsed.message?.content) {
                yield ({ type: 'token', value: parsed.message.content })
            }
            if (parsed.done) {
                yield ({ type: 'done' })
            }
            }
        }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                yield ({ type: 'error', message: err.message })
            }
        }
    }

export async function* sendChattSSEHisotry(history: {role: string, content: string}[], controller: AbortController): AsyncGenerator<{type: string, value?: string, message?: string}> {
    const res = await fetch(`${config.OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
            model: config.MODEL,
            messages: history,
            stream: true
        })
        })

        if (!res.ok) {
            throw new Error();
        }

        try {
        // L'API Ollama renvoie du NDJSON — une ligne JSON par token
        for await (const chunk of res.body!!) {
            const lines = Buffer.from(chunk).toString('utf8').split('\n').filter(Boolean)
            for (const line of lines) {
            const parsed = JSON.parse(line)
            if (parsed.message?.content) {
                yield ({ type: 'token', value: parsed.message.content })
            }
            if (parsed.done) {
                yield ({ type: 'done' })
            }
            }
        }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                yield ({ type: 'error', message: err.message })
            }
        }
}
