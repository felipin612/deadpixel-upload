// EP05 "LAMPLIGHT" scenes + shorts S13-S15.
import * as THREE from 'three';
import { TEX, lambert, box, house, hudSprite, drawTextBox, rng, ease, clamp01, room, textCanvas, figure, crt, ps2 } from './lib.js';
import { screenScene, drawLogo, drawCTA } from './screens.js';
import { drawTyped, drawMemoryCardNW } from './screens2.js';
import { drawTitleLL, drawLog, LOG, drawMapViewer, drawFiles, drawCounter } from './screens5.js';

const camFor = (W, H, fov = 62) => new THREE.PerspectiveCamera(W > H ? fov : fov * 1.45, W / H, 0.1, 200);
function composite(shots) {
  const self = { scene: null, camera: null, hud: null };
  self.update = (t, dur) => {
    const p = t / dur; let acc = 0;
    for (const s of shots) { const end = acc + s.frac;
      if (p < end || s === shots[shots.length - 1]) { s.obj.update(t - acc * dur, s.frac * dur); self.scene = s.obj.scene; self.camera = s.obj.camera; self.hud = s.obj.hud; return; }
      acc = end; }
  };
  return self;
}
const later = (o, k) => ({ get scene() { return o.scene; }, get camera() { return o.camera; }, get hud() { return o.hud; }, update(t, d) { o.update(t + d * k, d * (1 + k)); } });
const screen = (W, H, fn) => screenScene(W, H, fn);
const camShot = (scene, camera, fn, hud = null) => ({ scene, camera, hud, update: fn });
const black = (W, H) => screen(W, H, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); });
function textBox(hud, W, H) {
  const bw = Math.min(W - 20, 300), bh = 44;
  const s = hudSprite(hud, bw, bh, (W - bw) / 2, W > H ? 10 : H - Math.round(H * 0.25) - bh, (g) => g.clearRect(0, 0, bw, bh)); s.mesh.visible = false;
  return { show(text, p) { s.mesh.visible = true; s.tc.redraw((g, w, h) => drawTextBox(g, w, h, text, Math.floor(text.length * clamp01(p)))); }, hide() { s.mesh.visible = false; } };
}
function counter(hud, W, H) {
  const s = hudSprite(hud, 70, 18, W - 78, H - (W > H ? 26 : Math.round(H * 0.2)), (g, w, h) => drawCounter(g, w, h, 8)); let last = -1;
  return { set(n) { if (n !== last) { last = n; s.tc.redraw((g, w, h) => drawCounter(g, w, h, n)); } }, hide() { s.mesh.visible = false; } };
}

