# ComSec Tracker：Vercel + Supabase 部署步驟

## A. Supabase（資料庫）
1. supabase.com 開帳戶 → New project（Region 揀 Singapore 或 Tokyo，記低 database 密碼）。
2. 左邊 SQL Editor → 貼上 `supabase/01-schema.sql` → Run。
3. 逐個執行 `supabase/02-seed-1.sql`、`02-seed-2.sql`、`02-seed-3.sql`（呢三個係你份 comsec-data.json 嘅全部資料，共 2528 筆）。
4. Project Settings → API：抄低 **Project URL** 同 **anon public key**。
5. 驗證：Table Editor → store，應該有 2528 行。

## B. 填入 URL / Key
用文字編輯器打開 `index.html`，搜尋 `CLOUD_DEFAULT`，將兩個引號之間填入 URL 同 key：
`const CLOUD_DEFAULT = {url:'https://xxxx.supabase.co', key:'eyJ...'};`
（唔填都得，每部電腦喺 App 嘅 Settings →「雲端資料庫」自己輸入。）

## C. Vercel（放個網頁）
1. 將成個 `deploy` 資料夾（唔洗 backups）放上 GitHub 私人 repo，Vercel 揀 Import 呢個 repo → Deploy。
2. 之後每次改 `index.html` 再 push，所有人一開就係最新版（`vercel.json` 已關閉快取）。

## D. 自動每日備份（GitHub Actions）
1. repo → Settings → Secrets and variables → Actions → 新增 `SUPABASE_URL`、`SUPABASE_KEY`。
2. 每日香港凌晨 2:00 自動將全部資料存入 repo 嘅 `backups/comsec-backup-日期.json`（同 App「匯出Data」同一格式，可直接用「匯入Data」還原）。
3. 即時備份：Actions → Daily Supabase backup → Run workflow。
4. repo 一定要設做 **Private**。

## E. 救返被改／被刪嘅紀錄
Supabase 後台 SQL Editor：
`select * from store_history order by changed_at desc limit 50;`
入面有每筆被改或被刪紀錄嘅舊內容。（Activity Log 唔記錄。）

## F. 注意
- 冇登入：知道 URL + anon key 就可以讀寫，唔好公開網址同 key。
- 同事改唔同紀錄唔會互相覆蓋；同一筆紀錄同時改，後儲存嗰個贏。
- App 每 30 秒同切返個視窗時自動同步。
- 一次過刪走 20 筆以上（超過一半）會彈出確認，並可由雲端還原。
