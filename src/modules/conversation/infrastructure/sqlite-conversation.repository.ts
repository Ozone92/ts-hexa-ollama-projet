import type { ConversationRepository } from "../application/ports/conversation.repository.js";
import type Conversation from "../domain/conversation.entity.js";
import database from '@shared/infrastructure/persistance/database.js'

export class SqliteConversationRepository implements ConversationRepository {
    create(name: string): Conversation | undefined {
        const stmt = database.db.prepare<string, Conversation>('INSERT INTO conversations (title) VALUES (?) RETURNING *')
        return stmt.get(name);
    }

    all(): Conversation[] {
        const stmt = database.db.prepare<undefined[], Conversation>(`
            SELECT c.id, c.title, c.createdAt,
                    COUNT(m.id) AS messageCount
            FROM conversations c
            LEFT JOIN messages m ON m.conversationId = c.id
            GROUP BY c.id ORDER BY c.createdAt DESC
        `);

        return stmt.all();
    }
    
    get(id: number) {
        const stmt = database.db.prepare<number, Conversation>('SELECT * FROM conversations WHERE id = ?')
        return stmt.get(id);
    }

    delete(id: number): boolean {
        const stmt = database.db.prepare<number>('DELETE FROM conversations WHERE id = ?')
        const response = stmt.run(id)
        return response.changes > 0
    }

    update(id: number, title: string): void {
        const stmt = database.db.prepare<[number, string]>('UPDATE conversations SET title = ? WHERE id = ?')
        stmt.run(id, title);
    }
}
