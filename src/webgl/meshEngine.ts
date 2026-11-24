import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

import { MESH_PALETTES, dampFactor, dampScalar, hexToRgbNormalized } from "../lib/palette";
import type { ThemeMode } from "../lib/theme";
import { MESH_FRAGMENT_SHADER, MESH_VERTEX_SHADER } from "./shaders";

export interface FieldSample {
  readonly x: number;
  readonly y: number;
  readonly phi: number;
}

export interface MeshEngineOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  initialTheme: ThemeMode;
  reducedMotion: boolean;
  onSample?: (sample: FieldSample) => void;
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
const SAMPLE_INTERVAL_MS = 90;

function toThreeColor(hex: string): Color {
  const [r, g, b] = hexToRgbNormalized(hex);
  return new Color().setRGB(r, g, b);
}

/**
 * Evaluates a lightweight scalar potential matching the shader's drifting field
 * at normalized observer coordinate (nx, ny) for the quiet readout plate.
 */
function sampleFieldPotential(nx: number, ny: number, aspect: number, t: number): number {
  const cx = (nx - 0.5) * aspect;
  const cy = ny - 0.5;
  const qx = cx + 0.34 * Math.sin(cy * 2.1 + t * 0.72) + 0.18 * Math.cos(cx * 1.9 - t * 0.56);
  const qy = cy + 0.34 * Math.cos(cx * 2.0 - t * 0.64) + 0.18 * Math.sin(cy * 2.3 + t * 0.48);

  const blob = (bx: number, by: number, r: number) => {
    const dx = qx - bx;
    const dy = qy - by;
    return Math.exp(-(dx * dx + dy * dy) / (r * r));
  };

  const wOrange = blob(
    0.3 * aspect + 0.32 * Math.sin(t * 0.52),
    0.06 + 0.28 * Math.cos(t * 0.44),
    0.72,
  );
  const wYellow = blob(
    0.16 * aspect + 0.34 * Math.cos(t * 0.46 + 1.1),
    -0.16 + 0.3 * Math.sin(t * 0.58 + 0.6),
    0.76,
  );
  const wSolar = blob(
    0.02 * aspect + 0.36 * Math.sin(t * 0.39 + 2.3),
    0.22 + 0.26 * Math.cos(t * 0.49 + 1.7),
    0.7,
  );

  return Math.min(Math.max(wOrange * 0.52 + wYellow * 0.42 + wSolar * 0.32, 0), 1);
}

export function createMeshEngine(options: MeshEngineOptions): MeshEngineHandle {
  const { canvas, container, onSample, onContextLost } = options;

  let targetTheme: ThemeMode = options.initialTheme;
  let reducedMotion = options.reducedMotion;
  let isDocumentHidden = typeof document !== "undefined" ? document.hidden : false;
  let isInView = true;
  let pointerInside = false;
  let disposed = false;
  let rafId: number | null = null;
  let lastFrameMs = performance.now();
  let lastSampleMs = 0;
  let elapsedSeconds = 0;
  let currentAspect = 1.6;

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
  const resolution = new Vector2(1, 1);

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

  const emitSample = (force = false, now = performance.now()) => {
    if (!onSample || (!force && now - lastSampleMs < SAMPLE_INTERVAL_MS)) {
      return;
    }
    lastSampleMs = now;
    onSample({
      x: currentPointer.x,
      y: currentPointer.y,
      phi: sampleFieldPotential(currentPointer.x, currentPointer.y, currentAspect, elapsedSeconds),
    });
  };

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    currentAspect = width / height;
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

      // When no pointer is active, let the perceptual aperture trace a calm orbit over the right field
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

    const pointerAlpha = dampFactor(POINTER_DAMP_LAMBDA, dt);
    currentPointer.lerp(targetPointer, pointerAlpha);

    renderOnce();
    emitSample(false, now);

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
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    pointerInside = inside;
    if (!inside) {
      return;
    }
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = 1 - (event.clientY - rect.top) / rect.height;
    targetPointer.set(nx, ny);
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
  document.documentElement.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  canvas.addEventListener("webglcontextlost", handleContextLost);

  resize();
  renderOnce();
  emitSample(true);
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
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
