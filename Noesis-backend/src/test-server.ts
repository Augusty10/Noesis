import express from "express";
import { db } from "./lib/db";

const app = express();
console.log("Express app created");

app.get("/test", async (req, res) => {
  console.log("Received /test request");
  try {
    const notebooks = await db.notebook.findMany();
    console.log("Notebooks fetched:", notebooks);
    res.json(notebooks);
  } catch (err: any) {
    console.error("Error fetching notebooks:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5001, () => {
  console.log("Test server listening on port 5001");
});
