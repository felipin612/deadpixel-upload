# Cloud publishing (no device needed) — replaces the browser flow in PUBLISHING.md

Everything runs in the cloud session. Nothing needs the user's Mac.

## Hosting the files
Buffer needs a public URL. Commit each finished file to `v/` in this repo (each file < 95 MB; GitHub refuses 100 MB) and use
`https://raw.githubusercontent.com/felipin612/deadpixel-upload/main/v/<file>`.
Encode the 16:9 episode to fit: `ffmpeg -i EPxx_16x9.mp4 -c:v libx264 -preset veryfast -b:v 1100k -maxrate 1400k -bufsize 2800k -c:a aac -b:a 128k v/EPxx.mp4` (check size < 95 MB; lower -b:v if not). Shorts are small already.
Delete files from `v/` (git rm) once Buffer shows the post as sent.

## Buffer (organization 6b08697bca9ef287f9887aab) — channel ids and slots are in studio/schedule.json
For every video: run `gate.py check` first (use the slot time as --at). Only on GATE PASS:
- Re-read studio/schedule.json now (the Rastreador may have changed it this morning). Pass the chosen slot as `gate.py --at`.
- mcp Buffer `create_post`, `schedulingType: automatic`, `mode: customScheduled`, `dueAt` = next free slot of that platform (ISO with -03:00), never a slot already used that day (check `list_posts` status scheduled/sent).
- TikTok: `assets:[{video:{url, metadata:{thumbnailOffset: 0}}}]`, `metadata.tiktok:{title: caption, isAiGenerated: true}`, `text` = caption. Rule R5: the first TikTok of the day has no YouTube mention.
- Instagram Reel: `metadata.instagram:{type:"reel", shouldShareToFeed:true, isAiGenerated:true}`, `assets` video with `thumbnailOffset: 0`, `text` = caption with 8-12 hashtags.
- YouTube Short: `metadata.youtube:{type:"short", title, categoryId:"24", madeForKids:false, privacy:"public", isAiGenerated:true}`, `text` = description.
- YouTube episode: `metadata.youtube:{type:"regularVideo", title, categoryId:"24", madeForKids:false, privacy:"public", isAiGenerated:true}`, description with chapters.
- After the post is sent (`get_post` status sent, it has the network link/id): run `gate.py record ... --post-id <id>`.
- The first frame of every short IS its cover (thumbnailOffset 0): it must be the designed cover frame (strongest image + hook text), which is also rule R7.

## YouTube custom cover + playlist (GitHub Actions, no device)
When the YouTube video id is known, write `jobs/youtube/<ID>.json`:
`{"video_id": "...", "thumbnail": "covers/<ID>_16x9.jpg", "synthetic": true, "playlist_id": "<The Lost Library id, episodes only>"}`
commit the cover jpg (< 2 MB) and the job, push. The workflow `.github/workflows/youtube_meta.yml` applies them and writes `result` back into the job file. Check it on the next run; if `error` says the secrets are missing, add an alert event for the user.

## If Buffer fails twice
Leave the post as a draft in Buffer (`saveToDraft: true`), write an alert event in the dashboard with the reason, and continue with the rest.
