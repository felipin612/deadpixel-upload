// 2D "screen" scenes: PS2 menus, memory card browser, forum, newspaper, cards.
// Each draw(g, w, h, t, dur) paints a full frame onto a canvas at internal resolution.
import * as THREE from 'three';
import { wrap, clamp01, ease } from './lib.js';

export function screenScene(W, H, draw) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex }));
  scene.add(plane);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    scene, camera, hud: null, canvas: c,
    update(t, dur) { draw(g, W, H, t, dur); tex.needsUpdate = true; },
  };
}

// Fixed pixel font sizes scaled to the shorter side so 9:16 still reads.
export const px = (W, H, n) => Math.max(6, Math.round(n * Math.min(W, H) / 270));

export function drawBootSwirl(g, w, h, t) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, s = Math.min(w, h);
  // muddy green towers rising, like a corrupted PS2 boot
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + t * 0.4;
    const r = s * 0.22;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.45;
    const hh = s * (0.08 + 0.1 * Math.abs(Math.sin(t * 1.3 + i)));
    g.fillStyle = `rgba(${70 + i * 6},${110 + i * 4},${60},0.85)`;
    g.fillRect(Math.round(x - 3), Math.round(y - hh), 6, Math.round(hh));
  }
  g.fillStyle = 'rgba(120,150,110,0.15)'; g.fillRect(0, cy + s * 0.12, w, 1);
}

export function drawBrowser(g, w, h, t) {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#0a1430'); grd.addColorStop(1, '#02050d'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9fb4e8'; g.font = `${px(w, h, 12)}px monospace`; g.textAlign = 'center';
  g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2.5);
  g.fillText('Please insert a disc.', w / 2, h * 0.55);
  g.globalAlpha = 1;
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#5f6f99';
  g.fillText('Browser', w * 0.3, h * 0.38); g.fillText('System Configuration', w * 0.7, h * 0.38);
  g.textAlign = 'left';
}

export function drawTitle(g, w, h, t, fogSeed = 0) {
  g.fillStyle = '#4a524c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const y = (i * 37 + fogSeed) % h, x = ((t * 6 + i * 53) % (w + 80)) - 40;
    g.fillStyle = 'rgba(150,160,150,0.06)'; g.fillRect(x, y, 80, 18);
  }
  // town silhouette
  g.fillStyle = '#2c322e';
  for (let i = 0; i < 9; i++) { const x = w * 0.08 + i * w * 0.1, hh = h * (0.05 + (i % 3) * 0.02); g.fillRect(x, h * 0.7 - hh, w * 0.06, hh); g.fillRect(x + w * 0.005, h * 0.7 - hh - 6, w * 0.05, 6); }
  g.fillRect(0, h * 0.7, w, h * 0.3);
  g.fillStyle = '#e6e6e0'; g.textAlign = 'center';
  g.font = `bold ${px(w, h, 30)}px Georgia, serif`;
  g.fillText('SALTMARSH', w / 2, h * 0.42);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = `rgba(220,220,210,${0.5 + 0.5 * Math.sin(t * 3)})`;
  g.fillText('PRESS START', w / 2, h * 0.58);
  g.textAlign = 'left';
}

