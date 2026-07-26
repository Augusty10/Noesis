import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Set the WebSocket constructor for Neon serverless pooler connection
neonConfig.webSocketConstructor = ws;

declare global {
  var prisma: PrismaClient | undefined;
}

let prismaClientInstance: PrismaClient;

const connectionString = process.env.DATABASE_URL || "";

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  prismaClientInstance = new PrismaClient({ adapter });
} else {
  // Use global client to avoid pool leak during development hot-reloads
  if (!global.prisma) {
    // If connection string is missing during initial CLI prisma generate steps, fallback to mock/local format to avoid constructor crash
    const conn = connectionString || "postgresql://placeholder:placeholder@localhost:5432/neondb?sslmode=require";
    const pool = new Pool({ connectionString: conn });
    const adapter = new PrismaNeon(pool);
    global.prisma = new PrismaClient({ adapter });
  }
  prismaClientInstance = global.prisma;
}

export const db = prismaClientInstance;