// ---- a small fishing boat: hull, two-triangle sail, bow lamp ----
const lampM = new THREE.MeshBasicMaterial({ color: 0xffd060 });
function boat(seed) {
  const g = new THREE.Group(); const r = rng(seed);
  const hull = box(0.9, 0.3, 2.2, lambert({ color: 0x3a2e24 })); hull.position.y = 0.15; g.add(hull);
  const mast = box(0.06, 2.0, 0.06, lambert({ color: 0x2a2a2a })); mast.position.y = 1.2; g.add(mast);
  const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.3, -0.05), new THREE.Vector3(0, 2.1, 0), new THREE.Vector3(0, 0.3, -1.0)]), lambert({ color: 0x8a8678, side: THREE.DoubleSide }));
  sail.geometry.computeVertexNormals(); g.add(sail);
  const l = box(0.3, 0.3, 0.3, lampM); l.position.set(0, 0.55, 1.05); g.add(l);
  g.rotation.y = r() * Math.PI * 2; return g;
}
// ---- the ninth: a rowing boat, empty, oil lamp on a hook, oars that move by themselves ----
function rowboat(hullVisible = true) {
  const g = new THREE.Group();
  const hullM = lambert({ color: 0x4a3a2c }); const hull = box(0.8, 0.28, 2.0, hullM); hull.position.y = 0.12; hull.visible = hullVisible; g.add(hull);
  const seat = box(0.8, 0.05, 0.3, hullM); seat.position.set(0, 0.28, 0); seat.visible = hullVisible; g.add(seat);
  const hook = box(0.04, 0.6, 0.04, lambert({ color: 0x1a1a1a })); hook.position.set(0, 0.5, 1.0); hook.visible = hullVisible; g.add(hook);
  const lamp = box(0.4, 0.48, 0.4, new THREE.MeshBasicMaterial({ color: 0xffc050 })); lamp.position.set(0, 0.62, 1.05); g.add(lamp);
  const glow = new THREE.PointLight(0xffb040, 8, 9, 1.6); glow.position.set(0, 0.7, 1.1); g.add(glow);
  const oars = [];
  for (const s of [-1, 1]) { const o = box(0.05, 0.05, 1.8, lambert({ color: 0x6a5a44 })); const p = new THREE.Group(); o.position.set(s * 0.9, 0, 0); o.rotation.y = s * 0.3; p.add(o); p.position.set(s * 0.35, 0.3, 0); p.visible = hullVisible; g.add(p); oars.push(p); }
  g.userData = { oars, lamp, glow, row(t) { const a = Math.sin(t * 1.6); oars[0].rotation.y = a * 0.5; oars[1].rotation.y = -a * 0.5; oars.forEach((o) => { o.rotation.z = (o.position.x < 0 ? -1 : 1) * (0.2 + 0.15 * Math.cos(t * 1.6)); }); } };
  return g;
}
function pine(h = 4) { const g = new THREE.Group(); const m = lambert({ color: 0x1a2a20 });
  const c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.28, h, 5), m); c.position.y = h / 2 + 0.4; g.add(c);
  const tr = box(0.2, 0.6, 0.2, lambert({ color: 0x2a2018 })); tr.position.y = 0.3; g.add(tr); return g; }

// ---- exterior: black lake, pier, lighthouse with a turning beam, eight boats ----
export function lake(W, H, opts = {}) {
  const scene = new THREE.Scene(); const fogC = 0x0a0e16; scene.background = new THREE.Color(fogC); scene.fog = new THREE.Fog(fogC, 8, opts.far || 95);
  scene.add(new THREE.AmbientLight(0x6a7694, 1.7)); const moon = new THREE.DirectionalLight(0xa0b0d0, 0.4); moon.position.set(-8, 12, -6); scene.add(moon);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), lambert({ color: 0x16243a })); water.rotation.x = -Math.PI / 2; scene.add(water);
  // far shore with pines
  const r = rng(55);
  for (let i = 0; i < 60; i++) { const p = pine(3 + r() * 4); const a = -1.2 + i * 0.045; p.position.set(Math.sin(a) * 70, 0, -Math.cos(a) * 70); scene.add(p); }
  const shore = box(200, 0.6, 12, lambert({ map: TEX.grass([30, 2]) })); shore.position.set(0, 0.1, 16); scene.add(shore);
  // pier from the shore out to the lighthouse
  const plM = lambert({ map: TEX.planks([70, 60, 48], [1, 10]) }); const pier = box(2.2, 0.2, 30, plM); pier.position.set(0, 0.7, 0); scene.add(pier);
  for (let z = -14; z <= 14; z += 2.5) for (const x of [-1, 1]) { const p = box(0.18, 1.6, 0.18, lambert({ color: 0x2a2420 })); p.position.set(x, 0.1, z); scene.add(p); }
  // lighthouse at the lake end of the pier
  const lh = new THREE.Group(); const towerM = lambert({ color: 0xd8d4c8 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 9, 8), towerM); tower.position.y = 5.3; lh.add(tower);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 1.2, 8), lambert({ color: 0x8a2a24 })); band.position.y = 6.5; lh.add(band);
  const gal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.15, 8), lambert({ color: 0x1a1a1a })); gal.position.y = 9.9; lh.add(gal);
  const lensM = new THREE.MeshBasicMaterial({ color: 0xfff0b0 }); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.2, 8), lensM); lens.position.y = 10.6; lh.add(lens);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.9, 8), lambert({ color: 0x1a1a1a })); cap.position.y = 11.65; lh.add(cap);
  const beamPivot = new THREE.Group(); beamPivot.position.y = 10.6; lh.add(beamPivot);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3, 60, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3c0, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.FrontSide, fog: false }));
  beam.rotation.x = Math.PI / 2; beam.position.z = -30; beamPivot.add(beam);
  const spot = new THREE.SpotLight(0xfff0c0, 80, 90, 0.12, 0.5, 1.0); spot.position.set(0, 0, 0); spot.target.position.set(0, -10, -60); beamPivot.add(spot, spot.target);
  lh.position.set(0, 0, -16.5); scene.add(lh);
  // eight boats around the lake
  const boats = []; const br = rng(9);
  for (let i = 0; i < 8; i++) { const b = boat(i + 3); const a = -1.0 + i * 0.28 + br() * 0.08, d = 26 + br() * 22; b.position.set(Math.sin(a) * d, 0, -16 - Math.cos(a) * d); scene.add(b); boats.push(b); }
  const ninth = rowboat(opts.hull !== false); ninth.position.set(opts.ninth?.[0] ?? -6, 0, opts.ninth?.[1] ?? -58); ninth.rotation.y = Math.PI; scene.add(ninth); ninth.visible = opts.ninth !== null && opts.showNinth !== false;
  beamPivot.rotation.order = 'YXZ'; beamPivot.rotation.x = -0.14;
  const setBeam = (a) => { beamPivot.rotation.y = a; };
  const lightOut = (k) => { lensM.color.setRGB(1 - k, (0.94) * (1 - k), (0.7) * (1 - k)); beam.visible = k < 0.5; spot.intensity = 80 * (1 - k); };
  const camera = camFor(W, H, 58); const hud = new THREE.Scene(); const tb = textBox(hud, W, H); const ct = counter(hud, W, H); if (!opts.counter) ct.hide();
  return { scene, camera, hud, tb, ct, boats, ninth, setBeam, lightOut, lh, beam };
}

