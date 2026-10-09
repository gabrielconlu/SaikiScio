import { Pool } from "pg";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL to the intended PostgreSQL database before applying the SaikiScio schema.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 5000,
});

try {
  const schema = await readFile(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  await pool.query(schema);
  console.log("SaikiScio PostgreSQL schema is ready.");
} catch (error) {
  console.error("Unable to apply the SaikiScio PostgreSQL schema.", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
