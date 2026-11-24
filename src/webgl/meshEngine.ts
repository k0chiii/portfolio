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
const POINTER_DAMP_LAMBDA = 4.6;

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

    if (!reducedMotion || !colorsConverged()) {
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
    if (!reducedMotion || !colorsConverged()) {
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
    const nx = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const ny = Math.min(Math.max(1 - (event.clientY - rect.top) / rect.height, 0), 1);
    targetPointer.set(nx, ny);
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

  container.addEventListener("pointermove", handlePointerMove, { passive: true });
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
      if (canAnimate()) {
        ensureRunning();
      } else {
        // Snap immediately when off-screen so returning to the hero shows the updated palette.
        for (let i = 0; i < currentColors.length; i += 1) {
          currentColors[i].copy(targetColors[i]);
        }
        material.uniforms.uGrain.value = targetGrain;
        renderOnce();
      }
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
        syncPlayback();
      }
    },
    dispose() {
      disposed = true;
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
