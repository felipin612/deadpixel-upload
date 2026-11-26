import * as THREE from 'three';

// ---------- deterministic random ----------
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ---------- low-res procedural textures ----------
const texCache = {};
function canvasTex(key, size, draw, repeat = [1, 1]) {
  const k = key + repeat.join('x');
  if (texCache[k]) return texCache[k];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size, rng(key.length * 7919 + size));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
  texCache[k] = t; return t;
}
function noise(g, s, r, base, amp) {
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const n = (r() - 0.5) * amp;
    g.fillStyle = `rgb(${base[0] + n | 0},${base[1] + n | 0},${base[2] + n | 0})`;
    g.fillRect(x, y, 1, 1);
  }
}
export const TEX = {
  dirt: (rep) => canvasTex('dirt', 32, (g, s, r) => noise(g, s, r, [74, 66, 52], 26), rep),
  grass: (rep) => canvasTex('grass', 32, (g, s, r) => noise(g, s, r, [52, 62, 44], 22), rep),
  planks: (col, rep) => canvasTex('planks' + col, 32, (g, s, r) => {
    noise(g, s, r, col, 18);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let y = 0; y < s; y += 6) g.fillRect(0, y, s, 1);
  }, rep),
  brick: (rep) => canvasTex('brick', 32, (g, s, r) => {
    noise(g, s, r, [112, 58, 44], 20);
    g.fillStyle = 'rgba(40,30,28,0.8)';
    for (let y = 0; y < s; y += 4) { g.fillRect(0, y, s, 1); for (let x = (y / 4) % 2 ? 0 : 4; x < s; x += 8) g.fillRect(x, y, 1, 4); }
  }, rep),
  roof: (rep) => canvasTex('roof', 32, (g, s, r) => {
    noise(g, s, r, [48, 44, 46], 16); g.fillStyle = 'rgba(0,0,0,0.4)';
    for (let y = 0; y < s; y += 4) g.fillRect(0, y, s, 1);
  }, rep),
  carpet: (col, rep) => canvasTex('carpet' + col, 16, (g, s, r) => noise(g, s, r, col, 14), rep),
  wall: (col, rep) => canvasTex('wall' + col, 16, (g, s, r) => noise(g, s, r, col, 8), rep),
  stone: (rep) => canvasTex('stone', 32, (g, s, r) => {
    noise(g, s, r, [88, 88, 84], 22); g.fillStyle = 'rgba(30,30,30,0.6)';
    for (let y = 0; y < s; y += 8) { g.fillRect(0, y, s, 1); for (let x = (y / 8) % 2 ? 0 : 8; x < s; x += 16) g.fillRect(x, y, 1, 8); }
  }, rep),
};

export function lambert(opts) { return new THREE.MeshLambertMaterial(opts); }
export function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

// ---------- canvas text / UI textures ----------
export function textCanvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return { canvas: c, ctx: g, tex: t, redraw(fn) { fn(g, w, h); t.needsUpdate = true; } };
}

// A screen-space sprite for the HUD (ortho camera, origin bottom-left, pixels)
export function hudSprite(hud, w, h, x, y, draw) {
  const tc = textCanvas(w, h, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tc.tex, transparent: true, depthTest: false }));
  m.position.set(x + w / 2, y + h / 2, 0); hud.add(m);
  return { mesh: m, tc };
}

// Classic PS2 RPG text box drawn with a pixel font look
export function drawTextBox(g, w, h, text, chars = 9999) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(8,10,24,0.86)'; g.fillRect(2, 2, w - 4, h - 4);
  g.strokeStyle = '#c8c8d0'; g.lineWidth = 1; g.strokeRect(3.5, 3.5, w - 7, h - 7);
  g.fillStyle = '#e8e8e8'; g.font = '10px monospace'; g.textBaseline = 'top';
  const shown = text.slice(0, chars);
  wrap(g, shown, 10, 10, w - 20, 12);
}
export function wrap(g, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const wd of words) {
    const test = line ? line + ' ' + wd : wd;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); line = wd; y += lh; }
    else line = test;
  }
  if (line) g.fillText(line, x, y);
}

