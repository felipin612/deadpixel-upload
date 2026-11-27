// EP04 "SIGNALMAN" scenes + shorts S10-S12.
import * as THREE from 'three';
import { TEX, lambert, box, house, hudSprite, drawTextBox, rng, ease, clamp01, room, textCanvas, figure } from './lib.js';
import { screenScene, drawLogo, drawCTA } from './screens.js';
import { drawTyped, drawMemoryCardNW } from './screens2.js';
import { drawTitleSM, drawTimetable, drawTimetableBack, drawDiagram, drawBellCodes, drawRegister, drawMagazineSM,
  drawForumSM, drawDebugSM, drawLineView } from './screens4.js';

const camFor = (W, H, fov = 62) => new THREE.PerspectiveCamera(W > H ? fov : fov * 1.45, W / H, 0.1, 160);
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

// ---- the train: engine + 6 carriages, last window lit with a seated figure holding a card ----
function train() {
  const g = new THREE.Group(); const dark = lambert({ color: 0x46505a }); const roofM = lambert({ color: 0x1a1c20 });
  const eng = box(2.4, 2.4, 5, lambert({ color: 0x1e2a22 })); eng.position.set(0, 1.6, 0); g.add(eng);
  const cab = box(2.4, 0.9, 1.6, lambert({ color: 0x18201a })); cab.position.set(0, 3.2, -1.6); g.add(cab);
  const lampM = new THREE.MeshBasicMaterial({ color: 0xfff0c0 });
  for (const x of [-0.8, 0.8]) { const l = box(0.3, 0.3, 0.05, lampM); l.position.set(x, 1.0, 2.53); g.add(l); }
  const head = new THREE.SpotLight(0xfff0c0, 30, 40, 0.5, 0.6, 1.2); head.position.set(0, 1.2, 2.6); head.target.position.set(0, 0, 20); g.add(head, head.target);
  const winDark = lambert({ color: 0x0a0c10 }); const wl = textCanvas(32, 24, (g, w, h) => { g.fillStyle = '#ffd070'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3226'; g.fillRect(12, 6, 8, 7); g.fillRect(10, 12, 12, 12); g.fillStyle = '#8a8a8a'; g.fillRect(14, 15, 4, 4); });
  const winLit = new THREE.MeshBasicMaterial({ map: wl.tex });
  let last = null;
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Group(); const b = box(2.3, 2.2, 6, dark); b.position.y = 1.5; c.add(b);
    const r = box(2.4, 0.2, 6.1, roofM); r.position.y = 2.7; c.add(r);
    for (const sx of [1.17, -1.17]) for (let k = 0; k < 4; k++) { const wn = box(0.05, 0.7, 0.9, (i === 5 && k === 2) ? winLit : winDark); wn.position.set(sx, 1.8, -2.2 + k * 1.45); c.add(wn); }
    c.position.z = -5.8 - i * 6.3; g.add(c); if (i === 5) last = c;
  }
  const pass = figure(0x6a6a70); pass.scale.setScalar(0.85); pass.position.set(0.6, 0.9, -2.2 + 2 * 1.45); pass.rotation.y = Math.PI / 2; last.add(pass);
  const card = box(0.14, 0.02, 0.18, new THREE.MeshLambertMaterial({ color: 0x909090, emissive: 0x404040 })); card.position.set(0.85, 1.38, -2.2 + 2 * 1.45); last.add(card);
  const glow = new THREE.PointLight(0xffc060, 4, 6, 2); glow.position.set(1.6, 1.8, -2.2 + 2 * 1.45); last.add(glow);
  g.userData = { last, pass, card, glow, winLit, empty: () => wl.redraw((c, w, h) => { c.fillStyle = '#ffd070'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a5a40'; c.fillRect(8, 18, 16, 6); c.fillStyle = '#8a8a8a'; c.fillRect(14, 15, 4, 3); }) };
  return g;
}

// ---- exterior: single line at night, signal post, the box on stilts ----
function line(W, H, opts = {}) {
  const scene = new THREE.Scene(); const fogC = 0x10131a; scene.background = new THREE.Color(fogC); scene.fog = new THREE.Fog(fogC, 6, opts.far || 70);
  scene.add(new THREE.AmbientLight(0x5a6478, 1.0)); const moon = new THREE.DirectionalLight(0xa0b0d0, 0.35); moon.position.set(-6, 10, 4); scene.add(moon);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), lambert({ map: TEX.grass([60, 60]) })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const bal = new THREE.Mesh(new THREE.PlaneGeometry(4, 300), lambert({ map: TEX.dirt([1, 60]) })); bal.rotation.x = -Math.PI / 2; bal.position.y = 0.01; scene.add(bal);
  const railM = lambert({ color: 0x8a8c90 });
  for (const x of [-0.72, 0.72]) { const r = box(0.08, 0.12, 300, railM); r.position.set(x, 0.12, 0); scene.add(r); }
  const slM = lambert({ map: TEX.planks([60, 48, 36], [1, 1]) });
  for (let z = -150; z < 150; z += 0.9) { const s = box(2.2, 0.08, 0.25, slM); s.position.set(0, 0.05, z); scene.add(s); }
  // signal post with arm + lamp
  const sig = new THREE.Group(); const post = box(0.15, 5, 0.15, lambert({ color: 0x2a2a2a })); post.position.y = 2.5; sig.add(post);
  const arm = box(1.2, 0.22, 0.05, lambert({ color: 0xc02a20 })); arm.position.set(0.6, 4.6, 0.1); sig.add(arm);
  const lampM = new THREE.MeshBasicMaterial({ color: 0xff2a1a }); const lamp = box(0.18, 0.18, 0.06, lampM); lamp.position.set(0.1, 4.2, 0.12); sig.add(lamp);
  const sl = new THREE.PointLight(0xff3020, 3, 6, 2); sl.position.set(0.1, 4.2, 0.6); sig.add(sl);
  sig.position.set(-1.8, 0, 8); scene.add(sig);
  const setSignal = (green) => { lampM.color.set(green ? 0x30ff60 : 0xff2a1a); sl.color.set(green ? 0x40ff70 : 0xff3020); arm.rotation.z = green ? -0.7 : 0; };
  // the box
  const bx = house({ w: 3.4, d: 2.6, h: 2.2, wall: [70, 54, 40], roofH: 0.9, lit: true, door: false }); bx.position.set(3.4, 2.0, 2); bx.rotation.y = -Math.PI / 2; scene.add(bx);
  for (const [x, z] of [[-1.5, -1.1], [1.5, -1.1], [-1.5, 1.1], [1.5, 1.1]]) { const st = box(0.15, 2, 0.15, lambert({ color: 0x2a2420 })); st.position.set(3.4 + z, 1, 2 + x); scene.add(st); }
  const tr = train(); tr.position.set(0, 0, opts.trainZ ?? -60); scene.add(tr);
  const camera = camFor(W, H, 58); const hud = new THREE.Scene(); const tb = textBox(hud, W, H);
  return { scene, camera, hud, tb, tr, setSignal, sig, bx };
}

// ---- interior of the signal box: lever frame, diagram board, window onto the line ----
function cabin(W, H, opts = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050608);
  scene.add(new THREE.AmbientLight(0x6a6050, 0.9));
  const lamp = new THREE.PointLight(0xffc070, 6, 10, 1.6); lamp.position.set(0, 2.6, 0.5); scene.add(lamp);
  scene.add(room(6, 3.2, 4.4, [74, 62, 48], TEX.planks([80, 64, 48], [4, 3])));
  const board = textCanvas(240, 120, () => {}); const bd = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.5), new THREE.MeshBasicMaterial({ map: board.tex }));
  bd.position.set(0, 2.25, -2.18); scene.add(bd);
  const frame = box(4.4, 0.25, 0.6, lambert({ color: 0x2a2a2a })); frame.position.set(0, 0.35, -1.4); scene.add(frame);
  const levers = [];
  for (let i = 0; i < 12; i++) { const col = i === 11 ? 0xd8c030 : (i % 4 === 3 ? 0x222222 : 0xb0281e);
    const lv = new THREE.Group(); const rod = box(0.07, 1.3, 0.07, lambert({ color: col })); rod.position.y = 0.65; lv.add(rod);
    const grip = box(0.12, 0.12, 0.12, lambert({ color: 0xd0d0d0 })); grip.position.y = 1.3; lv.add(grip);
    lv.position.set(-1.9 + i * 0.345, 0.45, -1.4); lv.rotation.x = -0.35; scene.add(lv); levers.push(lv); }
  // window to the line (left wall), outside is near-black with a red point
  const win = box(0.05, 1.0, 1.8, new THREE.MeshBasicMaterial({ color: 0x0a0e16 })); win.position.set(-2.97, 1.8, 0.2); scene.add(win);
  const red = box(0.02, 0.06, 0.06, new THREE.MeshBasicMaterial({ color: 0xff2a1a })); red.position.set(-2.94, 1.65, 0.7); scene.add(red);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.18, 10), lambert({ color: 0xb09040, emissive: 0x201000 })); bell.position.set(1.8, 1.8, -2.1); scene.add(bell);
  const tt = box(0.5, 0.7, 0.02, lambert({ color: 0xe4dcc6, emissive: 0x2a2620 })); tt.position.set(2.4, 1.7, -2.18); scene.add(tt);
  const camera = camFor(W, H, 60); const hud = new THREE.Scene(); const tb = textBox(hud, W, H);
  const drawBoard = (t, ghost = 0, cleared = false, lit = -1) => board.redraw((g, w, h) => drawDiagram(g, w, h, t, ghost, cleared, lit));
  return { scene, camera, hud, tb, levers, drawBoard, bell, red, win, lamp };
}

