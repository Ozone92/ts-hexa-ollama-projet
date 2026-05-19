import type Conversation from "@modules/conversation/domain/conversation.entity.js";

export interface ConversationRepository {
    create(name: string): Conversation | undefined
    all(): Conversation[]
    get(id: number): Conversation | undefined
    delete(id: number): boolean
    update(id: number, title: string): void
}
