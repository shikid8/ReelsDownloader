/** GET /api/test — endpoint diagnostik minimal tanpa import apapun */
export default function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      status: "ok",
      message: "Vercel function berjalan dengan baik",
      node: process.version,
      env_count: Object.keys(process.env).length,
    })
  );
}
