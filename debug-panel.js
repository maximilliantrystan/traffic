/* UrbanFlow panel debug AI (rahasia). Buka/tutup: tekan P + O bersamaan (di layar sentuh: ketuk teks sumber data di bawah 5x). Esc menutup. */
(() => {
'use strict';
const LOG = [], MAX = 40, of = window.fetch.bind(window); let open = false, box, body, timer, srv = null, srvErr = '', taps = 0, tapT = 0;
window.fetch = async function (u, o) {
  const url = typeof u === 'string' ? u : (u && u.url) || '';
  if (!/\/api\/(ai|voice-intent)(\?|$)/.test(url)) return of(u, o);
  let q = ''; try { const b = JSON.parse(o.body); q = b.question || b.text || ''; } catch (e) { }
  const t = performance.now(), e = { t: new Date().toLocaleTimeString('id-ID'), url: url.replace(location.origin, ''), q };
  LOG.unshift(e); if (LOG.length > MAX) LOG.pop();
  try {
    const r = await of(u, o); e.status = r.status; e.ms = Math.round(performance.now() - t); e.retryAfter = r.headers.get('Retry-After');
    r.clone().json().then(j => { e.json = j; if (open) draw(); }).catch(() => { }); return r;
  } catch (err) { e.status = 'x'; e.ms = Math.round(performance.now() - t); e.error = err.name === 'AbortError' ? 'dibatalkan (abort)' : err.message; throw err; }
};
const css = document.createElement('style');
css.textContent = `#dbg{position:fixed;z-index:130;top:0;right:0;bottom:0;width:min(580px,100vw);display:flex;flex-direction:column;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0);background:rgba(10,10,14,.86);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-left:1px solid rgba(255,255,255,.12);font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#e8e8ee;transform:translateX(102%);transition:transform .25s cubic-bezier(.23,1,.32,1);visibility:hidden}
#dbg.on{transform:none;visibility:visible}#dbg header{display:flex;gap:6px;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}#dbg header b{flex:1;font-weight:600}
#dbg button{min-height:32px;padding:4px 10px;border-radius:8px;background:rgba(255,255,255,.09);color:#fff;font:inherit;cursor:pointer}
#dbg .bd{flex:1;overflow:auto;padding:12px 14px}#dbg h4{margin:16px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a998f}#dbg h4:first-child{margin-top:0}
#dbg .dg{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);white-space:pre-wrap}#dbg .dg.bad{border-color:rgba(255,92,92,.6);background:rgba(255,92,92,.12)}#dbg .dg.ok{border-color:rgba(61,220,151,.5);background:rgba(61,220,151,.1)}#dbg .dg.wa{border-color:rgba(255,181,71,.55);background:rgba(255,181,71,.1)}
#dbg details{margin:4px 0;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.04)}#dbg summary{cursor:pointer;word-break:break-word}#dbg pre{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;color:#c9c9d3;max-height:260px;overflow:auto}
#dbg .s2{color:#3ddc97}#dbg .s4{color:#ff5c5c}#dbg .s5{color:#ffb547}`;
document.head.append(css);
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
box = h('aside', ''); box.id = 'dbg'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Debug AI');
const hd = h('header'), bt = (t, f) => { const b = h('button', '', t); b.type = 'button'; b.onclick = f; return b; };
hd.append(h('b', '', 'Debug AI · P+O'), bt('Segarkan', () => load()), bt('Salin', copy), bt('Tutup', () => toggle(false)));
body = h('div', 'bd'); box.append(hd, body); document.body.append(box);
const cls = s => s >= 500 || s === 'x' ? 's5' : s >= 400 ? 's4' : 's2';
function diag() {
  const bad = LOG.find(x => x.status && x.status !== 200), calls = (srv && srv.calls) || [], sbad = calls.find(c => !c.ok), j = (bad && bad.json) || {};
  const txt = [j.detail, sbad && sbad.detail, srv && srv.ai && srv.ai.error].filter(Boolean).join(' ').toLowerCase();
  const voice = LOG.filter(x => x.url.includes('voice-intent') && Date.now() - Date.parse(new Date().toDateString() + ' ' + x.t) < 6e4).length;
  const extra = voice ? `\nCatatan: ${voice} penilaian suara (mikrofon) dalam 1 menit terakhir; tiap ucapan memakai kuota AI yang sama.` : '';
  if (j.permanent || /request too large|reduce max_tokens|otpm|expected output tokens/.test(txt))
    return ['bad', 'BUKAN antrean: permintaan melebihi batas token keluaran per menit (OTPM) model ini. Menunggu tidak akan membantu.\nSolusi: jalankan server dengan AI_MAX_TOKENS di bawah batas (mis. 900) atau ganti AI_MODEL ke model dengan kuota lebih besar.' + extra];
  if (bad && bad.status === 429 || /429/.test(sbad && sbad.error || '') || /rate limit|tokens per|requests per|tpm|rpm|quota/.test(txt))
    return ['wa', 'Kena batas laju/kuota provider (429). Ini sementara: tunggu' + (bad && bad.retryAfter ? ' ' + bad.retryAfter + ' detik' : ' sekitar semenit') + ' atau kurangi pemakaian.' + extra];
  if (bad && bad.status === 503) return ['bad', 'AI belum dikonfigurasi di server (AI_PROVIDER, AI_API_KEY, AI_MODEL).'];
  if (bad && bad.status === 502) return ['bad', 'Provider AI membalas error atau jawabannya tidak bisa dibaca. Lihat detail di bawah.' + extra];
  if (bad) return ['bad', 'Permintaan gagal: ' + (j.error || bad.error || bad.status) + extra];
  return ['ok', LOG.length ? 'Tidak ada error pada permintaan terbaru.' + extra : 'Belum ada permintaan AI sejak halaman dibuka. Kirim pertanyaan lalu segarkan.'];
};
function draw() {
  body.textContent = ''; const [k, t] = diag(); body.append(h('h4', '', 'Diagnosis'), h('div', 'dg ' + k, t));
  body.append(h('h4', '', 'Server'));
  if (srv) { const c = srv.config || {}; body.append(h('div', 'dg', `status: ${srv.ai && srv.ai.state}${srv.ai && srv.ai.error ? ' (' + srv.ai.error + ')' : ''}\nprovider: ${c.provider} · model: ${c.model}\nbase: ${c.base || '-'}\nmax_tokens diminta: ${c.maxTokens}\nkunci terpasang: ${c.hasKey ? 'ya' : 'tidak'}`)); }
  else body.append(h('div', 'dg wa', srvErr || 'Memuat…'));
  if (srv) { body.append(h('h4', '', `Panggilan AI di server (${srv.calls.length})`)); srv.calls.forEach(c => { const d = h('details'), s = h('summary', '', `${new Date(c.t).toLocaleTimeString('id-ID')} · ${c.kind} · ${c.ok ? 'OK' : 'GAGAL ' + (c.error || '')} · ${c.ms} ms · max_tokens ${c.maxTokens}`); d.append(s, h('pre', '', c.ok ? c.output : (c.detail || c.error || '(tanpa detail)'))); body.append(d); }); }
  body.append(h('h4', '', `Permintaan dari browser (${LOG.length})`));
  LOG.forEach(e => { const d = h('details'), s = h('summary'); s.append(h('span', cls(e.status), String(e.status || '...')), document.createTextNode(` ${e.t} ${e.url} ${e.ms != null ? e.ms + ' ms' : ''}${e.retryAfter ? ' · Retry-After ' + e.retryAfter : ''}${e.q ? ' · "' + e.q.slice(0, 50) + '"' : ''}`)); d.append(s, h('pre', '', e.json ? JSON.stringify(e.json, null, 2) : e.error || '(menunggu respons)')); body.append(d); });
}
async function load() {
  try { const r = await of('/api/ai/debug'); if (r.status === 404) { srv = null; srvErr = 'Data server dimatikan. Jalankan server dengan AI_DEBUG=1 untuk melihat panggilan AI di sisi server.'; } else if (!r.ok) { srv = null; srvErr = 'Gagal memuat data server (' + r.status + ').'; } else { srv = await r.json(); srvErr = ''; } } catch (e) { srv = null; srvErr = 'Server tidak terjangkau.'; }
  if (open) draw();
}
function copy() { const t = JSON.stringify({ diagnosis: diag()[1], server: srv, browser: LOG }, null, 2); navigator.clipboard && navigator.clipboard.writeText(t).catch(() => { }); }
function toggle(v) { open = v == null ? !open : v; box.classList.toggle('on', open); clearInterval(timer); if (open) { draw(); load(); timer = setInterval(load, 5000); } }
const down = new Set();
addEventListener('keydown', e => {
  const t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
  if (e.key === 'Escape' && open) return toggle(false);
  down.add(e.key.toLowerCase()); if (down.has('p') && down.has('o') && !e.repeat) { e.preventDefault(); toggle(); }
});
addEventListener('keyup', e => down.delete(e.key.toLowerCase())); addEventListener('blur', () => down.clear());
const cap = document.getElementById('cap'); if (cap) cap.addEventListener('click', () => { const n = Date.now(); taps = n - tapT < 600 ? taps + 1 : 1; tapT = n; if (taps >= 5) { taps = 0; toggle(); } });
})();
