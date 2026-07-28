import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import notebookRouter from "./routes/notebook";
import sourcesRouter from "./routes/sources";
import queryRouter from "./routes/query";
import podcastRouter from "./routes/podcast";
import roadmapRouter from "./routes/roadmap";

const app = express();
const port = process.env.PORT || 5005;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api/notebooks", notebookRouter);
// Mount sourcesRouter at /api so it maps to:
// - /api/sources (POST, GET, DELETE)
// - /api/notebooks/:notebookId/sources (GET)
app.use("/api", sourcesRouter);
app.use("/api/query", queryRouter);
app.use("/api/podcast", podcastRouter);
app.use("/api/roadmap", roadmapRouter);

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Server Error]:", err);
  res.status(err.status || 500).json({
    message: err.message || "An internal server error occurred.",
  });
});

app.listen(port, () => {
  console.log(`[Server] Noesis backend is running on port ${port}`);
});
