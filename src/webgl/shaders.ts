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
  uniform vec4 uTrail0;
  uniform vec4 uTrail1;
  uniform vec4 uTrail2;
  uniform vec4 uTrail3;
  uniform vec3 uColor0;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  mat2 rot2(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  // Apply a decaying localized vortex memory left by recent pointer/touch gestures
  vec2 applyTrace(vec2 p, vec4 trace, float aspect) {
    float strength = trace.z;
    if (strength <= 0.001) return p;

    vec2 center = (trace.xy - 0.5) * vec2(aspect, 1.0);
    vec2 d = p - center;
    float r2 = dot(d, d);
    float falloff = exp(-r2 / 0.14) * strength;
    float spin = trace.w * falloff * 1.45;
    vec2 rotated = rot2(spin) * d;
    return center + mix(d, rotated, 0.85) + normalize(d + vec2(0.0001)) * falloff * 0.04;
  }

  // Curl-like shear convection (organic silk bands without heavy noise loops)
  vec2 advect(vec2 p, float t) {
    vec2 q = p;
    q.x += 0.36 * sin(p.y * 2.2 + t * 0.74) + 0.18 * cos((p.x - p.y) * 1.9 - t * 0.58);
    q.y += 0.36 * cos(p.x * 2.1 - t * 0.66) + 0.18 * sin((p.x + p.y) * 2.0 + t * 0.52);

    vec2 r = rot2(0.28 * sin(t * 0.35)) * q;
    r.x += 0.24 * sin(q.y * 3.1 - t * 0.68 + 1.1);
    r.y += 0.24 * cos(q.x * 2.9 + t * 0.60 + 0.5);
    return r;
  }

  vec3 evaluateField(vec2 p, float t, float aspect) {
    vec2 flow = advect(p, t);

    // Intersecting ribbons and thermal currents across the full frame
    float waveA = 0.5 + 0.5 * sin(flow.x * 2.1 + flow.y * 1.3 - t * 0.82);
    float waveB = 0.5 + 0.5 * cos(flow.x * 1.6 - flow.y * 2.4 + t * 0.68);
    float waveC = 0.5 + 0.5 * sin(length(flow) * 2.8 - t * 0.92);

    vec2 cOrange = vec2(0.32 * aspect * sin(t * 0.48), 0.28 * cos(t * 0.41));
    vec2 cYellow = vec2(0.36 * aspect * cos(t * 0.43 + 1.4), 0.30 * sin(t * 0.54 + 0.7));
    vec2 cCitrus = vec2(0.30 * aspect * sin(t * 0.37 + 2.6), -0.26 * cos(t * 0.49 + 1.8));
    vec2 cDeep = vec2(-0.34 * aspect * cos(t * 0.33 + 0.9), -0.28 * sin(t * 0.39 + 2.2));

    float mOrange = exp(-dot(flow - cOrange, flow - cOrange) / 0.78);
    float mYellow = exp(-dot(flow - cYellow, flow - cYellow) / 0.82);
    float mCitrus = exp(-dot(flow - cCitrus, flow - cCitrus) / 0.68);
    float mDeep = exp(-dot(flow - cDeep, flow - cDeep) / 0.88);

    vec3 col = uColor0;
    col = mix(col, uColor4, smoothstep(0.08, 0.92, mDeep * (0.58 + 0.34 * waveB)));
    col = mix(col, uColor1, smoothstep(0.05, 0.88, mOrange * (0.76 + 0.34 * waveA)));
    col = mix(col, uColor2, smoothstep(0.06, 0.90, mYellow * (0.74 + 0.32 * waveB)));
    col = mix(col, uColor3, smoothstep(0.14, 0.92, mCitrus * (0.58 + 0.38 * waveC)));
    return col;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centered = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 pointerShift = (uPointer - 0.5) * vec2(aspect, 1.0) * 0.16;

    vec2 warped = centered - pointerShift;
    warped = applyTrace(warped, uTrail0, aspect);
    warped = applyTrace(warped, uTrail1, aspect);
    warped = applyTrace(warped, uTrail2, aspect);
    warped = applyTrace(warped, uTrail3, aspect);

    // Subtle perceptual temporal lag across RGB channels (afterimage of motion)
    float lag = 0.055;
    float r = evaluateField(warped, uTime + lag, aspect).r;
    float g = evaluateField(warped, uTime, aspect).g;
    float b = evaluateField(warped, uTime - lag, aspect).b;
    vec3 col = vec3(r, g, b);

    // Tactile grain eliminates 8-bit banding across intense orange-yellow transitions
    float grain = (hash12(gl_FragCoord.xy) - 0.5) * uGrain;
    col += vec3(grain);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;
