// EP02 "NIGHTWALK" scenes + shorts S04-S06.
import * as THREE from 'three';
import { TEX, lambert, box, house, ground, lantern, hudSprite, drawTextBox, rng, ease, clamp01,
  crt, ps2, figure, room, textCanvas } from './lib.js';
import { screenScene, drawBootSwirl, drawMemoryCard, drawNewspaper, drawLogo } from './screens.js';
import { drawTyped, drawTitleNW, drawPauseNW, drawMemoryCardNW, drawMagazine, drawForumNW, drawDebugNW,
  drawCredits, drawStepHUD } from './screens2.js';

const camFor = (W, H, fov = 62) => new THREE.PerspectiveCamera(W > H ? fov : fov * 1.45, W / H, 0.1, 80);
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
function hooded(color = 0x5e5e64, lanternOn = false) {
  const f = figure(color); f.scale.set(1, 1.18, 1);
  if (lanternOn) { const l = lantern(); l.position.set(0.45, 0.75, 0.2); l.userData.light.intensity = 9; f.add(l); f.userData.lan = l; }
  return f;
}
function textBox(hud, W, H) {
  const bw = Math.min(W - 20, 300), bh = 44;
  const s = hudSprite(hud, bw, bh, (W - bw) / 2, 10, (g) => g.clearRect(0, 0, bw, bh)); s.mesh.visible = false;
  return { show(text, p) { s.mesh.visible = true; s.tc.redraw((g, w, h) => drawTextBox(g, w, h, text, Math.floor(text.length * clamp01(p)))); }, hide() { s.mesh.visible = false; } };
}

// The road: fog, a dirt road, streetlights every 12 m on the right, lantern in hand
function road(W, H, opts = {}) {
  const scene = new THREE.Scene(); const fogC = 0x262c2c;
  scene.background = new THREE.Color(fogC); scene.fog = new THREE.Fog(fogC, 2, opts.far || 22);
  scene.add(new THREE.AmbientLight(0x7a8484, 1.0));
  scene.add(ground());
  const r = rng(3);
  for (let i = 0; i < 40; i++) {
    const z = -6 - i * 12, g = new THREE.Group();
    const pole = box(0.12, 4, 0.12, lambert({ color: 0x2a2a2a })); pole.position.y = 2; g.add(pole);
    const arm = box(0.8, 0.08, 0.08, lambert({ color: 0x2a2a2a })); arm.position.set(-0.4, 4, 0); g.add(arm);
    const bulb = box(0.3, 0.08, 0.2, new THREE.MeshBasicMaterial({ color: 0xffd090 })); bulb.position.set(-0.75, 3.92, 0); g.add(bulb);
    if (i % 2 === 0) { const pl = new THREE.PointLight(0xffc080, 10, 10, 1.6); pl.position.set(-0.75, 3.6, 0); g.add(pl); }
    g.position.set(3, 0, z); scene.add(g);
    if (r() < 0.5) { const tr = box(0.3, 3 + r() * 2, 0.3, lambert({ color: 0x1e2220 })); tr.position.set(-6 - r() * 4, 1.8, z + r() * 6); scene.add(tr); }
  }
  const lan = lantern(); scene.add(lan);
  const camera = camFor(W, H, 60);
  const hud = new THREE.Scene();
  let steps = null;
  if (opts.hud !== false) steps = hudSprite(hud, 150, 16, 6, H - 22, (g, w, h) => drawStepHUD(g, w, h, opts.steps ?? 0));
  const setSteps = (n) => steps && steps.tc.redraw((g, w, h) => drawStepHUD(g, w, h, n));
  const walk = (t, z, bobOn = true) => {
    const bob = bobOn ? Math.sin(t * 5) * 0.04 : 0;
    camera.position.set(0.2, 1.6 + bob, z); camera.rotation.set(-0.03, Math.sin(t * 0.3) * 0.03, 0);
    lan.position.set(camera.position.x + 0.45 + Math.sin(t * 2.2) * 0.05, camera.position.y - 0.55, camera.position.z - 1.1);
    lan.userData.light.intensity = 13 + Math.sin(t * 13) * 0.8;
  };
  return { scene, camera, hud, setSteps, walk, lan };
}

