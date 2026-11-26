// EP02 "NIGHTWALK" screens. Same conventions as screens.js: draw(g, w, h, t, dur) at internal resolution.
import { px } from './screens.js';
import { wrap, clamp01, ease } from './lib.js';

// black screen, white text typed one letter at a time
export function drawTyped(g, w, h, t, lines, cps = 14) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e6e6e0'; g.textAlign = 'center'; g.font = `${px(w, h, 10)}px monospace`;
  let n = Math.floor(t * cps);
  lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n)); n -= l.length + 6; g.fillText(s, w / 2, h * 0.46 + i * px(w, h, 16)); });
  g.textAlign = 'left';
}

export function drawTitleNW(g, w, h, t) {
  g.fillStyle = '#0d1012'; g.fillRect(0, 0, w, h);
  // road vanishing point
  g.fillStyle = '#1c1e1c'; g.beginPath(); g.moveTo(w * 0.47, h * 0.55); g.lineTo(w * 0.53, h * 0.55); g.lineTo(w * 0.8, h); g.lineTo(w * 0.2, h); g.fill();
  // streetlight
  g.fillStyle = '#2a2a2a'; g.fillRect(w * 0.64, h * 0.3, 2, h * 0.32);
  g.fillStyle = '#ffcf80'; g.fillRect(w * 0.64 - 4, h * 0.3, 10, 3);
  const gr = g.createRadialGradient(w * 0.64, h * 0.32, 2, w * 0.64, h * 0.32, h * 0.25);
  gr.addColorStop(0, 'rgba(255,200,120,0.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // fog moving TOWARD camera (puffs grow)
  for (let i = 0; i < 26; i++) {
    const k = ((t * 0.12 + i / 26) % 1), s = 10 + k * w * 0.5;
    g.fillStyle = `rgba(150,160,155,${0.05 * (1 - k)})`;
    g.fillRect(w / 2 - s / 2 + Math.sin(i * 7) * w * 0.3 * k, h * 0.55 + k * h * 0.3 - s * 0.15, s, s * 0.3);
  }
  g.fillStyle = '#e8e8e2'; g.textAlign = 'center'; g.font = `bold ${px(w, h, 26)}px Georgia, serif`;
  g.fillText('NIGHTWALK', w / 2, h * 0.3);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = `rgba(220,220,210,${0.5 + 0.5 * Math.sin(t * 3)})`;
  g.fillText('PRESS START', w / 2, h * 0.44);
  g.textAlign = 'left';
}

export function drawPauseNW(g, w, h, t, steps, distance) {
  g.fillStyle = 'rgba(0,0,0,0.78)'; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.fillStyle = '#e0e0e0';
  g.font = `bold ${px(w, h, 16)}px monospace`; g.fillText('PAUSE', w / 2, h * 0.2);
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#9a9a9a'; g.fillText('RULE 1', w / 2, h * 0.3);
  g.fillStyle = '#e8e8e8'; g.font = `${px(w, h, 11)}px monospace`; g.fillText('DO NOT LOOK BACK', w / 2, h * 0.36);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = '#d0d0d0';
  g.fillText('STEPS BEHIND YOU: ' + steps, w / 2, h * 0.5);
  if (distance) { g.fillStyle = (Math.floor(t * 2) % 2) ? '#ff5050' : '#e8e8e8'; g.fillText('DISTANCE: ' + distance, w / 2, h * 0.57); }
  g.fillStyle = '#7a7a7a'; g.font = `${px(w, h, 8)}px monospace`; g.fillText('CONTINUE      QUIT', w / 2, h * 0.75);
  g.textAlign = 'left';
}

export function drawMemoryCardNW(g, w, h, t, name, playTime, date) {
  const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#05081a'); grd.addColorStop(1, '#101a3a');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = '#b8c4ee'; g.fillText('MEMORY CARD (PS2) / SLOT 1', w * 0.06, h * 0.1);
  const cols = w > h ? 5 : 3, cw = w * 0.8 / cols, chh = h * (w > h ? 0.18 : 0.12), ox = w * 0.1, oy = h * (w > h ? 0.2 : 0.18);
  const colors = ['#c8503c', '#7a7a7a', '#3c8ac8', '#d8b040', '#50a060', '#a060c0'];
  for (let k = 0; k < cols * 2; k++) {
    const c = k % cols, r = Math.floor(k / cols); const x = ox + c * cw + cw / 2, y = oy + r * chh + chh / 2;
    const sz = Math.min(cw, chh) * 0.32, sx = Math.cos(t * (k === 1 ? 0.5 : 1.2) + k) * sz;
    g.fillStyle = colors[k % colors.length]; g.fillRect(x - Math.abs(sx), y - sz, Math.abs(sx) * 2, sz * 2);
    if (k === 1) { g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 4)})`; g.strokeRect(Math.round(x - cw / 2 + 2) + 0.5, Math.round(y - chh / 2 + 2) + 0.5, Math.round(cw - 4), Math.round(chh - 4)); }
  }
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(w * 0.06, h * 0.78, w * 0.88, h * 0.16);
  g.fillStyle = '#e8ecff'; g.font = `${px(w, h, 11)}px monospace`; g.fillText(name, w * 0.09, h * 0.84);
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#a8b4dd';
  g.fillText(`PLAY TIME ${playTime}`, w * 0.09, h * 0.9);
  g.fillText(`CREATED ${date}`, w * (w > h ? 0.5 : 0.09), h * (w > h ? 0.9 : 0.925));
}

// 2003 magazine preview scan
export function drawMagazine(g, w, h, t, zoom = 0) {
  g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h);
  const z = 1 + ease(zoom) * 0.8; g.save(); g.translate(w * 0.62, h * 0.3); g.scale(z, z); g.translate(-w * 0.62, -h * 0.3);
  g.fillStyle = '#b02020'; g.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.1);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 12)}px Georgia, serif`; g.fillText('PREVIEW · NIGHTWALK', w * 0.09, h * 0.13);
  g.fillStyle = '#1a1a1a'; g.fillRect(w * 0.06, h * 0.2, w * 0.4, h * 0.34);
  g.fillStyle = '#3a3a34'; g.beginPath(); g.moveTo(w * 0.25, h * 0.32); g.lineTo(w * 0.27, h * 0.32); g.lineTo(w * 0.4, h * 0.54); g.lineTo(w * 0.12, h * 0.54); g.fill();
  g.fillStyle = '#ffcf80'; g.fillRect(w * 0.3, h * 0.27, 4, 2);
  g.fillStyle = '#222'; g.font = `${px(w, h, 8)}px Georgia, serif`;
  wrap(g, 'A meditation on loneliness from the tiny team at Dead Pixel. One road, one lantern, one rule. "We wanted the player to feel accompanied," the studio told us.', w * 0.5, h * 0.24, w * 0.44, px(w, h, 10));
  g.fillStyle = '#b02020'; g.font = `bold ${px(w, h, 9)}px Georgia, serif`;
  g.fillText('UPDATE: CANCELLED', w * 0.06, h * 0.64);
  g.fillStyle = '#222'; g.font = `${px(w, h, 8)}px Georgia, serif`;
  wrap(g, 'Dead Pixel confirmed the project is on hold after an incident during testing. No further comment.', w * 0.06, h * 0.7, w * 0.86, px(w, h, 10));
  g.restore();
}

