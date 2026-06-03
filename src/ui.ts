import type { DownloadResponse, BatchResponse, BatchItem } from "./types";

/* ── Element References ────────────────────────────────────────────────── */
export const getEl = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

export const urlInput            = () => getEl<HTMLInputElement>("url-input");
export const downloadBtn         = () => getEl<HTMLButtonElement>("download-btn");
export const pasteBtn            = () => getEl<HTMLButtonElement>("paste-btn");
export const statusSection       = () => getEl<HTMLElement>("status-section");
export const resultSection       = () => getEl<HTMLElement>("result-section");
export const errorSection        = () => getEl<HTMLElement>("error-section");
export const getBatchTextarea    = () => getEl<HTMLTextAreaElement>("batch-textarea");
export const addUrlBtn           = () => getEl<HTMLButtonElement>("add-url-btn");
export const batchDownloadAllBtn = () => getEl<HTMLButtonElement>("batch-download-all");

/* ── Mode Toggle ───────────────────────────────────────────────────────── */
export function setMode(mode: "single" | "batch"): void {
  getEl("single-panel").classList.toggle("hidden", mode !== "single");
  getEl("batch-panel").classList.toggle("hidden", mode !== "batch");
  getEl("mode-single").classList.toggle("active", mode === "single");
  getEl("mode-batch").classList.toggle("active", mode === "batch");
  getEl("batch-results-section").classList.add("hidden");
  errorSection().classList.add("hidden");
  closeModal();
}

