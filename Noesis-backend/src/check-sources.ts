import { db } from "./lib/db";

async function main() {
  const sources = await db.source.findMany({
    orderBy: { createdAt: "desc" },
  });
  console.log("=== Sources Status ===");
  for (const s of sources) {
    console.log(`[${s.type}] Status: ${s.status} | Title: ${s.title}`);
    console.log(`  URL: ${s.originalUrl}`);
    if (s.errorMessage) {
      console.log(`  Error: ${s.errorMessage}`);
    }
  }
}

main()
  .catch((e) => console.error(e));
