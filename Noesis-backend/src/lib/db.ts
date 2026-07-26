import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Set the WebSocket constructor for Neon serverless pooler connection
neonConfig.webSocketConstructor = ws;

declare global {
  var prisma: PrismaClient | undefined;
  var prismaConnStr: string | undefined;
}

let prismaClientInstance: PrismaClient;

let connectionString = (process.env.DATABASE_URL || "").trim();
if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
  connectionString = connectionString.slice(1, -1);
}
if (connectionString.startsWith("'") && connectionString.endsWith("'")) {
  connectionString = connectionString.slice(1, -1);
}

const isPlaceholder = !connectionString || connectionString.includes("placeholder") || connectionString.includes("your-neon-db-hostname");

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaNeon({ connectionString });
  prismaClientInstance = new PrismaClient({ adapter });
} else {
  // Recreate client if connection string changes or is not initialized
  if (!global.prisma || global.prismaConnStr !== connectionString || isPlaceholder) {
    console.log("[db.ts] Initializing PrismaClient. Connection string length:", connectionString.length);
    const conn = connectionString || "postgresql://placeholder:placeholder@localhost:5432/neondb?sslmode=require";
    const adapter = new PrismaNeon({ connectionString: conn });
    global.prisma = new PrismaClient({ adapter });
    global.prismaConnStr = connectionString;
  }
  prismaClientInstance = global.prisma;
}

// Export a Proxy to prevent stale module-caching reference issues in routes during development hot-reloads
export const db = new Proxy<PrismaClient>({} as PrismaClient, {
  get(target, prop) {
    const instance = global.prisma || prismaClientInstance;
    return (instance as any)[prop];
  }
});
