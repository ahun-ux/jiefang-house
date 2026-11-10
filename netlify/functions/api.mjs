// 解方島・我的島屋 後端
// GET  /api/config            網站文字（所有人）
// POST /api/login  {name}     只回傳這位同學自己的資料
// POST /api/admin  {password, action, ...}  老師後台（需 ADMIN_PASSWORD）
import { getStore } from "@netlify/blobs";
import SEEDS from "./seeds.mjs";

export const config = { path: "/api/*" };

const QK = ["num", "itv", "obs", "beh"];
const CFG_KEYS = ["title", "sub", "welcome", "welcomeSub", "hint", "notFound", "notice"];
const MAX_STUDENTS = 300;

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const norm = (s) => String(s || "").replace(/\s/g, "").replace(/臺/g, "台");
const clip = (s, n) => String(s ?? "").trim().slice(0, n);
const list = (a, n, len) => (Array.isArray(a) ? a : []).map((x) => clip(x, len)).filter(Boolean).slice(0, n);

function cleanStudent(r = {}) {
  const quad = {};
  for (const k of QK) quad[k] = list(r.quad && r.quad[k], 40, 600);
  return {
    order: Number.isFinite(+r.order) ? +r.order : 0,
    name: clip(r.name, 30),
    place: clip(r.place, 40),
    quad,
    advice: clip(r.advice, 2000),
    note: clip(r.note, 2000),
    ideas: list(r.ideas, 20, 1000),
    tables: (Array.isArray(r.tables) ? r.tables : []).slice(0, 6).map((t) => ({
      title: clip(t && t.title, 60),
      total: clip(t && t.total, 30),
      rows: (Array.isArray(t && t.rows) ? t.rows : []).slice(0, 60).map((x) => ({
        item: clip(x && x.item, 100), unit: clip(x && x.unit, 30), qty: clip(x && x.qty, 30),
        times: clip(x && x.times, 30), sub: clip(x && x.sub, 30),
      })),
    })),
  };
}
function cleanConfig(c = {}) {
  const o = {};
  for (const k of CFG_KEYS) o[k] = clip(c[k], k === "notice" ? 1000 : 200);
  return o;
}
async function loadAll(store) {
  const { blobs } = await store.list({ prefix: "s/" });
  const out = await Promise.all(
    blobs.map(async (b) => {
      const data = await store.get(b.key, { type: "json" });
      return data ? { id: b.key.slice(2), data } : null;
    })
  );
  return out.filter(Boolean).sort((a, b) => (a.data.order || 999) - (b.data.order || 999) || a.id.localeCompare(b.id));
}
function adminPassword() {
  try { if (typeof Netlify !== "undefined" && Netlify.env) { const v = Netlify.env.get("ADMIN_PASSWORD"); if (v) return v; } } catch {}
  return process.env.ADMIN_PASSWORD || "";
}

export default async (req) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const store = getStore({ name: "jiefang-house", consistency: "strong" });

  try {
    if (req.method === "GET" && route === "config") {
      const c = await store.get("config", { type: "json" });
      return json({ config: c || {} });
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    let body = {};
    try { body = await req.json(); } catch {}

    // ---- 同學登島：只回傳名字完全相符的那一位 ----
    if (route === "login") {
      const n = norm(body.name);
      if (!n) return json({ error: "empty" }, 400);
      const all = await loadAll(store);
      const hit = all.find((r) => norm(r.data.name) === n);
      if (!hit) return json({ error: "not_found", empty: all.length === 0 }, 404);
      return json({ id: hit.id, student: hit.data });
    }

    // ---- 老師後台 ----
    if (route === "admin") {
      const pw = adminPassword();
      if (!pw) return json({ error: "no_password" }, 500);
      if (String(body.password || "") !== pw) return json({ error: "forbidden" }, 403);
      const action = body.action;

      if (action === "check") return json({ ok: true });
      if (action === "list") {
        const c = await store.get("config", { type: "json" });
        return json({ students: await loadAll(store), config: c || {} });
      }
      if (action === "save") {
        const rec = cleanStudent(body.student);
        if (!rec.name) return json({ error: "no_name" }, 400);
        const all = await loadAll(store);
        let id = clip(body.id, 40).replace(/[^\w-]/g, "");
        if (all.some((r) => r.id !== id && norm(r.data.name) === norm(rec.name))) return json({ error: "duplicate" }, 409);
        if (!id) {
          if (all.length >= MAX_STUDENTS) return json({ error: "full" }, 409);
          id = "s" + Date.now().toString(36);
          if (!rec.order) rec.order = Math.max(0, ...all.map((r) => r.data.order || 0)) + 1;
        }
        await store.setJSON("s/" + id, rec);
        return json({ ok: true, id, student: rec });
      }
      if (action === "delete") {
        const id = clip(body.id, 40).replace(/[^\w-]/g, "");
        if (!id) return json({ error: "bad_id" }, 400);
        await store.delete("s/" + id);
        return json({ ok: true });
      }
      if (action === "config") {
        const c = cleanConfig(body.config);
        await store.setJSON("config", c);
        return json({ ok: true, config: c });
      }
      if (action === "seed") {
        // 只補上還沒有的同學，不覆蓋老師已修改過的資料
        const all = await loadAll(store);
        const ids = new Set(all.map((r) => r.id)), names = new Set(all.map((r) => norm(r.data.name)));
        let added = 0;
        for (const [id, rec] of SEEDS) {
          if (ids.has(id) || names.has(norm(rec.name))) continue;
          await store.setJSON("s/" + id, cleanStudent(rec));
          added++;
        }
        return json({ ok: true, added });
      }
      return json({ error: "bad_action" }, 400);
    }
    return json({ error: "not_found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: "server" }, 500);
  }
};
