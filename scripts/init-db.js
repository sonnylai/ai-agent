import fs from "fs";
import { Client } from "pg";

const sql = fs.readFileSync("./schema/schema.sql", "utf8");

async function main() {
  //const client = new Client({
  //  connectionString: process.env.DATABASE_URL
  //});
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'ai_agent_demo',
  password: 'admin',
  port: 5432,
});

  try {
  
    await client.connect();
    console.log("Connected to DB!");

    await client.query(sql);
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("❌ Database init error:", err);
  } finally {
    await client.end();
  }
}

main();
