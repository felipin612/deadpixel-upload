"""Run by GitHub Actions (R25): upload the YouTube episode through the YouTube Data API, scheduled at the
Rastreador's slot (status.privacyStatus private + publishAt), with AI disclosure, custom thumbnail and playlist.
Job file jobs/upload/<ID>.json:
{"file": "v/EP05.mp4", "title": "...", "description": "...", "tags": ["..."], "publish_at": "2026-11-28T16:00:00-03:00",
 "thumbnail": "covers/EP05_16x9.jpg", "playlist_title": "The Lost Library"}
Writes back "video_id", "result" and "done": true. Secrets: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN."""
import glob, json, os, sys, urllib.error, urllib.parse, urllib.request

def token():
    env = {k: os.environ.get(k, "").strip() for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")}
    print("secrets present:", {k: bool(v) for k, v in env.items()},
          "client id looks right:", env["YT_CLIENT_ID"].endswith(".apps.googleusercontent.com"),
          "refresh token looks right:", env["YT_REFRESH_TOKEN"].startswith("1//"))
    data = urllib.parse.urlencode({"client_id": env["YT_CLIENT_ID"], "client_secret": env["YT_CLIENT_SECRET"],
                                   "refresh_token": env["YT_REFRESH_TOKEN"], "grant_type": "refresh_token"}).encode()
    try:
        return json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", data))["access_token"]
    except urllib.error.HTTPError as e:
        body = json.loads(e.read() or b"{}")
        print("Google token error:", e.code, body.get("error"), body.get("error_description"))
        raise SystemExit(1)

def call(url, tok, body=None, method="GET", ctype="application/json"):
    req = urllib.request.Request(url, data=body, method=method, headers={"Authorization": "Bearer " + tok, "Content-Type": ctype})
    return json.load(urllib.request.urlopen(req))


def upload(tok, job):
    meta = {"snippet": {"title": job["title"], "description": job["description"], "tags": job.get("tags", []),
                        "categoryId": job.get("category_id", "24"), "defaultLanguage": "en", "defaultAudioLanguage": "en"},
            "status": {"privacyStatus": "private", "publishAt": job["publish_at"], "selfDeclaredMadeForKids": False,
                       "containsSyntheticMedia": True, "embeddable": True, "license": "youtube"}}
    data = open(job["file"], "rb").read()
    req = urllib.request.Request("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                                 data=json.dumps(meta).encode(), method="POST",
                                 headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json; charset=UTF-8",
                                          "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(len(data))})
    loc = urllib.request.urlopen(req).headers["Location"]
    put = urllib.request.Request(loc, data=data, method="PUT", headers={"Content-Type": "video/mp4", "Content-Length": str(len(data))})
    return json.load(urllib.request.urlopen(put, timeout=1800))

def main():
    tok, failed = token(), 0
    for path in sorted(glob.glob("jobs/upload/*.json")):
        job = json.load(open(path))
        if job.get("done"):
            continue
        res = job.get("result", {})
        try:
            if not job.get("video_id"):
                v = upload(tok, job); job["video_id"] = v["id"]; res["upload"] = "ok"
                res["status"] = v.get("status", {})
                json.dump(job | {"result": res}, open(path, "w"), indent=1)
            vid = job["video_id"]
            if job.get("thumbnail") and res.get("thumbnail") != "ok":
                ct = "image/png" if job["thumbnail"].endswith(".png") else "image/jpeg"
                call("https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=" + vid, tok, open(job["thumbnail"], "rb").read(), "POST", ct)
                res["thumbnail"] = "ok"
            if job.get("playlist_title") and res.get("playlist") != "ok":
                pls = call("https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50", tok).get("items", [])
                pl = next((p["id"] for p in pls if p["snippet"]["title"].strip().lower() == job["playlist_title"].lower()), None)
                if pl:
                    call("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", tok, json.dumps(
                        {"snippet": {"playlistId": pl, "resourceId": {"kind": "youtube#video", "videoId": vid}}}).encode(), "POST")
                    res["playlist"] = "ok"; res["playlist_id"] = pl
                else:
                    res["playlist"] = "not found: " + ", ".join(p["snippet"]["title"] for p in pls)
            job["done"] = True
        except urllib.error.HTTPError as e:
            failed += 1; res["error"] = f"{e.code} {e.read()[:400].decode(errors='replace')}"
        except Exception as e:
            failed += 1; res["error"] = repr(e)[:400]
        job["result"] = res
        json.dump(job, open(path, "w"), indent=1)
        print(path, json.dumps(res)[:600])
    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
