import SqliteMessageRepository from "../infrastructure/sqlite-message.repository.js";

export default class MessageService {
    #messageRepository = new SqliteMessageRepository();

    getAll(convId: number) {
        return this.#messageRepository.get(convId);
    }

    addMessage(convId: number, role: "user" | "system" | "assistant", message: string) {
        this.#messageRepository.add(convId, role, message);
    }
}