// ---- lamp room interior: big lens, logbook desk, shutter lever, window to the lake ----
export function lamproom(W, H) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x040508);
  scene.add(new THREE.AmbientLight(0x6a6050, 0.8));
  const lamp = new THREE.PointLight(0xffd080, 7, 10, 1.6); lamp.position.set(0, 2.4, 0); scene.add(lamp);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3.2, 10, 1, true), lambert({ map: TEX.stone([6, 2]), side: THREE.BackSide })); wall.position.y = 1.6; scene.add(wall);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 10), lambert({ map: TEX.planks([70, 58, 44], [3, 3]) })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // windows: dark panes with tiny boat lamps outside
  const winTex = textCanvas(64, 24, (g, w, h) => { g.fillStyle = '#060a12'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd060'; [[6, 16], [17, 14], [29, 17], [41, 15], [53, 16]].forEach(([x, y]) => g.fillRect(x, y, 1, 1)); });
  for (let i = 0; i < 5; i++) { const a = Math.PI * 0.6 + i * 0.38; const w = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.1), new THREE.MeshBasicMaterial({ map: winTex.tex })); w.position.set(Math.sin(a) * 3.15, 2.0, Math.cos(a) * 3.15); w.lookAt(0, 2.0, 0); scene.add(w); }
  const lensM = new THREE.MeshLambertMaterial({ color: 0xfff0c0, emissive: 0x806020 }); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 8), lensM); lens.position.set(0, 1.5, 0); scene.add(lens);
  const ped = box(0.9, 0.7, 0.9, lambert({ color: 0x2a2a2a })); ped.position.set(0, 0.35, 0); scene.add(ped);
  const desk = box(1.2, 0.08, 0.6, lambert({ color: 0x4a3626 })); desk.position.set(1.9, 0.8, 1.2); desk.rotation.y = -0.6; scene.add(desk);
  for (const [x, z] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) { const l = box(0.06, 0.8, 0.06, lambert({ color: 0x2a2018 })); l.position.set(x, -0.4, z); desk.add(l); }
  const book = box(0.5, 0.04, 0.35, lambert({ color: 0xe4dcc6, emissive: 0x2a2620 })); book.position.set(0, 0.06, 0); desk.add(book);
  const shutter = new THREE.Group(); const sh = box(0.08, 1.2, 0.08, lambert({ color: 0x3a3a3a })); sh.position.y = 0.6; shutter.add(sh);
  const grip = box(0.18, 0.12, 0.12, lambert({ color: 0xb02a20 })); grip.position.y = 1.2; shutter.add(grip); shutter.position.set(-1.4, 0.5, 1.0); shutter.rotation.x = -0.4; scene.add(shutter);
  const clicker = box(0.1, 0.14, 0.05, lambert({ color: 0x9a9a9a })); clicker.position.set(1.0, 1.3, 1.5); scene.add(clicker);
  const camera = camFor(W, H, 60); const hud = new THREE.Scene(); const tb = textBox(hud, W, H); const ct = counter(hud, W, H);
  const dark = (k) => { lensM.emissive.setRGB(0.5 * (1 - k), 0.37 * (1 - k), 0.12 * (1 - k)); lamp.intensity = 7 * (1 - k * 0.9); };
  return { scene, camera, hud, tb, ct, lens, shutter, desk, dark, lamp };
}

