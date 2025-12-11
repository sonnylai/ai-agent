import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function runQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    console.log("👉 DB connected..");
    const res = await client.query({ text: sql, values: params });
    return res.rows;
  } finally {
    client.release();
  }
}
