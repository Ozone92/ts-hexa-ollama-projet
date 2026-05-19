import type Message from "@modules/conversation/domain/message.entity.js";

export default interface MessageRepository {
    get(id: number): Message[]
    add(id: number, role: 'user' | 'system' | 'assistant', message: string): void
}
