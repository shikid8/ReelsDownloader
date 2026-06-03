import dotenv from "dotenv";
import { fetchInstagramVideo } from "./_fetcher";

dotenv.config();

interface BatchItem {
  url: string;
  success: boolean;
  downloadUrl?: string;
  thumbnail?: string;
  caption?: string;
  filename?: string;
  message?: string;
}

/** POST /api/batch — proses banyak URL sekaligus (maks. 20) */
export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, message: "Method not allowed." }));
    return;
  }

  let body: { urls?: unknown } = {};
  try {
    body = typeof req.body === "object" && req.body !== null
      ? req.body
      : JSON.parse(req.body || "{}");
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, message: "Request body tidak valid." }));
    return;
  }

  const { urls } = body;

  if (!Array.isArray(urls) || urls.length === 0) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({ success: false, message: "Parameter 'urls' harus berupa array dan tidak boleh kosong." })
    );
    return;
  }

  if (urls.length > 20) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, message: "Maksimum 20 link sekaligus." }));
    return;
  }

  const validUrlPattern =
    /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?/;

  const CONCURRENCY = 3; // Lower concurrency for serverless stability
  const results: BatchItem[] = new Array(urls.length);
  const queue = urls.map((url: unknown, index: number) => ({ url: String(url), index }));

  async function processChunk(chunk: typeof queue): Promise<void> {
    await Promise.all(
      chunk.map(async ({ url, index }) => {
        if (!validUrlPattern.test(url)) {
          results[index] = { url, success: false, message: "URL tidak valid." };
          return;
        }
        try {
          const info = await fetchInstagramVideo(url);
          results[index] = { url, success: true, ...info };
        } catch (err: unknown) {
          results[index] = {
            url,
            success: false,
            message: err instanceof Error ? err.message : "Gagal mengambil video.",
          };
        }
      })
    );
  }

  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    await processChunk(queue.slice(i, i + CONCURRENCY));
  }

  res.end(
    JSON.stringify({
      success: true,
      total: urls.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  );
}
