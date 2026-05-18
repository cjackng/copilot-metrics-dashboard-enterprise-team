import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboard_auth (
      id INT PRIMARY KEY DEFAULT 1,
      password_hash VARCHAR(255),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT single_row CHECK (id = 1)
    )
  `);
}

export async function getPasswordHash(): Promise<string | null> {
  await ensureTable();
  const result = await pool.query(
    "SELECT password_hash FROM dashboard_auth WHERE id = 1"
  );
  return result.rows[0]?.password_hash ?? null;
}

export async function setPasswordHash(hash: string): Promise<void> {
  await ensureTable();
  await pool.query(
    `INSERT INTO dashboard_auth (id, password_hash, updated_at)
     VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE SET password_hash = $1, updated_at = NOW()`,
    [hash]
  );
}
