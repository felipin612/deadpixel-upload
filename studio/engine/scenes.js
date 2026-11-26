import * as THREE from 'three';
import { TEX, lambert, box, house, church, ground, lantern, hudSprite, drawTextBox, rng, ease, clamp01,
  crt, ps2, figure, room, textCanvas } from './lib.js';
import { screenScene, drawBootSwirl, drawBrowser, drawTitle, drawMemoryCard, drawForum, drawNewspaper,
  drawCard, drawLogo, px, drawLoading, drawDebug, drawPause, drawCTA } from './screens.js';

// ---------- shared ----------
const palette = [[92, 80, 64], [80, 84, 78], [96, 88, 72], [70, 66, 60], [88, 76, 70]];
function townHouse(i) {
  const r = rng(100 + i);
  const hs = house({ wall: palette[i % 5], w: 3.6 + r() * 1.2, d: 4, h: 2.8 });
  const side = i % 2 ? 1 : -1;
  hs.position.set(side * 7.5, 0, -10 - Math.floor(i / 2) * 11 - (i % 2) * 4);
  hs.rotation.y = -side * Math.PI / 2;
  return hs;
}
export function buildTown(scene, count = 12) {
  const hs = [];
  for (let i = 0; i < count; i++) { const h = townHouse(i); scene.add(h); hs.push(h); }
  const ch = church(); ch.position.set(9, 0, -82); ch.rotation.y = -Math.PI / 2; scene.add(ch);
  return { houses: hs, church: ch };
}
export function blueHouse(opts = {}) {
  const h = house({ wall: [60, 84, 132], w: 5, d: 5, h: 2.8, stories: 2, lit: !opts.dark, porch: true, doorOpen: !!opts.doorOpen });
  const pole = box(0.1, 3.2, 0.1, lambert({ color: 0x777777 })); pole.position.set(3.4, 1.6, 3.5); h.add(pole);
  const board = box(1.1, 0.7, 0.06, lambert({ color: 0xdedede })); board.position.set(3.4, 3.2, 3.2); h.add(board);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 4, 10), lambert({ color: 0xb04020 }));
  rim.rotation.x = Math.PI / 2; rim.position.set(3.4, 2.95, 2.9); h.add(rim);
  return h;
}
function fogScene(color = 0x3e4640, near = 2, far = 24) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(color);
  scene.fog = new THREE.Fog(color, near, far);
  scene.add(new THREE.AmbientLight(0x8a948a, 1.4));
  const moon = new THREE.DirectionalLight(0x9aa6b0, 0.6); moon.position.set(-5, 10, 4); scene.add(moon);
  return scene;
}
function darkRoomScene(amb = 0.25) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050608);
  scene.add(new THREE.AmbientLight(0x56606e, amb * 2.4));
  return scene;
}
function hudCounter(hud, W, H, n) {
  return hudSprite(hud, 40, 16, W - 46, H - 22, (g) => {
    g.clearRect(0, 0, 40, 16); g.fillStyle = '#c8d0c0'; g.font = '10px monospace'; g.textBaseline = 'top';
    g.fillText('⌂ ' + n, 4, 3);
  });
}
function textBox(hud, W, H) {
  const bw = Math.min(W - 20, 300), bh = 44;
  const s = hudSprite(hud, bw, bh, (W - bw) / 2, 10, (g) => g.clearRect(0, 0, bw, bh));
  s.mesh.visible = false;
  return { show(text, p) { s.mesh.visible = true; s.tc.redraw((g, w, h) => drawTextBox(g, w, h, text, Math.floor(text.length * clamp01(p)))); }, hide() { s.mesh.visible = false; } };
}
function walkCam(cam, t, speed, z0 = 2, x = 0.3) {
  const z = z0 - t * speed, bob = Math.sin(t * speed * 3.2) * 0.04;
  cam.position.set(x + Math.sin(t * 0.7) * 0.05, 1.6 + bob, z);
  cam.rotation.set(-0.02 + bob * 0.3, Math.sin(t * 0.35) * 0.05, 0);
}
function withLantern(scene) {
  const lan = lantern(); scene.add(lan);
  return (cam, t) => {
    lan.position.set(cam.position.x + 0.45 + Math.sin(t * 2.2) * 0.06, cam.position.y - 0.55, cam.position.z - 1.1);
    lan.userData.light.intensity = 14 + Math.sin(t * 13) * 0.8 + Math.sin(t * 7.3) * 0.6;
  };
}
function camFor(W, H, fov = 62) { return new THREE.PerspectiveCamera(W > H ? fov : fov * 1.45, W / H, 0.1, 80); }