/* ── Single Mode State ─────────────────────────────────────────────────── */
export function setLoading(loading: boolean): void {
  const btn = downloadBtn();
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner"></span> Memproses...`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
       </svg> Unduh Reels`;

  statusSection().classList.toggle("hidden", !loading);
  if (loading) {
    resultSection().classList.add("hidden");
    errorSection().classList.add("hidden");
  }
}

export function showResult(data: DownloadResponse): void {
  const section = resultSection();
  const preview = getEl<HTMLElement>("result-preview");
  const caption = getEl<HTMLElement>("result-caption");
  const dlBtn   = getEl<HTMLAnchorElement>("result-download");

  // Build proxy URL for video playback
  const proxyUrl = data.downloadUrl
    ? `/api/proxy?url=${encodeURIComponent(data.downloadUrl)}&filename=${encodeURIComponent(data.filename ?? "reel.mp4")}`
    : "";

  if (data.thumbnail || proxyUrl) {
    preview.innerHTML = `
      <div class="video-preview-wrapper" data-proxy="${proxyUrl}">
        ${data.thumbnail
          ? `<img class="result-thumbnail" src="${data.thumbnail}" alt="Thumbnail video" />`
          : `<div class="result-thumbnail no-thumb">🎬</div>`
        }
        ${proxyUrl ? `
          <button class="play-overlay" aria-label="Putar video">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>` : ""}
      </div>`;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }

  caption.textContent = data.caption ?? "";
  dlBtn.dataset["filename"] = data.filename ?? "reels.mp4";
  dlBtn.dataset["url"]      = data.downloadUrl ?? "";

  section.classList.remove("hidden");
  statusSection().classList.add("hidden");
}

export function showError(message: string): void {
  getEl<HTMLElement>("error-message").textContent = message;
  errorSection().classList.remove("hidden");
  statusSection().classList.add("hidden");
}

export function clearAll(): void {
  resultSection().classList.add("hidden");
  errorSection().classList.add("hidden");
  statusSection().classList.add("hidden");
  getEl("batch-results-section").classList.add("hidden");
  closeModal();
}

/* ── Video Preview: inline swap (single result) ────────────────────────── */
export function activateInlinePlayer(wrapper: HTMLElement): void {
  const proxyUrl = wrapper.dataset["proxy"] ?? "";
  if (!proxyUrl) return;

  wrapper.innerHTML = `
    <video
      class="result-video"
      src="${proxyUrl}"
      controls
      autoplay
      playsinline
      preload="auto"
    ></video>`;
}

/* ── Video Modal (batch thumbnails) ────────────────────────────────────── */
export function openModal(proxyUrl: string, caption: string): void {
  const modal   = getEl("video-modal");
  const videoEl = getEl<HTMLVideoElement>("modal-video");
  const capEl   = getEl<HTMLElement>("modal-caption");

  videoEl.src = proxyUrl;
  capEl.textContent = caption;
  modal.classList.remove("hidden");
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  videoEl.play().catch(() => {/* autoplay blocked — user can click play */});
}

export function closeModal(): void {
  const modal   = getEl("video-modal");
  const videoEl = getEl<HTMLVideoElement>("modal-video");
  if (!modal) return;
  videoEl.pause();
  videoEl.src = "";
  modal.classList.remove("open");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ── Batch Mode State ──────────────────────────────────────────────────── */
export function setBatchLoading(loading: boolean, total: number): void {
  const btn = getEl<HTMLButtonElement>("batch-download-btn");
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner"></span> Memproses ${total} link...`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
       </svg> Proses Semua Link`;

  errorSection().classList.add("hidden");
  if (loading) getEl("batch-results-section").classList.add("hidden");
}

export function renderBatchResults(response: BatchResponse): void {
  const section = getEl("batch-results-section");
  const list    = getEl("batch-results-list");
  const summary = getEl("batch-summary");

  summary.innerHTML =
    `<span class="summary-total">📋 ${response.total} Link</span>` +
    `<span class="summary-ok">✅ ${response.succeeded} Berhasil</span>` +
    (response.failed > 0 ? `<span class="summary-err">❌ ${response.failed} Gagal</span>` : "");

  list.innerHTML = response.results
    .map((item, i) => renderBatchItem(item, i))
    .join("");

  section.classList.remove("hidden");
}

function renderBatchItem(item: BatchItem, index: number): string {
  const shortUrl = item.url.replace("https://www.instagram.com/", "instagram.com/").slice(0, 50);

  if (!item.success) {
    return `
      <div class="batch-item error">
        <div class="batch-item-num">${index + 1}</div>
        <div class="batch-item-info">
          <span class="batch-item-url" title="${item.url}">${shortUrl}</span>
          <span class="batch-item-err">⚠️ ${item.message ?? "Gagal"}</span>
        </div>
      </div>`;
  }

  const caption = item.caption
    ? item.caption.slice(0, 60) + (item.caption.length > 60 ? "…" : "")
    : item.filename ?? "";

  const proxyUrl = item.downloadUrl
    ? `/api/proxy?url=${encodeURIComponent(item.downloadUrl)}&filename=${encodeURIComponent(item.filename ?? "reel.mp4")}`
    : "";

  return `
    <div class="batch-item success"
         data-url="${item.downloadUrl ?? ""}"
         data-proxy="${proxyUrl}"
         data-caption="${caption}"
         data-filename="${item.filename ?? "reel.mp4"}">
      <div class="batch-item-num">${index + 1}</div>
      <div class="batch-thumb-wrap" title="Putar video">
        ${item.thumbnail
          ? `<img class="batch-item-thumb" src="${item.thumbnail}" alt="thumb" />`
          : `<div class="batch-item-thumb-placeholder">🎬</div>`
        }
        ${proxyUrl ? `
          <div class="batch-play-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </div>` : ""}
      </div>
      <div class="batch-item-info">
        <span class="batch-item-url" title="${item.url}">${shortUrl}</span>
        <span class="batch-item-caption">${caption}</span>
      </div>
      <button class="batch-item-dl" title="Unduh video ini">⬇️</button>
    </div>`;
}

export function updateBatchDownloadAll(successItems: BatchItem[]): void {
  const btn = batchDownloadAllBtn();
  if (successItems.length === 0) {
    btn.classList.add("hidden");
    return;
  }
  btn.classList.remove("hidden");
  btn.textContent = `⬇️ Unduh Semua (${successItems.length})`;
}
