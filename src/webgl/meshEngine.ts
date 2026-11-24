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

export interface MeshEngineOptions {
  canvas: HTMLCanvasElement;
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
const POINTER_DAMP_LAMBDA = 3.2;

function toThreeColor(hex: string): Color {
  const [r, g, b] = hexToRgbNormalized(hex);
  return new Color().setRGB(r, g, b);
}

export function createMeshEngine(options: MeshEngineOptions): MeshEngineHandle {
  const { canvas, onContextLost } = options;

  let targetTheme: ThemeMode = options.initialTheme;
  let reducedMotion = options.reducedMotion;
  let isHidden = typeof document !== "undefined" ? document.hidden : false;
  let disposed = false;
  let rafId: number | null = null;
  let lastFrameMs = performance.now();
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

  // Single fullscreen triangle (3 vertices, no diagonal seam)
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

  const currentPointer = new Vector2(0.5, 0.5);
  const targetPointer = new Vector2(0.5, 0.5);
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
      uGrain: { value: initialPalette.grainStrength },
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
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    resolution.set(width * dpr, height * dpr);
  };

  const renderOnce = () => {
    if (disposed) return;
    renderer.render(scene, camera);
  };

  const colorsConverged = (): boolean => {
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
    return Math.abs((material.uniforms.uGrain.value as number) - targetGrain) <= 0.0005;
  };

  const stopLoop = () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const step = (now: number) => {
    rafId = null;
    if (disposed || isHidden) {
      return;
    }

    const dt = Math.min((now - lastFrameMs) / 1000, 0.05);
    lastFrameMs = now;

    if (!reducedMotion) {
      elapsedSeconds += dt;
      material.uniforms.uTime.value = elapsedSeconds;
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

    const pointerAlpha = dampFactor(POINTER_DAMP_LAMBDA, dt);
    currentPointer.lerp(targetPointer, pointerAlpha);

    renderOnce();

    // Keep animating when motion is enabled, or while a theme color transition is still settling.
    if (!reducedMotion || !colorsConverged()) {
      rafId = window.requestAnimationFrame(step);
    }
  };

  const ensureRunning = () => {
    if (disposed || isHidden || rafId !== null) {
      return;
    }
    lastFrameMs = performance.now();
    rafId = window.requestAnimationFrame(step);
  };

  const handleResize = () => {
    resize();
    renderOnce();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (reducedMotion || event.pointerType === "touch") {
      return;
    }
    const nx = event.clientX / Math.max(window.innerWidth, 1);
    const ny = 1 - event.clientY / Math.max(window.innerHeight, 1);
    targetPointer.set(nx, ny);
  };

  const handleVisibilityChange = () => {
    isHidden = document.hidden;
    if (isHidden) {
      stopLoop();
    } else if (!reducedMotion || !colorsConverged()) {
      ensureRunning();
    }
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    stopLoop();
    onContextLost?.();
  };

  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  canvas.addEventListener("webglcontextlost", handleContextLost);

  resize();
  renderOnce();
  if (!reducedMotion && !isHidden) {
    ensureRunning();
  }

  return {
    setTheme(theme: ThemeMode) {
      if (disposed || theme === targetTheme) {
        return;
      }
      targetTheme = theme;
      const nextPalette = MESH_PALETTES[theme];
      targetColors = nextPalette.colors.map(toThreeColor) as [Color, Color, Color, Color, Color];
      targetGrain = nextPalette.grainStrength;
      ensureRunning();
    },
    setReducedMotion(reduced: boolean) {
      if (disposed || reduced === reducedMotion) {
        return;
      }
      reducedMotion = reduced;
      if (reduced) {
        targetPointer.set(0.5, 0.5);
        if (colorsConverged()) {
          stopLoop();
        }
      } else {
        ensureRunning();
      }
    },
    dispose() {
      disposed = true;
      stopLoop();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