// bedroom with CRT + PS2 + digital clock; returns handles
function bedroom(W, H) {
  const scene = darkRoomScene(0.35);
  scene.add(room(6, 3, 6, [40, 44, 52], TEX.carpet([60, 56, 54], [4, 4])));
  const dresser = box(1.8, 0.9, 0.7, lambert({ map: TEX.planks([70, 52, 40], [1, 1]) })); dresser.position.set(0, 0.45, -2.4); scene.add(dresser);
  const screen = textCanvas(160, 120, () => {});
  const tv = crt(screen.tex); tv.position.set(0, 1.45, -2.2); scene.add(tv);
  const console_ = ps2(true); console_.position.set(0, 0.99, -2.1); scene.add(console_);
  const clockC = textCanvas(64, 24, () => {});
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: clockC.tex }));
  clock.position.set(1.4, 0.95, -1.6); clock.rotation.y = -0.5; scene.add(clock);
  const stand = box(0.6, 0.8, 0.5, lambert({ color: 0x2a2420 })); stand.position.set(1.45, 0.4, -1.75); scene.add(stand);
  const setClock = (txt) => clockC.redraw((g, w, h) => { g.fillStyle = '#100'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff3a2a'; g.font = 'bold 18px monospace'; g.textBaseline = 'middle'; g.fillText(txt, 6, h / 2 + 1); });
  return { scene, tv, screen, console_, setClock, clock };
}

// composite helper: a scene that switches between sub-shots
function composite(shots) {
  const self = { scene: null, camera: null, hud: null };
  self.update = (t, dur) => {
    const p = t / dur; let acc = 0;
    for (const s of shots) {
      const end = acc + s.frac;
      if (p < end || s === shots[shots.length - 1]) {
        const lt = t - acc * dur, ld = s.frac * dur;
        s.obj.update(lt, ld);
        self.scene = s.obj.scene; self.camera = s.obj.camera; self.hud = s.obj.hud; return;
      }
      acc = end;
    }
  };
  return self;
}

// ---------- scenes ----------
export const SCENES = {
  // 1. Cold open: bedroom, clock flips 3:32 -> 3:33, CRT boots green
  s01({ W, H }) {
    const b = bedroom(W, H); const camera = camFor(W, H, 55);
    return {
      scene: b.scene, camera, hud: null,
      update(t, dur) {
        const flip = dur * 0.35;
        b.setClock(t < flip ? '3:32' : '3:33');
        if (t < flip) b.screen.redraw((g, w, h) => { g.fillStyle = '#020203'; g.fillRect(0, 0, w, h); });
        else b.screen.redraw((g, w, h) => drawBootSwirl(g, w, h, t - flip));
        b.tv.userData.glow.intensity = t < flip ? 0.2 : 2.2;
        const p = ease(t / dur);
        camera.position.set(0.9 - p * 0.7, 1.35, 1.6 - p * 1.6); camera.lookAt(0.2 - p * 0.2, 1.3, -2.2);
      },
    };
  },
  // 2. Garage sale: overcast driveway, a box of games, a black case with a hand-drawn logo
  s02({ W, H }) {
    const scene = fogScene(0x8a8e88, 4, 40); scene.children[0].intensity = 2.2;
    const camera = camFor(W, H, 55);
    const drive = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), lambert({ map: TEX.stone([10, 10]) })); drive.rotation.x = -Math.PI / 2; scene.add(drive);
    const garage = house({ wall: [150, 146, 136], w: 8, d: 6, h: 3.2, door: false }); garage.position.set(0, 0, -8); scene.add(garage);
    const table = box(2.2, 0.8, 1.0, lambert({ color: 0x6a5a48 })); table.position.set(0, 0.4, -2); scene.add(table);
    const cardboard = box(0.9, 0.35, 0.6, lambert({ color: 0xa88a5a })); cardboard.position.set(0, 0.98, -2); scene.add(cardboard);
    const r = rng(7);
    for (let i = 0; i < 9; i++) { const c = box(0.12, 0.3, 0.2, lambert({ color: [0x2050a0, 0x205a30, 0xa03020, 0x1a1a1a, 0x806020][i % 5] })); c.position.set(-0.35 + i * 0.09, 1.05, -2 + (r() - 0.5) * 0.2); c.rotation.z = (r() - 0.5) * 0.3; scene.add(c); }
    const logoC = textCanvas(64, 90, (g, w, h) => {
      g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#c8c8cc'; g.lineWidth = 2; g.strokeRect(20, 22, 24, 24); g.fillStyle = '#c8c8cc'; g.fillRect(36, 22, 8, 8);
      g.font = '9px monospace'; g.fillText('Dead', 20, 60); g.fillText('Pixel', 18, 70);
    });
    const dark = lambert({ color: 0x0c0c0e });
    const blackCase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.56, 0.04), [dark, dark, dark, dark, lambert({ map: logoC.tex }), dark]);
    scene.add(blackCase);
    return {
      scene, camera, hud: null,
      update(t, dur) {
        const p = t / dur;
        const lift = ease((p - 0.35) / 0.35);
        blackCase.position.set(0.1, 1.0 + lift * 0.45, -2 + lift * 1.2);
        blackCase.rotation.set(-Math.PI / 2 * (1 - lift), 0, 0);
        const c = ease(p / 0.6);
        camera.position.set(0.3 - c * 0.2, 2.0 - c * 0.45, 1.5 - c * 1.6);
        if (p > 0.85) camera.position.lerp(new THREE.Vector3(0.1, 1.45, -0.35), ease((p - 0.85) / 0.15));
        camera.lookAt(0.1, 1.0 + lift * 0.45, -2 + lift * 1.2);
      },
    };
  },
  // 3. Won't boot -> 3:33 wake -> SALTMARSH title
  s03({ W, H }) {
    const a = screenScene(W, H, (g, w, h, t) => drawBrowser(g, w, h, t));
    const b = SCENES.s01({ W, H });
    const wake = { get scene() { return b.scene; }, get camera() { return b.camera; }, hud: null, update(t, d) { b.update(d * 2 + t, d * 2.2); } };
    const c = screenScene(W, H, (g, w, h, t) => drawTitle(g, w, h, t));
    return composite([{ frac: 0.4, obj: a }, { frac: 0.2, obj: wake }, { frac: 0.4, obj: c }]);
  },
  // 4. Night one: twelve houses
  s04({ W, H }) {
    const scene = fogScene(); const camera = camFor(W, H);
    scene.add(ground()); buildTown(scene, 12);
    const lan = withLantern(scene); const hud = new THREE.Scene(); hudCounter(hud, W, H, 12);
    return { scene, camera, hud, update(t) { walkCam(camera, t, 1.4); lan(camera, t); } };
  },
  // 5. Night two: the blue house (13)
  s05({ W, H }) {
    const scene = fogScene(); const camera = camFor(W, H);
    scene.add(ground()); buildTown(scene, 12);
    const bh = blueHouse(); bh.position.set(0, 0, -96); scene.add(bh);
    const lan = withLantern(scene); const hud = new THREE.Scene(); hudCounter(hud, W, H, 13);
    return {
      scene, camera, hud,
      update(t, dur) {
        const p = t / dur;
        if (p <= 0.55) walkCam(camera, t, 70 / (dur * 0.55), -12);
        else { const q = ease((p - 0.55) / 0.45); camera.position.set(0.3 + q * 1.2, 1.6, -82 - q * 5); camera.lookAt(3.4 * q, 1.6 + q * 1.2, -93); }
        lan(camera, t);
      },
    };
  },
  // 6. The rules: four shots, cards for 1-3, the open door for 4
  s06({ W, H }) {
    const mk = (extra, cardLines, counter, look) => {
      const scene = fogScene(); const camera = camFor(W, H, 58); scene.add(ground()); buildTown(scene, 12);
      extra.forEach(e => scene.add(e));
      const hud = new THREE.Scene(); hudCounter(hud, W, H, counter);
      if (cardLines) hudSprite(hud, W, H, 0, 0, (g, w, h) => drawCard(g, w, h, 0, cardLines));
      return { scene, camera, hud, update(t, d) { look(camera, t, d); } };
    };
    const duplex = () => { const h = house({ wall: [120, 112, 100], w: 6, d: 4, h: 2.8, stories: 2, lit: true }); h.position.set(-7.5, 0, -100); h.rotation.y = Math.PI / 2; return h; };
    const dorm = () => { const h = house({ brick: true, w: 9, d: 6, h: 2.8, stories: 4 }); h.position.set(7, 0, -108); h.rotation.y = -Math.PI / 2;
      h.userData.windows.forEach((m, i) => { if (i === 5) m.material = new THREE.MeshBasicMaterial({ color: 0xffc070 }); }); return h; };
    const bh = (open) => { const h = blueHouse(open ? { dark: true, doorOpen: true } : {}); h.position.set(0, 0, -96); return h; };
    const look1 = (c, t) => { c.position.set(0.3, 1.6, -20 - t * 0.6); c.rotation.set(0, Math.sin(t * 0.3) * 0.1, 0); };
    const look2 = (c, t) => { c.position.set(-1, 1.6, -88 - t * 0.5); c.lookAt(-7.5, 2.5, -100); };
    const look3 = (c, t) => { c.position.set(1, 1.5, -95 - t * 0.4); c.lookAt(7, 4 + t * 0.2, -108); };
    const look4 = (c, t, d) => { const q = ease(t / d); c.position.set(0, 1.6, -84 - q * 6); c.lookAt(0, 1.0, -93.5); };
    return composite([
      { frac: 0.22, obj: mk([bh(false)], ['RULE 1', '3:33 AM · 21 MINUTES'], 13, look1) },
      { frac: 0.22, obj: mk([bh(false), duplex()], ['RULE 2', 'ONE NEW HOUSE A NIGHT'], 14, look2) },
      { frac: 0.26, obj: mk([bh(false), duplex(), dorm()], ['RULE 3', 'EVERY HOUSE IS ONE I LIVED IN'], 15, look3) },
      { frac: 0.30, obj: mk([bh(true), duplex(), dorm()], null, 15, look4) },
    ]);
  },
  // 7. Church with no door: endless fog walk, then pews of memory cards
  s07({ W, H }) {
    const out = (() => {
      const scene = fogScene(); const camera = camFor(W, H); scene.add(ground()); const town = buildTown(scene, 12);
      const lan = withLantern(scene);
      for (let i = 0; i < 60; i++) { const post = box(0.12, 1.1, 0.12, lambert({ color: 0x3a3028 })); post.position.set(-10 - i * 3, 0.55, -58.5); scene.add(post); }
      return { scene, camera, hud: null, update(t, d) {
        const q = t / d;
        camera.position.set(-14 - t * 1.3, 1.6, -60);
        camera.rotation.set(0, Math.PI / 2 + (q > 0.55 ? Math.PI * ease((q - 0.55) / 0.25) : 0), 0);
        town.church.position.set(camera.position.x + 12, 0, -60); lan(camera, t);
      } };
    })();
    const inside = (() => {
      const scene = darkRoomScene(0.5); scene.add(room(8, 5, 12, [60, 58, 54], TEX.planks([60, 50, 40], [4, 6])));
      const beam = new THREE.SpotLight(0xb0b8c8, 80, 20, 0.45, 0.6); beam.position.set(-2, 5, 2); beam.target.position.set(0, 0, -2); scene.add(beam, beam.target);
      const r = rng(9);
      for (let row = 0; row < 6; row++) for (const sx of [-2, 2]) {
        const pew = box(3, 0.5, 0.5, lambert({ color: 0x4a3a2a })); pew.position.set(sx, 0.45, 3 - row * 1.6); scene.add(pew);
        const back = box(3, 0.6, 0.1, lambert({ color: 0x4a3a2a })); back.position.set(sx, 0.9, 3.25 - row * 1.6); scene.add(back);
        for (let k = 0; k < 5; k++) { if (row === 5 && sx < 0 && k === 2) continue; const mc = box(0.14, 0.03, 0.17, lambert({ color: 0x8a8a8a })); mc.position.set(sx - 1.2 + k * 0.6 + (r() - 0.5) * 0.1, 0.72, 3 - row * 1.6); mc.rotation.y = (r() - 0.5) * 0.4; scene.add(mc); }
      }
      const blank = box(0.2, 0.04, 0.24, new THREE.MeshLambertMaterial({ color: 0xb8b8b8, emissive: 0x303030 })); blank.position.set(-2, 0.73, 3 - 5 * 1.6); scene.add(blank);
      const camera = camFor(W, H, 55);
      return { scene, camera, hud: null, update(t, d) { const q = ease(t / d); camera.position.set(-1.2, 1.8 - q * 0.7, 5.5 - q * 9.4); camera.lookAt(-2, 0.7, -5); } };
    })();
    return composite([{ frac: 0.45, obj: out }, { frac: 0.55, obj: inside }]);
  },
  // 8. Grandmother's kitchen, the memory card, "Do not save over slot 3."
  s08({ W, H }) {
    const scene = darkRoomScene(0.6); scene.add(room(6, 3, 6, [120, 112, 90], TEX.carpet([52, 92, 60], [4, 4])));
    const lamp = new THREE.PointLight(0xffd090, 8, 8, 1.5); lamp.position.set(0, 2.6, -0.5); scene.add(lamp);
    const table = box(1.6, 0.75, 1.0, lambert({ map: TEX.planks([100, 76, 52], [1, 1]) })); table.position.set(0, 0.38, -1); scene.add(table);
    const card = box(0.42, 0.05, 0.5, lambert({ color: 0x8c8c8c })); card.position.set(0, 0.78, -1); scene.add(card);
    const clockC = textCanvas(32, 32, (g) => { g.fillStyle = '#eee'; g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); g.strokeStyle = '#111'; g.beginPath(); g.moveTo(16, 16); g.lineTo(16, 5); g.moveTo(16, 16); g.lineTo(24, 18); g.stroke(); });
    const clk = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12), new THREE.MeshBasicMaterial({ map: clockC.tex })); clk.position.set(1.2, 2.1, -2.98); scene.add(clk);
    const counter = box(3, 0.9, 0.6, lambert({ color: 0xd0c8b0 })); counter.position.set(-1.2, 0.45, -2.6); scene.add(counter);
    const camera = camFor(W, H, 58); const hud = new THREE.Scene(); const tb = textBox(hud, W, H);
    return { scene, camera, hud, update(t, d) {
      const q = ease(t / (d * 0.6)); camera.position.set(1.8 - q * 1.6, 1.65 - q * 0.3, 2.2 - q * 2.4); camera.lookAt(0, 0.8, -1);
      if (t > d * 0.62) tb.show('Do not save over slot 3.', (t - d * 0.62) / 1.6); else tb.hide();
    } };
  },
  // 9. Real memory card: SALTMARSH 99:59, 03/03/2004
  s09({ W, H }) { return screenScene(W, H, (g, w, h, t) => drawMemoryCard(g, w, h, t, '99:59', '03/03/2004')); },
  // 10. The forum post on a CRT monitor, username comes into focus
  s10({ W, H }) {
    const scene = darkRoomScene(0.3);
    const sc = textCanvas(240, 180, () => {});
    const mon = crt(sc.tex); mon.scale.setScalar(1.2); mon.position.set(0, 1.2, -1.5); scene.add(mon);
    const desk = box(2.4, 0.08, 1.2, lambert({ color: 0x3a3028 })); desk.position.set(0, 0.5, -1.2); scene.add(desk);
    const kb = box(0.9, 0.04, 0.3, lambert({ color: 0xb8b4a8 })); kb.position.set(0, 0.56, -0.8); scene.add(kb);
    const camera = camFor(W, H, 50);
    return { scene, camera, hud: null, update(t, d) {
      const q = ease(t / d);
      sc.redraw((g, w, h) => drawForum(g, w, h, t, clamp01((t / d - 0.55) / 0.25)));
      camera.position.set(0, 1.25, 1.2 - q * 1.85); camera.lookAt(0, 1.2 - q * 0.18, -1.5);
    } };
  },
  // 11. Newspaper photo, zoom into the tester's face until the dead pixel
  s11({ W, H }) { return screenScene(W, H, (g, w, h, t, d) => drawNewspaper(g, w, h, t, clamp01((t / d - 0.2) / 0.7))); },
  // 12. Unplugged PS2 turns on; house sixteen is my building
  s12({ W, H }) {
    const b = bedroom(W, H); const cam1 = camFor(W, H, 50);
    const cable = box(0.04, 0.02, 1.2, lambert({ color: 0x111111 })); cable.position.set(0.5, 0.02, -1.6); cable.rotation.y = 0.4; b.scene.add(cable);
    const plug = box(0.12, 0.06, 0.08, lambert({ color: 0x222222 })); plug.position.set(0.75, 0.04, -1.05); b.scene.add(plug);
    const shot1 = { scene: b.scene, camera: cam1, hud: null, update(t, d) {
      b.setClock('3:33'); const on = t > d * 0.55;
      b.console_.userData.led.material.color.set(on ? 0x30ff60 : 0x200808);
      b.screen.redraw((g, w, h) => { if (on) drawBootSwirl(g, w, h, t); else { g.fillStyle = '#020203'; g.fillRect(0, 0, w, h); } });
      b.tv.userData.glow.intensity = on ? 2 : 0.1;
      cam1.position.set(0.9, 0.5, -0.5); cam1.lookAt(0.2, 0.7, -2.1);
    } };
    const shot2 = (() => {
      const scene = fogScene(); const camera = camFor(W, H); scene.add(ground()); buildTown(scene, 12);
      const bh = blueHouse({ dark: true }); bh.position.set(0, 0, -96); scene.add(bh);
      const apt = house({ brick: true, w: 7, d: 6, h: 2.8, stories: 3 }); apt.position.set(0, 0, -120); scene.add(apt);
      let tvWin = apt.userData.windows[5]; tvWin.material = new THREE.MeshBasicMaterial({ color: 0x5070ff });
      const sign = box(4, 0.5, 0.05, new THREE.MeshBasicMaterial({ color: 0xd0e8ff })); sign.position.set(0, 2.4, 3.05); apt.add(sign);
      const fe = box(0.08, 8, 0.08, lambert({ color: 0x333333 })); fe.position.set(3.6, 4, 3.2); apt.add(fe);
      const lan = withLantern(scene); const hud = new THREE.Scene(); hudCounter(hud, W, H, 16);
      return { scene, camera, hud, update(t, d) {
        const q = t / d;
        if (q < 0.55) walkCam(camera, t, 14 / (d * 0.55), -96);
        else { const k = ease((q - 0.55) / 0.45); camera.position.set(0.3, 1.6, -110); camera.lookAt(0, 1.6 + k * 6.6, -117); }
        tvWin.material.color.setHSL(0.63, 0.8, 0.45 + 0.12 * Math.sin(t * 11) * Math.sin(t * 3.1));
        lan(camera, t);
      } };
    })();
    return composite([{ frac: 0.3, obj: shot1 }, { frac: 0.7, obj: shot2 }]);
  },
  // 13. Endless stairwell, then my apartment as a game level, the figure, "Saving to slot 3."
  s13({ W, H }) {
    const stairs = (() => {
      const scene = darkRoomScene(0.5); const lamp = new THREE.PointLight(0xc8d0b0, 6, 10, 1.5); scene.add(lamp);
      const m = lambert({ map: TEX.stone([1, 1]) });
      for (let i = 0; i < 160; i++) { const st = box(1.6, 0.18, 0.3, m); const fl = Math.floor(i / 12), k = i % 12; const dir = fl % 2 ? -1 : 1;
        st.position.set(fl % 2 ? -0.9 : 0.9, i * 0.18, dir * (k * 0.3 - 1.65)); scene.add(st); }
      const camera = camFor(W, H, 65);
      return { scene, camera, hud: null, update(t, d) { const y = 1.6 + t * 1.0; camera.position.set(0, y, 2.6); camera.lookAt(0.6 * Math.sin(t * 0.8), y + 1.2, -1); lamp.position.set(0, y + 1, 0); } };
    })();
    const apt = (() => {
      const scene = darkRoomScene(0.4); scene.add(room(6, 2.8, 6, [60, 62, 70], TEX.carpet([70, 64, 60], [4, 4])));
      const sc = textCanvas(160, 120, () => {});
      const tv = crt(sc.tex); tv.position.set(0, 0.95, -2.5); tv.userData.glow.intensity = 3; scene.add(tv);
      const stand = box(1.4, 0.4, 0.6, lambert({ color: 0x2a2624 })); stand.position.set(0, 0.2, -2.55); scene.add(stand);
      const couch = box(2.2, 0.8, 0.9, lambert({ color: 0x4a3a3a })); couch.position.set(0, 0.4, 1.6); scene.add(couch);
      const shelf = box(0.4, 1.8, 1.2, lambert({ color: 0x3a3028 })); shelf.position.set(-2.7, 0.9, -1); scene.add(shelf);
      const fig = figure(); fig.position.set(0, 0, -1.2); fig.rotation.y = Math.PI; scene.add(fig);
      const camera = camFor(W, H, 55); const hud = new THREE.Scene(); const tb = textBox(hud, W, H);
      return { scene, camera, hud, update(t, d) {
        sc.redraw((g, w, h) => drawTitle(g, w, h, t));
        const q = ease(t / d); camera.position.set(0.6 - q * 0.5, 1.6 - q * 0.3, 2.6 - q * 2.0); camera.lookAt(0, 0.9, -2);
        const p = t / d;
        if (p > 0.45 && p < 0.75) tb.show('Thank you for keeping me company.', (p - 0.45) / 0.15);
        else if (p >= 0.75) tb.show('Saving to slot 3...' + ['', ' |', ' /', ' -', ' \\'][Math.floor(t * 6) % 5], 1);
        else tb.hide();
      } };
    })();
    return composite([{ frac: 0.35, obj: stairs }, { frac: 0.65, obj: apt }]);
  },
  // 14. Disc spins down, card says 100:00 today, bedroom 3:32, logo
  s14({ W, H }) {
    const disc = (() => {
      const scene = darkRoomScene(0.6); const l = new THREE.PointLight(0xffffff, 5, 6); l.position.set(1, 2, 2); scene.add(l);
      const dc = textCanvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, '#666'); gr.addColorStop(0.3, '#1a1a22'); gr.addColorStop(1, '#30303a'); g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(32, 32, 5, 0, 7); g.fill(); g.fillStyle = '#aaa'; g.fillRect(40, 20, 8, 8); });
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), new THREE.MeshLambertMaterial({ map: dc.tex })); scene.add(d);
      const hand = box(0.5, 0.15, 0.25, lambert({ color: 0xa08070 })); hand.position.set(0, -0.62, 0.05); scene.add(hand);
      const camera = camFor(W, H, 50); camera.position.set(0, 0.1, 1.6); camera.lookAt(0, 0, 0);
      return { scene, camera, hud: null, update(t, d2) { const tt = Math.min(t, d2); d.rotation.z = -(tt * 9 - tt * tt * 9 / (2 * d2)); } };
    })();
    const card = screenScene(W, H, (g, w, h, t) => drawMemoryCard(g, w, h, t, '100:00', 'TODAY'));
    const bed = (() => { const b = bedroom(W, H); const camera = camFor(W, H, 55); return { scene: b.scene, camera, hud: null, update() {
      b.setClock('3:32'); b.screen.redraw((g, w, h) => { g.fillStyle = '#020203'; g.fillRect(0, 0, w, h); }); b.tv.userData.glow.intensity = 0.2;
      camera.position.set(0.9, 1.35, 1.6); camera.lookAt(0.2, 1.3, -2.2); } }; })();
    const black = screenScene(W, H, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); });
    const logo = screenScene(W, H, (g, w, h, t) => drawLogo(g, w, h, t, 3));
    return composite([{ frac: 0.2, obj: disc }, { frac: 0.3, obj: card }, { frac: 0.3, obj: bed }, { frac: 0.04, obj: black }, { frac: 0.16, obj: logo }]);
  },
  // Short 1: memory card play time creeps from 99:56 to 100:00
  sh1({ W, H }) {
    return screenScene(W, H, (g, w, h, t, d) => {
      const m = Math.min(4, Math.floor(t / d * 5)); const pt = m < 4 ? `99:5${6 + m}` : '100:00';
      drawMemoryCard(g, w, h, t, pt, '03/03/2004');
    });
  },
  // Short 2: 3:33 boot, the fog town, the blue house, house sixteen
  sh2({ W, H }) {
    const a = SCENES.s01({ W, H }), b = SCENES.s04({ W, H }), c = SCENES.s05({ W, H }), d = SCENES.s12({ W, H });
    const late = (o, k) => ({ get scene() { return o.scene; }, get camera() { return o.camera; }, get hud() { return o.hud; }, update(t, du) { o.update(t + du * k, du * (1 + k)); } });
    return composite([{ frac: 0.2, obj: a }, { frac: 0.25, obj: b }, { frac: 0.3, obj: late(c, 1.2) }, { frac: 0.25, obj: late(d, 2.0) }]);
  },
  // Short 3: loading tip, debug menu, pause with two controllers, the empty sofa
  sh3({ W, H }) {
    const load = screenScene(W, H, (g, w, h, t) => drawLoading(g, w, h, t));
    const dbg = screenScene(W, H, (g, w, h, t, d) => drawDebug(g, w, h, t, Math.min(4, Math.floor(t / (d / 5)))));
    const pause = screenScene(W, H, (g, w, h, t) => { g.fillStyle = '#3e4640'; g.fillRect(0, 0, w, h); drawPause(g, w, h, t); });
    const sofa = (() => {
      const scene = darkRoomScene(0.4); scene.add(room(6, 2.8, 6, [60, 62, 70], TEX.carpet([70, 64, 60], [4, 4])));
      const couch = box(2.2, 0.8, 0.9, lambert({ color: 0x4a3a3a })); couch.position.set(0, 0.4, -1.5); scene.add(couch);
      const pad = box(0.3, 0.06, 0.18, lambert({ color: 0x1a1a1e })); pad.position.set(0.5, 0.83, -1.4); scene.add(pad);
      const glow = new THREE.PointLight(0x8090ff, 4, 6, 1.5); glow.position.set(0, 1, 1); scene.add(glow);
      const camera = camFor(W, H, 55);
      return { scene, camera, hud: null, update(t, d) { const q = ease(t / d); camera.position.set(0, 1.3, 1.8 - q * 1.0); camera.lookAt(0.3, 0.8, -1.5);
        glow.intensity = 4 + Math.sin(t * 11) * 0.8; } };
    })();
    return composite([{ frac: 0.25, obj: load }, { frac: 0.3, obj: dbg }, { frac: 0.25, obj: pause }, { frac: 0.2, obj: sofa }]);
  },
  cta({ W, H }) { return screenScene(W, H, (g, w, h, t) => drawCTA(g, w, h, t)); },
  black({ W, H }) { return screenScene(W, H, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }); },
  // standalone logo card
  logo({ W, H }) { return screenScene(W, H, (g, w, h) => drawLogo(g, w, h, 5, 2)); },
};