// ---- my room: desk with the PS2 + CRT, PC monitor ----
function myroom(W, H, screenDraw) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050506);
  scene.add(new THREE.AmbientLight(0x505868, 0.9)); const lamp = new THREE.PointLight(0xffc880, 3, 8, 1.6); lamp.position.set(-1.5, 2.3, 1); scene.add(lamp);
  scene.add(room(5, 2.8, 4, [62, 58, 54], TEX.carpet([52, 46, 40], [3, 3])));
  const desk = box(2.4, 0.08, 0.9, lambert({ color: 0x4a3626 })); desk.position.set(0, 0.78, -1.4); scene.add(desk);
  const sc = textCanvas(160, 120, (g, w, h) => screenDraw(g, w, h, 0)); const tv = crt(sc.tex); tv.position.set(0, 0.82, -1.5); scene.add(tv);
  const p = ps2(true); p.position.set(0.85, 0.82, -1.3); scene.add(p);
  const camera = camFor(W, H, 55);
  return { scene, camera, hud: null, sc, lamp };
}

// ---- my street from the window: one low yellow lamp at the end ----
function street(W, H) {
  const scene = new THREE.Scene(); const fogC = 0x0a0d14; scene.background = new THREE.Color(fogC); scene.fog = new THREE.Fog(fogC, 4, 60);
  scene.add(new THREE.AmbientLight(0x5a6478, 1.3));
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), lambert({ map: TEX.grass([40, 40]) })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 200), lambert({ map: TEX.dirt([1, 40]) })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 0); scene.add(road);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const h = house({ w: 4, d: 4, h: 2.6, wall: [120 - i * 6, 116, 110], roofH: 1.2, door: true, lit: (i + (s > 0)) % 3 === 0 }); h.position.set(s * 8, 0, -6 - i * 9); h.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(h); }
  const lamps = [];
  for (let i = 0; i < 4; i++) { const pole = box(0.12, 3.6, 0.12, lambert({ color: 0x2a2a2a })); pole.position.set(3.6, 1.8, -4 - i * 12); scene.add(pole);
    const b = box(0.3, 0.15, 0.3, new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); b.position.set(3.4, 3.6, -4 - i * 12); scene.add(b); const l = new THREE.PointLight(0xffd090, 5, 10, 1.5); l.position.set(3.4, 3.4, -4 - i * 12); scene.add(l); lamps.push(b); }
  const low = box(0.18, 0.22, 0.18, new THREE.MeshBasicMaterial({ color: 0xffc050 })); low.position.set(-0.6, 0.5, -52); scene.add(low);
  const lowL = new THREE.PointLight(0xffb040, 3, 6, 2); lowL.position.set(-0.6, 0.6, -51.5); scene.add(lowL);
  const camera = camFor(W, H, 50);
  return { scene, camera, hud: null, low, lowL };
}

