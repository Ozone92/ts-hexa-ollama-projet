import config from '@shared/core/config.js'

interface OllamaResponse {
    message: {content: string};
}

class ChatService {
    async sendChat(userMessage:  string) {
        const res = await fetch(`${config.OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.MODEL,
                messages: [{ role: 'user', content: userMessage }],
                stream: false
            })
        })

        if (!res.ok) {
            throw new Error();
        }

        const data = (await res.json()) as OllamaResponse
        return { response: data.message.content }
    }
}

export default ChatService;
