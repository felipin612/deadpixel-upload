# Dead Pixel publishing bridge

Public queue repo. Each batch: push videos to `v/` (files < 100 MB; split larger ones with
`split -b 80m -d -a 1 EP.mp4 v/EPxx.part`), publish, verify, then remove the batch's files.

## YouTube (built-in browser, signed in to YouTube Studio)
1. Open `studio.youtube.com/channel/UCgzBji7am_XfHWe_doh7ujQ/videos/upload?d=ud`.
2. One real click on the page (focus), set `window.__P`, run `tools/youtube_upload.js`.
3. Check the content list: title, visibility Público, no duplicates.

## TikTok (built-in browser, signed in to TikTok Studio)
1. Tab A at `https://www.tiktok.com/robots.txt`: set `window.__FILES`, run `tools/tiktok_cache_from_robots.js`.
2. Tab B at `/tiktokstudio/upload`: set `window.__K` (cached name) and `window.__N` (one-word file name,
   e.g. `DeadPixel_Spawn_Tester.mp4`), run `tools/tiktok_stage1_upload.js`.
3. Caption (Draft.js only accepts REAL input): real double-click the file name in Description to select it,
   type the caption with real keystrokes, real click on the "Description" label (blur), real click at the end
   of the text and type one space. The phone preview must now show the caption.
4. Run `tools/tiktok_stage3_ai_check.js`; if ai/everyone are true and preview shows the caption, real click "Post".
5. Verify in `/tiktokstudio/content`: caption and "Everyone". TikTok cannot edit captions after posting.
