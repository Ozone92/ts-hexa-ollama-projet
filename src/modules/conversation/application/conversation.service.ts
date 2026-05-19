import { SqliteConversationRepository } from "../infrastructure/sqlite-conversation.repository.js";

class ConversationService {
    #conversationRepository = new SqliteConversationRepository();

    createConversation(name: string) {
        return this.#conversationRepository.create(name);
    }

    getAllConversations() {
        return this.#conversationRepository.all();
    }

    getById(id: number) {
        return this.#conversationRepository.get(id);
    }

    deleteById(id: number) {
        return this.#conversationRepository.delete(id);
    }

    update(id: number, title: string) {
        this.#conversationRepository.update(id, title);
    }
}

export default ConversationService