// Memory card browser. playTime e.g. '99:59', date '03/03/2004'
export function drawMemoryCard(g, w, h, t, playTime, date, highlightOn = true) {
  const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#05081a'); grd.addColorStop(1, '#101a3a');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = '#b8c4ee'; g.fillText('MEMORY CARD (PS2) / SLOT 1', w * 0.06, h * 0.1);
  const cols = w > h ? 5 : 3, rows = 3, cw = w * 0.8 / cols, chh = h * (w > h ? 0.18 : 0.12);
  const ox = w * 0.1, oy = h * (w > h ? 0.2 : 0.18);
  const colors = ['#c8503c', '#3c8ac8', '#d8b040', '#50a060', '#a060c0', '#6a6a6a', '#c07040', '#40a0a0', '#9090d0', '#b04070', '#70a040', '#d0d0d0', '#8a5a3a', '#4a6ab0', '#b0b050'];
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++, k++) {
    const x = ox + c * cw + cw / 2, y = oy + r * chh + chh / 2;
    const isSlot3 = k === 2;
    const sz = Math.min(cw, chh) * 0.32, a = t * (isSlot3 ? 0.6 : 1.2) + k;
    g.save(); g.translate(x, y);
    g.fillStyle = isSlot3 ? '#7a7a7a' : colors[k % colors.length];
    // fake rotating cube: two parallelograms
    const sx = Math.cos(a) * sz;
    g.fillRect(-Math.abs(sx), -sz, Math.abs(sx) * 2, sz * 2);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-Math.abs(sx), 0, Math.abs(sx) * 2, sz);
    g.restore();
    if (isSlot3 && highlightOn) {
      g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 4)})`; g.lineWidth = 1;
      g.strokeRect(Math.round(x - cw / 2 + 2) + 0.5, Math.round(y - chh / 2 + 2) + 0.5, Math.round(cw - 4), Math.round(chh - 4));
    }
  }
  // info panel
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(w * 0.06, h * 0.78, w * 0.88, h * 0.16);
  g.fillStyle = '#e8ecff'; g.font = `${px(w, h, 11)}px monospace`;
  g.fillText('SALTMARSH', w * 0.09, h * 0.84);
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#a8b4dd';
  g.fillText(`PLAY TIME ${playTime}`, w * 0.09, h * 0.9);
  g.fillText(`CREATED ${date}`, w * (w > h ? 0.5 : 0.09), h * (w > h ? 0.9 : 0.925));
}

export function drawForum(g, w, h, t, reveal) {
  g.fillStyle = '#d4d0c8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a4a7a'; g.fillRect(0, 0, w, h * 0.1);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 10)}px Verdana, sans-serif`; g.fillText('RetroGamerBoards :: Lost & Unreleased', 6, h * 0.07);
  g.fillStyle = '#e8e6e0'; g.fillRect(6, h * 0.14, w - 12, h * 0.26);
  g.fillStyle = '#222'; g.font = `${px(w, h, 8)}px Verdana, sans-serif`;
  wrap(g, 'Posted 2006 by nightowl_77: Anyone remember a small studio in Seattle that closed overnight? Dead Pixel? Never released anything.', 10, h * 0.17, w - 24, px(w, h, 10));
  g.fillStyle = '#f2f0ea'; g.fillRect(6, h * 0.44, w - 12, h * 0.46);
  g.fillStyle = '#222';
  wrap(g, 'They were working on a game for kids. A town that keeps you company. The lead tester stopped coming in. Then the studio stopped coming in.', 10, h * 0.48, w - 24, px(w, h, 10));
  // username, blurred then sharp
  const name = 'deadpixel-123';
  g.font = `bold ${px(w, h, 9)}px Verdana, sans-serif`;
  const nx = 10, ny = h * 0.84;
  if (reveal < 1) {
    g.fillStyle = '#556'; const bw = g.measureText(name).width;
    for (let i = 0; i < bw; i += 3) g.fillRect(nx + i, ny - 8, 3, 9 * (0.5 + 0.5 * Math.sin(i + t * 9)) * (1 - reveal) + 1);
    g.globalAlpha = reveal;
  }
  g.fillStyle = '#1a2a6a'; g.fillText('— ' + name, nx, ny); g.globalAlpha = 1;
}

// Newspaper scan with zoom on the far-left figure. zoom 0..1
export function drawNewspaper(g, w, h, t, zoom) {
  // render the photo at tiny resolution, then upscale by drawing blocks
  const PW = 64, PH = 40;
  const pc = drawNewspaper.pc || (drawNewspaper.pc = (() => {
    const c = document.createElement('canvas'); c.width = PW; c.height = PH; const p = c.getContext('2d');
    p.fillStyle = '#b8b4a8'; p.fillRect(0, 0, PW, PH);
    p.fillStyle = '#7a5a4a'; p.fillRect(0, 4, PW, 26); // brick office
    p.fillStyle = '#e8e4d8'; p.fillRect(12, 8, 40, 5); // banner
    p.fillStyle = '#333'; p.font = '4px sans-serif'; p.fillText('DEAD PIXEL STUDIOS', 13, 12);
    const xs = [8, 20, 32, 44, 56];
    xs.forEach((x, i) => {
      p.fillStyle = i === 0 ? '#6a6a70' : ['#33405a', '#5a3a3a', '#3a5a3a', '#4a4a4a'][i - 1];
      p.fillRect(x - 3, 20, 6, 14); p.fillStyle = i === 0 ? '#6a6a70' : '#c8a888'; p.fillRect(x - 2, 15, 4, 5);
    });
    p.fillStyle = '#000'; p.fillRect(7, 17, 1, 1); // the dead pixel on the tester's eye
    return c; })());
  g.fillStyle = '#d8d4c8'; g.fillRect(0, 0, w, h);
  const z = 1 + ease(zoom) * 9;
  const k = ease(Math.min(1, zoom * 2.2)); const cx = 8 * k + PW / 2 * (1 - k), cy = 17 * k + PH / 2 * (1 - k);
  const scale = Math.min(w / PW, h * 0.8 / PH) * 0.9 * z;
  g.imageSmoothingEnabled = false;
  g.drawImage(pc, w / 2 - cx * scale, h * 0.45 - cy * scale, PW * scale, PH * scale);
  if (zoom < 0.1) {
    g.fillStyle = '#333'; g.font = `${px(w, h, 8)}px Georgia, serif`;
    g.fillText('The team behind Dead Pixel Studios, 2003. Back row: ... and our tester.', w * 0.06, h * 0.93);
  }
}

export function drawCard(g, w, h, t, lines, alpha = 1) {
  g.clearRect(0, 0, w, h);
  g.globalAlpha = alpha; g.fillStyle = '#e8e8e0'; g.textAlign = 'center';
  lines.forEach((l, i) => { g.font = `${i === 0 ? 'bold ' : ''}${px(w, h, i === 0 ? 14 : 9)}px monospace`; g.fillText(l, w / 2, h * 0.16 + i * px(w, h, 14)); });
  g.textAlign = 'left'; g.globalAlpha = 1;
}

