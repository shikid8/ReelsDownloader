import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import downloadRouter from "./routes/download";
import proxyRouter from "./routes/proxy";
import batchRouter from "./routes/batch";

// Resolve .env from project root — works in both ts-node-dev (server/) and compiled (dist/server/)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env["PORT"] ?? 3000;

/* ── Middleware ──────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Static Files ────────────────────────────────────────────────────── */
// Works for both ts-node-dev (__dirname = server/) and compiled (__dirname = dist/server/)
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));


/* ── API Routes ──────────────────────────────────────────────────────── */
app.use("/api/download", downloadRouter);
app.use("/api/proxy", proxyRouter);
app.use("/api/batch", batchRouter);

/* ── SPA Fallback ────────────────────────────────────────────────────── */
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

/* ── Start ───────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Reels Installer berjalan di: http://localhost:${PORT}\n`);
});
