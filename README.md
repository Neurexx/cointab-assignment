# Tech Stack

Frontend: Next.js<br>
Backend: Express<br>
Database: Postgres<br>
LLM Provider: Ollama 

# Setup Instructions

Install ollama
```bash
ollama pull gemma3:1b
ollama serve
```
```bash
git clone https://github.com/Neurexx/cointab-assignment.git
cd cointab-assignment
```
## Frontend
```bash
cd cointab
npm i
npm run dev
```
## Backend
```bash
cd cointab-backend
npm i
npm run dev
```
## Database
Make sure Docker is up and running
```bash
docker run --name cointab -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
docker exec -it cointab psql -U postgres -d postgres
```

```bash
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
```

You're all set!

