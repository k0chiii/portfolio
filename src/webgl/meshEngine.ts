import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderer,
} from "three";

import { MESH_PALETTES, dampFactor, dampScalar, hexToRgbNormalized } from "../lib/palette";
import type { ThemeMode } from "../lib/theme";
import { MESH_FRAGMENT_SHADER, MESH_VERTEX_SHADER } from "./shaders";

export interface MeshEngineOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  initialTheme: ThemeMode;
  reducedMotion: boolean;
  onContextLost?: () => void;
}

export interface MeshEngineHandle {
  setTheme: (theme: ThemeMode) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
}

const MAX_DPR = 1.5;
const COLOR_DAMP_LAMBDA = 4.2;
const POINTER_DAMP_LAMBDA = 5.0;
const FOCUS_DAMP_LAMBDA = 4.5;
const TRAIL_DECAY_LAMBDA = 0.72;
const TRAIL_EMIT_COOLDOWN_MS = 140;

function toThreeColor(hex: string): Color {
  const [r, g, b] = hexToRgbNormalized(hex);
  return new Color().setRGB(r, g, b);
}

export function createMeshEngine(options: MeshEngineOptions): MeshEngineHandle {
  const { canvas, container, onContextLost } = options;

  let targetTheme: ThemeMode = options.initialTheme;
  let reducedMotion = options.reducedMotion;
  let isDocumentHidden = typeof document !== "undefined" ? document.hidden : false;
  let isInView = true;
  let pointerInside = false;
  let disposed = false;
  let rafId: number | null = null;
  let lastFrameMs = performance.now();
  let lastEmitMs = 0;
  let nextTrailIndex = 0;
  let elapsedSeconds = 0;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const geometry = new BufferGeometry();
  const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
  geometry.setAttribute("position", new BufferAttribute(vertices, 3));

  const initialPalette = MESH_PALETTES[targetTheme];
  const currentColors = initialPalette.colors.map(toThreeColor) as [
    Color,
    Color,
    Color,
    Color,
    Color,
  ];
  let targetColors = initialPalette.colors.map(toThreeColor) as [Color, Color, Color, Color, Color];
  let targetGrain = initialPalette.grainStrength;
  let targetThemeMix = targetTheme === "dark" ? 1 : 0;

  const currentPointer = new Vector2(0.72, 0.48);
  const targetPointer = new Vector2(0.72, 0.48);
  const lastPointer = new Vector2(0.72, 0.48);
  const resolution = new Vector2(1, 1);

  const trails: [Vector4, Vector4, Vector4, Vector4] = [
    new Vector4(0.5, 0.5, 0, 1),
    new Vector4(0.5, 0.5, 0, -1),
    new Vector4(0.5, 0.5, 0, 1),
    new Vector4(0.5, 0.5, 0, -1),
  ];

  const material = new ShaderMaterial({
    vertexShader: MESH_VERTEX_SHADER,
    fragmentShader: MESH_FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: resolution },
      uPointer: { value: currentPointer },
      uFocus: { value: 0 },
      uGrain: { value: initialPalette.grainStrength },
      uThemeMix: { value: targetThemeMix },
      uTrail0: { value: trails[0] },
      uTrail1: { value: trails[1] },
      uTrail2: { value: trails[2] },
      uTrail3: { value: trails[3] },
      uColor0: { value: currentColors[0] },
      uColor1: { value: currentColors[1] },
      uColor2: { value: currentColors[2] },
      uColor3: { value: currentColors[3] },
      uColor4: { value: currentColors[4] },
    },
  });

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    resolution.set(width * dpr, height * dpr);
  };

  const renderOnce = () => {
    if (disposed) return;
    renderer.render(scene, camera);
  };

  const stateSettled = (): boolean => {
    for (let i = 0; i < currentColors.length; i += 1) {
      const c = currentColors[i];
      const t = targetColors[i];
      if (
        Math.abs(c.r - t.r) > 0.001 ||
        Math.abs(c.g - t.g) > 0.001 ||
        Math.abs(c.b - t.b) > 0.001
      ) {
        return false;
      }
    }
    for (const trail of trails) {
      if (trail.z > 0.004) {
        return false;
      }
    }
    const grainDone = Math.abs((material.uniforms.uGrain.value as number) - targetGrain) <= 0.0005;
    const themeDone =
      Math.abs((material.uniforms.uThemeMix.value as number) - targetThemeMix) <= 0.002;
    return grainDone && themeDone;
  };

  const canAnimate = () => !disposed && !isDocumentHidden && isInView;

  const stopLoop = () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const step = (now: number) => {
    rafId = null;
    if (!canAnimate()) {
      return;
    }

    const dt = Math.min((now - lastFrameMs) / 1000, 0.05);
    lastFrameMs = now;

    if (!reducedMotion) {
      elapsedSeconds += dt;
      material.uniforms.uTime.value = elapsedSeconds;

      if (!pointerInside) {
        targetPointer.set(
          0.7 + 0.11 * Math.sin(elapsedSeconds * 0.34),
          0.48 + 0.14 * Math.cos(elapsedSeconds * 0.27),
        );
      }
    }

    const colorAlpha = dampFactor(COLOR_DAMP_LAMBDA, dt);
    for (let i = 0; i < currentColors.length; i += 1) {
      currentColors[i].lerp(targetColors[i], colorAlpha);
    }
    material.uniforms.uGrain.value = dampScalar(
      material.uniforms.uGrain.value as number,
      targetGrain,
      COLOR_DAMP_LAMBDA,
      dt,
    );
    material.uniforms.uThemeMix.value = dampScalar(
      material.uniforms.uThemeMix.value as number,
      targetThemeMix,
      COLOR_DAMP_LAMBDA,
      dt,
    );
    material.uniforms.uFocus.value = dampScalar(
      material.uniforms.uFocus.value as number,
      pointerInside ? 1 : 0,
      FOCUS_DAMP_LAMBDA,
      dt,
    );

    const decay = Math.exp(-TRAIL_DECAY_LAMBDA * dt);
    for (const trail of trails) {
      trail.z = trail.z * decay < 0.001 ? 0 : trail.z * decay;
    }

    const pointerAlpha = dampFactor(POINTER_DAMP_LAMBDA, dt);
    currentPointer.lerp(targetPointer, pointerAlpha);

    renderOnce();

    if (!reducedMotion || !stateSettled()) {
      rafId = window.requestAnimationFrame(step);
    }
  };

  const ensureRunning = () => {
    if (!canAnimate() || rafId !== null) {
      return;
    }
    lastFrameMs = performance.now();
    rafId = window.requestAnimationFrame(step);
  };

  const syncPlayback = () => {
    if (!canAnimate()) {
      stopLoop();
      return;
    }
    if (!reducedMotion || !stateSettled()) {
      ensureRunning();
    }
  };

  const injectTrace = (nx: number, ny: number, strength: number, spin: number) => {
    const slot = trails[nextTrailIndex];
    slot.set(nx, ny, Math.min(strength, 1), spin >= 0 ? 1 : -1);
    nextTrailIndex = (nextTrailIndex + 1) % trails.length;
    ensureRunning();
  };

  const toNormalized = (clientX: number, clientY: number): [number, number] | null => {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    return [(clientX - rect.left) / rect.width, 1 - (clientY - rect.top) / rect.height];
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    renderOnce();
  });
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isInView = entry ? entry.isIntersecting : true;
      syncPlayback();
    },
    { threshold: 0.01 },
  );
  intersectionObserver.observe(container);

  const handlePointerMove = (event: PointerEvent) => {
    if (reducedMotion || !isInView || event.pointerType === "touch") {
      return;
    }
    const coords = toNormalized(event.clientX, event.clientY);
    pointerInside = coords !== null;
    if (!coords) {
      return;
    }
    const [nx, ny] = coords;
    const dx = nx - lastPointer.x;
    const dy = ny - lastPointer.y;
    const speed = Math.hypot(dx, dy);
    lastPointer.set(nx, ny);
    targetPointer.set(nx, ny);

    const now = performance.now();
    if (speed > 0.014 && now - lastEmitMs >= TRAIL_EMIT_COOLDOWN_MS) {
      lastEmitMs = now;
      const spin = dx - dy >= 0 ? 1 : -1;
      injectTrace(nx, ny, Math.min(0.4 + speed * 4.5, 0.9), spin);
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (reducedMotion || !isInView) {
      return;
    }
    const coords = toNormalized(event.clientX, event.clientY);
    if (!coords) {
      return;
    }
    const [nx, ny] = coords;
    pointerInside = true;
    targetPointer.set(nx, ny);
    injectTrace(nx, ny, 0.95, nextTrailIndex % 2 === 0 ? 1 : -1);
  };

  const handlePointerLeave = () => {
    pointerInside = false;
  };

  const handleVisibilityChange = () => {
    isDocumentHidden = document.hidden;
    syncPlayback();
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    stopLoop();
    onContextLost?.();
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  document.documentElement.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  canvas.addEventListener("webglcontextlost", handleContextLost);

  resize();
  renderOnce();
  syncPlayback();

  return {
    setTheme(theme: ThemeMode) {
      if (disposed || theme === targetTheme) {
        return;
      }
      targetTheme = theme;
      const nextPalette = MESH_PALETTES[theme];
      targetColors = nextPalette.colors.map(toThreeColor) as [Color, Color, Color, Color, Color];
      targetGrain = nextPalette.grainStrength;
      targetThemeMix = theme === "dark" ? 1 : 0;

      if (canAnimate()) {
        ensureRunning();
      } else {
        for (let i = 0; i < currentColors.length; i += 1) {
          currentColors[i].copy(targetColors[i]);
        }
        material.uniforms.uGrain.value = targetGrain;
        material.uniforms.uThemeMix.value = targetThemeMix;
        renderOnce();
      }
    },
    setReducedMotion(reduced: boolean) {
      if (disposed || reduced === reducedMotion) {
        return;
      }
      reducedMotion = reduced;
      if (reduced) {
        pointerInside = false;
        for (const trail of trails) {
          trail.z = 0;
        }
        targetPointer.set(0.72, 0.48);
        if (stateSettled()) {
          stopLoop();
        }
      } else {
        syncPlayback();
      }
    },
    dispose() {
      disposed = true;
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
