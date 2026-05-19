import Database from 'better-sqlite3'
import sqlite from 'better-sqlite3'

import config from '@shared/core/config.js'

class OllamaDataBase {
    public db: sqlite.Database

    constructor() {
        this.db = new Database(config.DB_PATH)

        this.db.pragma('journal_mode = WAL')
        this.db.pragma('foreign_keys = ON')

        this.db.exec(`
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
    }
}

const dataBase = new OllamaDataBase();
export default dataBase
