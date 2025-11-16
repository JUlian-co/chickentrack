import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./configs/db/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:jejbos-murvaP-1vivte@db.vvklrsdxblmrlovunsde.supabase.co:5432/postgres",
  },
  schemaFilter: ["public"],
});
