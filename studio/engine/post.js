import * as THREE from 'three';

// PS2-style post: 15-bit colour (5 bits per channel) with 4x4 Bayer dithering,
// a slight green-grey grade, and a soft vignette. Scanlines and grain are added
// later in ffmpeg at full resolution.
export function initPost(renderer, W, H) {
  const rt = new THREE.WebGLRenderTarget(W, H, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    colorSpace: THREE.SRGBColorSpace,
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: rt.texture }, res: { value: new THREE.Vector2(W, H) }, grade: { value: 1.0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader: `
      uniform sampler2D tex; uniform vec2 res; uniform float grade; varying vec2 vUv;
      float bayer(vec2 p){
        int x=int(mod(p.x,4.)), y=int(mod(p.y,4.));
        int i=x+y*4;
        float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;
        m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
        for(int k=0;k<16;k++){ if(k==i) return m[k]/16.-0.5; }
        return 0.;
      }
      void main(){
        vec3 c = texture2D(tex, vUv).rgb;
        c = mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c));
        // grade: lift shadows toward green-grey, crush highlights a bit
        vec3 g = mix(c, c*vec3(0.92,1.0,0.94)+vec3(0.015,0.025,0.02), grade);
        float d = length(vUv-0.5);
        g *= 1.0 - 0.35*smoothstep(0.35,0.75,d);
        // 5-bit quantize with dither
        float levels = 31.0;
        g = floor(g*levels + bayer(gl_FragCoord.xy) + 0.5)/levels;
        gl_FragColor = vec4(clamp(g,0.,1.),1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  const scene = new THREE.Scene(); scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const hudCam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
  return { rt, scene, cam, hudCam, mat };
}

export function renderPost(renderer, post, scene, camera, hud) {
  renderer.setRenderTarget(post.rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.autoClear = true;
  renderer.render(post.scene, post.cam);
  if (hud) {
    renderer.autoClear = false;
    renderer.render(hud, post.hudCam);
    renderer.autoClear = true;
  }
}
