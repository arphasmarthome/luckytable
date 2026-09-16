/* Dinner RSVP relay between the Lucky Table device and the family's phones.
 *
 *   GET  /api/rsvp?device=ID                       -> the device's state
 *   POST /api/rsvp { device, kind: "snapshot", snapshot }            (device pushes tonight's table)
 *   POST /api/rsvp { device, kind: "reply", member, joining, source } (phone or device answers)
 *
 * State lives in Vercel KV / Upstash when KV_REST_API_URL + KV_REST_API_TOKEN are set (any Redis REST
 * store with the same API works); otherwise in this function instance's memory, which is enough for a
 * live demo but resets whenever the instance is recycled. */
const memory = new Map();
const TTL_SECONDS = 60 * 60 * 24 * 3;

const key = (device) => `luckytable:rsvp:${device}`;
const kv = () => (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN ? { url: process.env.KV_REST_API_URL.replace(/\/$/, ""), token: process.env.KV_REST_API_TOKEN } : null);

async function load(device) {
  const store = kv();
  if (!store) return memory.get(key(device)) || null;
  const res = await fetch(`${store.url}/get/${encodeURIComponent(key(device))}`, { headers: { Authorization: `Bearer ${store.token}` } });
  const json = await res.json();
  return json && json.result ? JSON.parse(json.result) : null;
}
async function save(device, state) {
  const store = kv();
  if (!store) {
    memory.set(key(device), state);
    return;
  }
  await fetch(`${store.url}/set/${encodeURIComponent(key(device))}?EX=${TTL_SECONDS}`, { method: "POST", headers: { Authorization: `Bearer ${store.token}` }, body: JSON.stringify(state) });
}

const blank = (device) => ({ device, snapshot: null, joining: {}, replyAt: {}, source: {}, updatedAt: 0 });
const cleanId = (value) => (typeof value === "string" && /^[\w.-]{1,64}$/.test(value) ? value : null);

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = typeof req.body === "string" ? req.body : "";
    if (raw) {
      try { return resolve(JSON.parse(raw)); } catch { return resolve({}); }
    }
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    const device = cleanId(req.query && req.query.device);
    if (!device) return res.status(400).json({ error: "device required" });
    return res.status(200).json((await load(device)) || blank(device));
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const body = await readBody(req);
  const device = cleanId(body.device);
  if (!device) return res.status(400).json({ error: "device required" });
  const state = (await load(device)) || blank(device);
  const now = Date.now();

  if (body.kind === "snapshot" && body.snapshot && typeof body.snapshot === "object") {
    const s = body.snapshot;
    state.snapshot = {
      familyName: String(s.familyName || "").slice(0, 60),
      dinnerTime: String(s.dinnerTime || "").slice(0, 10),
      members: Array.isArray(s.members) ? s.members.slice(0, 20).map((m) => ({ id: cleanId(m.id) || "", name: String(m.name || "").slice(0, 40), color: String(m.color || "").slice(0, 16), initials: String(m.initials || "").slice(0, 4) })).filter((m) => m.id) : [],
      tonight: Array.isArray(s.tonight) ? s.tonight.slice(0, 12).map((d) => ({ id: String(d.id || "").slice(0, 60), name: String(d.name || "").slice(0, 80), img: /^https?:\/\//.test(String(d.img || "")) ? String(d.img).slice(0, 300) : "", minutes: Number(d.minutes) || 0 })) : [],
    };
    // seed answers the device already knows, without overriding a reply the phone sent since
    if (body.joining && typeof body.joining === "object") {
      Object.entries(body.joining).forEach(([id, value]) => {
        const member = cleanId(id);
        if (member && !state.replyAt[member]) {
          state.joining[member] = Boolean(value);
          state.source[member] = "device";
        }
      });
    }
  } else if (body.kind === "reply") {
    const member = cleanId(body.member);
    if (!member) return res.status(400).json({ error: "member required" });
    state.joining[member] = Boolean(body.joining);
    state.replyAt[member] = now;
    state.source[member] = body.source === "device" ? "device" : "phone";
  } else return res.status(400).json({ error: "unknown kind" });

  state.updatedAt = now;
  await save(device, state);
  return res.status(200).json(state);
};