function bedroomNW(W, H, opts = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050608);
  const amb = new THREE.AmbientLight(0x56606e, opts.amb ?? 0.8); scene.add(amb);
  scene.add(room(6, 3, 6, [40, 44, 52], TEX.carpet([60, 56, 54], [4, 4])));
  const dresser = box(1.8, 0.9, 0.7, lambert({ map: TEX.planks([70, 52, 40], [1, 1]) })); dresser.position.set(0, 0.45, -2.4); scene.add(dresser);
  const sc = textCanvas(160, 120, () => {}); const tv = crt(sc.tex); tv.position.set(0, 1.45, -2.2); scene.add(tv);
  const con = ps2(true); con.position.set(0, 0.99, -2.1); scene.add(con);
  const bed = box(2.2, 0.5, 1.6, lambert({ color: 0x3a3a4a })); bed.position.set(0, 0.25, 1.6); scene.add(bed);
  const pad = box(0.3, 0.06, 0.18, lambert({ color: 0x1a1a1e })); pad.position.set(0.1, 0.56, 1.0); scene.add(pad);
  // door to the hallway (back wall behind the bed)
  const door = box(1.0, 2.1, 0.06, lambert({ color: 0x5a4a3a })); door.position.set(2.2, 1.05, 2.97); scene.add(door);
  const gap = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 2.05), new THREE.MeshBasicMaterial({ color: 0x222830 })); gap.position.set(1.68, 1.05, 2.93); gap.rotation.y = Math.PI; scene.add(gap);
  const dawn = new THREE.DirectionalLight(0xffc8a0, 0); dawn.position.set(-3, 2, 1); scene.add(dawn);
  return { scene, sc, tv, con, door, gap, dawn, amb };
}

const camShot = (scene, camera, fn, hud = null) => ({ scene, camera, hud, update: fn });

