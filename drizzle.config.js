import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./configs/db/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: "YOUR_DATABASE_URL",
  },
});
