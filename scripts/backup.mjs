// 由 Supabase 讀出全部資料，存成同 App「匯出Data」一樣格式嘅 JSON
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_KEY;
if (!URL || !KEY) { console.error('缺少 SUPABASE_URL / SUPABASE_KEY'); process.exit(1); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const cols = ['records','deregRecords','otherRecords','companies','notes','messageTemplates','activityLogs'];
const out = Object.fromEntries(cols.map(c => [c, []]));
for (let off = 0; ; off += 1000) {
  const r = await fetch(`${URL}/rest/v1/store?select=collection,data&order=collection,id&limit=1000&offset=${off}`, { headers: H });
  if (!r.ok) { console.error('讀取失敗', r.status, await r.text()); process.exit(1); }
  const rows = await r.json();
  rows.forEach(x => { if (out[x.collection]) out[x.collection].push(x.data); });
  if (rows.length < 1000) break;
}
const total = cols.filter(c => c !== 'activityLogs').reduce((n, c) => n + out[c].length, 0);
if (total === 0) { console.error('雲端資料係空嘅，唔寫備份'); process.exit(1); }
out.activityLogs.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
out.exportedAt = new Date().toISOString();
mkdirSync('backups', { recursive: true });
const name = `backups/comsec-backup-${out.exportedAt.slice(0, 10)}.json`;
writeFileSync(name, JSON.stringify(out, null, 2));
console.log('已備份', name, cols.map(c => c + ':' + out[c].length).join(' '));