export function drawLogo(g, w, h, t, missing = 2) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const s = Math.round(Math.min(w, h) * 0.22), x = Math.round(w / 2 - s / 2), y = Math.round(h * 0.38 - s / 2);
  const a = clamp01(t / 1.2);
  g.globalAlpha = a;
  g.strokeStyle = '#d8d8d8'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, s - 2, s - 2);
  // grid of pixels, some missing
  const n = 6, c = s / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const k = i * n + j; if (k < missing) continue;
    g.fillStyle = (i + j) % 2 ? '#bdbdbd' : '#d8d8d8'; g.fillRect(Math.round(x + j * c + 2), Math.round(y + i * c + 2), Math.ceil(c - 3), Math.ceil(c - 3));
  }
  g.fillStyle = '#000'; g.fillRect(Math.round(x + s - c), Math.round(y), Math.ceil(c), Math.ceil(c));
  g.fillStyle = '#e0e0e0'; g.textAlign = 'center'; g.font = `bold ${px(w, h, 14)}px monospace`;
  g.fillText('DEAD PIXEL', w / 2, y + s + px(w, h, 22));
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#9a9a9a'; g.fillText('STUDIOS', w / 2, y + s + px(w, h, 34));
  g.textAlign = 'left'; g.globalAlpha = 1;
}

export function drawLoading(g, w, h, t) {
  g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c8c8c8'; g.textAlign = 'center';
  g.font = `${px(w, h, 10)}px monospace`;
  g.fillText('NOW LOADING', w / 2, h * 0.46);
  const bw = w * 0.5, p = Math.min(1, (t % 6) / 5);
  g.strokeStyle = '#888'; g.strokeRect(Math.round(w / 2 - bw / 2) + 0.5, Math.round(h * 0.52) + 0.5, Math.round(bw), 6);
  g.fillStyle = '#d8d8d8'; g.fillRect(Math.round(w / 2 - bw / 2) + 2, Math.round(h * 0.52) + 2, Math.round((bw - 3) * p), 3);
  g.fillStyle = '#8a8a8a'; g.font = `${px(w, h, 8)}px monospace`;
  g.fillText('TIP: Do not save over slot 3.', w / 2, h * 0.72);
  g.textAlign = 'left';
}

export function drawDebug(g, w, h, t, sel) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#2aff6a';
  g.fillText('SALTMARSH BUILD 0.9  [DEBUG]', 8, px(w, h, 16));
  const items = ['WARP TO HOUSE 01', 'TOGGLE FOG', 'SHOW COLLISION', 'FREE CAMERA', 'SPAWN TESTER', 'RESET MEMORY CARD'];
  items.forEach((it, i) => {
    const y = px(w, h, 40) + i * px(w, h, 14);
    if (i === sel) { g.fillStyle = '#2aff6a'; g.fillRect(6, y - px(w, h, 10), w - 12, px(w, h, 13)); g.fillStyle = '#000'; }
    else g.fillStyle = i === 4 ? '#c8ffc8' : '#2aff6a';
    g.fillText((i === sel ? '> ' : '  ') + it, 10, y);
  });
}

export function drawPause(g, w, h, t) {
  g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e0e0e0'; g.textAlign = 'center';
  g.font = `bold ${px(w, h, 16)}px monospace`; g.fillText('PAUSE', w / 2, h * 0.22);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = '#b8b8b8';
  g.fillText('CONTROLLERS CONNECTED', w / 2, h * 0.32);
  g.fillStyle = '#e8e8e8'; g.fillText('PLAYER 1', w / 2, h * 0.39);
  g.fillStyle = (Math.floor(t * 2) % 2) ? '#ff5050' : '#e8e8e8'; g.fillText('PLAYER 2', w / 2, h * 0.45);
  g.textAlign = 'left';
}

export function drawCTA(g, w, h, t) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const a = Math.min(1, t / 0.4); g.globalAlpha = a; g.textAlign = 'center';
  const s = Math.round(Math.min(w, h) * 0.12), x = Math.round(w / 2 - s / 2), y = Math.round(h * 0.30);
  g.strokeStyle = '#ddd'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, s - 2, s - 2); g.fillStyle = '#000'; g.fillRect(x + s - s / 3, y, s / 3, s / 3);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 16)}px monospace`; g.fillText('FULL STORY', w / 2, y + s + px(w, h, 26));
  g.fillStyle = '#ffd600'; g.fillText('ON YOUTUBE', w / 2, y + s + px(w, h, 44));
  g.fillStyle = '#aaa'; g.font = `${px(w, h, 9)}px monospace`; g.fillText('DEAD PIXEL STUDIOS', w / 2, y + s + px(w, h, 62));
  g.textAlign = 'left'; g.globalAlpha = 1;
}
