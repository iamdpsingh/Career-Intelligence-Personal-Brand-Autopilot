import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * The core database connection instance.
 * It uses a connection pool for efficiency in serverless environments,
 * though Vercel Edge functions might require a different driver (like Neon HTTP)
 * if deployed to the Edge runtime. We are using standard node-postgres for Node runtimes.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
