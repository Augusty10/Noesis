import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL") || "postgresql://username:password@localhost:5432/neondb?sslmode=require",
  },
});
