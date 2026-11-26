// EP03 "STILLWATER" scenes + shorts S07-S09.
import * as THREE from 'three';
import { TEX, lambert, box, house, hudSprite, drawTextBox, rng, ease, clamp01, crt, ps2, room, textCanvas } from './lib.js';
import { screenScene, drawLogo, drawCTA } from './screens.js';
import { drawTyped, drawMemoryCardNW } from './screens2.js';
import { CATCH, drawTitleSW, drawCatchLog, drawPauseSW, drawArchive, drawMagazineSW, drawForumSW, drawDebugSW,
  drawLakeMap, drawSpine } from './screens3.js';

const camFor = (W, H, fov = 62) => new THREE.PerspectiveCamera(W > H ? fov : fov * 1.45, W / H, 0.1, 120);
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
function textBox(hud, W, H) {
  const bw = Math.min(W - 20, 300), bh = 44;
  const s = hudSprite(hud, bw, bh, (W - bw) / 2, W > H ? 10 : H - Math.round(H * 0.25) - bh, (g) => g.clearRect(0, 0, bw, bh)); s.mesh.visible = false;
  return { show(text, p) { s.mesh.visible = true; s.tc.redraw((g, w, h) => drawTextBox(g, w, h, text, Math.floor(text.length * clamp01(p)))); }, hide() { s.mesh.visible = false; } };
}
const iceTex = (rep) => { const t = TEX.wall([196, 204, 210], rep); return t; };

// The frozen lake: ice, tree line, shack, the hole, bucket, rod and float.
function lake(W, H, opts = {}) {
  const scene = new THREE.Scene(); const fogC = opts.night ? 0x1a1e2a : 0x8a909a;
  scene.background = new THREE.Color(fogC); scene.fog = new THREE.Fog(fogC, 3, opts.far || 45);
  const amb = new THREE.AmbientLight(opts.night ? 0x6a7490 : 0xb8c0cc, opts.night ? 1.1 : 1.5); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xd8d8f0, opts.night ? 0.3 : 0.8); sun.position.set(-5, 8, 3); scene.add(sun);
  const ice = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), lambert({ map: iceTex([40, 40]) })); ice.rotation.x = -Math.PI / 2; scene.add(ice);
  const r = rng(11);
  for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, d = 38 + r() * 6; const tr = new THREE.Mesh(new THREE.ConeGeometry(1 + r(), 5 + r() * 4, 5), lambert({ color: 0x1c2420 })); tr.position.set(Math.cos(a) * d, 3, Math.sin(a) * d); scene.add(tr); }
  const shack = house({ w: 2.6, d: 2.2, h: 2.2, wall: [86, 62, 44], roofH: 0.8, lit: true, door: true }); shack.position.set(-2.8, 0, -1.5); shack.rotation.y = 0.6; scene.add(shack);
  // hole: black disc + faint water
  const holeR = opts.holeR || 0.32;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x05070c })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.012; hole.scale.setScalar(holeR); scene.add(hole);
  const rim = new THREE.Mesh(new THREE.RingGeometry(1, 1.18, 20), lambert({ color: 0xe8eef2 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.011; rim.scale.setScalar(holeR); scene.add(rim);
  const pale = new THREE.Mesh(new THREE.CircleGeometry(0.4, 10), new THREE.MeshBasicMaterial({ color: 0x3a4650, transparent: true, opacity: 0 })); pale.rotation.x = -Math.PI / 2; pale.position.y = 0.013; scene.add(pale);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 10), lambert({ color: 0x9a3a2a })); bucket.position.set(0.9, 0.2, 0.9); scene.add(bucket);
  const flt = new THREE.Group(); const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0xe03028 })); flt.add(f1);
  const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xf0f0f0 })); f2.position.y = 0.04; flt.add(f2); flt.position.set(0, 0.03, 0); scene.add(flt);
  const rodMat = lambert({ color: 0x2a2420 });
  const rod = new THREE.Group(); const seg = []; for (let i = 0; i < 5; i++) { const b = box(0.025, 0.025, 0.3, rodMat); rod.add(b); seg.push(b); } scene.add(rod);
  const line = box(0.004, 1, 0.004, new THREE.MeshBasicMaterial({ color: 0xdedede })); scene.add(line);
  const hud = new THREE.Scene(); const tb = textBox(hud, W, H);
  const camera = camFor(W, H, 58);
  const tip = new THREE.Vector3();
  // bend 0..1; rod from (0.35,0.8,1.1) toward the hole
  const setRod = (bend, t = 0) => {
    const base = new THREE.Vector3(0.38, 0.75, 1.05);
    const dir = new THREE.Vector3(-0.38, 0.12, -0.9).normalize();
    let p = base.clone(), d = dir.clone();
    seg.forEach((b, i) => { d.applyAxisAngle(new THREE.Vector3(1, 0, 0), -bend * 0.22); const c = p.clone().addScaledVector(d, 0.15); b.position.copy(c); b.lookAt(c.clone().add(d)); p.addScaledVector(d, 0.3); });
    tip.copy(p);
    const fy = flt.position.y; const len = tip.y - fy; line.scale.y = Math.max(0.01, len); line.position.set((tip.x + flt.position.x) / 2, (tip.y + fy) / 2, (tip.z + flt.position.z) / 2);
    line.lookAt(flt.position.x, (tip.y + fy) / 2, flt.position.z); line.rotation.set(0, 0, 0);
    line.position.x = flt.position.x; line.position.z = flt.position.z;
  };
  const sitCam = (t, sway = 1) => { camera.position.set(0.15 + Math.sin(t * 0.4) * 0.02 * sway, 1.15, 1.45); camera.lookAt(0, 0.05, 0); };
  const bob = (t, still = false) => { flt.position.y = still ? 0.03 : 0.03 + Math.sin(t * 2.3) * 0.012 + Math.max(0, Math.sin(t * 0.9)) * 0.01; };
  const setHole = (s) => { hole.scale.setScalar(s); rim.scale.setScalar(s); };
  setRod(0); sitCam(0);
  return { scene, camera, hud, tb, setRod, sitCam, bob, flt, setHole, pale, amb, shack, bucket, rod, line };
}

