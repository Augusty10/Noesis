import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

import { Pool, Client } from "@neondatabase/serverless";

const conn = process.env.DATABASE_URL || "";
console.log("DATABASE_URL:", conn ? `${conn.slice(0, 30)}...` : "UNDEFINED");

// Let's create a Client directly
const client = new Client({ connectionString: conn });
console.log("Client config:", (client as any).config);
console.log("Client host before connect:", client.host);
console.log("Client connectionString before connect:", (client as any).connectionString);

// Let's create a Pool
const pool = new Pool({ connectionString: conn });
console.log("Pool options:", (pool as any).options);

const poolClient = new (pool as any).Client((pool as any).options);
console.log("Pool Client config:", (poolClient as any).config);
console.log("Pool Client host:", poolClient.host);
console.log("Pool Client connectionString:", (poolClient as any).connectionString);
console.log("Pool Client host !== undefined:", poolClient.host !== undefined);
console.log("Pool Client connectionString !== undefined:", (poolClient as any).connectionString !== undefined);

client.connect().then(() => {
  console.log("Direct Client connected.");
  client.end();
}).catch(err => {
  console.error("Direct Client failed:", err);
});
