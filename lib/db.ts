import { Pool } from "pg";

// A single shared connection pool. On serverless hosts (Vercel), keep the
// pool small — Postgres providers like Neon/Supabase cap concurrent
// connections, and each serverless invocation can spin up its own pool.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    ssl: process.env.DATABASE_URL?.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (!globalForPg.pgPool) globalForPg.pgPool = pool;

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
