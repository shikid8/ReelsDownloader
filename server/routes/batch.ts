import { Router, Request, Response } from "express";
import { fetchInstagramVideo } from "../utils/fetcher";

const router = Router();

interface BatchItem {
  url: string;
  success: boolean;
  downloadUrl?: string;
  thumbnail?: string;
  caption?: string;
  filename?: string;
  message?: string;
}

/**
 * POST /api/batch
 * Body: { urls: string[] }
 * Processes multiple Instagram URLs in parallel (max 5 concurrent).
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { urls } = req.body as { urls?: unknown };

  if (!Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ success: false, message: "Parameter 'urls' harus berupa array dan tidak boleh kosong." });
    return;
  }

  if (urls.length > 20) {
    res.status(400).json({ success: false, message: "Maksimum 20 link sekaligus." });
    return;
  }

  const validUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?/;

  // Process in parallel with concurrency limit of 5
  const CONCURRENCY = 5;
  const results: BatchItem[] = new Array(urls.length);
  const queue = urls.map((url, index) => ({ url: String(url), index }));

  async function processChunk(chunk: typeof queue): Promise<void> {
    await Promise.all(
      chunk.map(async ({ url, index }) => {
        if (!validUrlPattern.test(url)) {
          results[index] = {
            url,
            success: false,
            message: "URL tidak valid.",
          };
          return;
        }

        try {
          const info = await fetchInstagramVideo(url);
          results[index] = {
            url,
            success: true,
            ...info,
          };
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

  // Split into chunks of CONCURRENCY
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    await processChunk(queue.slice(i, i + CONCURRENCY));
  }

  res.json({
    success: true,
    total: urls.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
});

export default router;
