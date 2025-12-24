# Empty Project Workspace

How to run (step-by-step)

1. Node version: use Node.js 18+.

2. git init and paste files above, or create manually.
 
3. npm install

4. Create .env with your OPENAI_API_KEY and DATABASE_URL (Postgres) values.

DATABASE_URL format: postgresql://user:password@host:port/database

5. Put your schema/docs into /data as shown (one file per chunk). You can add more JSON/MD files — ingest.js handles them.

6. Run ingestion:
npm run ingest
This writes vectorstore.json with embeddings.

7. Run the agent CLI:
npm run dev
Type questions like:

Show me all customers who ordered more than $500 last month

List refunded orders in August 2025

8. The agent will:

retrieve relevant schema/docs,

ask the LLM to produce a read-only SQL query,

sanitize it,

execute it and print results.
