"""Run by GitHub Actions: for every jobs/youtube/*.json not yet done, set the custom thumbnail,
the altered/synthetic-content flag and the playlist on the user's own YouTube channel.
Secrets (set by the user in GitHub, never in the repo): YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN.
Job file: {"video_id": "...", "thumbnail": "covers/EP03_16x9.jpg", "synthetic": true, "playlist_id": "PL..."}"""
import glob, json, os, sys, urllib.parse, urllib.request

def token():
    data = urllib.parse.urlencode({"client_id": os.environ["YT_CLIENT_ID"], "client_secret": os.environ["YT_CLIENT_SECRET"],
                                   "refresh_token": os.environ["YT_REFRESH_TOKEN"], "grant_type": "refresh_token"}).encode()
    return json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", data))["access_token"]

def call(url, tok, body=None, method="GET", ctype="application/json"):
    req = urllib.request.Request(url, data=body, method=method, headers={"Authorization": "Bearer " + tok, "Content-Type": ctype})
    return json.load(urllib.request.urlopen(req))

def main():
    tok, failed = token(), 0
    for path in sorted(glob.glob("jobs/youtube/*.json")):
        job = json.load(open(path))
        if job.get("done"):
            continue
        vid, res = job["video_id"], {}
        try:
            if job.get("thumbnail"):
                ct = "image/png" if job["thumbnail"].endswith(".png") else "image/jpeg"
                call("https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=" + vid, tok,
                     open(job["thumbnail"], "rb").read(), "POST", ct)
                res["thumbnail"] = "ok"
            if job.get("synthetic"):
                v = call("https://www.googleapis.com/youtube/v3/videos?part=status&id=" + vid, tok)["items"][0]
                st = v["status"]; st["containsSyntheticMedia"] = True
                call("https://www.googleapis.com/youtube/v3/videos?part=status", tok,
                     json.dumps({"id": vid, "status": st}).encode(), "PUT")
                res["synthetic"] = "ok"
            if job.get("playlist_id"):
                call("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", tok, json.dumps(
                    {"snippet": {"playlistId": job["playlist_id"], "resourceId": {"kind": "youtube#video", "videoId": vid}}}).encode(), "POST")
                res["playlist"] = "ok"
            job["done"] = True
        except Exception as e:
            failed += 1
            res["error"] = str(e)[:300]
        job["result"] = res
        json.dump(job, open(path, "w"), indent=1)
        print(path, res)
    sys.exit(1 if failed else 0)

main()
