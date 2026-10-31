/* UrbanFlow Avatar Engine v2.1. Dimuat SETELAH skrip utama dashboard (sebelum </body>).
   Menimpa: moveTo, moveAvatar, setSt, mouth, placeBub, typeBubble, hl, exec, remote, say (wrapper), msg (wrapper).
   v2.1: bubble tidak lagi membengkak (bentrok nama kelas .g), avatar memilih sudut kanan-atas kartu dan menunggu scroll selesai,
         avatar mengikuti kartu saat di-scroll, respons multi-lokasi dipecah menjadi langkah bertahap (pindah, jelaskan, lanjut). */
(() => {
'use strict';
const EO = 'cubic-bezier(.23,1,.32,1)', OV = 'cubic-bezier(.34,1.56,.64,1)', BI = 'cubic-bezier(.65,0,.35,1)';
const R = Math.random, rr = (a, b) => a + R() * (b - a), pick = a => a[Math.floor(R() * a.length)], set = (e, k, v) => e.style.setProperty(k, v);
const clean = t => String(t).replace(/```[\s\S]*?```/g, ' ').replace(/[*_`#]+/g, '').replace(/^\s*>\s?/gm, '').replace(/(^|\s)(?:\d{1,2}[.)]|[-\u2022])\s+(?=[A-Z])/g, '$1').replace(/\s{2,}/g, ' ').trim();
const T = (x, y, s) => `translate3d(${x - 20}px,${y - 20}px,0) scale(${s})`;
// ekspresi: ey=skala mata, bl=angkat alis, b1/b2=rotasi alis kiri/kanan, mo=buka mulut, mw=lebar, ms=+senyum/-cemberut
const EX = {
  neutral: { ey: 1, bl: 0, b1: 0, b2: 0, mo: .35, mw: 1, ms: 1 },
  happy: { ey: .6, bl: -2, b1: 0, b2: 0, mo: .7, mw: 1.55, ms: 1 },
  sad: { ey: .9, bl: 1, b1: -14, b2: 14, mo: .5, mw: .8, ms: -1 },
  angry: { ey: .78, bl: 1.5, b1: 18, b2: -18, mo: .3, mw: 1.1, ms: -1 },
  confused: { ey: 1, bl: -1, b1: -12, b2: 8, mo: .4, mw: .7, ms: -1 },
  surprised: { ey: 1.35, bl: -3.5, b1: -4, b2: 4, mo: 1.2, mw: .6, ms: 1 },
  thinking: { ey: .85, bl: -.5, b1: -8, b2: 10, mo: .25, mw: .6, ms: 1, lx: -2, ly: -2 },
  listening: { ey: 1.15, bl: -2, b1: -3, b2: 3, mo: .3, mw: .8, ms: 1 }
};
EX.error = EX.sad;
const BUB = ['fade', 'pop', 'shake', 'alert', 'playful'], BV = { happy: 'pop', surprised: 'shake', angry: 'alert', sad: 'fade', confused: 'playful', error: 'shake' };
const VIS = { a: [1, 1.1], e: [.6, 1.5], i: [.45, 1.6], o: [.85, .7], u: [.5, .6], b: [0, 1], m: [0, 1], p: [0, 1], ' ': [.1, 1] };
const V = { s: .58, last: '', lastSpot: '', held: null, bv: 'fade', st: 'idle', audio: 0, typing: 0, lv: 0, w: 1, ch: 0, cw: 1, ready: 0, envA: null, an: null, ctx: null, raf: 0, dots: 0, dt: 0, ex: EX.neutral, lk: 0, hlBusy: 0, intent: null };

// ---------- CSS (hanya transform/opacity dianimasikan)
const css = `
#av{width:40px;height:40px;background:none!important;box-shadow:none!important;transition:none!important;animation:none!important;will-change:transform}
#av .sq,#av .hd,#av .br{position:absolute;inset:0}
#av .hd{transform:translate(var(--hx,0px),calc(var(--hy,0px) + var(--hb,0px))) rotate(var(--hr,0deg));transition:transform .7s ${EO}}
#av[data-tk] .hd{transition-duration:.15s}
#av .br{border-radius:50%;background:#fff;box-shadow:0 0 22px rgba(255,255,255,.22);animation:ybr 4s ease-in-out infinite}
@keyframes ybr{50%{transform:scale(1.03,1.015)}}
#av .ye,#av .yb,#av .ym{position:absolute}
#av .ye{top:15px;width:6px;height:8px;border-radius:50%;background:#111;transition:transform .22s ${EO};transform:translate(var(--lx,0px),var(--ly,0px)) scaleY(calc(var(--ey,1)*var(--bk,1)))}
#av[data-bl] .ye{--bk:.08;transition-duration:.07s}
#av .ye.l{left:11px}#av .ye.r{right:11px}
#av .yb{top:10px;width:8px;height:2px;border-radius:2px;background:#111;transition:transform .25s ${EO}}
#av .yb.l{left:9px;transform:translateY(var(--bl,0px)) rotate(var(--b1,0deg))}#av .yb.r{right:9px;transform:translateY(var(--bl,0px)) rotate(var(--b2,0deg))}
#av .ym{left:50%;top:26px;width:12px;height:6px;margin-left:-6px;background:#111;border-radius:0 0 12px 12px;transform-origin:50% 0;transform:scale(var(--mw,1),calc(var(--mo,.35)*var(--ms,1)));transition:transform .25s ${EO}}
#av[data-tk] .ym{transition:none}
#av .rg{position:absolute;inset:-5px;border-radius:50%;border:2px solid var(--rc,transparent);opacity:0;transform:scale(calc(1 + var(--lv,0)*.25))}
#av[data-s=listening] .rg{--rc:#3ddc97;opacity:.9;animation:yp 1.4s ${EO} infinite}
#av[data-s=thinking] .rg{--rc:#8fb4ff;opacity:.8;animation:yp 1.1s ${EO} infinite}
#av[data-s=error] .rg{--rc:#ff5c5c;opacity:.9}
#av[data-tk] .rg{--rc:rgba(255,255,255,.65);opacity:.55}
@keyframes yp{0%{transform:scale(.95);opacity:.9}100%{transform:scale(1.4);opacity:0}}
#bub{left:0!important;top:0!important;width:max-content;max-width:min(280px,calc(100vw - 24px))!important;padding:0!important;background:none!important;border:0!important;border-radius:0!important;font-size:13px;line-height:1.45;opacity:0;transform:translate3d(var(--bx,0px),var(--by,0px),0) scale(var(--bs,.92))!important;transform-origin:var(--bo,50% 50%)!important;transition:opacity .16s ${EO},transform .16s ${EO}!important}
#bub.on{--bs:1;opacity:1;transition:opacity .22s ${EO},transform .34s ${EO}!important}
#bub.nt{transition:opacity .22s ${EO}!important}
#bub .bi{position:relative;padding:10px 14px;border-radius:18px;color:#f6f6fa;text-shadow:0 1px 2px rgba(0,0,0,.4);background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.06)),rgba(10,10,18,.5);-webkit-backdrop-filter:blur(12px) saturate(1.3);backdrop-filter:blur(12px) saturate(1.3);border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 28px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.12);animation:bfade .34s ${EO} both}
@supports not (backdrop-filter:blur(1px)){#bub .bi{background:rgba(20,20,30,.93)}}
#bub[data-v=pop] .bi{animation-name:bpop}#bub[data-v=shake] .bi{animation-name:bshake}#bub[data-v=alert] .bi{animation-name:balert;background:linear-gradient(135deg,rgba(255,92,92,.36),rgba(255,92,92,.16)),rgba(30,8,8,.58);border-color:rgba(255,120,120,.65)}#bub[data-v=playful] .bi{animation-name:bplay}
@keyframes bfade{from{opacity:0;transform:translateY(6px)}}
@keyframes bpop{0%{transform:scale(.7)}60%{transform:scale(1.06)}100%{transform:none}}
@keyframes bshake{0%{transform:scale(.8)}30%{transform:scale(1.08) rotate(-2deg)}50%{transform:translateX(-4px)}65%{transform:translateX(4px)}82%{transform:translateX(-2px)}100%{transform:none}}
@keyframes balert{0%{transform:scale(.9);box-shadow:0 0 0 0 rgba(255,92,92,.6)}100%{transform:none;box-shadow:0 0 0 14px rgba(255,92,92,0)}}
@keyframes bplay{0%{transform:scale(.6) rotate(-8deg)}55%{transform:scale(1.08) rotate(3deg)}100%{transform:none}}
/* .gh = teks bayangan penahan ukuran (sebelumnya .g, bentrok dengan kelas grid dashboard sehingga bubble membengkak) */
#bub .tx{display:grid}#bub .tx>*{grid-area:1/1}#bub .gh{visibility:hidden}
#bub .bi::after{content:"";position:absolute;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.2)}
#bub[data-side=left] .bi::after{right:-12px;top:var(--ty,50%)}#bub[data-side=right] .bi::after{left:-12px;top:var(--ty,50%)}
#bub[data-side=above] .bi::after{bottom:-12px;left:var(--tx,50%)}#bub[data-side=below] .bi::after{top:-12px;left:var(--tx,50%)}
#bub .dt{display:flex;gap:5px;padding:4px 2px}#bub .dt i{width:6px;height:6px;border-radius:50%;background:#fff;animation:ydot 1s ease-in-out infinite}
#bub .dt i:nth-child(2){animation-delay:.15s}#bub .dt i:nth-child(3){animation-delay:.3s}
@keyframes ydot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
#bub .eq{display:none;position:absolute;right:8px;bottom:-5px;gap:2px;align-items:flex-end;height:10px;padding:2px 5px;border-radius:9px;background:rgba(20,20,30,.8)}
#bub[data-sp] .eq{display:flex}#bub .eq b{width:2px;height:8px;border-radius:2px;background:#8fb4ff;transform-origin:50% 100%;transform:scaleY(calc(.2 + var(--lv,0)*.9))}
#bub .eq b:nth-child(2){transform:scaleY(calc(.2 + var(--lv,0)*1.1))}
.kp #kv-c{font-size:clamp(24px,2.3vw,32px)!important;white-space:nowrap}
@media(prefers-reduced-motion:reduce){#av .br{animation:none}#bub .bi{animation:none}}`;
document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
av.innerHTML = '<i class="rg"></i><div class="sq"><div class="hd"><div class="br"><i class="ye l"></i><i class="ye r"></i><i class="yb l"></i><i class="yb r"></i><b class="ym"></b></div></div></div>';
const sq = av.querySelector('.sq'), hd = av.querySelector('.hd');
bub.setAttribute('aria-hidden', 'true');

// ---------- geometri: area aman, penghalang, tumpang tindih
const pr = Object.assign(document.createElement('div'), {}); pr.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'; document.body.append(pr);
function safe() {
  const c = getComputedStyle(pr), S = { l: 8 + (parseFloat(c.paddingLeft) || 0), t: 8 + (parseFloat(c.paddingTop) || 0), r: document.documentElement.clientWidth - 8 - (parseFloat(c.paddingRight) || 0), b: document.documentElement.clientHeight - 8 - (parseFloat(c.paddingBottom) || 0) };
  const n = $('.side').getBoundingClientRect();
  if (n.width > n.height) S.b = Math.min(S.b, n.top - 6); else S.l = Math.max(S.l, n.right + 6);
  return S;
}
const obs = () => [...(A.open ? [pn] : []), $('.side'), isl].map(e => e.getBoundingClientRect());
const ov = (x, y, w, h, o) => Math.max(0, Math.min(x + w, o.left + o.width) - Math.max(x, o.left)) * Math.max(0, Math.min(y + h, o.top + o.height) - Math.max(y, o.top));
const RMq = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

// ---------- ekspresi, tatapan, kepala
function setLook(x, y) { set(av, '--lx', x.toFixed(1) + 'px'); set(av, '--ly', y.toFixed(1) + 'px'); }
function head(x, y, r) { set(av, '--hx', x.toFixed(1) + 'px'); set(av, '--hy', y.toFixed(1) + 'px'); set(av, '--hr', r.toFixed(1) + 'deg'); }
function expr() {
  const m = V.held || { thinking: 'thinking', listening: 'listening', error: 'error' }[V.st] || 'neutral', e = EX[m] || EX.neutral; V.ex = e;
  ['ey', 'bl', 'b1', 'b2', 'ms'].forEach(k => set(av, '--' + k, k === 'bl' ? e[k] + 'px' : k.startsWith('b') ? e[k] + 'deg' : e[k]));
  if (!V.audio && !V.typing) { set(av, '--mo', e.mo); set(av, '--mw', e.mw); }
  setLook(e.lx || 0, e.ly || 0);
}
const infer = t => /maaf|tidak tersedia|belum bisa|gagal/i.test(t) ? 'sad' : /kritis|parah|bahaya|gawat/i.test(t) ? 'angry' : /melonjak|lonjakan|tiba-tiba|rekor/i.test(t) ? 'surprised' : /\?|bingung|tidak yakin|mungkin/i.test(t) ? 'confused' : /lancar|membaik|turun|bagus|baik/i.test(t) ? 'happy' : 'neutral';
function mood(m, bv) {
  V.held = EX[m] ? m : 'neutral'; V.bv = BUB.includes(bv) ? bv : BV[V.held] || 'fade'; clearTimeout(V.dt); expr();
  if (RMq()) return;
  if (m === 'sad' || m === 'error') { hd.animate({ rotate: ['0deg', '-7deg', '6deg', '-4deg', '0deg'] }, { duration: 520, easing: EO }); head(0, 2, 0); }
  else if (m === 'surprised') sq.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 320, easing: OV });
  else if (m === 'confused') head(0, 0, 9); else if (m === 'happy') head(0, -1, -3);
}
const decay = () => { clearTimeout(V.dt); V.dt = setTimeout(() => { if (!V.audio && !V.typing) { V.held = null; expr(); head(0, 0, 0); } }, 1400); };

// ---------- gerakan: 6 jenis perpindahan + masuk/keluar
function fly(x, y, s, kind) {
  const r = av.getBoundingClientRect(), fx = r.left + r.width / 2, fy = r.top + r.height / 2, fs = V.s, to = T(x, y, s), dx = x - fx, dy = y - fy, d = Math.hypot(dx, dy);
  V.s = s; av.getAnimations().forEach(a => a.cancel()); sq.getAnimations().forEach(a => a.cancel());
  av.style.transform = to;
  if (!V.ready || RMq() || (d < 2 && fs === s)) return;
  if ((kind === 'suck' || kind === 'emerge') && d < 80) kind = 'glide';
  const dur = Math.max(320, Math.min(820, 260 + d * .4)), a = T(fx, fy, fs), mx = (fx + x) / 2, my = (fy + y) / 2, lift = Math.min(110, d * .28) + 20, side = dx >= 0 ? 1 : -1;
  let fr = [{ transform: a }, { transform: to }], op = { duration: dur, easing: EO }, rot = null;
  if (kind === 'hop') { fr = [{ transform: a }, { transform: T(mx, my - lift, Math.max(fs, s) * 1.05), easing: 'ease-in-out' }, { transform: to }]; op = { duration: dur * 1.05, easing: EO }; }
  else if (kind === 'zip') op = { duration: dur * .7, easing: OV };
  else if (kind === 'swoop') { fr = [{ transform: a }, { transform: T(mx + side * Math.min(90, d * .25), my + lift * .6, fs) }, { transform: to }]; rot = [0, side * 12, 0]; }
  else if (kind === 'spin') rot = [0, 360];
  else if (kind === 'emerge') { fr = [{ transform: T(fx, fy, .58) }, { transform: to }]; op = { duration: dur * 1.1, easing: OV }; rot = [0, 360]; }
  else if (kind === 'suck') { op = { duration: dur, easing: BI }; rot = [0, -360]; }
  av.animate(fr, op);
  if (rot) av.animate({ rotate: rot.map(v => v + 'deg') }, { duration: op.duration, easing: EO });
  if (kind !== 'glide' && kind !== 'suck') { // squash & stretch searah gerakan
    const k = Math.min(.2, Math.max(.08, d / 600)), h = Math.abs(dx) > Math.abs(dy), st = h ? `scale(${1 + k},${1 - k})` : `scale(${1 - k},${1 + k})`, lnd = h ? `scale(${1 - k * .8},${1 + k * .8})` : `scale(${1 + k * .8},${1 - k * .8})`;
    sq.animate([{ transform: 'scale(1)' }, { transform: st, offset: .3 }, { transform: st, offset: .8 }, { transform: lnd, offset: .9 }, { transform: 'scale(1)' }], { duration: op.duration + 120, easing: 'ease-out' });
  }
  if (d > 40) { setLook(dx / d * 2.6, dy / d * 1.8); clearTimeout(V.lk); V.lk = setTimeout(expr, dur); }
}
const nr = l => { const c = l.filter(k => k !== V.last); return V.last = pick(c); };
moveTo = function (x, y, s = 1, kind) {
  const S = safe(), home = s < .7;
  if (!home) { x = cl(x, S.l + 20, S.r - 20); y = cl(y, S.t + 20, S.b - 20); }
  fly(x, y, s, kind || (home ? 'suck' : V.s < .7 ? pick(['emerge', 'hop', 'zip', 'spin']) : nr(['glide', 'hop', 'zip', 'swoop', 'spin'])));
  A.x = x; A.y = y; A.s = s; layoutBub();
};
moveAvatar = function (pos) {
  if (pos === 'home') { V.intent = null; home(); return; }
  const S = safe(), t = pos.split('-'), v = t[0], h = t[1] || 'center', ir = isl.getBoundingClientRect();
  const x = h === 'left' ? S.l + 24 : h === 'right' ? S.r - 24 : (S.l + S.r) / 2;
  const y = v === 'top' ? (h === 'center' ? ir.bottom + 34 : S.t + 24) : v === 'bottom' ? S.b - 24 : (S.t + S.b) / 2;
  V.intent = { p: pos }; moveTo(x, y, 1);
};
// sudut kartu: kanan-atas diutamakan; avatar duduk di tepi kartu supaya isi kartu tidak tertutup
function spot(el) {
  const r = el.getBoundingClientRect(), S = safe(), a = Math.max(r.left, S.l), b = Math.min(r.right, S.r), c = Math.max(r.top, S.t), d = Math.min(r.bottom, S.b), ob = obs();
  let best;
  [[b - 20, c - 4, 'tr', 0], [a + 20, c - 4, 'tl', 16], [b - 20, d + 4, 'br', 30], [a + 20, d + 4, 'bl', 34]].forEach(([x0, y0, n, bias]) => {
    const x = cl(x0, S.l + 20, S.r - 20), y = cl(y0, S.t + 20, S.b - 20),
      sc = ob.reduce((q, o) => q + ov(x - 22, y - 22, 44, 44, o), 0) * .1 + (Math.abs(x - x0) + Math.abs(y - y0)) * 1.2 + bias;
    if (!best || sc < best.sc) best = { x, y, sc, n };
  });
  V.lastSpot = best.n; return best;
}
// tunggu sampai scroll halus benar-benar berhenti (sebelumnya hanya menunggu 700 ms sehingga posisi dihitung dari kartu yang masih bergerak)
const settle = (ms = 1600) => new Promise(res => {
  let last = -1, n = 0; const t0 = performance.now();
  (function f() { const y = scrollY, el = performance.now() - t0; n = y === last ? n + 1 : 0; last = y; if ((el > 140 && n >= 4) || el > ms) res(); else requestAnimationFrame(f); })();
});
hl = async function (k) {
  const el = $(TG[k]); if (!el) return;
  V.hlBusy = 1; setSt('navigating');
  const r0 = el.getBoundingClientRect(), tall = r0.height > innerHeight * .8, inView = r0.top >= 70 && r0.bottom <= innerHeight - 20;
  if (!inView) { el.scrollIntoView({ behavior: RMq() ? 'auto' : 'smooth', block: tall ? 'start' : 'center' }); await settle(); }
  const p = spot(el); V.intent = { el: k }; V.focus = el; moveTo(p.x, p.y, 1); V.hlBusy = 0;
  el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 3400);
  await wait(RMq() ? 80 : 620); setSt('idle');
};
// jalankan aksi sesuai urutan (versi lama menjalankan semua aksi non-highlight dulu, lalu semua highlight beruntun)
exec = async function (l) { for (const a of (Array.isArray(l) ? l : []).slice(0, 40)) await run(a); };

// ---------- respons multi-lokasi dipecah bertahap: pindah ke lokasi 1, jelaskan, lalu lokasi 2, dst
function norm(r) {
  if (!r || (Array.isArray(r.steps) && r.steps.length) || typeof r.say !== 'string') return r;
  const acts = Array.isArray(r.actions) ? r.actions : [];
  if (acts.filter(a => a && a.type === 'highlight').length < 2) return r;
  const segs = []; let cur = [];
  acts.forEach(a => { cur.push(a); if (a && a.type === 'highlight') { segs.push(cur); cur = []; } });
  if (cur.length) segs[segs.length - 1].push(...cur);
  const items = r.say.split(/(?:^|\s)\d{1,2}[.)]\s+(?=[*A-Z])/).map(clean).filter(Boolean), txt = clean(r.say);
  let parts = items.length >= segs.length ? items : txt.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length < segs.length) parts = txt.split(/(?<=[.!?;,])\s+|\s+(?:lalu|kemudian|selanjutnya|terakhir)\s+/i).filter(Boolean);
  const per = Math.max(1, parts.length) / segs.length;
  const steps = segs.map((s, i) => ({ actions: s, say: parts.slice(Math.round(i * per), Math.round((i + 1) * per)).join(' ') }));
  steps[0].mood = r.mood; steps[0].bubble = r.bubble;
  return { ...r, actions: [], steps };
}
const _remote = remote; remote = async q => norm(await _remote(q));

// ---------- bubble adaptif
function layoutBub() {
  const w = bub.offsetWidth, h = bub.offsetHeight; if (!w) return;
  const S = safe(), r = 20 * V.s + 6, g = 10, ob = obs(), C = { left: [A.x - r - g - w, A.y - h / 2], right: [A.x + r + g, A.y - h / 2], above: [A.x - w / 2, A.y - r - g - h], below: [A.x - w / 2, A.y + r + g] };
  const fr = V.focus && V.intent && V.intent.el && A.s >= .7 ? V.focus.getBoundingClientRect() : null;
  let best;
  (A.x > innerWidth / 2 ? ['left', 'below', 'above', 'right'] : ['right', 'below', 'above', 'left']).forEach((sd, i) => {
    const [x0, y0] = C[sd], x = cl(x0, S.l, Math.max(S.l, S.r - w)), y = cl(y0, S.t, Math.max(S.t, S.b - h));
    const sc = (Math.abs(x - x0) + Math.abs(y - y0)) * 2 + ob.reduce((q, o) => q + ov(x, y, w, h, o), 0) / 50 + ov(x, y, w, h, { left: A.x - r, top: A.y - r, width: 2 * r, height: 2 * r }) / 7 + (fr ? ov(x, y, w, h, fr) / 15 : 0) + i * 6;
    if (!best || sc < best.sc) best = { sd, x, y, sc };
  });
  set(bub, '--bx', best.x + 'px'); set(bub, '--by', best.y + 'px'); bub.dataset.side = best.sd;
  set(bub, '--ty', cl(A.y - best.y - 4, 12, h - 16) + 'px'); set(bub, '--tx', cl(A.x - best.x - 4, 12, w - 16) + 'px');
  set(bub, '--bo', { left: '100% 50%', right: '0% 50%', above: '50% 100%', below: '50% 0%' }[best.sd]);
}
placeBub = layoutBub;
function showBub(html, fill) {
  const was = bub.classList.contains('on'); bub.innerHTML = html; if (fill) fill(); bub.dataset.v = V.bv;
  if (!was) bub.classList.add('nt'); layoutBub(); bub.classList.add('on'); if (!was) setTimeout(() => bub.classList.remove('nt'), 420);
}
const dots = () => { if (!$('#ob').checked) return; V.dots = 1; V.bv = 'fade'; showBub('<div class="bi"><div class="dt"><i></i><i></i><i></i></div></div>'); };
typeBubble = function (text, id) {
  if (!$('#ob').checked) return Promise.resolve();
  V.dots = 0; V.typing = 1; startLoop();
  showBub('<div class="bi"><div class="tx"><span class="gh"></span><span class="t"></span></div><i class="eq"><b></b><b></b></i></div>', () => { bub.querySelector('.gh').textContent = text; });
  const t = bub.querySelector('.t'), chars = Array.from(text);
  return new Promise(res => {
    let i = 0; const tick = () => {
      if (id !== A.q) { V.typing = 0; return res(); }
      t.textContent = chars.slice(0, i).join(''); if (i > 0) V.char(chars[i - 1]);
      if (i++ >= chars.length) { V.typing = 0; return res(); }
      setTimeout(tick, /[,.;!?]/.test(chars[i - 1] || '') ? 140 : 18);
    }; tick();
  });
};
V.char = c => { const v = VIS[(c || '').toLowerCase()] || [.3, 1]; V.ch = v[0]; V.cw = v[1]; };

// ---------- lip-sync: amplitudo (live), envelope (buffered), fonem kasar dari teks (tanpa suara)
function loop(t) {
  V.raf = 0;
  if (!(V.audio || V.typing)) { av.removeAttribute('data-tk'); bub.removeAttribute('data-sp'); V.lv = 0; set(av, '--lv', 0); set(av, '--hb', '0px'); expr(); return; }
  let lv = 0, w = 1;
  if (V.audio) {
    if (V.an && liveNodes.size) {
      const a = V.tb || (V.tb = new Uint8Array(V.an.fftSize)), f = V.fb || (V.fb = new Uint8Array(V.an.frequencyBinCount)); V.an.getByteTimeDomainData(a); V.an.getByteFrequencyData(f);
      let s = 0; for (let i = 0; i < a.length; i += 2) { const q = (a[i] - 128) / 128; s += q * q; } lv = Math.min(1, Math.sqrt(s / (a.length / 2)) * 5);
      let lo = 0, hi = 0; const n = f.length; for (let i = 1; i < n; i++) { if (i < n * .05) lo += f[i]; else if (i > n * .12) hi += f[i]; } w = .7 + hi / (lo + hi + 1) * 1.3;
    } else if (V.envA && !V.envA.a.paused) lv = Math.min(1, (V.envA.e[Math.floor(V.envA.a.currentTime / .02)] || 0) / V.envA.mx * 1.1);
    else lv = Math.max(0, Math.sin(t / 95) * Math.sin(t / 230 + 1)) * .9;
  } else { lv = V.ch; V.ch *= .86; w = V.cw; }
  V.lv += (lv - V.lv) * (lv > V.lv ? .6 : .25); V.w += (w - V.w) * .3;
  const e = V.ex; set(av, '--mo', cl(e.mo * .3 + V.lv * 1.15, .12, 1.4).toFixed(2)); set(av, '--mw', (e.mw * V.w).toFixed(2)); set(av, '--hb', (-V.lv * 1.2).toFixed(2) + 'px');
  set(av, '--lv', V.lv.toFixed(2)); set(bub, '--lv', V.lv.toFixed(2));
  V.raf = requestAnimationFrame(loop);
}
function startLoop() { av.dataset.tk = 1; V.audio ? bub.setAttribute('data-sp', '') : bub.removeAttribute('data-sp'); if (!V.raf) V.raf = requestAnimationFrame(loop); }
mouth = function (on) {
  const was = V.audio; V.audio = on ? 1 : 0;
  if (on) { setSt('speaking'); if (!was && !RMq()) sq.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07,.95)' }, { transform: 'scale(1)' }], { duration: 220, easing: EO }); startLoop(); } else V.envA = null;
};
setSt = function (s) {
  const prev = V.st; V.st = s; av.dataset.s = s;
  if (s === 'thinking') { V.held = null; dots(); } else if (V.dots) { V.dots = 0; bub.classList.remove('on'); }
  expr(); if (s === 'idle') { decay(); if (prev === 'speaking' && !RMq()) hd.animate({ rotate: ['0deg', '2deg', '0deg'] }, { duration: 400, easing: EO }); }
};
window.AV = {
  tap() { unlockAudio(); if (V.ctx !== liveAudio || !V.an) { V.ctx = liveAudio; V.an = liveAudio.createAnalyser(); V.an.fftSize = 512; V.an.smoothingTimeConstant = .4; V.an.connect(liveAudio.destination); } return V.an; },
  async env(a, j) {
    try {
      unlockAudio(); const bin = atob(j.audio), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const b = await liveAudio.decodeAudioData(u.buffer), d = b.getChannelData(0), n = Math.floor(b.sampleRate * .02), e = []; let mx = 1e-4;
      for (let i = 0; i + n <= d.length; i += n) { let s = 0; for (let k = 0; k < n; k += 4) s += d[i + k] ** 2; const v = Math.sqrt(s / (n / 4)); e.push(v); if (v > mx) mx = v; }
      V.envA = { a, e, mx };
    } catch (e) { V.envA = null; }
  }
};

// ---------- integrasi alur lama
const _say = say; say = function (t, o) {
  o = o || {}; t = clean(t); const crit = /kritis|bahaya|parah|gawat|di atas ambang/i.test(t);
  let m = EX[o.mood] ? o.mood : infer(t), b = o.bubble; if (!crit) { if (m === 'angry') m = 'neutral'; if (b === 'alert') b = undefined; }
  mood(m, b); return _say(t);
};
const _msg = msg; msg = function (r, t) { _msg(r, t); if (r === 'u' && !RMq()) { sq.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12,.92)' }, { transform: 'scale(1)' }], { duration: 260, easing: OV }); } };
$('#aq').addEventListener('focus', () => { if (!V.audio && !V.typing) { V.held = 'listening'; expr(); } });
$('#aq').addEventListener('blur', () => { if (V.held === 'listening') { V.held = null; expr(); } });

// ---------- idle hidup: kedip acak, napas (CSS), kepala/mata melayang, postur, ikuti kursor
(function blink() { if (!document.hidden && !RMq()) { av.setAttribute('data-bl', ''); setTimeout(() => { av.removeAttribute('data-bl'); if (R() < .18) setTimeout(() => { av.setAttribute('data-bl', ''); setTimeout(() => av.removeAttribute('data-bl'), 90); }, 140); }, 100); } setTimeout(blink, rr(2200, 5600)); })();
(function drift() {
  if (!document.hidden && !RMq() && !V.audio && !V.typing && V.st === 'idle' && !V.held) {
    setLook(rr(-2.5, 2.5), rr(-1.5, 1.5)); head(rr(-1.2, 1.2), rr(-.8, .8), rr(-4, 4));
    if (R() < .25) sq.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04,.96)' }, { transform: 'scale(1)' }], { duration: 900, easing: 'ease-in-out' });
  }
  setTimeout(drift, rr(1800, 4500));
})();
let pt = 0; matchMedia('(pointer:fine)').matches && addEventListener('pointermove', e => {
  const n = performance.now(); if (n - pt < 80 || V.audio || V.typing || V.st !== 'idle' || V.held) return; pt = n;
  const dx = e.clientX - A.x, dy = e.clientY - A.y, d = Math.hypot(dx, dy); if (d < 420 && d > 1) setLook(dx / d * 2.6, dy / d * 1.8);
}, { passive: true });
let rt; addEventListener('resize', () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(() => { const i = V.intent; if (i && i.el && A.s >= .7) { const el = $(TG[i.el]); if (el) { const p = spot(el); moveTo(p.x, p.y, 1, 'glide'); } } else if (i && i.p) moveAvatar(i.p); layoutBub(); }); });
// ikuti kartu saat pengguna men-scroll sendiri; bila kartu sudah jauh keluar layar, avatar pulang ke Dynamic Island
let sc2; addEventListener('scroll', () => {
  clearTimeout(sc2); sc2 = setTimeout(() => {
    const i = V.intent; if (V.hlBusy || !i || !i.el || A.s < .7) return;
    const el = $(TG[i.el]); if (!el) return; const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { V.intent = null; home(); return; }
    const p = spot(el); moveTo(p.x, p.y, 1, 'glide');
  }, 160);
}, { passive: true });

new ResizeObserver(() => requestAnimationFrame(layoutBub)).observe(bub);
// ---------- inisialisasi: snap ke pulau, lalu animasi masuk
{ const a = anchor(); moveTo(a[0], a[1], a[2]); V.ready = 1; A.x = a[0]; A.y = a[1];
  if (!RMq()) av.animate([{ transform: T(a[0], a[1], .01) }, { transform: T(a[0], a[1], a[2]) }], { duration: 420, easing: OV }); expr(); }
})();