/**
 * api/index.ts — sudah tidak digunakan sebagai Express wrapper.
 * Setiap endpoint sekarang memiliki file handler terpisah:
 *   - api/download.ts  → POST /api/download
 *   - api/batch.ts     → POST /api/batch
 *   - api/proxy.ts     → GET  /api/proxy
 *   - api/health.ts    → GET  /api/health
 */
export default function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ message: "ReelsDownloader API", version: "1.0.0" }));
}
