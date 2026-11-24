export const MESH_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const MESH_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uGrain;
  uniform vec3 uColor0;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;

  // Lightweight 2D hash for fine film grain & anti-banding dithering
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Fluid, lively trigonometric domain warping (low GPU cost)
  vec2 warp(vec2 p, float t) {
    vec2 q = p;
    q.x += 0.34 * sin(p.y * 2.1 + t * 0.72) + 0.18 * cos(p.x * 1.9 - t * 0.56);
    q.y += 0.34 * cos(p.x * 2.0 - t * 0.64) + 0.18 * sin(p.y * 2.3 + t * 0.48);

    vec2 r = q;
    r.x += 0.22 * sin(q.y * 3.1 - t * 0.62 + 1.2) + 0.09 * cos((q.x + q.y) * 2.4 + t * 0.45);
    r.y += 0.22 * cos(q.x * 2.8 + t * 0.54 + 0.6) + 0.09 * sin((q.x - q.y) * 2.2 - t * 0.41);
    return r;
  }

  float softBlob(vec2 p, vec2 center, float radius) {
    vec2 d = p - center;
    return exp(-dot(d, d) / (radius * radius));
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vUv;
    vec2 centered = (uv - 0.5) * vec2(aspect, 1.0);

    vec2 pointerOffset = (uPointer - 0.5) * vec2(aspect, 1.0) * 0.24;
    float t = uTime;
    vec2 flow = warp(centered - pointerOffset * 0.4, t);

    // Expressive drifting pigment masses crossing through the right & center-right field
    vec2 coreOrange = vec2(
      0.30 * aspect + 0.32 * sin(t * 0.52),
      0.06 + 0.28 * cos(t * 0.44)
    ) + pointerOffset * 0.55;

    vec2 goldenYellow = vec2(
      0.16 * aspect + 0.34 * cos(t * 0.46 + 1.1),
      -0.16 + 0.30 * sin(t * 0.58 + 0.6)
    ) - pointerOffset * 0.35;

    vec2 solarHighlight = vec2(
      0.02 * aspect + 0.36 * sin(t * 0.39 + 2.3),
      0.22 + 0.26 * cos(t * 0.49 + 1.7)
    ) + pointerOffset * 0.28;

    vec2 coolWeight = vec2(
      -0.44 * aspect + 0.18 * cos(t * 0.31 + 3.4),
      -0.26 + 0.20 * sin(t * 0.34 + 2.6)
    );

    float wOrange = softBlob(flow, coreOrange, 0.72);
    float wYellow = softBlob(flow, goldenYellow, 0.76);
    float wSolar = softBlob(flow, solarHighlight, 0.70);
    float wCool = softBlob(flow, coolWeight, 0.76);

    // Silk-like traveling wave that shifts warm orange into golden yellow
    float ribbon = 0.5 + 0.5 * sin(flow.x * 2.6 - flow.y * 1.9 + t * 0.78);
    float crest = 0.5 + 0.5 * cos(flow.x * 1.7 + flow.y * 2.5 - t * 0.64);

    vec3 col = uColor0;
    col = mix(col, uColor4, smoothstep(0.12, 0.92, wCool * 0.52));
    col = mix(col, uColor1, smoothstep(0.06, 0.88, wOrange * 1.06));
    col = mix(col, uColor2, smoothstep(0.06, 0.88, wYellow * (0.82 + 0.26 * ribbon)));
    col = mix(col, uColor3, smoothstep(0.10, 0.90, wSolar * (0.62 + 0.34 * crest)));

    // Keep the far-left copy zone readable while letting warm motion sweep across
    float leftCalm = smoothstep(0.48, 0.02, uv.x) * 0.28;
    col = mix(col, uColor0, leftCalm);

    // Fine film grain to prevent 8-bit color banding
    float grain = (hash12(gl_FragCoord.xy) - 0.5) * uGrain;
    col += vec3(grain);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;
