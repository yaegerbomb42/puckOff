import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// LEGENDARY SHADER MATERIAL
// ============================================
export const LegendaryMaterial = shaderMaterial(
    { time: 0, map: null, color: new THREE.Color(0.2, 0.6, 1.0) },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float time;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform float time;
    uniform sampler2D map;
    uniform vec3 color;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 texColor = texture2D(map, vUv);
      
      // holographic wave effect
      float wave = sin(vPosition.y * 10.0 + time * 2.0) * 0.5 + 0.5;
      float shine = max(0.0, dot(vNormal, vec3(0.0, 1.0, 0.0)));
      
      // pulse
      float pulse = sin(time * 3.0) * 0.2 + 0.8;
      
      // Combine functionality: keep icon visible but add magical glow
      vec3 finalColor = texColor.rgb * pulse + color * wave * 0.5;
      
      // Rim light
      float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
      rim = pow(rim, 3.0);
      finalColor += vec3(0.5, 0.8, 1.0) * rim;

      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
);


// ============================================
// COSMIC SHADER (TIER 9) - Dark Matter & Rainbows
// ============================================
export const CosmicMaterial = shaderMaterial(
    { time: 0, map: null },
    // Vertex
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment
    `
    uniform float time;
    uniform sampler2D map;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Swirling UVs
      vec2 centered = vUv - 0.5;
      float dist = length(centered);
      float angle = atan(centered.y, centered.x);
      
      float spiral = angle + dist * 5.0 - time * 1.5;
      vec2 spiralUv = vec2(cos(spiral), sin(spiral)) * dist + 0.5;
      
      // Chromatic aberration
      float shift = sin(time) * 0.01;
      vec4 texColorR = texture2D(map, spiralUv + vec2(shift, 0.0));
      vec4 texColorG = texture2D(map, spiralUv);
      vec4 texColorB = texture2D(map, spiralUv - vec2(shift, 0.0));
      
      vec3 finalColor = vec3(texColorR.r, texColorG.g, texColorB.b);
      
      // Dark Matter void edges
      float voidEdge = smoothstep(0.4, 0.5, dist + sin(time * 2.0)*0.05);
      finalColor = mix(finalColor, vec3(0.05, 0.0, 0.1), voidEdge); // Dark purple void
      
      // Rainbow rim
      vec3 rimColor = 0.5 + 0.5 * cos(time + vUv.xyx + vec3(0, 2, 4));
      float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
      rim = pow(rim, 2.0);
      
      finalColor += rimColor * rim * 0.8;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// ============================================
// DIVINE SHADER (TIER 10) - Golden Light & Pulse
// ============================================
export const DivineMaterial = shaderMaterial(
    { time: 0, map: null },
    // Vertex
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment
    `
    uniform float time;
    uniform sampler2D map;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    // Simplex noise function would be huge, using simple pseudo-noise
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec4 texColor = texture2D(map, vUv);
      
      // Golden Pulse
      float heartbeat = abs(sin(time * 2.0));
      vec3 gold = vec3(1.0, 0.84, 0.0);
      
      // "Ascending" particles (noise moving up)
      float particle = step(0.98, rand(vUv + vec2(0.0, -time * 0.5)));
      
      vec3 finalColor = texColor.rgb + (gold * heartbeat * 0.3);
      finalColor += gold * particle; // Add particles
      
      // Intense White Rim
      float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
      rim = pow(rim, 4.0);
      finalColor += vec3(1.0) * rim * 1.5;

      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
);

// ============================================
// MYSTERY SHADER (UNIQUE) - Reality Glitch
// ============================================
export const MysteryMaterial = shaderMaterial(
    { time: 0, map: null },
    // Vertex
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float time;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Vertex jitter glitch
      vec3 pos = position;
      float glitch = step(0.95, sin(time * 10.0 + position.y * 5.0));
      pos.x += glitch * 0.1 * sin(time * 20.0);
      
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
    // Fragment
    `
    uniform float time;
    uniform sampler2D map;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
      // Voronoi-ish fracture (simplified grid)
      vec2 grid = fract(vUv * 10.0);
      float cellBorder = step(0.9, grid.x) + step(0.9, grid.y);
      
      vec4 texColor = texture2D(map, vUv);
      
      // Void background showing through cracks
      vec3 voidColor = vec3(0.0); // Pitch black
      
      // Intermittent "Reality Failure"
      float failure = smoothstep(0.4, 0.6, sin(time * 0.5)); // Slow fade in/out
      
      vec3 finalColor = mix(texColor.rgb, voidColor, cellBorder * failure);
      
      // Matrix rain overlay? No, keeping it subtle void.
      
      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
);
