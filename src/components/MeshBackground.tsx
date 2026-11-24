import { useEffect, useRef, useState } from "react";

import type { ThemeMode } from "../lib/theme";
import type { MeshEngineHandle } from "../webgl/meshEngine";

interface MeshBackgroundProps {
  theme: ThemeMode;
  reducedMotion: boolean;
}

export function MeshBackground({ theme, reducedMotion }: MeshBackgroundProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MeshEngineHandle | null>(null);
  const initialThemeRef = useRef(theme);
  const initialReducedRef = useRef(reducedMotion);
  const [webglReady, setWebglReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const canvas = canvasRef.current;
      const container = stageRef.current;
      if (!canvas || !container) {
        return;
      }

      try {
        const { createMeshEngine } = await import("../webgl/meshEngine");
        if (cancelled) {
          return;
        }

        const engine = createMeshEngine({
          canvas,
          container,
          initialTheme: initialThemeRef.current,
          reducedMotion: initialReducedRef.current,
          onContextLost: () => {
            setWebglReady(false);
            setWebglFailed(true);
          },
        });

        engineRef.current = engine;
        setWebglReady(true);
      } catch {
        if (!cancelled) {
          setWebglFailed(true);
        }
      }
    };

    const idleApi = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const useIdleCallback =
      typeof idleApi.requestIdleCallback === "function" &&
      typeof idleApi.cancelIdleCallback === "function";

    const scheduleId = useIdleCallback
      ? idleApi.requestIdleCallback!(
          () => {
            void boot();
          },
          { timeout: 600 },
        )
      : window.setTimeout(() => {
          void boot();
        }, 60);

    return () => {
      cancelled = true;
      if (useIdleCallback) {
        idleApi.cancelIdleCallback!(scheduleId);
      } else {
        window.clearTimeout(scheduleId);
      }
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    initialThemeRef.current = theme;
    engineRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    initialReducedRef.current = reducedMotion;
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  return (
    <div ref={stageRef} className="mesh-stage" aria-hidden="true">
      <div className="mesh-fallback" />
      {!webglFailed && (
        <canvas ref={canvasRef} className={`mesh-canvas${webglReady ? " is-ready" : ""}`} />
      )}
    </div>
  );
}