// ---- my street at night: house with the blue door and the flickering porch light ----
function street(W, H, opts = {}) {
  const scene = new THREE.Scene(); const fogC = 0x0c0f16; scene.background = new THREE.Color(fogC); scene.fog = new THREE.Fog(fogC, 5, 55);
  scene.add(new THREE.AmbientLight(0x6a7488, 1.7)); const mn = new THREE.DirectionalLight(0xa0b0d0, 0.6); mn.position.set(-5, 9, 8); scene.add(mn);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), lambert({ map: TEX.grass([40, 40]) })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 6), lambert({ map: TEX.dirt([40, 1]) })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 9); scene.add(road);
  const h = house({ w: 5, d: 4, h: 2.8, wall: [150, 148, 140], roofH: 1.4, door: true, porch: true }); scene.add(h);
  h.userData.door.material = lambert({ color: 0x2a4a9a });
  const porchM = new THREE.MeshBasicMaterial({ color: 0xffd090 }); const bulb = box(0.15, 0.15, 0.15, porchM); bulb.position.set(0.7, 2.0, 2.1); scene.add(bulb);
  const pl = new THREE.PointLight(0xffc880, 6, 9, 1.6); pl.position.set(0.7, 1.9, 2.8); scene.add(pl);
  const flick = (t, start = 0) => { const k = t - start; const on = k < 0 ? 0 : (k < 0.15 ? 1 : k < 0.3 ? 0 : k < 0.45 ? 1 : k < 0.6 ? 0 : 1); pl.intensity = 6 * on; porchM.color.set(on ? 0xffd090 : 0x302a20); };
  const mat = box(0.9, 0.03, 0.55, lambert({ color: 0x5a3a2a })); mat.position.set(0, 0.17, 2.85); scene.add(mat);
  const card = box(0.14, 0.02, 0.18, new THREE.MeshLambertMaterial({ color: 0x909090, emissive: 0x404040 })); card.position.set(0.1, 0.2, 2.85); card.rotation.y = 0.5; card.visible = !!opts.card; scene.add(card);
  let tr = null;
  if (opts.train) { // the in-game train, standing on a "platform" in front of the house
    const plat = box(60, 0.6, 2.2, lambert({ map: TEX.stone([20, 1]) })); plat.position.set(0, 0.3, 6.2); scene.add(plat);
    tr = train(); tr.rotation.y = Math.PI / 2; tr.position.set(34.5, 0, 8.6); scene.add(tr);
  }
  const camera = camFor(W, H, 56); const hud = new THREE.Scene(); const tb = textBox(hud, W, H);
  return { scene, camera, hud, tb, flick, card, tr, house: h };
}

