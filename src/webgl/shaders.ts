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

  // Low-cost trigonometric domain warping
  vec2 warp(vec2 p, float t) {
    vec2 q = p;
    q.x += 0.22 * sin(p.y * 2.2 + t * 0.28) + 0.11 * cos(p.x * 1.8 - t * 0.2);
    q.y += 0.22 * cos(p.x * 2.0 - t * 0.24) + 0.11 * sin(p.y * 2.4 + t * 0.18);

    vec2 r = q;
    r.x += 0.13 * sin(q.y * 3.0 - t * 0.19 + 1.2);
    r.y += 0.13 * cos(q.x * 2.7 + t * 0.16 + 0.6);
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

    vec2 pointerOffset = (uPointer - 0.5) * vec2(aspect, 1.0) * 0.15;
    float t = uTime;
    vec2 flow = warp(centered - pointerOffset * 0.35, t);

    // Asymmetric composition:
    // Keep the left reading area calmer while anchoring the neon orange mass on the right/lower-right.
    vec2 coreOrange = vec2(
      0.34 * aspect + 0.16 * sin(t * 0.21),
      0.04 + 0.22 * cos(t * 0.17)
    ) + pointerOffset * 0.5;

    vec2 hotEdge = vec2(
      0.16 * aspect + 0.22 * cos(t * 0.16 + 1.3),
      -0.24 + 0.18 * sin(t * 0.19 + 0.7)
    ) - pointerOffset * 0.28;

    vec2 warmWash = vec2(
      -0.14 * aspect + 0.20 * sin(t * 0.15 + 2.5),
      0.24 + 0.16 * cos(t * 0.18 + 1.9)
    ) + pointerOffset * 0.18;

    vec2 coolWeight = vec2(
      -0.42 * aspect + 0.14 * cos(t * 0.13 + 3.6),
      -0.28 + 0.16 * sin(t * 0.14 + 2.8)
    );

    float wCore = softBlob(flow, coreOrange, 0.68);
    float wHot = softBlob(flow, hotEdge, 0.72);
    float wWash = softBlob(flow, warmWash, 0.80);
    float wCool = softBlob(flow, coolWeight, 0.78);

    float sheen = 0.5 + 0.5 * sin(flow.x * 2.4 - flow.y * 1.7 + t * 0.24);

    vec3 col = uColor0;
    col = mix(col, uColor4, smoothstep(0.10, 0.92, wCool * 0.62));
    col = mix(col, uColor3, smoothstep(0.08, 0.90, wWash * 0.78));
    col = mix(col, uColor1, smoothstep(0.06, 0.88, wCore * 1.08));
    col = mix(col, uColor2, smoothstep(0.12, 0.90, wHot * (0.64 + 0.28 * sheen)));

    // Gently calm the far-left text zone so typography stays effortlessly legible
    float leftCalm = smoothstep(0.58, 0.04, uv.x) * 0.42;
    col = mix(col, uColor0, leftCalm);

    // Fine film grain (eliminates 8-bit orange banding and adds tactile finish)
    float grain = (hash12(gl_FragCoord.xy) - 0.5) * uGrain;
    col += vec3(grain);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;
