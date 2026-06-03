# 🍪 Panduan Setup Instagram Session Cookies

Panduan ini menjelaskan cara mengambil cookies dari browser untuk digunakan di aplikasi Reels Installer.

---

## Prasyarat

- Akun Instagram aktif (gunakan akun yang tidak takut ter-rate-limit)
- Browser Chrome, Firefox, atau Edge
- Sudah login di instagram.com

---

## Langkah-langkah

### Menggunakan Chrome / Edge

1. Buka **[https://www.instagram.com](https://www.instagram.com)** dan pastikan sudah login
2. Tekan **`F12`** untuk membuka DevTools
3. Klik tab **`Application`** (atau `Storage` di Firefox)
4. Di panel kiri, pilih **`Cookies`** → **`https://www.instagram.com`**
5. Cari dan salin nilai dari cookie berikut:

| Cookie Name | Salin ke variabel |
|-------------|-------------------|
| `sessionid` | `IG_SESSION_ID` |
| `csrftoken` | `IG_CSRF_TOKEN` |
| `ds_user_id` | `IG_DS_USER_ID` |

### Menggunakan Firefox

1. Buka **`https://www.instagram.com`**, pastikan sudah login
2. Tekan **`F12`** → klik tab **`Storage`**
3. Klik **`Cookies`** → **`https://www.instagram.com`**
4. Salin nilai cookie yang sama seperti tabel di atas

---

## Cara Cepat via Console (Chrome/Edge)

Alternatif lebih cepat: jalankan script ini di **Console** DevTools (tab `Console`):

```javascript
// Paste di Console dan tekan Enter
const cookies = ['sessionid', 'csrftoken', 'ds_user_id'];
const result = {};
document.cookie.split('; ').forEach(c => {
  const [k, v] = c.split('=');
  if (cookies.includes(k)) result[k] = v;
});
console.log('IG_SESSION_ID=' + result.sessionid);
console.log('IG_CSRF_TOKEN=' + result.csrftoken);
console.log('IG_DS_USER_ID=' + result.ds_user_id);
```

---

## Mengisi `.env`

Setelah mendapatkan nilai cookies, buka file `.env` di root proyek dan isi:

```env
PORT=3000

IG_SESSION_ID=nilai_sessionid_kamu_disini
IG_CSRF_TOKEN=nilai_csrftoken_kamu_disini
IG_DS_USER_ID=angka_user_id_kamu_disini
IG_APP_ID=936619743392459
```

Simpan file `.env`, server akan **auto-reload** otomatis.

---

## ⚠️ Peringatan Penting

> **Jangan pernah commit file `.env` ke Git!**
> File `.gitignore` sudah mengecualikan `.env` secara otomatis.

> **Cookies memiliki masa berlaku.**
> Jika muncul error "Autentikasi gagal", ulangi langkah di atas untuk mendapatkan cookies baru.

> **Gunakan akun sekunder** jika memungkinkan — akun utama berisiko
> ter-rate-limit jika digunakan terlalu sering untuk scraping.

---

## Masa Berlaku Cookies

| Cookie | Durasi Umum |
|--------|-------------|
| `sessionid` | ~90 hari (atau sampai logout) |
| `csrftoken` | ~1 tahun |
| `ds_user_id` | Permanen selama tidak logout |

---

## Verifikasi Berhasil

Setelah mengisi `.env`, coba unduh sebuah Reels. Di terminal/log server akan muncul:

```
✅ MediaInfo succeeded for [shortcode]
```

Jika masih gagal dengan error 401/403, berarti cookies tidak valid — ulangi langkah pengambilan cookies.
