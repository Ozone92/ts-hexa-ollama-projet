import type MessageRepository from "../application/ports/message.repository.js";
import type Message from "../domain/message.entity.js";

import database from "@shared/infrastructure/persistance/database.js";

export default class SqliteMessageRepository implements MessageRepository {
    get(id: number): Message[] {
        const stmt = database.db.prepare<number, Message>('SELECT * FROM messages WHERE conversationId = ? ORDER BY id')
        return stmt.all(id)
    }

    add(id: number, role: "user" | "system" | "assistant", message: string): void {
        const stmt = database.db.prepare<[number, "user" | "system" | "assistant", string]>('INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?) RETURNING *')
        stmt.run(id, role, message);
    }
}