function fish(color = 0x5a6a52) {
  const g = new THREE.Group(); const m = lambert({ color });
  const body = box(0.42, 0.12, 0.14, m); g.add(body);
  const tail = box(0.1, 0.14, 0.02, m); tail.position.x = -0.25; g.add(tail);
  const eye = box(0.02, 0.02, 0.02, new THREE.MeshBasicMaterial({ color: 0x000000 })); eye.position.set(0.16, 0.03, 0.07); g.add(eye);
  const watch = new THREE.Group(); const band = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 4, 10), lambert({ color: 0x3a2618 }));
  band.rotation.y = Math.PI / 2; watch.add(band);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), new THREE.MeshLambertMaterial({ color: 0xd8c070, emissive: 0x403010 })); face.rotation.z = Math.PI / 2; face.position.set(0, 0.085, 0); face.rotation.set(0, 0, 0); watch.add(face);
  watch.position.x = 0.05; g.add(watch); g.userData.tail = tail; g.userData.watch = watch;
  return g;
}

function bedroom(W, H, opts = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050608);
  const amb = new THREE.AmbientLight(0x56606e, opts.amb ?? 0.8); scene.add(amb);
  scene.add(room(6, 3, 6, [44, 46, 56], TEX.carpet([60, 58, 54], [4, 4])));
  const dresser = box(1.8, 0.9, 0.7, lambert({ map: TEX.planks([70, 52, 40], [1, 1]) })); dresser.position.set(0, 0.45, -2.4); scene.add(dresser);
  const sc = textCanvas(160, 120, () => {}); const tv = crt(sc.tex); tv.position.set(0, 1.45, -2.2); scene.add(tv);
  const con = ps2(true); con.position.set(0, 0.99, -2.1); scene.add(con);
  const tbx = box(0.5, 0.18, 0.28, lambert({ color: 0x3a6a4a })); tbx.position.set(-0.6, 0.99, -2.2); scene.add(tbx);
  const bed = box(2.2, 0.5, 1.6, lambert({ color: 0x3a3a4a })); bed.position.set(0, 0.25, 1.6); scene.add(bed);
  const dawn = new THREE.DirectionalLight(0xffc8a0, 0); dawn.position.set(-3, 2, 1); scene.add(dawn);
  const tvLake = (g, w, h, t, still = false) => { g.fillStyle = '#9aa0aa'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8ccd0'; g.fillRect(0, h * 0.5, w, h * 0.5);
    g.fillStyle = '#080a0e'; g.beginPath(); g.ellipse(w / 2, h * 0.75, 16, 6, 0, 0, 7); g.fill(); g.fillStyle = '#e03028'; g.fillRect(w / 2 - 1, h * 0.75 - 2 + (still ? 0 : Math.round(Math.sin(t * 2.3))), 3, 3); };
  return { scene, sc, tv, con, dawn, amb, tvLake };
}