export const SCENES2 = {
  // 1. Cold open: road + counter ticks 1 -> 2, cut to me on the bed with the pad
  e01({ W, H }) {
    const r = road(W, H, { steps: 1 });
    const a = camShot(r.scene, r.camera, (t, d) => { r.walk(t, -10, false); r.setSteps(t > d * 0.75 ? 2 : 1); }, r.hud);
    const b = bedroomNW(W, H); const cam = camFor(W, H, 55);
    const bs = camShot(b.scene, cam, (t, d) => {
      b.sc.redraw((g, w, h) => { g.fillStyle = '#262c2c'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8dcd0'; g.font = '9px monospace'; g.fillText('STEPS BEHIND YOU: 2', 6, 12); });
      b.tv.userData.glow.intensity = 2.2; const q = ease(t / d); cam.position.set(0.3, 1.15, 2.3 - q * 0.5); cam.lookAt(0, 1.35, -2.2);
    });
    return composite([{ frac: 0.55, obj: a }, { frac: 0.45, obj: bs }]);
  },
  // 2. The envelope on the doormat, the black case, the sticky note
  e02({ W, H }) {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0b0c);
    scene.add(new THREE.AmbientLight(0x9a9488, 1.6));
    scene.add(room(4, 3, 6, [110, 104, 92], TEX.planks([80, 62, 46], [3, 4])));
    const door = box(1.0, 2.1, 0.08, lambert({ color: 0x6a3a2a })); door.position.set(0, 1.05, -2.96); scene.add(door);
    const slot = box(0.4, 0.05, 0.1, lambert({ color: 0xb8a060 })); slot.position.set(0, 1.0, -2.9); scene.add(slot);
    const mat = box(1.2, 0.02, 0.7, lambert({ color: 0x5a4a30 })); mat.position.set(0, 0.02, -2.4); scene.add(mat);
    const env = box(0.5, 0.06, 0.34, lambert({ color: 0xc8b48a })); env.position.set(0.05, 0.06, -2.35); env.rotation.y = 0.3; scene.add(env);
    const nameC = textCanvas(64, 40, (g, w, h) => { g.fillStyle = '#c8b48a'; g.fillRect(0, 0, w, h); g.fillStyle = '#555'; g.font = '8px monospace'; g.fillText('for you', 10, 22); });
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), new THREE.MeshBasicMaterial({ map: nameC.tex })); lbl.rotation.x = -Math.PI / 2; lbl.position.set(0, 0.095, 0); env.add(lbl);
    const logoC = textCanvas(64, 90, (g, w, h) => { g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8c8cc'; g.lineWidth = 2; g.strokeRect(20, 22, 24, 24); g.fillStyle = '#c8c8cc'; g.fillRect(36, 22, 8, 8);
      g.fillStyle = '#e8d060'; g.fillRect(8, 58, 48, 26); g.fillStyle = '#222'; g.font = '6px monospace'; g.fillText('this one is', 10, 67); g.fillText('yours now.', 10, 74); g.fillText('walk slow.', 10, 81); });
    const dark = lambert({ color: 0x0c0c0e });
    const kase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.56, 0.04), [dark, dark, dark, dark, lambert({ map: logoC.tex }), dark]); scene.add(kase);
    const camera = camFor(W, H, 55);
    return camShot(scene, camera, (t, d) => {
      const p = t / d, lift = ease((p - 0.3) / 0.3);
      kase.position.set(0.05, 0.12 + lift * 1.25, -2.35 + lift * 1.6); kase.rotation.set(-Math.PI / 2 * (1 - lift), 0, 0);
      const c = ease(p / 0.3); camera.position.set(0.6 - c * 0.5, 1.7 - c * 0.3, 0.8 - c * 1.0);
      if (p > 0.7) camera.position.lerp(new THREE.Vector3(0.05, 1.37, -0.25), ease((p - 0.7) / 0.2));
      camera.lookAt(0.05, 0.12 + lift * 1.25, -2.35 + lift * 1.6);
    });
  },
  // 3. Title screen, then the one-line tutorial
  e03({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => drawTitleNW(g, w, h, t));
    const b = screen(W, H, (g, w, h, t) => drawTyped(g, w, h, t, ['YOU MAY WALK AS FAR AS YOU LIKE.', 'DO NOT LOOK BACK.'], 12));
    return composite([{ frac: 0.5, obj: a }, { frac: 0.5, obj: b }]);
  },
  // 4. First night: the walk, then the memory card save
  e04({ W, H }) {
    const r = road(W, H, { hud: false });
    const a = camShot(r.scene, r.camera, (t) => r.walk(t, 0 - t * 1.4), null);
    const b = screen(W, H, (g, w, h, t) => drawMemoryCardNW(g, w, h, t, 'NIGHTWALK', '20:00', 'TODAY'));
    return composite([{ frac: 0.8, obj: a }, { frac: 0.2, obj: b }]);
  },
  // 5. Rule card in the pause menu, the road pulled past you, TV seen from the side
  e05({ W, H }) {
    const p1 = screen(W, H, (g, w, h, t) => { g.fillStyle = '#262c2c'; g.fillRect(0, 0, w, h); drawPauseNW(g, w, h, t, 0); });
    const r = road(W, H, { steps: 0 });
    const p2 = camShot(r.scene, r.camera, (t) => { r.walk(t, -30 - t * 1.1, false); }, r.hud);
    const b = bedroomNW(W, H); const cam = camFor(W, H, 50);
    const p3 = camShot(b.scene, cam, (t, d) => { b.sc.redraw((g, w, h) => { g.fillStyle = '#262c2c'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3a36'; g.fillRect(w * 0.4, h * 0.5, w * 0.2, h * 0.5); });
      b.tv.userData.glow.intensity = 2; const q = ease(t / d); cam.position.set(1.6 - q * 0.2, 1.4, -1.0 + q * 0.2); cam.lookAt(0, 1.45, -2.2); });
    return composite([{ frac: 0.28, obj: p1 }, { frac: 0.42, obj: p2 }, { frac: 0.3, obj: p3 }]);
  },
  // 6. Third night: stop-and-listen walk, counter 4 -> 5
  e06({ W, H }) {
    const r = road(W, H, { steps: 4 });
    return camShot(r.scene, r.camera, (t, d) => {
      const p = t / d; const moving = (p < 0.35) || (p > 0.5 && p < 0.7);
      const z = -60 - (Math.min(p, 0.35) + Math.max(0, Math.min(p, 0.7) - 0.5)) * d * 1.3;
      r.walk(t, z, moving); r.setSteps(p > 0.88 ? 5 : 4);
    }, r.hud);
  },
  // 7. The road ends: bus stop, timetable, the memory card on the bench, text box
  e07({ W, H }) {
    const r = road(W, H, { steps: 5, far: 26 });
    const stop = new THREE.Group();
    const roof = box(3, 0.1, 1.4, lambert({ color: 0x4a4e52 })); roof.position.y = 2.5; stop.add(roof);
    const back = box(3, 2.4, 0.06, lambert({ color: 0x3a4248, transparent: true, opacity: 0.7 })); back.position.set(0, 1.25, -0.65); stop.add(back);
    const bench = box(2.2, 0.08, 0.5, lambert({ color: 0x5a4a3a })); bench.position.set(0, 0.5, -0.3); stop.add(bench);
    const legs = box(2.0, 0.45, 0.06, lambert({ color: 0x2a2a2a })); legs.position.set(0, 0.25, -0.3); stop.add(legs);
    const card = box(0.16, 0.035, 0.2, new THREE.MeshLambertMaterial({ color: 0xa0a0a0, emissive: 0x404040 })); card.position.set(0.2, 0.56, -0.25); stop.add(card);
    const ttC = textCanvas(48, 64, (g, w, h) => { g.fillStyle = '#e8e8e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = '6px monospace'; for (let i = 0; i < 8; i++) g.fillText('03:33', 8, 10 + i * 7); });
    const tt = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), new THREE.MeshBasicMaterial({ map: ttC.tex })); tt.position.set(1.7, 1.5, 0.2); tt.rotation.y = -0.4; stop.add(tt);
    const pole = box(0.06, 2.4, 0.06, lambert({ color: 0x777777 })); pole.position.set(1.7, 1.2, 0.18); stop.add(pole);
    stop.position.set(0, 0, -372); stop.rotation.y = 0; r.scene.add(stop);
    const sl = new THREE.PointLight(0xffd8a0, 12, 8, 1.4); sl.position.set(0, 2.3, -372); r.scene.add(sl);
    const tb = textBox(r.hud, W, H);
    return camShot(r.scene, r.camera, (t, d) => {
      const p = t / d;
      if (p < 0.35) r.walk(t, -355 - p / 0.35 * 10);
      else if (p < 0.55) { const q = ease((p - 0.35) / 0.2); r.walk(t, -365 - q * 3, false); r.camera.lookAt(1.7 * (1 - q) + 0.2 * q, 1.5 - q * 0.6, -372); }
      else { const q = ease((p - 0.55) / 0.2); r.walk(t, -368 - q * 2.6, false); r.camera.lookAt(0.2, 0.56, -372.25); }
      if (p > 0.62 && p < 0.97) tb.show('He waited here for you. He waited here every night.', (p - 0.62) / 0.15); else tb.hide();
    }, r.hud);
  },
  // 8. Pause: 14 steps, distance one step; then the bedroom door from the bed
  e08({ W, H }) {
    const a = screen(W, H, (g, w, h, t) => { g.fillStyle = '#262c2c'; g.fillRect(0, 0, w, h); drawPauseNW(g, w, h, t, 14, 'ONE STEP'); });
    const b = bedroomNW(W, H, { amb: 0.5 }); const cam = camFor(W, H, 55);
    const bs = camShot(b.scene, cam, (t, d) => {
      b.sc.redraw((g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#ccc'; g.font = 'bold 14px monospace'; g.fillText('PAUSE', 54, 40); });
      b.tv.userData.glow.intensity = 1.2; const q = ease(t / d);
      cam.position.set(-0.6, 1.3, 0.4 + q * 0.3); cam.lookAt(2.0, 1.1, 2.97); // looking back at the door
      b.gap.material.color.setRGB(0.13 + 0.05 * Math.sin(t * 3), 0.15, 0.19);
    });
    return composite([{ frac: 0.42, obj: a }, { frac: 0.58, obj: bs }]);
  },
  // 9. Magazine preview, forum warning, back on the road
  e09({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawMagazine(g, w, h, t, clamp01(t / d) * 0.25));
    const b = screen(W, H, (g, w, h, t, d) => drawForumNW(g, w, h, t, clamp01((t / d - 0.4) / 0.5)));
    const r = road(W, H, { hud: false }); const c = camShot(r.scene, r.camera, (t) => r.walk(t, -100 - t * 1.0), null);
    return composite([{ frac: 0.25, obj: a }, { frac: 0.25, obj: c }, { frac: 0.5, obj: b }]);
  },
  // 10. Debug menu, cursor walks down to REAR CAMERA
  e10({ W, H }) {
    return screen(W, H, (g, w, h, t, d) => drawDebugNW(g, w, h, t, Math.min(4, Math.floor((t / d) * 6))));
  },
  // 11. Rear camera: the player, and the one behind him getting closer each time
  e11({ W, H }) {
    const mk = (dist, close = false) => {
      const r = road(W, H, { steps: dist <= 1 ? 1 : 3 }); const z0 = -150;
      const pl = hooded(0x6a6a70, true); pl.position.set(0.2, 0, z0); r.scene.add(pl);
      const fol = hooded(0x4a4a50); fol.position.set(0.2, 0, z0 + dist); r.scene.add(fol);
      r.lan.visible = false;
      return camShot(r.scene, r.camera, (t, d) => {
        if (close) { r.camera.position.set(0.25, 1.75, z0 + dist + 1.1 - t * 0.04); r.camera.lookAt(0.2, 1.55, z0 + dist); }
        else { r.camera.position.set(0.6, 2.2, z0 - 3.2); r.camera.lookAt(0.2, 1.1, z0 + dist * 0.5); }
        fol.rotation.y = Math.PI; pl.rotation.y = Math.PI;
      }, r.hud);
    };
    const front = () => { const r = road(W, H, { steps: 3 }); return camShot(r.scene, r.camera, (t) => r.walk(t, -140 - t * 1.4), r.hud); };
    return composite([{ frac: 0.26, obj: mk(10) }, { frac: 0.1, obj: front() }, { frac: 0.18, obj: mk(5) }, { frac: 0.08, obj: front() }, { frac: 0.16, obj: mk(2) }, { frac: 0.22, obj: mk(1, true) }]);
  },
  // 12. Power off. The black screen as a mirror until sunrise
  e12({ W, H }) {
    const b = bedroomNW(W, H, { amb: 0.35 }); const cam = camFor(W, H, 50);
    b.con.userData.led.material.color.set(0x200808);
    return camShot(b.scene, cam, (t, d) => {
      const p = t / d;
      b.sc.redraw((g, w, h) => { g.fillStyle = '#040506'; g.fillRect(0, 0, w, h); g.fillStyle = `rgba(80,90,110,${0.12 + p * 0.1})`; g.fillRect(w * 0.15, h * 0.35, w * 0.7, h * 0.65); g.fillStyle = 'rgba(30,30,36,0.6)'; g.fillRect(w * 0.42, h * 0.45, w * 0.16, h * 0.55); });
      b.tv.userData.glow.intensity = 0;
      b.dawn.intensity = p > 0.55 ? (p - 0.55) * 3.5 : 0; b.amb.intensity = 0.35 + Math.max(0, p - 0.55) * 1.4;
      const q = ease(p); cam.position.set(0, 1.25, 1.2 - q * 1.6); cam.lookAt(0, 1.4, -2.2);
    });
  },
  // 13. Credits: QA T. ROWE; then the newspaper zoom to the dead pixel
  e13({ W, H }) {
    const a = screen(W, H, (g, w, h, t, d) => drawCredits(g, w, h, t, d));
    const b = screen(W, H, (g, w, h, t, d) => drawNewspaper(g, w, h, t, clamp01(t / d * 1.1)));
    return composite([{ frac: 0.76, obj: a }, { frac: 0.24, obj: b }]);
  },
  // 14. Missing-person notice, the bench save, walking backwards out of the room, logo
  e14({ W, H }) {
    const notice = screen(W, H, (g, w, h, t) => {
      g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = `bold ${Math.max(9, Math.round(Math.min(w, h) / 18))}px Georgia, serif`;
      g.fillText('LOCAL · 2004', w * 0.08, h * 0.18); g.font = `${Math.max(7, Math.round(Math.min(w, h) / 26))}px Georgia, serif`;
      ['Man reported missing after night shift', '', 'T. Rowe, 31, was last seen walking home', 'in the early hours of March 3. Anyone', 'with information is asked to contact', 'the county sheriff.'].forEach((l, i) => g.fillText(l, w * 0.08, h * 0.3 + i * Math.min(w, h) / 16));
    });
    const card = screen(W, H, (g, w, h, t) => drawMemoryCardNW(g, w, h, t, 'NIGHTWALK · BENCH', '1331 STEPS', '03/03/2004'));
    const b = bedroomNW(W, H, { amb: 0.9 }); const cam = camFor(W, H, 60);
    const back = camShot(b.scene, cam, (t, d) => { const q = ease(t / d); b.sc.redraw((g, w, h) => { g.fillStyle = '#040506'; g.fillRect(0, 0, w, h); });
      cam.position.set(1.4 + q * 0.6, 1.6, 0.2 + q * 2.4); cam.lookAt(0, 1.3, -2.2); });
    const black = screen(W, H, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); });
    const logo = screen(W, H, (g, w, h, t) => drawLogo(g, w, h, t, 4));
    return composite([{ frac: 0.22, obj: notice }, { frac: 0.22, obj: card }, { frac: 0.36, obj: back }, { frac: 0.04, obj: black }, { frac: 0.16, obj: logo }]);
  },
  // ---- shorts (vertical) ----
  sh4({ W, H }) { const a = SCENES2.e01({ W, H }), b = SCENES2.e06({ W, H }), c = SCENES2.e08({ W, H });
    return composite([{ frac: 0.35, obj: a }, { frac: 0.35, obj: later(b, 0.6) }, { frac: 0.3, obj: c }]); },
  sh5({ W, H }) { const a = SCENES2.e10({ W, H }), b = SCENES2.e11({ W, H });
    return composite([{ frac: 0.3, obj: a }, { frac: 0.7, obj: b }]); },
  sh6({ W, H }) { const a = SCENES2.e03({ W, H }), b = SCENES2.e13({ W, H });
    return composite([{ frac: 0.25, obj: later(a, 1.0) }, { frac: 0.75, obj: b }]); },
};
