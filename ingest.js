import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const DATA_DIR = path.resolve("./data");
const VECTOR_FILE = process.env.VECTORSTORE_FILE || "./vectorstore.json";


if (!OPENAI_API_KEY) {
  console.error("Please set OPENAI_API_KEY in .env");
  process.exit(1);
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

async function listDataFiles() {
  const files = await fs.readdir(DATA_DIR);
  return files.filter((f) => f.endsWith(".json") || f.endsWith(".md"));
}

async function loadChunk(file) {
  const content = await fs.readFile(path.join(DATA_DIR, file), "utf8");
  if (file.endsWith(".json")) {
    return JSON.parse(content);
  } else {
    // for .md files we assume the whole content is the text field
    return {
      id: path.basename(file, ".md"),
      type: "doc",
      title: path.basename(file),
      text: content
    };
  }
}

async function embedText(text) {
  // create embedding for given text
  const resp = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text
  });
  return resp.data[0].embedding;
}

// simple helper for cosine similarity
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function norm(a) {
  return Math.sqrt(dot(a, a));
}

async function main() {
  const files = await listDataFiles();
  console.log("Found files:", files);

  const store = [];

  for (const f of files) {
    const chunk = await loadChunk(f);
    console.log("Embedding:", chunk.id || f);
    const emb = await embedText(chunk.text);
    store.push({
      id: chunk.id,
      type: chunk.type || "doc",
      title: chunk.title || "",
      text: chunk.text,
      embedding: emb
    });
  }

  await fs.writeFile(VECTOR_FILE, JSON.stringify(store, null, 2));
  console.log("Vector store saved to", VECTOR_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
