/* Servidor local sem dependências, restrito aos arquivos públicos do protótipo. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function resolvePublicPath(url) {
  let pathname;
  try { pathname = decodeURIComponent(String(url).split("?")[0]); } catch { return null; }
  if (pathname.includes("\\") || pathname.split("/").some(part => part === ".." || part === ".")) return null;
  if (pathname === "/" || pathname === "/index.html") return path.join(root, "index.html");
  if (!/^\/assets\/[a-zA-Z0-9/_-]+\.(css|js|svg|png|jpg|webp)$/.test(pathname)) return null;
  return path.join(root, pathname);
}
function createServer() {
  return http.createServer((request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const file = resolvePublicPath(request.url);
    if (!file) { response.writeHead(404); response.end("Nao encontrado"); return; }
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404); response.end("Nao encontrado"); return; }
      const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };
      response.writeHead(200, { "Content-Type": mime[path.extname(file)], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      response.end(request.method === "HEAD" ? undefined : data);
    });
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 5500);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("PORT deve ser um número entre 1024 e 65535.");
  const server = createServer();
  server.on("error", error => { console.error(error.code === "EADDRINUSE" ? "Porta ocupada. Feche o outro servidor ou escolha outra porta com PORT." : error.message); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => console.log("Banco Nexo: http://localhost:" + port + "\nUse Ctrl+C para encerrar."));
}
module.exports = { createServer, resolvePublicPath };
