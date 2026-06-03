import type { DownloadResponse, BatchResponse } from "./types";

const API_BASE = "/api";

export async function fetchVideoInfo(url: string): Promise<DownloadResponse> {
  try {
    const res = await fetch(`${API_BASE}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: (err as DownloadResponse).message ?? `Server error (${res.status}). Pastikan cookies Instagram valid di server.`,
      };
    }

    return res.json() as Promise<DownloadResponse>;
  } catch (e) {
    const isOffline = !navigator.onLine || (e instanceof TypeError && e.message.includes("fetch"));
    return {
      success: false,
      message: isOffline
        ? "Tidak ada koneksi internet. Periksa jaringan kamu."
        : "Gagal menghubungi server. Coba lagi beberapa saat.",
    };
  }
}

export async function fetchBatchInfo(urls: string[]): Promise<BatchResponse> {
  try {
    const res = await fetch(`${API_BASE}/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        total: urls.length,
        succeeded: 0,
        failed: urls.length,
        results: [],
        message: (err as BatchResponse).message ?? `Server error (${res.status}).`,
      };
    }

    return res.json() as Promise<BatchResponse>;
  } catch (e) {
    const isOffline = !navigator.onLine || (e instanceof TypeError && e.message.includes("fetch"));
    return {
      success: false,
      total: urls.length,
      succeeded: 0,
      failed: urls.length,
      results: [],
      message: isOffline
        ? "Tidak ada koneksi internet."
        : "Gagal menghubungi server. Coba lagi beberapa saat.",
    };
  }
}

/**
 * Downloads a video by routing through the server proxy.
 * Direct browser fetch from Instagram CDN is blocked by CORS.
 */
export function triggerDownload(cdnUrl: string, filename: string): void {
  const proxyUrl =
    `${API_BASE}/proxy?` +
    `url=${encodeURIComponent(cdnUrl)}&` +
    `filename=${encodeURIComponent(filename)}`;

  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Trigger multiple downloads sequentially with a small delay between each */
export async function triggerBatchDownload(
  items: Array<{ downloadUrl: string; filename: string }>
): Promise<void> {
  for (const item of items) {
    triggerDownload(item.downloadUrl, item.filename);
    // Small delay to prevent browser from blocking multiple simultaneous downloads
    await new Promise((r) => setTimeout(r, 600));
  }
}