// ---- doorstep by day: the logbook page wrapped round the case ----
function doorstep(W, H) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xa0a8b0); scene.fog = new THREE.Fog(0xa0a8b0, 6, 40);
  scene.add(new THREE.AmbientLight(0xd0d4d8, 1.4)); const sun = new THREE.DirectionalLight(0xfff0e0, 0.8); sun.position.set(4, 6, 3); scene.add(sun);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), lambert({ map: TEX.stone([30, 30]) })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const h = house({ w: 5, d: 4, h: 2.8, wall: [150, 148, 140], roofH: 1.4, door: true, porch: true }); h.position.set(0, 0, -3); scene.add(h);
  const pkg = new THREE.Group(); const page = box(0.32, 0.02, 0.24, lambert({ color: 0xe8e0c8, emissive: 0x222018 })); pkg.add(page);
  const ln = textCanvas(32, 24, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#9aa8c0'; for (let y = 3; y < h; y += 3) g.fillRect(0, y, w, 1); g.fillStyle = '#c05050'; g.fillRect(20, 0, 1, h); });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), new THREE.MeshBasicMaterial({ map: ln.tex })); top.rotation.x = -Math.PI / 2; top.position.y = 0.012; pkg.add(top);
  pkg.position.set(0.3, 0.02, 0.4); pkg.rotation.y = 0.4; scene.add(pkg);
  return { scene, camera: camFor(W, H, 50), hud: null };
}

const MISSING = 7; // logo loses one more pixel each episode (episode number + 2)