// ---- mailbox by day ----
function mailbox(W, H) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xa8b0b8); scene.fog = new THREE.Fog(0xa8b0b8, 6, 50);
  scene.add(new THREE.AmbientLight(0xd0d4d8, 1.5)); const sun = new THREE.DirectionalLight(0xfff0e0, 0.8); sun.position.set(4, 6, 3); scene.add(sun);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), lambert({ map: TEX.grass([40, 40]) })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const h = house({ w: 5, d: 4, h: 2.8, wall: [150, 148, 140], roofH: 1.4, door: true, porch: true }); h.position.set(0, 0, -6); scene.add(h); h.userData.door.material = lambert({ color: 0x2a4a9a });
  const mb = new THREE.Group(); const post = box(0.1, 1.1, 0.1, lambert({ color: 0x3a3a3a })); post.position.y = 0.55; mb.add(post);
  const bx = box(0.3, 0.28, 0.5, lambert({ color: 0x4a4a50 })); bx.position.y = 1.22; mb.add(bx);
  const paper = box(0.26, 0.03, 0.2, lambert({ color: 0xe4dcc6, emissive: 0x222018 })); paper.position.set(0, 1.18, 0.3); mb.add(paper);
  const flag = box(0.03, 0.18, 0.08, lambert({ color: 0xc02a20 })); flag.position.set(0.17, 1.35, -0.1); mb.add(flag);
  mb.position.set(1.2, 0, 1); scene.add(mb);
  return { scene, camera: camFor(W, H, 55), paper };
}

