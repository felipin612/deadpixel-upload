# Dead Pixel daily production (one story episode + 3 shorts a day)

Setup in a fresh session: attach repo felipin612/deadpixel-upload (push), clone it, run `bash studio/setup.sh`.

## Lore log (never repeat a game, genre or horror rule from the last 5 pieces)
| ID | Game | Genre / rule | New clue |
|---|---|---|---|
| EP01 | SALTMARSH | fog town, a new house each night = places you lived | Slot 3 save, 03/03/2004, the tester (dead pixel on his eye) |
| EP02 | NIGHTWALK | walking sim, never look back, "steps behind you" | Tester's name: T. Rowe, missing since 03/03/2004 |
| EP03 | STILLWATER | ice-fishing sim, "if the line goes still, cut it"; the catch log returns what you lost | Studio address: an old boathouse, 14 Merrow Road (Merrow Lake); T. Rowe's memory card is the last uncaught entry |
| EP04 | SIGNALMAN | railway signal-box sim, "clear only the trains on the timetable; anything else, hold at red"; the 03:03 to Merrow Road | Founder of Dead Pixel: J. Kell, daughter of R. Kell (drowned in Merrow Lake, 1961); she started the studio in his boathouse |
Logo loses one more pixel each episode (drawLogo missing = episode number + 2).




