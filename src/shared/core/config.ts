import { join } from "path";

const config = {
    OLLAMA_URL: process.env.OLLAMA_URL ?? 'http://localhost:11434',
    MODEL: process.env.OLLAMA_MODEL ?? 'llama3.2',
    DB_PATH: process.env.DB_PATH ?? join(process.cwd(), 'data.db')
}

export default config;
