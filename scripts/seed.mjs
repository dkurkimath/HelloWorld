import { readFileSync } from "fs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = readFileSync(new URL("../db/seed.sql", import.meta.url), "utf-8");

try {
  await pool.query(sql);
  console.log("✓ seed data loaded");
} catch (e) {
  console.error("Seed failed:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
