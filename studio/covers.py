"""Build cover candidates: nearest-neighbour upscale of a frame + Anton text on a dark gradient.
Scores each at feed size and keeps the top 3 with different reasons to click."""
import json, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageStat

FONT = '/home/claude/dp/fonts/Anton.ttf'

def cover(frame_path, lines, out, size=(1280, 720), vertical=False):
    src = Image.open(frame_path).convert('RGB')
    W, H = size
    if vertical:
        img = src.resize(size, Image.NEAREST)
    else:  # push the subject right so the text sits on the dark left third
        k = 1.25
        big = src.resize((int(W * k), int(H * k)), Image.NEAREST)
        img = Image.new('RGB', size, (0, 0, 0))
        img.paste(big, (int(W * 0.30), -int(H * (k - 1) / 2)))
    grad = Image.new('L', size, 0); g = ImageDraw.Draw(grad)
    if vertical:  # dark band behind text in the upper-middle, clear of TikTok's right rail and bottom caption
        for y in range(H):
            a = max(0, 1 - abs(y - H * 0.30) / (H * 0.22)); g.line([(0, y), (W, y)], fill=int(205 * a))
    else:
        for x in range(W):
            a = max(0, 1 - x / (W * 0.62)); g.line([(x, 0), (x, H)], fill=int(215 * a))
    img = Image.composite(Image.new('RGB', size, (0, 0, 0)), img, grad)
    d = ImageDraw.Draw(img)
    fs = int(H * (0.085 if vertical else 0.19))
    font = ImageFont.truetype(FONT, fs)
    y = int(H * 0.17) if vertical else int(H * 0.16)
    for i, (txt, yellow) in enumerate(lines):
        x = int(W * 0.07)
        if vertical:
            tw = d.textlength(txt, font=font); x = int((W * 0.86 - tw) / 2)  # keep off the right-hand buttons
        d.text((x + 6, y + 6), txt, font=font, fill=(0, 0, 0))
        d.text((x, y), txt, font=font, fill=(255, 214, 0) if yellow else (255, 255, 255))
        y += int(fs * 1.08)
    # the dead pixel stamp
    s = int(min(W, H) * 0.045); m = int(min(W, H) * 0.035)
    d.rectangle([W - m - s, m, W - m, m + s], outline=(230, 230, 230), width=max(2, s // 8))
    d.rectangle([W - m - s // 2 + 1, m, W - m, m + s // 2 - 1], fill=(0, 0, 0))
    img.save(out)
    return img

def feed_score(img):
    small = img.resize((168, 94), Image.BILINEAR).convert('L')
    st = ImageStat.Stat(small)
    contrast = st.stddev[0] / 64.0
    edges = ImageStat.Stat(small.filter(ImageFilter.FIND_EDGES)).mean[0] / 40.0
    return round(min(1, contrast) * 60 + min(1, edges) * 40, 1)

if __name__ == '__main__':
    specs = json.load(open(sys.argv[1]))
    res = []
    for s in specs:
        im = cover(s['frame'], [(l[0], l[1]) for l in s['lines']], s['out'])
        res.append({**s, 'score': feed_score(im)})
    res.sort(key=lambda r: -r['score'])
    for r in res: print(r['score'], r['reason'], '|', ' / '.join(l[0] for l in r['lines']), '|', r['out'])
    json.dump(res, open(sys.argv[2], 'w'), indent=1)
