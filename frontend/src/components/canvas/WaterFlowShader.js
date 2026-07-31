import { ShaderMaterial, Color, DoubleSide } from 'three'

export function createWaterFlowShader({ color = '#00aaff', speed = 0.5 } = {}) {
  return new ShaderMaterial({
    side: DoubleSide,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uColor: { value: new Color(color) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uSpeed;
      uniform vec3 uColor;
      varying vec2 vUv;

      void main() {
        float t = mod(uTime * uSpeed, 1.0);
        float flow = fract(vUv.x * 40.0 + t);
        float pattern = smoothstep(0.0, 0.25, flow) - smoothstep(0.35, 0.65, flow);
        float alpha = pattern * 0.6 + 0.2;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })
}
