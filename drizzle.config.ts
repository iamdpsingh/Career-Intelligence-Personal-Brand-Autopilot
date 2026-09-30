import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file during local development
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./providers/db/schema.ts",
  out: "./providers/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL?.replace('file:', '').replace('sqlite://', '') || "./local.db",
  },
  verbose: true,
  strict: false,
});
