import fp from 'fastify-plugin'
import Database from 'better-sqlite3'
import sqlite from 'better-sqlite3'
import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'

const DB_PATH = process.env.DB_PATH ?? join(process.cwd(), 'data.db')

declare module 'fastify' {
    interface FastifyInstance {
        db: sqlite.Database,
        stmts: {
          createConv: sqlite.Statement,
          listConvs: sqlite.Statement,
          getConv: sqlite.Statement<number, {id: number, title: string, createdAt: string}>,
          deleteConv: sqlite.Statement<number>,
          getMessages: sqlite.Statement<number, {id: number, conversationId: number, role: 'user'|'assistant'|'system', content: string, createdAt: string}>,
          addMessage: sqlite.Statement,
        }
    }
}

async function dbPlugin(app: FastifyInstance) {
  const db = new Database(DB_PATH)

  // WAL : lectures et écritures simultanées sans conflit
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT    NOT NULL,
      createdAt TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role           TEXT    NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content        TEXT    NOT NULL,
      createdAt      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `)

  // Préparer les requêtes une seule fois (performances + sécurité)
  const stmts = {
    createConv:   db.prepare('INSERT INTO conversations (title) VALUES (?) RETURNING *'),
    listConvs:    db.prepare(`
      SELECT c.id, c.title, c.createdAt,
             COUNT(m.id) AS messageCount
      FROM conversations c
      LEFT JOIN messages m ON m.conversationId = c.id
      GROUP BY c.id ORDER BY c.createdAt DESC
    `),
    getConv:      db.prepare<number, {id: number, title: string, createdAt: string}>('SELECT * FROM conversations WHERE id = ?'),
    deleteConv:   db.prepare<number>('DELETE FROM conversations WHERE id = ?'),
    getMessages:  db.prepare<number, {id: number, conversationId: number, role: 'user'|'assistant'|'system', content: string, createdAt: string}>('SELECT * FROM messages WHERE conversationId = ? ORDER BY id'),
    addMessage:   db.prepare('INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?) RETURNING *'),
  }

  app.decorate('db', db)
  app.decorate('stmts', stmts)

  // Fermeture propre de la DB à l'arrêt du serveur
  app.addHook('onClose', () => db.close())
}

// fp() = fastify-plugin : le décorateur est visible en dehors de l'encapsulation
export default fp(dbPlugin, { name: 'db' })
