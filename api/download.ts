import dotenv from "dotenv";
import { fetchInstagramVideo } from "../server/utils/fetcher";

dotenv.config();

/** POST /api/download — ambil info video dari URL Instagram */
export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, message: "Method not allowed." }));
    return;
  }

  // Parse body (Vercel auto-parses JSON when Content-Type: application/json)
  let body: { url?: string } = {};
  try {
    body = typeof req.body === "object" && req.body !== null
      ? req.body
      : JSON.parse(req.body || "{}");
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, message: "Request body tidak valid." }));
    return;
  }

  const { url } = body;

  if (!url || typeof url !== "string") {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, message: "Parameter 'url' tidak boleh kosong." }));
    return;
  }

  const isValidUrl =
    /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?/.test(url);
  if (!isValidUrl) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, message: "URL Instagram tidak valid." }));
    return;
  }

  try {
    const videoInfo = await fetchInstagramVideo(url);
    res.end(JSON.stringify({ success: true, ...videoInfo }));
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
    console.error("[download] Error:", message);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, message }));
  }
}