// Real-world Merrow Lake, morning: boathouse, dock, the hole, bucket, card
function shore(W, H) {
  const scene = new THREE.Scene(); const fogC = 0xb4bcc4; scene.background = new THREE.Color(fogC); scene.fog = new THREE.Fog(fogC, 4, 60);
  scene.add(new THREE.AmbientLight(0xd0d4dc, 1.4)); const sun = new THREE.DirectionalLight(0xffe0c0, 0.9); sun.position.set(6, 5, 4); scene.add(sun);
  const ice = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), lambert({ map: iceTex([40, 40]) })); ice.rotation.x = -Math.PI / 2; scene.add(ice);
  const land = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), lambert({ map: TEX.grass([30, 6]) })); land.rotation.x = -Math.PI / 2; land.position.set(0, 0.02, 30); scene.add(land);
  const bh = house({ w: 5, d: 4, h: 3, wall: [104, 100, 94], roofH: 1.4, door: true }); bh.position.set(0, 0, 14); bh.rotation.y = Math.PI; scene.add(bh);
  bh.userData.windows.forEach((w) => { w.material = lambert({ map: TEX.planks([90, 70, 50], [1, 1]) }); });
  const dock = box(1.4, 0.15, 7, lambert({ map: TEX.planks([90, 74, 58], [1, 4]) })); dock.position.set(1.5, 0.3, 9); dock.rotation.z = 0.04; scene.add(dock);
  const mb = new THREE.Group(); const post = box(0.1, 1.1, 0.1, lambert({ color: 0x3a3a3a })); post.position.y = 0.55; mb.add(post);
  const bx = box(0.3, 0.25, 0.45, lambert({ color: 0x5a5a5e })); bx.position.y = 1.2; mb.add(bx);
  const numC = textCanvas(32, 16, (g, w, h) => { g.fillStyle = '#5a5a5e'; g.fillRect(0, 0, w, h); g.fillStyle = '#eee'; g.font = 'bold 12px monospace'; g.fillText('14', 8, 13); });
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), new THREE.MeshBasicMaterial({ map: numC.tex })); num.position.set(0, 1.2, -0.23); num.rotation.y = Math.PI; mb.add(num);
  mb.position.set(-3.5, 0, 11); scene.add(mb);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: 0x05070c })); hole.rotation.x = -Math.PI / 2; hole.position.set(0, 0.012, -2); scene.add(hole);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 10), lambert({ color: 0x9a3a2a })); bucket.position.set(0.8, 0.2, -1.8); bucket.rotation.x = Math.PI; scene.add(bucket);
  const card = box(0.12, 0.02, 0.16, new THREE.MeshLambertMaterial({ color: 0x909090, emissive: 0x303030 })); card.position.set(0.8, 0.41, -1.8); card.rotation.y = 0.4; scene.add(card);
  const camera = camFor(W, H, 58);
  return { scene, camera, bh, mb, hole, bucket, card };
}

