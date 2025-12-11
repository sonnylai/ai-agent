import fs from "fs/promises";
import path from "path";

export async function loadVectorStore(file = process.env.VECTORSTORE_FILE || "./vectorstore.json") {
  const content = await fs.readFile(path.resolve(file), "utf8");
  return JSON.parse(content);
}

export function cosineSimilarity(a, b) {
  // assume arrays
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function topKSimilar(store, queryEmbedding, k = 4) {
  const scores = store.map((item) => {
    return { item, score: cosineSimilarity(item.embedding, queryEmbedding) };
  });
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, k).map((s) => s.item);
}
