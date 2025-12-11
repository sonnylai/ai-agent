import dotenv from "dotenv";
dotenv.config();

import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import OpenAI from "openai";
import { loadVectorStore, topKSimilar } from "./vector-utils.js";
import { runQuery } from "./db.js";
import { isSafeSelect } from "./sql-sanitizer.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TOP_K = parseInt(process.env.TOP_K || "4", 10);
const MAX_ROWS = parseInt(process.env.SQL_MAX_ROWS || "200", 10);

function buildPrompt(retrievedChunks, userQuestion) {
  const schemaContext = retrievedChunks.map((c) => `---\nSource: ${c.id}\n${c.text}`).join("\n\n");
  const instructions = `
You are an assistant that transforms a user's natural language request into a safe, read-only SQL query for a Postgres database.
Guidelines:
- Use only the tables/columns in the schema context below.
- Only generate a single SELECT statement. Do NOT generate INSERT/UPDATE/DELETE or DDL.
- Use created_at as the order date when appropriate.
- Limit results to at most ${MAX_ROWS} rows by adding "LIMIT ${MAX_ROWS}" if not present.
- If user asks for aggregates or groupings, generate an appropriate GROUP BY.
- Return only the SQL query as a JSON object with keys: {"sql": "<SQL>"} and nothing else.
If you cannot confidently answer, return {"sql": ""}.
Schema and docs:
${schemaContext}

User question: ${userQuestion}
`;
  return instructions;
}

async function embedText(text) {
  const resp = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text
  });
  return resp.data[0].embedding;
}

async function generateSQL(prompt) {
  const resp = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800
  });
  const text = resp.choices?.[0]?.message?.content || "";
  // Try to parse JSON result
  try {
    const parsed = JSON.parse(text);
    return parsed.sql || "";
  } catch (e) {
    // fallback: try to extract SQL from text (not ideal)
    const m = text.match(/```sql([\s\S]*?)```/i);
    if (m) return m[1].trim();
    // otherwise return whole text
    return text.trim();
  }
}

async function startCli() {
  const rl = readline.createInterface({ input, output });
  console.log("Loading vector store...");
  const store = await loadVectorStore();
  while (true) {
    const q = await rl.question("Enter natural language question (or 'quit'): ");
    if (!q || q.trim().toLowerCase() === "quit") break;

    // embed query & retrieve
    const qEmb = await embedText(q);
    const retrieved = topKSimilar(store, qEmb, TOP_K);
    console.log("Retrieved sources:", retrieved.map((r) => r.id).join(", "));

    // build prompt
    const prompt = buildPrompt(retrieved, q);

    // ask LLM for SQL
    console.log("Generating SQL...");
    const sql = await generateSQL(prompt);
    
    if (!sql) {
      console.log("LLM declined to produce SQL or couldn't produce one confidently.");
      continue;
    }

    // ensure LIMIT is present
    let finalSql = sql;
    if (!/limit\s+\d+/i.test(finalSql)) {
      finalSql = `${finalSql.trim()} LIMIT ${MAX_ROWS}`;
    }

    // sanitize
    if (!isSafeSelect(finalSql)) {
      console.log("Generated SQL failed safety checks. Aborting execution.");
      console.log(finalSql);
      continue;
    }

    console.log("Executing SQL:\n", finalSql);
    try {
      const rows = await runQuery(finalSql);
      console.log("Result rows:", rows.length);
      console.table(rows.slice(0, 50));
    } catch (err) {
      console.error("Error executing SQL:", err.message || err);
    }
  }
  rl.close();
  console.log("Bye");
}

startCli().catch((e) => {
  console.error("Fatal error", e);
  process.exit(1);
});
