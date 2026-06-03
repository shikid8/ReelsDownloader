import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

/**
 * GET /api/proxy?url=<encoded_cdn_url>&filename=<filename.mp4>
 *
 * Proxies the video from Instagram's CDN through our server to the browser.
 * This is needed because Instagram CDN blocks direct browser requests (CORS).
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { url, filename } = req.query as { url?: string; filename?: string };

  if (!url) {
    res.status(400).json({ error: "Parameter 'url' wajib diisi." });
    return;
  }

  // Only allow Instagram/Facebook CDN URLs for security
  const allowedHosts = [
    "instagram.com",
    "cdninstagram.com",
    "fbcdn.net",
    "fbsbx.com",
  ];
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    res.status(400).json({ error: "URL tidak valid." });
    return;
  }

  const isAllowed = allowedHosts.some((host) =>
    parsedUrl.hostname.endsWith(host)
  );
  if (!isAllowed) {
    res.status(403).json({ error: "Host tidak diizinkan." });
    return;
  }

  const safeFilename = (filename ?? "reel.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    const upstream = await axios.get<NodeJS.ReadableStream>(url, {
      responseType: "stream",
      timeout: 30000,
      headers: {
        // Send a browser-like request to CDN
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "identity", // Prevent compressed stream issues
      },
    });

    // Forward relevant headers from CDN to browser
    const contentLength = upstream.headers["content-length"];
    const contentType   = upstream.headers["content-type"] ?? "video/mp4";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`
    );
    res.setHeader("Cache-Control", "no-store");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    // Stream video data directly to the browser
    upstream.data.pipe(res);

    upstream.data.on("error", (err: Error) => {
      console.error("[proxy] Stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream gagal." });
      }
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("[proxy] Axios error:", err.response?.status, err.message);
      res.status(502).json({
        error: `Gagal mengambil video dari CDN: ${err.message}`,
      });
    } else {
      res.status(500).json({ error: "Terjadi kesalahan pada proxy." });
    }
  }
});

export default router;
