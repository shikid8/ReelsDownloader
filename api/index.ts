import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import downloadRouter from "../server/routes/download";
import proxyRouter from "../server/routes/proxy";
import batchRouter from "../server/routes/batch";

dotenv.config();

const app = express();

/* ── Middleware ──────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Static Files ────────────────────────────────────────────────────── */
const publicDir = path.resolve(process.cwd(), "public");
app.use(express.static(publicDir));

/* ── API Routes ──────────────────────────────────────────────────────── */
app.use("/api/download", downloadRouter);
app.use("/api/proxy", proxyRouter);
app.use("/api/batch", batchRouter);

/* ── SPA Fallback ────────────────────────────────────────────────────── */
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