function parking(W, H) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9aa4ae); scene.fog = new THREE.Fog(0x9aa4ae, 6, 50);
  scene.add(new THREE.AmbientLight(0xd0d4d8, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(3, 6, 2); scene.add(sun);
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), lambert({ map: TEX.carpet([58, 60, 62], [20, 20]) })); asphalt.rotation.x = -Math.PI / 2; scene.add(asphalt);
  for (let i = -4; i <= 4; i++) { const l = box(0.1, 0.01, 4, new THREE.MeshBasicMaterial({ color: 0xd8d8c8 })); l.position.set(i * 2.8, 0.01, 0); scene.add(l); }
  const car = new THREE.Group(); const body = box(1.8, 0.7, 4.2, lambert({ color: 0x4a5a6e })); body.position.y = 0.55; car.add(body);
  const top = box(1.6, 0.55, 2.0, lambert({ color: 0x3a4a5e })); top.position.set(0, 1.15, -0.2); car.add(top);
  const glass = box(1.62, 0.4, 1.6, lambert({ color: 0x1a2028 })); glass.position.set(0, 1.2, -0.2); car.add(glass);
  car.position.set(1.4, 0, 0); scene.add(car);
  const tb = new THREE.Group(); const tbb = box(0.55, 0.22, 0.3, lambert({ color: 0x3a6a4a })); tb.add(tbb); const hnd = box(0.2, 0.04, 0.04, lambert({ color: 0x222222 })); hnd.position.y = 0.13; tb.add(hnd);
  tb.position.set(1.4, 0.99, 1.4); tb.rotation.y = 0.3; scene.add(tb);
  const office = box(30, 8, 2, lambert({ map: TEX.brick([10, 3]) })); office.position.set(0, 4, -12); scene.add(office);
  const camera = camFor(W, H, 55);
  return { scene, camera, tb };
}

