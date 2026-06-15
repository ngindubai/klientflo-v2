import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env or the datasource URL from the schema, so we
// load env here and provide the connection URL for migrate/introspect.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
