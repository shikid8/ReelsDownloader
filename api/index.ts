import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import downloadRouter from "../server/routes/download";
import proxyRouter from "../server/routes/proxy";
import batchRouter from "../server/routes/batch";

// Load env vars — Vercel injects them automatically via dashboard settings
dotenv.config();

const app = express();

/* ── Middleware ──────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── API Routes ──────────────────────────────────────────────────────── */
// Static files are handled by Vercel (outputDirectory: "public")
// Only API routes are needed here
app.use("/api/download", downloadRouter);
app.use("/api/proxy", proxyRouter);
app.use("/api/batch", batchRouter);

// Export app — Vercel's @vercel/node runtime wraps this as a serverless handler
export default app;
