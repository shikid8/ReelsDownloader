# 📥 ReelsDownloader

> Sistem web modern untuk mengunduh Instagram Reels dengan mudah menggunakan link.

![Preview](https://img.shields.io/badge/status-development-yellow)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-blue)

---

## 📌 Deskripsi

**ReelsDownloader** adalah aplikasi web yang memungkinkan pengguna mengunduh video Instagram Reels hanya dengan menempelkan link/URL. Proyek ini dibangun dengan antarmuka yang bersih dan modern, serta backend ringan yang memproses pengunduhan secara server-side.

---

## ✨ Fitur

- 🔗 **Input URL** — Tempelkan link Reels Instagram dan unduh langsung
- 📥 **Download Otomatis** — File video langsung terunduh ke perangkat pengguna
- 📱 **Responsive Design** — Tampilan optimal di desktop maupun mobile
- 🎨 **UI Modern** — Antarmuka bersih dengan tema gelap (dark mode)
- 📦 **Batch Download** — Unduh hingga 20 video sekaligus
- 🔒 **Tanpa Login** — Tidak memerlukan akun Instagram (hanya akun publik)

---

## 🛠️ Tech Stack

| Layer     | Teknologi                                   |
|-----------|---------------------------------------------|
| Frontend  | HTML, CSS (Vanilla), **TypeScript**         |
| Backend   | Node.js + Express.js + TypeScript           |
| Scraper   | Instagram API v1 + GraphQL (cookie-based)   |
| Bundler   | `esbuild` / `tsc` (kompilasi TypeScript)    |
| Hosting   | Localhost / VPS / Vercel (opsional)         |

---

## 📁 Struktur Folder

```
ReelsDownloader/
├── public/
│   ├── index.html        # Halaman utama
│   └── style.css         # Styling UI
├── src/
│   ├── main.ts           # Entry point TypeScript frontend
│   ├── api.ts            # Fungsi fetch ke backend API
│   └── ui.ts             # Manipulasi DOM & event handler
├── server/
│   ├── index.ts          # Entry point Express server
│   ├── routes/
│   │   ├── download.ts   # Route handler untuk single download
│   │   └── batch.ts      # Route handler untuk batch download
│   └── utils/
│       └── fetcher.ts    # Logika fetch video dari Instagram
├── tsconfig.json         # Konfigurasi TypeScript frontend
├── tsconfig.server.json  # Konfigurasi TypeScript server
├── .env.example          # Template environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Cara Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/username/reelsdownloader.git
cd reelsdownloader
```

### 2. Install Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit file `.env`:

```env
PORT=3000

# Instagram Session Cookies (wajib)
IG_SESSION_ID=your_session_id
IG_CSRF_TOKEN=your_csrf_token
IG_DS_USER_ID=your_user_id
IG_APP_ID=936619743392459
```

### 4. Setup Instagram Cookies

Untuk mengunduh video, kamu perlu mengisi cookies sesi Instagram:

1. Buka [instagram.com](https://www.instagram.com) di browser dan login
2. Buka DevTools (`F12`) → **Application** → **Cookies** → `https://www.instagram.com`
3. Salin nilai cookie berikut ke file `.env`:
   - `sessionid` → `IG_SESSION_ID`
   - `csrftoken` → `IG_CSRF_TOKEN`
   - `ds_user_id` → `IG_DS_USER_ID`

> ⚠️ Cookies bersifat sensitif. Jangan bagikan ke orang lain dan jangan commit ke repository publik.

### 5. Kompilasi TypeScript

```bash
# Kompilasi frontend TypeScript ke dist/
npm run build:client

# Kompilasi server TypeScript
npm run build:server

# Kompilasi semua sekaligus
npm run build
```

### 6. Jalankan Server

```bash
# Mode Development (dengan auto-reload & watch mode)
npm run dev

# Mode Production
npm start
```

### 7. Buka di Browser

```
http://localhost:3000
```

---

## 🔌 API Endpoint

### `POST /api/download`

Mengambil informasi dan URL video dari link Instagram Reels (single).

**Request Body:**

```json
{
  "url": "https://www.instagram.com/reel/XXXXXXXXXXX/"
}
```

**Response Sukses:**

```json
{
  "success": true,
  "filename": "reel_XXXXXXXXXXX.mp4",
  "downloadUrl": "https://...",
  "thumbnail": "https://...",
  "caption": "Caption video..."
}
```

**Response Error:**

```json
{
  "success": false,
  "message": "URL tidak valid atau konten tidak dapat diakses."
}
```

### `POST /api/batch`

Mengunduh beberapa video sekaligus (maks. 20 URL).

**Request Body:**

```json
{
  "urls": [
    "https://www.instagram.com/reel/ABC123/",
    "https://www.instagram.com/reel/DEF456/"
  ]
}
```

---

## 📋 Cara Penggunaan

1. Buka aplikasi di browser
2. Salin link Reels Instagram (contoh: `https://www.instagram.com/reel/ABC123/`)
3. Pilih mode **Single** (satu video) atau **Batch** (banyak sekaligus)
4. Tempelkan link ke kolom input
5. Klik tombol **"Unduh"**
6. Tunggu proses selesai — video akan otomatis terunduh

---

## ⚠️ Catatan Penting

> **WARNING:** Alat ini dibuat **hanya untuk keperluan pribadi dan edukasi**. Mengunduh konten Instagram tanpa izin pembuat konten mungkin melanggar [Terms of Service Instagram](https://help.instagram.com/581066165581870). Gunakan dengan bijak dan bertanggung jawab.

> **NOTE:** Aplikasi ini hanya dapat mengunduh Reels dari akun **publik**. Akun privat tidak dapat diakses tanpa autentikasi.

---

## 🧪 Dependencies

**Runtime:**
```json
{
  "express": "^4.18.2",
  "axios": "^1.6.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

**Dev (TypeScript & Tooling):**
```json
{
  "typescript": "^5.4.0",
  "ts-node-dev": "^2.0.0",
  "@types/node": "^20.0.0",
  "@types/express": "^4.17.21",
  "@types/cors": "^2.8.17",
  "esbuild": "^0.20.0"
}
```

---

## 🗺️ Roadmap

- [x] Setup proyek & README
- [x] Implementasi UI (index.html + style.css)
- [x] Backend Express server
- [x] Integrasi scraper Instagram (cookie-based)
- [x] Fitur preview thumbnail sebelum unduh
- [x] Dukungan multi-link (batch download)
- [ ] Deploy ke VPS / cloud

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

## 👤 Author

Dibuat dengan ❤️ oleh **[Username]**

> Pull request dan kontribusi sangat disambut!
