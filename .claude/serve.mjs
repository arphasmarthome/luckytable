// Minimal static file server for local review of the prototype (no dependencies).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8765);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".md": "text/markdown; charset=utf-8", ".ico": "image/x-icon" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found"); return; }
    res.writeHead(200, { "content-type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    res.end(data);
  });
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://127.0.0.1:${port}/`));
