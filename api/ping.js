// api/ping.js — pure JavaScript, zero TypeScript compilation
module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    status: "ok",
    message: "Vercel JS function berjalan!",
    node: process.version,
    method: req.method,
  }));
};