// ---------- builders ----------
export function house(opts = {}) {
  const { w = 4, d = 4, h = 3, wall = [92, 80, 64], roofH = 1.6, lit = false, litColor = 0xffc070,
    door = true, doorOpen = false, porch = false, stories = 1, brick = false } = opts;
  const g = new THREE.Group();
  const wallMat = lambert({ map: brick ? TEX.brick([2, 2]) : TEX.planks(wall, [2, 2]) });
  const H2 = h * stories;
  const body = box(w, H2, d, wallMat); body.position.y = H2 / 2; g.add(body);
  // roof: two slanted boxes
  const roofMat = lambert({ map: TEX.roof([2, 1]) });
  if (!brick) {
    const slope = Math.atan2(roofH, w / 2), len = Math.hypot(roofH, w / 2) + 0.2;
    for (const s of [-1, 1]) {
      const r = box(len, 0.15, d + 0.4, roofMat);
      r.position.set(s * w / 4, H2 + roofH / 2, 0); r.rotation.z = -s * slope; g.add(r);
    }
    const gable = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w / 2, 0, 0), new THREE.Vector3(w / 2, 0, 0), new THREE.Vector3(0, roofH, 0)]), wallMat);
    gable.geometry.computeVertexNormals();
    const gf = gable.clone(); gf.position.set(0, H2, d / 2 + 0.001); g.add(gf);
    const gb = gable.clone(); gb.position.set(0, H2, -d / 2 - 0.001); gb.rotation.y = Math.PI; g.add(gb);
  } else {
    const r = box(w + 0.2, 0.3, d + 0.2, roofMat); r.position.y = H2 + 0.15; g.add(r);
  }
  // windows
  const winMat = lit ? new THREE.MeshBasicMaterial({ color: litColor }) : lambert({ color: 0x141618 });
  const wins = [];
  for (let s = 0; s < stories; s++) for (const x of [-w / 4, w / 4]) {
    const wm = box(0.7, 0.8, 0.05, winMat.clone()); wm.position.set(x, s * h + h * 0.6, d / 2 + 0.03); g.add(wm); wins.push(wm);
  }
  if (door) {
    const dm = box(0.8, 1.6, 0.05, lambert({ color: doorOpen ? 0x000000 : 0x3a2a1e }));
    dm.position.set(0, 0.8, d / 2 + 0.03); if (doorOpen) dm.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    g.add(dm); g.userData.door = dm;
  }
  if (porch) {
    const p = box(w * 0.7, 0.15, 1.2, lambert({ color: 0xd8d8d0 })); p.position.set(0, 0.08, d / 2 + 0.6); g.add(p);
    for (const x of [-w * 0.32, w * 0.32]) { const c = box(0.12, 1.8, 0.12, lambert({ color: 0xe0e0d8 })); c.position.set(x, 0.9, d / 2 + 1.1); g.add(c); }
    const top = box(w * 0.7, 0.12, 1.2, lambert({ color: 0xd8d8d0 })); top.position.set(0, 1.85, d / 2 + 0.6); g.add(top);
  }
  if (lit) { const l = new THREE.PointLight(litColor, 3, 8, 2); l.position.set(0, h * 0.6, d / 2 + 1); g.add(l); }
  g.userData.windows = wins;
  return g;
}

export function church() {
  const g = new THREE.Group();
  const m = lambert({ map: TEX.planks([70, 68, 64], [3, 3]) });
  const body = box(6, 5, 10, m); body.position.y = 2.5; g.add(body);
  const roofMat = lambert({ map: TEX.roof([3, 1]) });
  for (const s of [-1, 1]) { const r = box(4.6, 0.2, 10.6, roofMat); r.position.set(s * 1.5, 6.3, 0); r.rotation.z = -s * 0.75; g.add(r); }
  const tower = box(2, 5, 2, m); tower.position.set(0, 7.5, 4); g.add(tower);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 4), roofMat); spire.position.set(0, 11.5, 4); spire.rotation.y = Math.PI / 4; g.add(spire);
  // no door: blank front wall; a dark gap at the back
  const gap = box(0.9, 2.2, 0.1, new THREE.MeshBasicMaterial({ color: 0x000000 })); gap.position.set(0, 1.1, -5.03); g.add(gap);
  return g;
}

export function ground(THREE_, size = 200) {
  const g = new THREE.Group();
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(size, size), lambert({ map: TEX.grass([size / 4, size / 4]) }));
  grass.rotation.x = -Math.PI / 2; g.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4, size), lambert({ map: TEX.dirt([1, size / 4]) }));
  road.rotation.x = -Math.PI / 2; road.position.y = 0.01; g.add(road);
  return g;
}

export function lantern() {
  const g = new THREE.Group();
  const body = box(0.08, 0.12, 0.08, new THREE.MeshBasicMaterial({ color: 0xffc070 })); g.add(body);
  const frame = box(0.14, 0.03, 0.14, lambert({ color: 0x222222 })); frame.position.y = 0.1; g.add(frame);
  const light = new THREE.PointLight(0xffa040, 14, 16, 1.4); g.add(light); g.userData.light = light;
  return g;
}

// A CRT TV whose screen shows a canvas texture
export function crt(screenTex) {
  const g = new THREE.Group();
  const shell = box(1.3, 1.05, 1.0, lambert({ color: 0x2a2a2c })); shell.position.z = -0.4; g.add(shell);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), new THREE.MeshBasicMaterial({ map: screenTex }));
  screen.position.z = 0.105; g.add(screen);
  const glow = new THREE.PointLight(0x8090ff, 1.6, 5, 2); glow.position.z = 0.8; g.add(glow);
  g.userData.screen = screen; g.userData.glow = glow;
  return g;
}

export function ps2(lightOn = true) {
  const g = new THREE.Group();
  const b = box(0.75, 0.18, 0.6, lambert({ color: 0x15151a })); g.add(b);
  const led = box(0.03, 0.03, 0.01, new THREE.MeshBasicMaterial({ color: lightOn ? 0x30ff60 : 0x401010 }));
  led.position.set(0.3, 0.02, 0.305); g.add(led); g.userData.led = led;
  return g;
}

export function figure(color = 0x6a6a70) {
  const g = new THREE.Group(); const m = lambert({ color });
  const body = box(0.7, 0.9, 0.45, m); body.position.y = 0.45; g.add(body);
  const head = box(0.4, 0.45, 0.42, m); head.position.y = 1.15; g.add(head);
  const hood = box(0.48, 0.3, 0.5, m); hood.position.set(0, 1.3, 0.02); g.add(hood);
  return g;
}

export function room(w, h, d, wallCol, floorTex) {
  const g = new THREE.Group();
  const wm = lambert({ map: TEX.wall(wallCol, [2, 2]), side: THREE.BackSide });
  const r = box(w, h, d, wm); r.position.y = h / 2; g.add(r);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lambert({ map: floorTex })); f.rotation.x = -Math.PI / 2; f.position.y = 0.01; g.add(f);
  return g;
}

export const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
