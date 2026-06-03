import { fetchVideoInfo, fetchBatchInfo, triggerDownload, triggerBatchDownload } from "./api";
import type { BatchItem } from "./types";
import {
  urlInput, downloadBtn, pasteBtn,
  setLoading, showResult, showError, clearAll, getEl,
  setMode, setBatchLoading, renderBatchResults, updateBatchDownloadAll,
  getBatchTextarea, addUrlBtn, batchDownloadAllBtn,
  activateInlinePlayer, openModal, closeModal,
} from "./ui";

/* ── Mode Toggle ───────────────────────────────────────────────────────── */
let currentMode: "single" | "batch" = "single";

getEl("mode-single").addEventListener("click", () => {
  currentMode = "single";
  setMode("single");
  clearAll();
});

getEl("mode-batch").addEventListener("click", () => {
  currentMode = "batch";
  setMode("batch");
  clearAll();
});

/* ── Single Mode ───────────────────────────────────────────────────────── */
pasteBtn().addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    urlInput().value = text;
  } catch {
    urlInput().focus();
  }
});

urlInput().addEventListener("input", () => { clearAll(); });

downloadBtn().addEventListener("click", async () => {
  const url = urlInput().value.trim();
  if (!url) { showError("Masukkan link Instagram Reels terlebih dahulu."); return; }
  if (!isValidInstagramUrl(url)) { showError("Link tidak valid. Gunakan URL Instagram Reels yang benar."); return; }

  setLoading(true);
  const data = await fetchVideoInfo(url);
  setLoading(false);

  if (!data.success) { showError(data.message ?? "Terjadi kesalahan."); return; }
  showResult(data);
});

getEl("result-download").addEventListener("click", (e) => {
  e.preventDefault();
  const btn = e.currentTarget as HTMLAnchorElement;
  const url      = btn.dataset["url"] ?? "";
  const filename = btn.dataset["filename"] ?? "reels.mp4";
  if (!url) return;

  btn.textContent = "⏳ Mengunduh...";
  triggerDownload(url, filename);
  setTimeout(() => { btn.textContent = "⬇️ Simpan Video"; }, 3000);
});

/* ── Batch Mode ────────────────────────────────────────────────────────── */

// Add URL rows dynamically
addUrlBtn().addEventListener("click", () => {
  const textarea = getBatchTextarea();
  const lines = textarea.value.split("\n").filter(Boolean);
  if (lines.length >= 20) { showError("Maksimum 20 link."); return; }
  textarea.value += (textarea.value.endsWith("\n") || textarea.value === "" ? "" : "\n");
  textarea.focus();
  const counter = getEl("url-count");
  updateUrlCounter(counter, textarea);
});

getBatchTextarea().addEventListener("input", () => {
  const counter = getEl("url-count");
  updateUrlCounter(counter, getBatchTextarea());
  clearAll();
});

function updateUrlCounter(counter: HTMLElement, textarea: HTMLTextAreaElement): void {
  const count = textarea.value.split("\n").filter((l) => l.trim()).length;
  counter.textContent = `${count}/20 link`;
  counter.className = "url-counter" + (count >= 20 ? " at-limit" : "");
}

// Process batch
getEl("batch-download-btn").addEventListener("click", async () => {
  const textarea = getBatchTextarea();
  const urls = textarea.value
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  if (urls.length === 0) { showError("Masukkan minimal 1 link Instagram Reels."); return; }
  if (urls.length > 20)  { showError("Maksimum 20 link sekaligus."); return; }

  setBatchLoading(true, urls.length);
  const response = await fetchBatchInfo(urls);
  setBatchLoading(false, urls.length);

  if (!response.success && response.results.length === 0) {
    showError(response.message ?? "Gagal memproses batch.");
    return;
  }

  renderBatchResults(response);
  updateBatchDownloadAll(response.results.filter((r) => r.success));
});

// Download All button
batchDownloadAllBtn().addEventListener("click", async () => {
  const btn = batchDownloadAllBtn();
  const successItems = Array.from(
    document.querySelectorAll<HTMLElement>(".batch-item.success")
  ).map((el) => ({
    downloadUrl: el.dataset["url"] ?? "",
    filename:    el.dataset["filename"] ?? "reel.mp4",
  })).filter((i) => i.downloadUrl);

  if (successItems.length === 0) return;

  btn.textContent = `⏳ Mengunduh ${successItems.length} video...`;
  btn.setAttribute("disabled", "true");

  await triggerBatchDownload(successItems);

  btn.textContent = `✅ Selesai! ${successItems.length} video diunduh`;
  setTimeout(() => {
    btn.textContent = `⬇️ Unduh Semua (${successItems.length})`;
    btn.removeAttribute("disabled");
  }, 4000);
});

// Individual download buttons (delegated)
document.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>(".batch-item-dl");
  if (!target) return;
  const item = target.closest<HTMLElement>(".batch-item");
  if (!item) return;

  const url      = item.dataset["url"] ?? "";
  const filename = item.dataset["filename"] ?? "reel.mp4";
  if (!url) return;

  target.textContent = "⏳";
  triggerDownload(url, filename);
  setTimeout(() => { target.textContent = "⬇️"; }, 3000);
});

/* ── Video Preview ─────────────────────────────────────────────── */

// Single result: click play overlay → swap to inline video
document.addEventListener("click", (e) => {
  const playBtn = (e.target as HTMLElement).closest<HTMLElement>(".play-overlay");
  if (!playBtn) return;
  const wrapper = playBtn.closest<HTMLElement>(".video-preview-wrapper");
  if (wrapper) activateInlinePlayer(wrapper);
});

// Batch: click thumbnail wrapper → open modal
document.addEventListener("click", (e) => {
  const thumbWrap = (e.target as HTMLElement).closest<HTMLElement>(".batch-thumb-wrap");
  if (!thumbWrap) return;
  const item = thumbWrap.closest<HTMLElement>(".batch-item");
  if (!item) return;
  const proxyUrl = item.dataset["proxy"] ?? "";
  const caption  = item.dataset["caption"] ?? "";
  if (proxyUrl) openModal(proxyUrl, caption);
});

// Modal: close on backdrop click
getEl("video-modal").addEventListener("click", (e) => {
  if (e.target === getEl("video-modal")) closeModal();
});

// Modal: close on X button
getEl("modal-close").addEventListener("click", () => closeModal());

// Modal: close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ── Helpers ───────────────────────────────────────────────────────────── */
function isValidInstagramUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?/.test(url);
}
