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

/* ── Health / Debug Endpoint ─────────────────────────────────────────── */
// Hit /api/health to verify env vars are loaded correctly on Vercel
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    env: {
      IG_SESSION_ID: process.env["IG_SESSION_ID"] ? "✅ SET" : "❌ MISSING",
      IG_CSRF_TOKEN: process.env["IG_CSRF_TOKEN"] ? "✅ SET" : "❌ MISSING",
      IG_DS_USER_ID: process.env["IG_DS_USER_ID"] ? "✅ SET" : "❌ MISSING",
      IG_APP_ID:     process.env["IG_APP_ID"]     ? "✅ SET" : "❌ MISSING",
    },
  });
});

/* ── API Routes ──────────────────────────────────────────────────────── */
// Static files are handled by Vercel (outputDirectory: "public")
app.use("/api/download", downloadRouter);
app.use("/api/proxy", proxyRouter);
app.use("/api/batch", batchRouter);

// Export app — Vercel's @vercel/node runtime wraps this as a serverless handler
export default app;
