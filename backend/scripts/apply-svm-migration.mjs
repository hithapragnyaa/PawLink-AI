import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(scriptDir, "../.env") });
import pg from "pg";
import { readFile } from "node:fs/promises";

const { Client } = pg;
const sql = await readFile(
  new URL("../../database/002_svm_prediction_support.sql", import.meta.url),
  "utf8"
);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log("Connected to PostgreSQL.");

  await client.query(sql);
  console.log("Migration executed successfully.");

  const result = await client.query(`
    SELECT
      e.enumlabel AS priority,
      a.attnotnull AS confidence_required
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_class c ON c.relname = 'ml_predictions'
    JOIN pg_attribute a
      ON a.attrelid = c.oid
     AND a.attname = 'confidence_score'
    WHERE t.typname = 'rescue_priority'
    ORDER BY e.enumsortorder
  `);

  console.table(result.rows);
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

