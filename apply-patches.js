// Pemakaian: node apply-patches.js [server.js] [urbanflow-dashboard.html]
// Membuat cadangan *.bak lalu menerapkan patch avatar v2. Aman dijalankan ulang.
const fs = require('fs');
const SRV = process.argv[2] || 'server.js', HTML = process.argv[3] || 'urbanflow-dashboard.html';
const MO = "const MO = ['neutral', 'happy', 'sad', 'angry', 'confused', 'surprised', 'thinking'], BU = ['fade', 'pop', 'shake', 'alert', 'playful'], pk = (v, l) => l.includes(v) ? v : undefined;\n";
const P = {
  [SRV]: [
    ['route', "    if (!p.startsWith('/api/')) return send(", "    if (req.method === 'GET' && p === '/avatar-engine.js') { res.writeHead(200, { ...H, 'Content-Type': 'text/javascript; charset=utf-8' }); return fs.createReadStream(path.join(__dirname, 'avatar-engine.js')).on('error', () => res.end()).pipe(res); }\n    if (!p.startsWith('/api/')) return send(", 'avatar-engine.js\''],
    ['prompt', 'Keluaran: JSON saja tanpa markdown.', 'Keluaran: JSON saja tanpa markdown. Setiap say atau langkah boleh menyertakan "mood" (neutral|happy|sad|angry|confused|surprised|thinking) dan "bubble" (fade|pop|shake|alert|playful; alert untuk hal penting atau kritis).', '"mood" (neutral'],
    ['consts', 'const AI = { state:', MO + 'const AI = { state:', 'pk = (v, l)'],
    ['step', 'return text ? { say: text, actions } : null;', 'return text ? { say: text, actions, mood: pk(step.mood, MO), bubble: pk(step.bubble, BU) } : null;', 'mood: pk(step.mood'],
    ['ret', 'return steps.length ? { say, actions: [], steps } : { say, actions };', 'return steps.length ? { say, actions: [], steps } : { say, actions, mood: pk(j.mood, MO), bubble: pk(j.bubble, BU) };', 'mood: pk(j.mood']
  ],
  [HTML]: [
    ['script', '</script></body>', '</script>\n<script src="/avatar-engine.js"></script></body>', 'avatar-engine.js'],
    ['tap', 'source.connect(liveAudio.destination)', 'source.connect(AV.tap())', 'AV.tap()'],
    ['env', "const audio=new Audio('data:'+j.mime+';base64,'+j.audio);", "const audio=new Audio('data:'+j.mime+';base64,'+j.audio);AV.env(audio,j);", 'AV.env('],
    ['say1', 'await say(step.say)', 'await say(step.say,step)', 'say(step.say,step)'],
    ['say2', 'await say(r.say)', 'await say(r.say,r)', 'say(r.say,r)']
  ]
};
let bad = 0;
for (const [file, rules] of Object.entries(P)) {
  if (!fs.existsSync(file)) { console.error('TIDAK ADA:', file); bad++; continue; }
  let s = fs.readFileSync(file, 'utf8'); const o = s;
  for (const [n, a, b, done] of rules) {
    if (s.includes(done)) { console.log(`= ${file} [${n}] sudah diterapkan`); continue; }
    if (!s.includes(a)) { console.error(`! ${file} [${n}] teks target tidak ditemukan, terapkan manual`); bad++; continue; }
    s = s.split(a).join(b); console.log(`+ ${file} [${n}]`);
  }
  if (s !== o) { fs.writeFileSync(file + '.bak', o); fs.writeFileSync(file, s); }
}
console.log(bad ? `Selesai dengan ${bad} masalah.` : 'Semua patch berhasil. Pastikan avatar-engine.js satu folder dengan server.js, lalu restart server.');
process.exit(bad ? 1 : 0);