const black = (W, H) => screen(W, H, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); });

export const SCENES4 = {
  // 1. Cold open: the train in front of my house, lit window, text box; porch light flickers
  e401({ W, H }) {
    const S = street(W, H, { train: true });
    const a = camShot(S.scene, S.camera, (t, d) => { const q = ease(t / d); S.camera.position.set(-8 + q * 2, 6.5 - q * 0.6, 16 - q * 1.5); S.camera.lookAt(0, 1.2, 3.5); S.flick(t, 0.4);
      if (t > 1.2) S.tb.show('PLATFORM CLEAR. WAITING FOR YOU.', (t - 1.2) / 1.6); }, S.hud);
    const S2 = street(W, H, { train: true });
    const b = camShot(S2.scene, S2.camera, (t, d) => { S2.flick(5); S2.camera.position.set(-0.6 + t * 0.03, 2.0, 12.0); S2.camera.lookAt(-2.1, 1.8, 7.4); });
    return composite([{ frac: 0.62, obj: a }, { frac: 0.38, obj: b }]);
  },
  // 2. Mailbox with the folded timetable; the circled departure; the case spine
  e402({ W, H }) {
    const M = mailbox(W, H);
    const a = camShot(M.scene, M.camera, (t, d) => { const q = ease(t / d); M.camera.position.set(-1.2 + q * 1.6, 1.7 - q * 0.2, 4 - q * 2.2); M.camera.lookAt(1.2, 1.2, 1); });
    const b = screen(W, H, (g, w, h, t) => drawTimetable(g, w, h, t, undefined, true, true));
    const c = screen(W, H, (g, w, h, t) => { g.fillStyle = '#060608'; g.fillRect(0, 0, w, h); const sw = w > h ? w * 0.12 : w * 0.22; const x = w / 2 - sw / 2;
      g.fillStyle = '#101012'; g.fillRect(x, h * 0.06, sw, h * 0.88); g.save(); g.translate(w / 2 + 4, h * 0.5); g.rotate(-Math.PI / 2);
      g.fillStyle = '#f0f0f0'; g.textAlign = 'center'; g.font = `bold ${Math.round(sw * 0.42)}px monospace`; g.fillText('SIGNALMAN', 0, 0);
      g.font = `${Math.round(sw * 0.18)}px monospace`; g.fillStyle = '#bbb'; g.fillText('keep the line clear', 0, sw * 0.32); g.restore(); g.textAlign = 'left'; });
    return composite([{ frac: 0.4, obj: a }, { frac: 0.3, obj: b }, { frac: 0.3, obj: c }]);
  },
  // 3. Title, then the one-line rule
  e403({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawTitleSM(g, w, h, t));
    const C = cabin(W, H); const b = camShot(C.scene, C.camera, (t, d) => { C.drawBoard(t); C.camera.position.set(0, 1.7, 1.6 - t * 0.02); C.camera.lookAt(0, 1.3, -2); });
    const c = screen(W, H, (g, w, h, t) => drawTyped(g, w, h, t, w > h ? ['CLEAR ONLY THE TRAINS ON THE TIMETABLE.', 'ANYTHING ELSE, HOLD AT RED.'] : ['CLEAR ONLY THE TRAINS', 'ON THE TIMETABLE.', 'ANYTHING ELSE,', 'HOLD AT RED.'], 14));
    return composite([{ frac: 0.4, obj: a }, { frac: 0.25, obj: b }, { frac: 0.35, obj: c }]);
  },
  // 4. First night: levers, freight rolls past with green signal, timetable, memory card
  e404({ W, H }) {
    const C = cabin(W, H);
    const a = camShot(C.scene, C.camera, (t, d) => { const q = t / d; C.drawBoard(t, 0, false, Math.floor(q * 6)); C.levers[3].rotation.x = -0.35 + ease(q * 2) * 0.7; C.camera.position.set(0.6, 1.6, 0.6); C.camera.lookAt(-0.4, 0.9, -1.4); });
    const L = line(W, H, { trainZ: -40 }); L.setSignal(true); L.tr.userData.winLit.color.set(0x0a0c10); L.tr.userData.pass.visible = false; L.tr.userData.glow.intensity = 0; L.tr.userData.card.visible = false;
    const b = camShot(L.scene, L.camera, (t, d) => { L.tr.position.z = -40 + t * 9; L.camera.position.set(1.6, 3.4, -0.6); L.camera.lookAt(0, 1, 8); });
    const c = screen(W, H, (g, w, h, t) => drawTimetable(g, w, h, t));
    const e = screen(W, H, (g, w, h, t) => drawMemoryCardNW(g, w, h, t, 'SIGNALMAN', '1:12', 'TODAY'));
    return composite([{ frac: 0.32, obj: a }, { frac: 0.33, obj: b }, { frac: 0.2, obj: c }, { frac: 0.15, obj: e }]);
  },
  // 5. 03:03 light on the unpainted branch; bell codes; the timetable without it
  e405({ W, H }) {
    const C = cabin(W, H); C.lamp.intensity = 3;
    const a = camShot(C.scene, C.camera, (t, d) => { C.drawBoard(t, t > d * 0.25 ? 1 : 0); const q = ease(t / d); C.camera.position.set(0.8 - q * 0.3, 1.9, 0.8 - q * 0.6); C.camera.lookAt(1.3, 2.4, -2.2); });
    const b = screen(W, H, (g, w, h, t) => drawBellCodes(g, w, h, t, 5));
    const c = screen(W, H, (g, w, h, t) => drawTimetable(g, w, h, t));
    return composite([{ frac: 0.45, obj: a }, { frac: 0.3, obj: b }, { frac: 0.25, obj: c }]);
  },
  // 6. Holding at red all night: the red lamp in the rain; dawn; the register line
  e406({ W, H }) {
    const L = line(W, H, { trainZ: -90 });
    const a = camShot(L.scene, L.camera, (t) => { L.camera.position.set(-0.4, 3.8, 9.4); L.camera.lookAt(-1.6, 3.9, 0); });
    const C = cabin(W, H); const b = camShot(C.scene, C.camera, (t) => { C.drawBoard(t, 1); C.bell.rotation.z = Math.sin(t * 30) * (Math.floor(t * 1.2) % 3 === 0 ? 0.25 : 0); C.camera.position.set(1.2, 1.8, 0); C.camera.lookAt(1.8, 1.8, -2.1); });
    const c = screen(W, H, (g, w, h, t, d) => drawRegister(g, w, h, t, clamp01((t - 0.8) / (d * 0.5))));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.25, obj: b }, { frac: 0.45, obj: c }]);
  },
  // 7. Third night: the train seen from the window, one lit carriage; zoom to the passenger with the card
  e407({ W, H }) {
    const L = line(W, H, { trainZ: -26 });
    const a = camShot(L.scene, L.camera, (t, d) => { const q = ease(t / d); L.camera.position.set(1.6, 3.4, -0.6); L.camera.lookAt(0, 1.4, -30 + q * 6); });
    const L2 = line(W, H, { trainZ: -26 });
    const b = camShot(L2.scene, L2.camera, (t, d) => { const q = ease(t / d); const z = -26 - 5.8 - 5 * 6.3 + 0.7; L2.camera.position.set(4.5 - q * 2.2, 2.2, z + 2.5 - q * 2.0); L2.camera.lookAt(0.8, 1.6, z); });
    return composite([{ frac: 0.5, obj: a }, { frac: 0.5, obj: b }]);
  },
  // 8. The magazine preview, zoom on the founder quote
  e408({ W, H }) { return screen(W, H, (g, w, h, t, d) => drawMagazineSM(g, w, h, t, clamp01((t / d - 0.35) / 0.4))); },
  // 9. Forum reply; then the frozen lake memory (boathouse) — R. Kell
  e409({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawForumSM(g, w, h, t, clamp01(t / (d * 0.45))));
    const b = screen(W, H, (g, w, h, t) => drawTyped(g, w, h, t, w > h ? ['R. KELL — MERROW LAKE — 1961', 'J. KELL — DEAD PIXEL STUDIOS — 2001'] : ['R. KELL', 'MERROW LAKE, 1961', 'J. KELL', 'DEAD PIXEL STUDIOS, 2001'], 12));
    return composite([{ frac: 0.62, obj: a }, { frac: 0.38, obj: b }]);
  },
  // 10. Debug menu -> LINE VIEW; route draws across the lake to my street
  e410({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawDebugSM(g, w, h, t, Math.min(3, Math.floor((t / d) * 5))));
    const m = screen(W, H, (g, w, h, t, d) => drawLineView(g, w, h, t, clamp01(t / (d * 0.55)), clamp01((t / d - 0.62) / 0.3)));
    return composite([{ frac: 0.25, obj: a }, { frac: 0.75, obj: m }]);
  },
  // 11. Fourth night: the train creeps forward at red until its lamps fill the window; text box; passenger looks up
  e411({ W, H }) {
    const L = line(W, H, { trainZ: -60 });
    const a = camShot(L.scene, L.camera, (t, d) => { const q = t / d; L.tr.position.z = -60 + Math.floor(q * 8) / 8 * 56; L.camera.position.set(1.6, 3.4, -0.6); L.camera.lookAt(0, 1.3, -10);
      if (q > 0.55) L.tb.show('HOLDING A TRAIN IS NOT THE SAME AS STOPPING IT.', (q - 0.55) / 0.15); }, L.hud);
    const L2 = line(W, H, { trainZ: 6 }); L2.tr.userData.pass.rotation.y = Math.PI / 2 - 0.9;
    const b = camShot(L2.scene, L2.camera, (t) => { const z = 6 - 5.8 - 5 * 6.3 + 0.7; L2.camera.position.set(2.6, 2.6, z + 0.8); L2.camera.lookAt(0.6, 1.5, z); });
    return composite([{ frac: 0.72, obj: a }, { frac: 0.28, obj: b }]);
  },
  // 12. The circled departure, then the back of the timetable
  e412({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawTimetable(g, w, h, t, undefined, true, true));
    const b = screen(W, H, (g, w, h, t, d) => drawTimetableBack(g, w, h, t, clamp01(t / (d * 0.6))));
    return composite([{ frac: 0.45, obj: a }, { frac: 0.55, obj: b }]);
  },
  // 13. Lever pulled: signal green, the train rolls past, empty window with the card; black; memory card
  e413({ W, H }) {
    const C = cabin(W, H);
    const a = camShot(C.scene, C.camera, (t, d) => { const q = t / d; C.drawBoard(t, 1, q > 0.4); C.levers[11].rotation.x = -0.35 + ease((q - 0.2) / 0.3) * 0.7; C.camera.position.set(-0.6, 1.5, 0.2); C.camera.lookAt(1.6, 0.9, -1.4); });
    const L = line(W, H, { trainZ: -30 }); L.setSignal(true); L.tr.userData.pass.visible = false; L.tr.userData.empty();
    const b = camShot(L.scene, L.camera, (t, d) => { L.tr.position.z = -30 + t * 4.5; L.camera.position.set(1.6, 3.4, -0.6); L.camera.lookAt(0, 1.4, -14); });
    const c = screen(W, H, (g, w, h, t) => drawMemoryCardNW(g, w, h, t, 'SIGNALMAN', '+3 MIN', '03/03/2004'));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.42, obj: b }, { frac: 0.05, obj: black(W, H) }, { frac: 0.23, obj: c }]);
  },
  // 14. Real world: my house at 3:15, porch light flickers twice and stays on; the card on the mat; logo
  e414({ W, H }) {
    const S = street(W, H, { card: true });
    const a = camShot(S.scene, S.camera, (t, d) => { const q = ease(t / d); S.camera.position.set(-5 + q * 2, 1.7, 12 - q * 3); S.camera.lookAt(0, 1.3, 2); S.flick(t, d * 0.55); });
    const S2 = street(W, H, { card: true });
    const b = camShot(S2.scene, S2.camera, (t, d) => { S2.flick(5); const q = ease(t / d); S2.camera.position.set(0.3, 1.5 - q * 0.6, 4.6 - q * 1.0); S2.camera.lookAt(0.1, 0.2, 2.85); });
    const logo = screen(W, H, (g, w, h, t) => drawLogo(g, w, h, t, 6));
    return composite([{ frac: 0.42, obj: a }, { frac: 0.38, obj: b }, { frac: 0.04, obj: black(W, H) }, { frac: 0.16, obj: logo }]);
  },
  e400({ W, H }) { return screen(W, H, (g, w, h, t) => drawLogo(g, w, h, t, 6)); },
  // ---- shorts (vertical): open on the strongest image, no logo, no slow move ----
  sh10({ W, H }) { const S = street(W, H, { train: true });
    const a = camShot(S.scene, S.camera, (t) => { S.flick(t, 0.6); S.camera.position.set(-6, 5.2, 15); S.camera.lookAt(0.2, 0.0, 4.5); }, S.hud);
    const b = SCENES4.e403({ W, H }), c = SCENES4.e405({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.32, obj: a }, { frac: 0.26, obj: later(b, 0.6) }, { frac: 0.3, obj: c }, { frac: 0.12, obj: e }]); },
  sh11({ W, H }) { const C = cabin(W, H); C.lamp.intensity = 3;
    const a = camShot(C.scene, C.camera, (t) => { C.drawBoard(t, 1); C.camera.position.set(0.5, 1.95, 0.2); C.camera.lookAt(1.3, 2.4, -2.2); });
    const b = screen(W, H, (g, w, h, t) => drawBellCodes(g, w, h, t, 5)), c = SCENES4.e406({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.22, obj: b }, { frac: 0.36, obj: later(c, 0.3) }, { frac: 0.12, obj: e }]); },
  sh12({ W, H }) { const a = screen(W, H, (g, w, h, t) => { g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, w, h);
      g.save(); g.translate(w / 2, h * 0.5); g.rotate(-0.06); g.fillStyle = '#f2ede2'; g.fillRect(-w * 0.42, -h * 0.2, w * 0.84, h * 0.4);
      g.fillStyle = '#c0281e'; g.fillRect(-w * 0.42, -h * 0.2, w * 0.84, h * 0.04); g.fillStyle = '#fff'; g.font = `bold ${Math.round(w * 0.04)}px Verdana, sans-serif`; g.fillText('PREVIEWS · SUMMER 2002', -w * 0.39, -h * 0.17);
      g.fillStyle = '#111'; g.font = `bold ${Math.round(w * 0.08)}px Georgia, serif`; g.fillText('SIGNALMAN', -w * 0.39, -h * 0.09);
      g.font = `italic ${Math.round(w * 0.045)}px Georgia, serif`; g.fillText('"I grew up next to a branch', -w * 0.39, -h * 0.02); g.fillText('line that closed..."', -w * 0.39, h * 0.02);
      g.fillStyle = `rgba(255,214,0,${0.55 + 0.3 * Math.sin(t * 5)})`; g.fillRect(-w * 0.4, h * 0.06, w * 0.62, h * 0.065);
      g.fillStyle = '#8a1a14'; g.font = `bold ${Math.round(w * 0.085)}px Georgia, serif`; g.fillText('— founder J. KELL', -w * 0.38, h * 0.11); g.restore(); }), b = SCENES4.e409({ W, H }), e = screen(W, H, (g, w, h, t) => drawCTA(g, w, h, t));
    return composite([{ frac: 0.3, obj: a }, { frac: 0.58, obj: b }, { frac: 0.12, obj: e }]); },
};
