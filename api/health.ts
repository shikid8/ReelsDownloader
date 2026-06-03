import dotenv from "dotenv";
dotenv.config();

/** GET /api/health — verifikasi env vars terkonfigurasi dengan benar */
export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      status: "ok",
      env: {
        IG_SESSION_ID: process.env["IG_SESSION_ID"] ? "✅ SET" : "❌ MISSING",
        IG_CSRF_TOKEN: process.env["IG_CSRF_TOKEN"] ? "✅ SET" : "❌ MISSING",
        IG_DS_USER_ID: process.env["IG_DS_USER_ID"] ? "✅ SET" : "❌ MISSING",
        IG_APP_ID:     process.env["IG_APP_ID"]     ? "✅ SET" : "❌ MISSING",
      },
    })
  );
}