export function drawForumNW(g, w, h, t, reveal) {
  g.fillStyle = '#d4d0c8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a4a7a'; g.fillRect(0, 0, w, h * 0.1);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 10)}px Verdana, sans-serif`; g.fillText('RetroGamerBoards :: Lost & Unreleased', 6, h * 0.07);
  g.fillStyle = '#e8e6e0'; g.fillRect(6, h * 0.14, w - 12, h * 0.2);
  g.fillStyle = '#222'; g.font = `${px(w, h, 8)}px Verdana, sans-serif`;
  wrap(g, 'Re: NIGHTWALK (Dead Pixel, unreleased) — does anyone have a build?', 10, h * 0.18, w - 24, px(w, h, 10));
  g.fillStyle = '#f2f0ea'; g.fillRect(6, h * 0.38, w - 12, h * 0.5);
  g.fillStyle = '#222';
  const msg = 'The rear camera is still in the debug menu. Don\'t use it. He is not behind the player. He is behind you.';
  const n = Math.floor(msg.length * clamp01(reveal));
  wrap(g, msg.slice(0, n), 10, h * 0.43, w - 24, px(w, h, 11));
  g.font = `bold ${px(w, h, 9)}px Verdana, sans-serif`; g.fillStyle = '#1a2a6a'; g.fillText('— 0303200400', 10, h * 0.84);
}

export function drawDebugNW(g, w, h, t, sel) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#2aff6a';
  g.fillText('NIGHTWALK BUILD 0.7  [DEBUG]', 8, px(w, h, 16));
  const items = ['WARP TO STREETLIGHT', 'TOGGLE FOG', 'FREE LANTERN', 'SHOW STEP LOG', 'REAR CAMERA'];
  items.forEach((it, i) => {
    const y = px(w, h, 40) + i * px(w, h, 14);
    if (i === sel) { g.fillStyle = '#2aff6a'; g.fillRect(6, y - px(w, h, 10), w - 12, px(w, h, 13)); g.fillStyle = '#000'; }
    else g.fillStyle = i === 4 ? '#c8ffc8' : '#2aff6a';
    g.fillText((i === sel ? '> ' : '  ') + it, 10, y);
  });
}

export function drawCredits(g, w, h, t, dur) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const lines = ['NIGHTWALK', '', 'DESIGN', 'DEAD PIXEL STUDIOS', '', 'PROGRAMMING', 'DEAD PIXEL STUDIOS', '', 'ART', 'DEAD PIXEL STUDIOS', '', 'QUALITY ASSURANCE', 'T. ROWE', '', '', 'THANK YOU FOR WALKING WITH US.', 'YOU CAN STOP NOW.'];
  const lh = px(w, h, 14), total = lines.length * lh + h * 0.5;
  const y0 = h - Math.min(1, t / (dur * 0.85)) * (total - h * 0.35);
  g.textAlign = 'center';
  lines.forEach((l, i) => {
    const y = y0 + i * lh; if (y < -lh || y > h + lh) return;
    const head = ['DESIGN', 'PROGRAMMING', 'ART', 'QUALITY ASSURANCE'].includes(l);
    g.fillStyle = l === 'T. ROWE' ? '#ffffff' : head ? '#8a8a8a' : '#d8d8d8';
    g.font = `${l === 'NIGHTWALK' || l === 'T. ROWE' ? 'bold ' : ''}${px(w, h, l === 'NIGHTWALK' ? 16 : head ? 8 : 10)}px monospace`;
    g.fillText(l, w / 2, y);
  });
  g.textAlign = 'left';
}

export function drawStepHUD(g, w, h, n) {
  g.clearRect(0, 0, w, h); g.fillStyle = '#d8dcd0'; g.font = '9px monospace'; g.textBaseline = 'top';
  g.fillText('STEPS BEHIND YOU: ' + n, 6, 4);
}
