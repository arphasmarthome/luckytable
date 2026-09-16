/* Serves ../api/rsvp.js on http://localhost:8787 so the Expo dev server (8081) can talk to it. */
const http = require("http");
const { URL } = require("url");
const handler = require("../../api/rsvp.js");

const PORT = Number(process.env.PORT) || 8787;
http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname !== "/api/rsvp") {
      res.statusCode = 404;
      return res.end();
    }
    req.query = Object.fromEntries(url.searchParams.entries());
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (value) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(value)); return res; };
    Promise.resolve(handler(req, res)).catch((err) => { console.error(err); res.status(500).json({ error: String(err) }); });
  })
  .listen(PORT, () => console.log(`rsvp relay on http://localhost:${PORT}/api/rsvp`));