## Voice: Chatterbox default voice (chosen by the user on 27/11) — never Kokoro, never ElevenLabs credits
Settings in studio/voice.json. Narration is made for free by the GitHub Actions workflow `.github/workflows/tts.yml` (CPU, about 4.4 s of work per second of audio):
1. As soon as the scripts are final, write `jobs/tts/<YYYY-MM-DD>_<ID>.json` = {"out_dir": "narration/<ID>", "items": [{"name": "<ID>_s01", "text": "...", "ref": null, "exaggeration": 0.5, "cfg_weight": 0.5}, ...]} — one item per scene for the episode (EPxx_s01..s14), one item per short (Sxx). Shorts first (one job for the 3 shorts, then one for the episode). Commit and push: the push starts the workflow.
2. Wait: `git pull` every 60 s until the job file says "done": true and narration/<ID>/*.wav exist (shorts ~8 min, episode ~45 min). Meanwhile build scenes/covers. If this run must end, save stage "voz_pending" in the state file; the next hourly run resumes.
3. Use narration/<ID>/<name>.wav as the voice tracks (timing per scene comes from each file's length). Trim leading silence to <= 0.15 s (R6).
4. gate.py rule R19 refuses any video whose narration/<ID>/ has no Chatterbox markers. Part 1 clips use the episode's folder.
5. If the workflow fails twice: Kokoro bm_george as fallback for that day only, alert event + alert email, and R19 is the one rule allowed to fail that day (write it in compliance).


## Felipe's email orders (studio/orders.json)
At the start of every run (production, Analista, Rastreador) read the active orders in studio/orders.json and obey them; they come from Felipe through the verified mailbox task and take priority over the defaults in this file (never over the safety limits: no passwords/keys/payments, no deleting published content, no messages to anyone but Felipe, no off-topic content). If an order conflicts with a rule in rules.json, the order wins and the rule must carry enabled:false with disabled_by.

## Fix loop: Analista findings are mandatory (never skip)
Every problem the Analista finds goes to the Rastreador (dashboard collection `research`). Its fixes are NOT suggestions:
- Before writing anything, list every research doc with status `solved`, `applied`, `not_applied` or `failed`. For each action in `findings.actions`, there must be a rule in `studio/rules.json`. If one is missing, add it (automatic check in `gate.py` when possible, else `"check": "confirm"`), commit, and write the rule ids into the doc field `rules`. Then set status `applied`.
- Docs with status `not_applied` come first: the Analista caught a rule that was skipped. Fix it in today's batch.
- Docs with status `failed` mean the fix did not improve the metric: do not keep using it; apply the Rastreador's new solution.
- `python3 studio/gate.py check ...` must print `GATE PASS` for every video on every platform before it is uploaded. On FAIL: fix the video, caption or schedule and run it again. Never publish on FAIL, never edit rules.json to make a video pass.
- After each verified post: `python3 studio/gate.py record ...`, and commit `studio/compliance/` and `studio/publish_log.json`.
- End of batch: in each research doc, write `compliance` (e.g. "S07-S09: R1-R9 cumplidas") with ifVersion.

## TikTok distribution rules (Analista/Rastreador, 26/11 — research doc r001)
All 7 TikToks posted 25-26/11 sit at 0 views while the 2 earlier posts got 115-135. Until this is solved:
- Never delete and re-upload the same video (duplicate detection). If a caption is wrong, leave it.
- Read the Content Check Lite result in the TikTok Studio upload form before posting. If it warns "Content may be restricted", do not post: note the warning in the dashboard research doc r001 and change the video (e.g. different opening/caption) before trying.
- Max 3 TikToks a day, at least 3 hours apart. Do not judge a post before 24 h.
- Keep "Creator labeled as AI-generated" ON (the narration is synthetic audio).
- Experiment running: one of the 3 daily TikToks without any YouTube mention in the caption (CTA only spoken at the end). Log which one in r001.
## Hook rules (research doc r002)
TikToks with data lost 64-81% of viewers by second 3. First frame = the most striking image of the story with the hook as on-screen text; spoken hook ≤ 10 words starting at 0.0 s (trim leading silence); no logo, no title card, no slow camera move in the first 2 s.


## Length, comments and Instagram rules (Analista/Rastreador 27/11 — research docs r003, r004, r006)
- R13 (r003): every short lasts 30-60 s on every platform. The 113-116 s TikToks were watched to the end only 0.4% of the time.
- R14 (r004): on YouTube, as soon as the short or episode is live, pin our own comment with ONE concrete question about the new clue (YouTube Help recommends pinned comments to ask a question).
- R15 (r004): TikTok and Instagram captions ask the viewer one concrete question about the story (must contain "?"), e.g. "Would you cut the line?".
- R16-R17 (r006): Instagram Reels have never been published. From today every short also goes to Instagram Reels and the episode Part 1 too, through Buffer (studio/PUBLISHING_CLOUD.md) with automatic publishing (not notification): 3 s-15 min, <= 300 MB, aspect 4:5-9:16. Check get_post shows status sent. S07-S09 are not on Instagram yet: publish them first (new files are allowed on a new platform; R1 is per platform).- R18 (r007): episodes get 0-42 views while Shorts get 44-205. Every YouTube Short gets its Related video set to the matching episode (YouTube Studio, Short > Related video). If the cloud run cannot reach Studio, do not skip it silently: add an alert event naming the Shorts still missing it.

## Posting times: the Rastreador decides, the Publicador obeys
Every morning the Rastreador rewrites `studio/schedule.json` (slots per platform: TikTok, Instagram Reels, YouTube Shorts, YouTube episode, Instagram Part 1) and explains the choice in `decision`.
How to choose (in this order; real numbers only, never invented):
1. The channel's own data: views and 3-second retention of each post by posting hour and weekday (Buffer `list_posts` with metrics, Windsor YouTube/TikTok data, YouTube Analytics through the repo workflow when available). Note how many posts back each hour; with fewer than 3 posts per hour slot, treat it as a HYPOTHESIS.
2. Where the audience is: the narration is English, so check audience country/timezone data; convert to Buenos Aires time.
3. Official platform guidance and reputable studies on best posting times per platform (cite them in `decision.sources`).
4. One experiment at a time: at most one slot per platform may be a test slot (`decision.experiment`), kept for 3 days before judging it.
Constraints: TikTok max 3 a day and >= 3 h apart (R2); slots between 09:30 and 23:30; the episode slot after the day's production usually finishes (>= 15:00).
Also write/update the research doc `research/horarios` (problem, evidence, decision, sources, status applied) so the dashboard shows it, and add an event "Horarios nuevos: ...". If the data does not justify a change, keep the slots and say so.
If schedule.json has `user_override_until` (times Felipe set by email) and that date has not passed, the Rastreador keeps his times and only writes its recommendation in research/horarios.
The Publicador re-reads schedule.json right before scheduling each post and uses the next free slot of that platform; gate rule R12 refuses any other time.

## Daily timeline (all in the cloud, no device)
09:02 Analista + Rastreador (scheduled task). 09:31 production starts (scheduled task) and works through the stages below; every hour at :31 until 23:31 a continuation run picks up any unfinished stage.
Progress is saved in `state/<YYYY-MM-DD>.json` ({"stage": ..., "done": [...], "posts": {...}}) and committed after every stage, so a later run resumes exactly where the last one stopped. If today's state says `complete`, the run ends at once.

## Steps
0. Publish everything listed in ../PENDING.md first and tick it off.
1. Run the Fix loop above (dashboard artifact slug 6fffd8bd-049e-490c-aa6b-da7200a14d8c, collection `research`). Nothing else starts until every fix is a rule in rules.json.
2. Script: `epNN/script.md`, 14 scenes `## eNN`, 1,450-1,600 words, first person, English. Hook in the first sentence, one new lore clue, CTA at the end.
3. Voice: Chatterbox default voice through the TTS workflow (section "Voice" above). Never Kokoro (except the documented fallback) and never ElevenLabs credits.
   Build plan.json + shots.txt so the episode lands at 10:15 (intro logo 6 s + scenes + holds).
4. Scenes: new `engine/scenesNN.js` + `screensNN.js`, register in `engine/index.html`. Check with `stills.py` before rendering.
5. Render with two `worker.py` processes (ports 8771/8772) sharing a job list: shorts first, the episode in parallel.
6. Finish: `finish.py` (episode) and `finish_short.sh SNN "TITLE"` (shorts). Captions: Anton 68 px at 1080 wide, 3-word chunks, y = 68% of height, white with black outline, yellow for on-screen/dialogue lines; `CAP_BOX=1` adds a dark band when the background is busy or white text.
7. Covers: `covers.py` — 16:9 (2-3 Anton lines, white + yellow, never repeat title words) and 9:16 for each short.
8. Gate: `gate.py check` for each video and platform (TikToks: schedule them >= 3 h apart with `--at` and TikTok Studio's schedule option). Only on GATE PASS: publish without asking (the user authorized publishing anything on-topic for the channel), following studio/PUBLISHING_CLOUD.md (Buffer, no device; the old browser flow in PUBLISHING.md is only a fallback): YouTube episode (cover, chapters, tags, AI disclosure, playlist The Lost Library, pinned question R14), 3 Shorts, 3 TikToks, 3 Instagram Reels + Instagram Part 1 (R16-R17). Verify every post in the content lists. Update Shorts descriptions with the episode link once it is live.
9. Update the dashboard workers and events; remove the batch from `v/`.
