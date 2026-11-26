"""Word timing by pause-aware proportional alignment, and an ffmpeg drawtext chain for
3-word Anton captions. No speech model is available here, so timing is estimated: each
stretch of speech between pauses gets the words in proportion to their length."""
import re, subprocess, os

def speech_chunks(wav, start=0.0, end=None, noise='-35dB', d=0.16):
    args = ['ffmpeg', '-i', wav]
    if end is not None:
        args += ['-af', f'atrim={start}:{end},asetpts=PTS-STARTPTS,silencedetect=noise={noise}:d={d}']
    else:
        args += ['-af', f'silencedetect=noise={noise}:d={d}']
    err = subprocess.run(args + ['-f', 'null', '-'], capture_output=True, text=True).stderr
    dur = (end - start) if end is not None else float(subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
    ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]
    se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    if len(se) < len(ss): se.append(dur)
    chunks, t = [], 0.0
    for a, b in zip(ss, se):
        if a - t > 0.12: chunks.append((t, a))
        t = b
    if dur - t > 0.12: chunks.append((t, dur))
    return [(a + start, b + start) for a, b in chunks]

def align(words, chunks):
    """Spread words over speech chunks in proportion to letters, keeping order."""
    w = [max(2, len(re.sub(r'\W', '', x))) + 1 for x in words]
    total_len = sum(b - a for a, b in chunks)
    tot_w = sum(w)
    out, ci, used = [], 0, 0.0
    # walk a virtual speech clock that skips the pauses
    def at(v):
        acc = 0.0
        for a, b in chunks:
            if v <= acc + (b - a): return a + (v - acc)
            acc += b - a
        return chunks[-1][1]
    clock = 0.0
    for word, k in zip(words, w):
        d = total_len * k / tot_w
        out.append((word, at(clock), at(clock + d)))
        clock += d
    return out

def esc(t):
    return t.replace('\\', '\\\\').replace("'", "’").replace(':', '\\:').replace('%', '\\%').replace(',', '\\,')

def drawtext_chain(timed, W, H, font, yellow_phrases=(), offset=0.0, y_frac=0.60, size_frac=0.075):
    """3-word chunks; words inside a yellow phrase are drawn yellow."""
    ylw = set()
    flat = ' '.join(w for w, _, _ in timed).lower()
    for ph in yellow_phrases:
        toks = ph.lower().split()
        for i in range(len(timed) - len(toks) + 1):
            if [re.sub(r'[^\w:]', '', timed[i + j][0].lower()) for j in range(len(toks))] == [re.sub(r'[^\w:]', '', t) for t in toks]:
                ylw.update(range(i, i + len(toks)))
    # vertical: matches the first PS2.STORIES TikTok (cap height ~2.9% of frame) -> 68px at 1080 wide
    fs = int(W * size_frac * (16 / 9)) if W > H else int(W * 0.063)
    parts = []
    for i in range(0, len(timed), 3):
        grp = timed[i:i + 3]
        a, b = grp[0][1] + offset, grp[-1][2] + offset
        if i + 3 < len(timed): b = max(b, timed[i + 3][1] + offset - 0.02)
        text = ' '.join(w for w, _, _ in grp).upper()
        color = 'yellow' if any(j in ylw for j in range(i, i + len(grp))) else 'white'
        parts.append(f"drawtext=fontfile={font}:text='{esc(text)}':fontsize={fs}:fontcolor={color}:borderw={max(4, fs // 13)}:bordercolor=black" + (':box=1:boxcolor=black@0.8:boxborderw=14' if os.environ.get('CAP_BOX') else '') + ""
                     f":x=(w-tw)/2:y=h*{y_frac}-th/2:enable='between(t\\,{a:.2f}\\,{b:.2f})'")
    return parts
