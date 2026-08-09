/* Hero shader — the typing → writing morph.
 *
 * One fullscreen quad. Two photographs and a paper-fibre displacement map are
 * blended by an ink-bleed threshold driven by a single uProgress uniform, which
 * ScrollTrigger drives from main.js.
 *
 * This module is dynamically imported and only ever runs on capable desktop
 * devices (see shouldRunHero in main.js). If anything here throws, the caller
 * keeps the CSS cross-fade fallback, so the hero is never blank.
 */

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;

  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform sampler2D uDisp;
  uniform float uProgress;
  uniform float uPlaneAspect;
  uniform float uAspectA;
  uniform float uAspectB;
  uniform float uGrain;

  varying vec2 vUv;

  /* Emulate background-size: cover for a texture inside the quad. */
  vec2 coverUv(vec2 uv, float imgAspect, float planeAspect) {
    vec2 s = planeAspect > imgAspect
      ? vec2(1.0, imgAspect / planeAspect)
      : vec2(planeAspect / imgAspect, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    float d = texture2D(uDisp, vUv * 1.6).r;

    /* Each image drifts slightly against the other so the morph reads as
       movement, not a dissolve. */
    vec2 uvA = coverUv(vUv, uAspectA, uPlaneAspect) + vec2(d * uProgress * 0.055, 0.0);
    vec2 uvB = coverUv(vUv, uAspectB, uPlaneAspect) - vec2(d * (1.0 - uProgress) * 0.055, 0.0);

    vec4 a = texture2D(uA, uvA);
    vec4 b = texture2D(uB, uvB);

    /* Ink bleed: the displacement map decides which pixels turn over first,
       so the transition spreads like liquid rather than fading uniformly. */
    float edge = 0.45;
    float t = smoothstep(d * edge, d * edge + (1.0 - edge), uProgress);

    vec4 col = mix(a, b, t);

    /* A touch of grain keeps it consistent with the rest of the page. */
    float n = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
    col.rgb += (n - 0.5) * uGrain;

    gl_FragColor = col;
  }
`;

export async function initHero(canvas, opts = {}) {
  const THREE = await import('./vendor/three.module.min.js');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0xfaf6ef, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const loader = new THREE.TextureLoader();
  const load = (url) =>
    new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));

  const [texA, texB, texD] = await Promise.all([
    load(opts.imageA),
    load(opts.imageB),
    load(opts.displacement),
  ]);

  for (const t of [texA, texB]) {
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
  }
  texD.wrapS = texD.wrapT = THREE.RepeatWrapping;

  const aspectOf = (t) => t.image.width / t.image.height;

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uA: { value: texA },
      uB: { value: texB },
      uDisp: { value: texD },
      uProgress: { value: 0 },
      uPlaneAspect: { value: 1 },
      uAspectA: { value: aspectOf(texA) },
      uAspectB: { value: aspectOf(texB) },
      uGrain: { value: 0.035 },
    },
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  let raf = 0;
  let running = true;

  function resize() {
    const parent = canvas.parentElement || canvas;
    const w = parent.clientWidth || 1;
    const h = parent.clientHeight || 1;
    // Cap DPR: the shader is fill-rate bound and 3x on a large display is wasteful.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    material.uniforms.uPlaneAspect.value = w / h;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function tick() {
    if (!running) return;
    render();
    raf = requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Only paint while the hero is actually on screen.
  const vis = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        tick();
      } else if (!e.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0 }
  );
  vis.observe(canvas);

  tick();

  return {
    setProgress(p) {
      material.uniforms.uProgress.value = Math.min(1, Math.max(0, p));
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      vis.disconnect();
      window.removeEventListener('resize', resize);
      material.dispose();
      texA.dispose();
      texB.dispose();
      texD.dispose();
      renderer.dispose();
    },
  };
}
