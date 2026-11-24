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

  // Lightweight 2D hash for subtle analog film grain & dithering
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Smooth domain warping using low-cost trigonometric harmonics
  vec2 warp(vec2 p, float t) {
    vec2 q = p;
    q.x += 0.24 * sin(p.y * 2.1 + t * 0.26) + 0.12 * cos(p.x * 1.7 - t * 0.19);
    q.y += 0.24 * cos(p.x * 1.9 - t * 0.22) + 0.12 * sin(p.y * 2.3 + t * 0.17);

    vec2 r = q;
    r.x += 0.14 * sin(q.y * 3.1 - t * 0.18 + 1.4);
    r.y += 0.14 * cos(q.x * 2.8 + t * 0.15 + 0.7);
    return r;
  }

  float softBlob(vec2 p, vec2 center, float radius) {
    vec2 d = p - center;
    float distSq = dot(d, d);
    return exp(-distSq / (radius * radius));
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vUv;
    vec2 centered = (uv - 0.5) * vec2(aspect, 1.0);

    // Subtle pointer parallax (never distracting)
    vec2 pointerOffset = (uPointer - 0.5) * vec2(aspect, 1.0) * 0.14;

    float t = uTime;
    vec2 flow = warp(centered - pointerOffset * 0.35, t);

    // Four slowly drifting pigment clouds
    vec2 c1 = vec2(
      -0.38 * aspect + 0.22 * sin(t * 0.19),
      0.26 + 0.18 * cos(t * 0.16)
    ) + pointerOffset * 0.45;

    vec2 c2 = vec2(
      0.34 * aspect + 0.24 * cos(t * 0.15 + 1.1),
      0.16 + 0.22 * sin(t * 0.18 + 0.5)
    ) - pointerOffset * 0.3;

    vec2 c3 = vec2(
      -0.12 * aspect + 0.28 * sin(t * 0.14 + 2.4),
      -0.30 + 0.18 * cos(t * 0.20 + 1.7)
    ) + pointerOffset * 0.2;

    vec2 c4 = vec2(
      0.28 * aspect + 0.20 * cos(t * 0.17 + 3.8),
      -0.24 + 0.24 * sin(t * 0.13 + 2.9)
    );

    float w1 = softBlob(flow, c1, 0.78);
    float w2 = softBlob(flow, c2, 0.82);
    float w3 = softBlob(flow, c3, 0.76);
    float w4 = softBlob(flow, c4, 0.86);

    // Organic silk sheen wave across the canvas
    float ribbon = 0.5 + 0.5 * sin(flow.x * 2.2 - flow.y * 1.8 + t * 0.22);

    vec3 col = uColor0;
    col = mix(col, uColor1, smoothstep(0.08, 0.92, w1 * 0.95));
    col = mix(col, uColor2, smoothstep(0.06, 0.90, w2 * 0.92));
    col = mix(col, uColor3, smoothstep(0.10, 0.88, w3 * 0.82));
    col = mix(col, uColor4, smoothstep(0.12, 0.92, w4 * (0.58 + 0.26 * ribbon)));

    // Subtle spatial vignette for calm depth around edges
    float edgeDist = length((uv - 0.5) * vec2(1.05, 1.15));
    col = mix(col, uColor0, smoothstep(0.45, 1.18, edgeDist) * 0.28);

    // Fine film grain (prevents 8-bit color banding and adds tactile finish)
    float grain = (hash12(gl_FragCoord.xy) - 0.5) * uGrain;
    col += vec3(grain);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;
