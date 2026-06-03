import { Router, Request, Response } from "express";
import { fetchInstagramVideo } from "../utils/fetcher";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    res.status(400).json({ success: false, message: "Parameter 'url' tidak boleh kosong." });
    return;
  }

  const isValidUrl = /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?/.test(url);
  if (!isValidUrl) {
    res.status(400).json({ success: false, message: "URL Instagram tidak valid." });
    return;
  }

  try {
    const videoInfo = await fetchInstagramVideo(url);
    res.json({
      success: true,
      ...videoInfo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
    res.status(500).json({ success: false, message });
  }
});

export default router;
