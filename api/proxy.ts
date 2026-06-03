import axios from "axios";

/** GET /api/proxy?url=<cdn_url>&filename=<name.mp4> — proxy video dari Instagram CDN */
export default async function handler(req: any, res: any) {
  const { url, filename } = req.query as { url?: string; filename?: string };

  if (!url) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Parameter 'url' wajib diisi." }));
    return;
  }

  // Hanya izinkan Instagram/Facebook CDN URLs
  const allowedHosts = ["instagram.com", "cdninstagram.com", "fbcdn.net", "fbsbx.com"];
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "URL tidak valid." }));
    return;
  }

  const isAllowed = allowedHosts.some((host) => parsedUrl.hostname.endsWith(host));
  if (!isAllowed) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Host tidak diizinkan." }));
    return;
  }

  const safeFilename = (filename ?? "reel.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    // Download as buffer (streaming not supported well in Vercel serverless)
    const upstream = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: 25000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "identity",
      },
    });

    const contentType = upstream.headers["content-type"] ?? "video/mp4";
    const buffer = Buffer.from(upstream.data);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "no-store");
    res.end(buffer);
  } catch (err: unknown) {
    console.error("[proxy] Error:", err instanceof Error ? err.message : err);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Gagal mengambil video dari CDN." }));
  }
}