export const SCENES3 = {
  // 1. Cold open: the fish on the ice with the watch + text box, then me in the bedroom, TV glow
  f01({ W, H }) {
    const L = lake(W, H); const f = fish(); f.position.set(0.25, 0.08, 0.4); f.rotation.y = 0.5; L.scene.add(f); L.flt.visible = false; L.line.visible = false;
    const a = camShot(L.scene, L.camera, (t, d) => {
      L.camera.position.set(0.55, 0.55, 0.95); L.camera.lookAt(0.28, 0.1, 0.38);
      const fl = Math.sin(t * 9) > 0.3 ? 0.18 : -0.12; f.rotation.z = fl * 0.6; f.userData.tail.rotation.y = fl * 2;
      L.setRod(0.1);
      if (t > 0.1) L.tb.show('CATCH LOGGED. RETURNED TO OWNER.', (t - 0.1) / 1.4);
    }, L.hud);
    const b = bedroom(W, H, { amb: 0.5 }); const cam = camFor(W, H, 55);
    const bs = camShot(b.scene, cam, (t, d) => { b.sc.redraw((g, w, h) => b.tvLake(g, w, h, t)); b.tv.userData.glow.intensity = 2.2; const q = ease(t / d); cam.position.set(0.4, 1.15, 2.0 - q * 0.4); cam.lookAt(0, 1.35, -2.2); });
    return composite([{ frac: 0.62, obj: a }, { frac: 0.38, obj: bs }]);
  },
  // 2. Parking lot: the tackle box on the hood; then the black case spine
  f02({ W, H }) {
    const P = parking(W, H);
    const a = camShot(P.scene, P.camera, (t, d) => { const q = ease(t / d); P.camera.position.set(-1.5 + q * 1.8, 1.7 - q * 0.3, 4.5 - q * 2.2); P.camera.lookAt(1.4, 1.0, 1.4); });
    const b = screen(W, H, (g, w, h, t) => drawSpine(g, w, h, t));
    return composite([{ frac: 0.55, obj: a }, { frac: 0.45, obj: b }]);
  },
  // 3. Title, then the one-line tutorial
  f03({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawTitleSW(g, w, h, t));
    const b = screen(W, H, (g, w, h, t) => drawTyped(g, w, h, t, ['EVERYTHING IN THE LAKE WAS LOST BY SOMEONE.', "FISH UNTIL YOU FIND WHAT'S YOURS."], 14));
    return composite([{ frac: 0.55, obj: a }, { frac: 0.45, obj: b }]);
  },
  // 4. First night: seated, float bobbing, wide of the shack; catch log; memory card
  f04({ W, H }) {
    const L = lake(W, H);
    const a = camShot(L.scene, L.camera, (t) => { L.sitCam(t); L.bob(t); L.setRod(Math.max(0, Math.sin(t * 0.9)) * 0.25); }, L.hud);
    const L2 = lake(W, H);
    const w = camShot(L2.scene, L2.camera, (t, d) => { const q = t / d; L2.camera.position.set(4 - q * 1.2, 1.8, 5); L2.camera.lookAt(-1, 0.6, -0.5); L2.bob(t); L2.setRod(0.1); });
    const b = screen(W, H, (g, w2, h, t, d) => drawCatchLog(g, w2, h, t, CATCH.slice(0, 5).map((r) => [r[0], '—', r[2]]), clamp01(t / (d * 0.6))));
    const c = screen(W, H, (g, w2, h, t) => drawMemoryCardNW(g, w2, h, t, 'STILLWATER', '1:07', 'TODAY'));
    return composite([{ frac: 0.34, obj: a }, { frac: 0.22, obj: w }, { frac: 0.3, obj: b }, { frac: 0.14, obj: c }]);
  },
  // 5. The log with names; the 1961 archive page
  f05({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawCatchLog(g, w, h, t, CATCH.slice(0, 5), 1, false, Math.floor(t / 2.5) % 2 ? 3 : 2));
    const b = screen(W, H, (g, w, h, t) => drawArchive(g, w, h, t, 1987));
    const c = screen(W, H, (g, w, h, t) => drawArchive(g, w, h, t, 1961));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.25, obj: b }, { frac: 0.45, obj: c }]);
  },
  // 6. Pause rule; float freezes mid-ripple
  f06({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => { g.fillStyle = '#8a909a'; g.fillRect(0, 0, w, h); drawPauseSW(g, w, h, t); });
    const L = lake(W, H, { night: true });
    const b = camShot(L.scene, L.camera, (t, d) => { L.camera.position.set(0.05, 0.6, 0.55); L.camera.lookAt(0, 0.02, 0); L.bob(t, t > d * 0.45); L.setRod(0.05); }, L.hud);
    return composite([{ frac: 0.42, obj: a }, { frac: 0.58, obj: b }]);
  },
  // 7. Reeling: rod bends, the collar rises out of the hole, text box
  f07({ W, H }) {
    const L = lake(W, H, { night: true });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 4, 12), lambert({ color: 0x2a5ad0 })); L.scene.add(collar);
    const tag = box(0.04, 0.03, 0.005, new THREE.MeshLambertMaterial({ color: 0xc0c0c0, emissive: 0x333333 })); collar.add(tag); tag.position.y = -0.11;
    return camShot(L.scene, L.camera, (t, d) => {
      const p = t / d; L.sitCam(t, 0.3);
      const bend = p < 0.6 ? 0.4 + 0.5 * ease(p / 0.6) + Math.sin(t * 17) * 0.04 : 0.9 * (1 - ease((p - 0.6) / 0.1));
      L.setRod(bend);
      const rise = ease((p - 0.5) / 0.15); collar.position.set(0, -0.2 + rise * 0.45, 0); collar.visible = p > 0.5; collar.rotation.x = Math.PI / 2 * (1 - rise);
      L.flt.visible = p < 0.5;
      if (p > 0.35 && p < 0.62) L.tb.show('SOMETHING YOU LOST.', (p - 0.35) / 0.08); else L.tb.hide();
      if (p > 0.62) { L.camera.position.set(0.15, 0.6, 0.45); L.camera.lookAt(0, 0.22, 0); }
    }, L.hud);
  },
  // 8. The hole grows (top-down, screenshot compare); log of things I lost
  f08({ W, H }) {
    const L = lake(W, H, { night: true });
    const a = camShot(L.scene, L.camera, (t, d) => { const p = t / d; L.setHole(0.32 + Math.floor(p * 5) * 0.07); L.camera.position.set(0, 2.2, 0.01); L.camera.lookAt(0, 0, 0); L.bob(t); L.setRod(0); }, L.hud);
    const b = screen(W, H, (g, w, h, t, d) => drawCatchLog(g, w, h, t, CATCH, clamp01(0.55 + 0.45 * t / (d * 0.8)), false, 5 + Math.min(4, Math.floor(t / (d / 5)))));
    return composite([{ frac: 0.45, obj: a }, { frac: 0.55, obj: b }]);
  },
  // 9. Magazine preview, push in on the boathouse line
  f09({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawMagazineSW(g, w, h, t, clamp01((t / d - 0.45) / 0.4)));
    const L = lake(W, H); const b = camShot(L.scene, L.camera, (t, d) => { const q = t / d; L.camera.position.set(-6 + q * 2, 2.4, 8); L.camera.lookAt(-2, 0.8, -2); L.bob(t); L.setRod(0); });
    return composite([{ frac: 0.72, obj: a }, { frac: 0.28, obj: b }]);
  },
  // 10. Forum thread, typed
  f10({ W, H }) {
    const b = bedroom(W, H, { amb: 0.6 }); const cam = camFor(W, H, 50);
    const a = camShot(b.scene, cam, (t, d) => { b.sc.redraw((g, w, h) => b.tvLake(g, w, h, t)); b.tv.userData.glow.intensity = 1.8; cam.position.set(1.8, 1.4, 0.4); cam.lookAt(0, 1.3, -2.2); });
    const f = screen(W, H, (g, w, h, t, d) => drawForumSW(g, w, h, t, clamp01(t / (d * 0.85))));
    return composite([{ frac: 0.2, obj: a }, { frac: 0.8, obj: f }]);
  },
  // 11. Debug menu to LAKE MAP; map fills with red squares; push in to 14 Merrow Road
  f11({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawDebugSW(g, w, h, t, Math.min(3, Math.floor((t / d) * 5))));
    const m = screen(W, H, (g, w, h, t, d) => drawLakeMap(g, w, h, t, clamp01(t / (d * 0.45)), clamp01((t / d - 0.5) / 0.35)));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.7, obj: m }]);
  },
  // 12. The grey entry; looking down into the wide hole, something pale far below
  f12({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawCatchLog(g, w, h, t, CATCH.slice(4), 1, true));
    const L = lake(W, H, { night: true, holeR: 0.75 });
    const b = camShot(L.scene, L.camera, (t, d) => { const q = ease(t / d); L.camera.position.set(0.1, 1.5 - q * 0.5, 1.0 - q * 0.6); L.camera.lookAt(0, 0, 0); L.pale.material.opacity = 0.15 + q * 0.35; L.bob(t, true); L.setRod(0); }, L.hud);
    return composite([{ frac: 0.55, obj: a }, { frac: 0.45, obj: b }]);
  },
  // 13. Last night: still float, text box by itself, rod bends on its own; power off; card flash
  f13({ W, H }) {
    const L = lake(W, H, { night: true, holeR: 0.85 });
    const a = camShot(L.scene, L.camera, (t, d) => { const p = t / d; L.sitCam(t, 0); L.bob(t, true); L.setRod(p > 0.55 ? ease((p - 0.55) / 0.45) * 0.9 : 0);
      if (p > 0.15) L.tb.show('YOU KNOW WHAT IS ON THE LINE.', (p - 0.15) / 0.1); }, L.hud);
    const b = bedroom(W, H, { amb: 0.3 }); const cam = camFor(W, H, 50); b.con.userData.led.material.color.set(0x200808);
    const off = camShot(b.scene, cam, (t) => { b.sc.redraw((g, w, h) => { g.fillStyle = '#040506'; g.fillRect(0, 0, w, h); }); b.tv.userData.glow.intensity = 0; cam.position.set(0, 1.25, 0.6); cam.lookAt(0, 1.4, -2.2); });
    const card = screen(W, H, (g, w, h, t) => { drawMemoryCardNW(g, w, h, t, 'STILLWATER', '+1 MIN', '03/03/2004'); g.fillStyle = `rgba(0,0,0,${clamp01(t / 1.5)})`; g.fillRect(0, 0, w, h); });
    return composite([{ frac: 0.62, obj: a }, { frac: 0.18, obj: card }, { frac: 0.2, obj: off }]);
  },
  // 14. Merrow Lake for real: boathouse, mailbox 14, the hole, the card on the bucket; logo
  f14({ W, H }) {
    const S = shore(W, H);
    const a = camShot(S.scene, S.camera, (t, d) => { const q = ease(t / d); S.camera.position.set(-6 + q * 3, 1.7, 4 + q * 1.5); S.camera.lookAt(0, 1.6, 14); });
    const S2 = shore(W, H);
    const m = camShot(S2.scene, S2.camera, (t) => { S2.camera.position.set(-3.6, 1.35, 9.3 + t * 0.03); S2.camera.lookAt(-3.5, 1.2, 11); });
    const S3 = shore(W, H);
    const h = camShot(S3.scene, S3.camera, (t, d) => { const q = ease(t / d); S3.camera.position.set(0.3, 1.65 - q * 0.5, 2.5 - q * 2.2); S3.camera.lookAt(0.6, 0.3, -1.9); });
    const black = screen(W, H, (g, w, h2) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h2); });
    const logo = screen(W, H, (g, w, h2, t) => drawLogo(g, w, h2, t, 5));
    return composite([{ frac: 0.26, obj: a }, { frac: 0.14, obj: m }, { frac: 0.4, obj: h }, { frac: 0.04, obj: black }, { frac: 0.16, obj: logo }]);
  },
  // intro logo (6 s)
  f00({ W, H }) { return screen(W, H, (g, w, h, t) => drawLogo(g, w, h, t, 5)); },
  // ---- shorts (vertical) ----
  // S07: open ON the fish with the watch (strongest image), log, grey entry, CTA
  sh7({ W, H }) { const a = SCENES3.f01({ W, H }), b = SCENES3.f05({ W, H }), c = SCENES3.f12({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.22, obj: b }, { frac: 0.36, obj: c }, { frac: 0.12, obj: e }]); },
  // S08: open on the frozen float, collar rises, the hole grows, CTA
  sh8({ W, H }) { const a = SCENES3.f06({ W, H }), b = SCENES3.f07({ W, H }), c = SCENES3.f08({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.22, obj: later(b, 1.4) }, { frac: 0.2, obj: later(a, 1.2) }, { frac: 0.18, obj: b }, { frac: 0.28, obj: c }, { frac: 0.12, obj: e }]); },
  // S09: open on the map label, shore, the hole, CTA
  sh9({ W, H }) { const a = screen(W, H, (g, w, h, t, d) => drawLakeMap(g, w, h, t, 1, 0.45 + 0.55 * clamp01(t / d))), b = SCENES3.f14({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.42, obj: a }, { frac: 0.46, obj: b }, { frac: 0.12, obj: e }]); },
};