export const SCENES5 = {
  // 1. Cold open: eight boats + the ninth lamp with no hull; beam sweeps; counter stays at 8
  e501({ W, H }) {
    const L = lake(W, H, { hull: false, ninth: [-9, -52], counter: true });
    const a = camShot(L.scene, L.camera, (t, d) => { L.setBeam(0.9 - t * 0.35); L.ct.set(8); L.camera.position.set(5, 4.5, 8); L.camera.lookAt(-5, 2.5, -40); L.ninth.position.y = Math.sin(t) * 0.05; }, L.hud);
    const L2 = lake(W, H, { hull: false, ninth: [-9, -52], counter: true });
    const b = camShot(L2.scene, L2.camera, (t, d) => { L2.setBeam(0.4); L2.ct.set(8); const q = ease(t / d); L2.camera.position.set(-6 + q, 2.2, -38 - q * 3); L2.camera.lookAt(-9, 0.4, -52); }, L2.hud);
    return composite([{ frac: 0.6, obj: a }, { frac: 0.4, obj: b }]);
  },
  // 2. Doorstep: the logbook page; the 8s column; the case spine
  e502({ W, H }) {
    const D = doorstep(W, H);
    const a = camShot(D.scene, D.camera, (t, d) => { const q = ease(t / d); D.camera.position.set(-1 + q * 1.2, 1.7 - q * 0.6, 3.6 - q * 2.2); D.camera.lookAt(0.3, 0, 0.4); });
    const b = screen(W, H, (g, w, h, t, d) => drawLog(g, w, h, t, { reveal: clamp01(t / (d * 0.5)), zoom: clamp01((t / d - 0.6) / 0.4) * 0.5 }));
    const c = screen(W, H, (g, w, h, t) => { g.fillStyle = '#060608'; g.fillRect(0, 0, w, h); const sw = w > h ? w * 0.12 : w * 0.22; const x = w / 2 - sw / 2;
      g.fillStyle = '#101012'; g.fillRect(x, h * 0.06, sw, h * 0.88); g.save(); g.translate(w / 2 + 4, h * 0.5); g.rotate(-Math.PI / 2);
      g.fillStyle = '#f0f0f0'; g.textAlign = 'center'; g.font = `bold ${Math.round(sw * 0.42)}px monospace`; g.fillText('LAMPLIGHT', 0, 0);
      g.font = `${Math.round(sw * 0.18)}px monospace`; g.fillStyle = '#bbb'; g.fillText('count every sweep', 0, sw * 0.32); g.restore(); g.textAlign = 'left'; });
    return composite([{ frac: 0.35, obj: a }, { frac: 0.4, obj: b }, { frac: 0.25, obj: c }]);
  },
  // 3. Title; lamp room; the rule
  e503({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawTitleLL(g, w, h, t));
    const R = lamproom(W, H); R.ct.hide();
    const b = camShot(R.scene, R.camera, (t) => { R.lens.rotation.y = t * 0.5; R.camera.position.set(1.6, 1.7, 2.2); R.camera.lookAt(0, 1.4, 0); }, R.hud);
    const c = screen(W, H, (g, w, h, t) => drawTyped(g, w, h, t, w > h ? ['COUNT THE BOATS ON EVERY SWEEP.', 'IF THERE IS ONE MORE THAN YOU COUNTED,', 'PUT THE LIGHT OUT.'] : ['COUNT THE BOATS', 'ON EVERY SWEEP.', 'IF THERE IS ONE MORE', 'THAN YOU COUNTED,', 'PUT THE LIGHT OUT.'], 14));
    return composite([{ frac: 0.38, obj: a }, { frac: 0.24, obj: b }, { frac: 0.38, obj: c }]);
  },
  // 4. Keeping the light: beam over the boats, counter ticks to 8, the log, memory card
  e504({ W, H }) {
    const L = lake(W, H, { showNinth: false, counter: true });
    const a = camShot(L.scene, L.camera, (t, d) => { const q = t / d; L.setBeam(1.1 - q * 2.2); L.ct.set(Math.min(8, Math.floor(q * 9))); L.camera.position.set(0, 10.4, -19.3); L.camera.lookAt(0, 0, -45); }, L.hud);
    const R = lamproom(W, H); R.ct.hide();
    const b = camShot(R.scene, R.camera, (t) => { R.lens.rotation.y = t * 0.5; R.camera.position.set(2.4, 1.5, 0.4); R.camera.lookAt(1.9, 0.8, 1.2); }, R.hud);
    const c = screen(W, H, (g, w, h, t, d) => drawLog(g, w, h, t, { reveal: clamp01(t / d * 1.4) }));
    const e = screen(W, H, (g, w, h, t) => drawMemoryCardNW(g, w, h, t, 'LAMPLIGHT', '1:08', 'TODAY'));
    return composite([{ frac: 0.38, obj: a }, { frac: 0.2, obj: b }, { frac: 0.24, obj: c }, { frac: 0.18, obj: e }]);
  },
  // 5. The ninth lamp appears at the edge of the mist; clicking 9, counter says 8; the shutter
  e505({ W, H }) {
    const L = lake(W, H, { hull: false, ninth: [-4, -70], counter: true, far: 80 });
    const a = camShot(L.scene, L.camera, (t, d) => { L.setBeam(0.5 - t * 0.12); L.ct.set(8); L.camera.position.set(0, 10.4, -19.3); L.camera.lookAt(-3, 0.3, -66); }, L.hud);
    const R = lamproom(W, H);
    const b = camShot(R.scene, R.camera, (t, d) => { R.ct.set(8); const q = ease(t / d); R.camera.position.set(0.2, 1.6, 2.6 - q * 0.6); R.camera.lookAt(-1.4, 1.0, 1.0); }, R.hud);
    return composite([{ frac: 0.6, obj: a }, { frac: 0.4, obj: b }]);
  },
  // 6. Closer against the wind; the log crosses out my 9
  e506({ W, H }) {
    const L = lake(W, H, { hull: false, ninth: [-4, -56], counter: true });
    const a = camShot(L.scene, L.camera, (t, d) => { L.setBeam(0.3); L.ct.set(8); L.ninth.position.z = -60 + ease(t / d) * 4; L.camera.position.set(0, 10.4, -19.3); L.camera.lookAt(-3, 0.3, -56); }, L.hud);
    const b = screen(W, H, (g, w, h, t, d) => drawLog(g, w, h, t, { rows: LOG.slice(0, 3).concat([['01:00', 'MIST', '9', 1]]), cross: t > d * 0.45 ? 3 : -1, zoom: 0.3 }));
    return composite([{ frac: 0.45, obj: a }, { frac: 0.55, obj: b }]);
  },
  // 7. Thirty-nine pages of eights; the last line: eight boats, and one for Rowe; 03/03/2004
  e507({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawLog(g, w, h, t, { rows: LOG.concat([['04:00', 'FOG', '8'], ['05:00', 'FOG', '8']]), reveal: clamp01(t / d * 1.5), date: 'PAGE 21' }));
    const b = screen(W, H, (g, w, h, t, d) => drawLog(g, w, h, t, { rows: LOG.slice(0, 4), last: ['03:00', 'FOG', '8 + 1 FOR ROWE'], date: '03/03/2004', zoom: clamp01((t / d - 0.3) / 0.5) * 0.7 }));
    return composite([{ frac: 0.4, obj: a }, { frac: 0.6, obj: b }]);
  },
  // 8. Fourth night: the beam shows the rowing boat, empty, oars moving
  e508({ W, H }) {
    const L = lake(W, H, { ninth: [-3, -36], counter: true });
    const a = camShot(L.scene, L.camera, (t, d) => { L.setBeam(0.12); L.ct.set(8); L.ninth.position.z = -38 + t * 0.15; L.ninth.userData.row(t); L.camera.position.set(0, 10.4, -19.3); L.camera.lookAt(-3, 0.2, -36); }, L.hud);
    const L2 = lake(W, H, { ninth: [-3, -36] });
    const b = camShot(L2.scene, L2.camera, (t, d) => { L2.setBeam(0.1); L2.ninth.userData.row(t); const q = ease(t / d); L2.camera.position.set(-0.6 + q * 0.4, 1.6, -31.5 - q * 0.6); L2.camera.lookAt(-3, 0.3, -36); });
    return composite([{ frac: 0.45, obj: a }, { frac: 0.55, obj: b }]);
  },
  // 9. The disc in my computer: file list, MERROW.MAP
  e509({ W, H }) {
    const M = myroom(W, H, (g, w, h) => { g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#000080'; g.fillRect(0, 0, w, 14); });
    const a = camShot(M.scene, M.camera, (t, d) => { const q = ease(t / d); M.camera.position.set(-0.6 + q * 0.4, 1.5, 1.2 - q * 0.8); M.camera.lookAt(0, 1.0, -1.5); });
    const b = screen(W, H, (g, w, h, t) => drawFiles(g, w, h, t, 4));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.7, obj: b }]);
  },
  // 10. Level viewer: the four games on one lake
  e510({ W, H }) { return screen(W, H, (g, w, h, t, d) => drawMapViewer(g, w, h, t, clamp01(t / (d * 0.85)), 0)); },
  // 11. The beam is fixed on the boathouse: 14 MERROW RD
  e511({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawMapViewer(g, w, h, t, 1, clamp01(t / (d * 0.5))));
    const b = screen(W, H, (g, w, h, t) => drawTyped(g, w, h, t, w > h ? ['14 MERROW ROAD — THE BOATHOUSE', 'R. KELL 1961 — J. KELL 2001'] : ['14 MERROW ROAD', 'THE BOATHOUSE', 'R. KELL, 1961', 'J. KELL, 2001'], 12));
    return composite([{ frac: 0.62, obj: a }, { frac: 0.38, obj: b }]);
  },
  // 12. Back in the game: rowing boat tied at the pier, counter says 0
  e512({ W, H }) {
    const R = lamproom(W, H);
    const a = camShot(R.scene, R.camera, (t) => { R.ct.set(8); R.lens.rotation.y = t * 0.5; R.camera.position.set(-0.8, 1.7, 2.4); R.camera.lookAt(0.6, 1.7, -3); }, R.hud);
    const L = lake(W, H, { ninth: [1.7, -2], counter: true });
    const b = camShot(L.scene, L.camera, (t, d) => { L.setBeam(0.6); L.ct.set(0); L.ninth.rotation.y = 0; const q = ease(t / d); L.camera.position.set(-0.6, 2.4, -12 + q * 2); L.camera.lookAt(1.7, 0.2, -2); }, L.hud);
    return composite([{ frac: 0.35, obj: a }, { frac: 0.65, obj: b }]);
  },
  // 13. Pull the shutter: lens dark, the boat lamps go out one by one; text box; memory card "NINE KEEPERS"
  e513({ W, H }) {
    const R = lamproom(W, H); R.ct.hide();
    const a = camShot(R.scene, R.camera, (t, d) => { const q = t / d; R.shutter.rotation.x = -0.4 + ease(q / 0.5) * 0.9; R.dark(ease((q - 0.4) / 0.4)); R.camera.position.set(0.6, 1.5, 2.4); R.camera.lookAt(-1.4, 0.9, 1.0); }, R.hud);
    const L = lake(W, H, { showNinth: false });
    const b = camShot(L.scene, L.camera, (t, d) => { const q = t / d; L.lightOut(1); L.boats.forEach((bt, i) => { bt.children[3].visible = q < 0.15 + i * 0.08; });
      L.camera.position.set(0, 10.4, -19.3); L.camera.lookAt(0, 0, -45); if (q > 0.85) L.tb.show('LIGHT OUT. THANK YOU, KEEPER.', (q - 0.85) / 0.1); }, L.hud);
    const c = screen(W, H, (g, w, h, t) => drawMemoryCardNW(g, w, h, t, 'LAMPLIGHT', 'NINE KEEPERS', '03/03/2004'));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.45, obj: b }, { frac: 0.04, obj: black(W, H) }, { frac: 0.21, obj: c }]);
  },
  // 14. Real world: the low yellow lamp at the end of my street goes out; logo
  e514({ W, H }) {
    const S = street(W, H);
    const a = camShot(S.scene, S.camera, (t, d) => { const q = t / d; S.camera.position.set(-2, 4.2, 12); S.camera.lookAt(-0.6, 0.4, -50); const on = q < 0.75; S.low.visible = on; S.lowL.intensity = on ? 3 : 0; });
    const logo = screen(W, H, (g, w, h, t) => drawLogo(g, w, h, t, MISSING));
    return composite([{ frac: 0.8, obj: a }, { frac: 0.04, obj: black(W, H) }, { frac: 0.16, obj: logo }]);
  },
  e500({ W, H }) { return screen(W, H, (g, w, h, t) => drawLogo(g, w, h, t, MISSING)); },
  // ---- shorts (vertical): open on the strongest image, no logo, no slow move; new image by 5-8 s ----
  sh13({ W, H }) {
    const L = lake(W, H, { hull: false, ninth: [-4, -42], counter: true });
    const a = camShot(L.scene, L.camera, (t) => { L.setBeam(0.15); L.ct.set(8); L.camera.position.set(0, 10.4, -19.3); L.camera.lookAt(-3.5, 0.3, -42); }, L.hud);
    const b = SCENES5.e503({ W, H }), c = SCENES5.e512({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.16, obj: a }, { frac: 0.06, obj: later(SCENES5.e505({ W, H }), 0.6) }, { frac: 0.36, obj: b }, { frac: 0.3, obj: later(c, 0.3) }, { frac: 0.12, obj: e }]);
  },
  sh14({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawLog(g, w, h, t, { rows: LOG.slice(0, 4), last: ['03:00', 'FOG', '1, NO HULL'], banner: 'DATE: TOMORROW', zoom: 0.1 }));
    const b = SCENES5.e504({ W, H }), c = SCENES5.e507({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.2, obj: a }, { frac: 0.32, obj: b }, { frac: 0.36, obj: later(c, 0.4) }, { frac: 0.12, obj: e }]);
  },
  sh15({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawMapViewer(g, w, h, t, 1, 0));
    const b = screen(W, H, (g, w, h, t) => drawFiles(g, w, h, t, 4));
    const c = screen(W, H, (g, w, h, t, d) => drawMapViewer(g, w, h, t, clamp01(t / (d * 0.7)), 0));
    const f = screen(W, H, (g, w, h, t, d) => drawMapViewer(g, w, h, t, 1, clamp01(t / (d * 0.5))));
    const e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.13, obj: a }, { frac: 0.13, obj: b }, { frac: 0.34, obj: c }, { frac: 0.28, obj: f }, { frac: 0.12, obj: e }]);
  },
};
