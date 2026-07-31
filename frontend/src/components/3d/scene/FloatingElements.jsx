import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { PipeElbow, PipeTee, PipeWye, PipeSocket, PipeReducer } from './PlumbingFittings'

function StraightPipe({ length, radius = 0.05 }) {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshPhysicalMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
    </mesh>
  )
}

/* ──── A joint that oscillates rotation, children move with it ──── */
function Joint({ children, config, index }) {
  const ref = useRef(null)
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const sp = config.speed || 0.6
    const amp = config.amp || 0.15
    const p = phase.current

    ref.current.rotation.z = Math.sin(t * sp + p + (config.offset || 0)) * amp
    ref.current.rotation.x = Math.cos(t * sp * 0.7 + p + (config.offset || 0)) * amp * 0.5
  })

  return (
    <group ref={ref} position={config.at || [0, 0, 0]}>
      {children}
    </group>
  )
}

/* ──── Orbit group that drifts across the canvas ──── */
function OrbitGroup({ config, index, children }) {
  const ref = useRef(null)
  const phase = useRef(Math.random() * Math.PI * 2)

  useGSAP(() => {
    if (ref.current) gsap.from(ref.current.position, { y: -2, duration: 0.8, delay: config.delay || 0, ease: 'power3.out' })
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const s = config.speed || 0.15
    const r = config.orbitRadius || 0.3
    const p = phase.current

    ref.current.position.x = config.base[0] + Math.sin(t * s + p + index) * r
    ref.current.position.z = config.base[2] + Math.cos(t * s * 0.8 + p + index) * r
    ref.current.position.y = config.base[1] + Math.sin(t * s * 0.5 + p) * 0.12
  })

  return (
    <group ref={ref} position={config.base} rotation={config.baseRot || [0, 0, 0]}>
      {children}
    </group>
  )
}

/* ──── HARNESS 1: Copper conduit with 90° elbow ──── */
function Harness1() {
  return (
    <Joint config={{ at: [0, 0, 0], speed: 0.8, amp: 0.2, offset: 0 }}>
      <StraightPipe length={0.5} radius={0.06} />
      <PipeSocket position={[0.3, 0, 0]} />
      <Joint config={{ at: [0.45, 0, 0], speed: 0.5, amp: 0.3, offset: 1.2 }}>
        <PipeElbow radius={0.18} tubeRadius={0.06} angle={Math.PI / 2} />
        <Joint config={{ at: [0.18, -0.18, 0], speed: 0.6, amp: 0.15, offset: 2.0 }}>
          <StraightPipe length={0.3} radius={0.05} />
          <Joint config={{ at: [0.2, 0, 0], speed: 0.7, amp: 0.1, offset: 0.5 }}>
            <PipeReducer startRadius={0.07} endRadius={0.04} />
          </Joint>
        </Joint>
      </Joint>
    </Joint>
  )
}

/* ──── HARNESS 2: Sanitary tee with branch ──── */
function Harness2() {
  return (
    <Joint config={{ at: [0, 0, 0], speed: 0.6, amp: 0.15, offset: 0.8 }}>
      <StraightPipe length={0.5} radius={0.05} />
      <PipeSocket position={[0.28, 0, 0]} />
      <Joint config={{ at: [0.32, 0, 0], speed: 0.7, amp: 0.25, offset: 1.5 }}>
        <PipeTee length={0.4} branchLength={0.15} radius={0.05} />
        <Joint config={{ at: [0, 0.15, 0], speed: 1.0, amp: 0.3, offset: 0.3 }}>
          <PipeElbow radius={0.15} tubeRadius={0.05} angle={Math.PI / 2} />
          <Joint config={{ at: [0.15, 0.15, 0], speed: 0.5, amp: 0.12, offset: 2.0 }}>
            <StraightPipe length={0.2} radius={0.045} />
          </Joint>
        </Joint>
      </Joint>
    </Joint>
  )
}

/* ──── HARNESS 3: Y-tee wye with AI node ──── */
function Harness3() {
  return (
    <Joint config={{ at: [0, 0, 0], speed: 0.5, amp: 0.2, offset: 1.0 }}>
      <StraightPipe length={0.4} radius={0.045} />
      <Joint config={{ at: [0.25, 0, 0], speed: 0.9, amp: 0.15, offset: 0.0 }}>
        <PipeWye length={0.3} radius={0.045} branchAngle={Math.PI / 4} />
        <Joint config={{ at: [0.1, 0.1, 0], speed: 0.8, amp: 0.2, offset: 1.8 }}>
          <StraightPipe length={0.15} radius={0.035} />
          <Joint config={{ at: [0.1, 0.1, 0], speed: 0.6, amp: 0.1, offset: 2.5 }}>
            <PipeElbow radius={0.1} tubeRadius={0.035} angle={Math.PI / 4} />
          </Joint>
        </Joint>
        <Joint config={{ at: [-0.2, 0, 0], speed: 0.4, amp: 0.1, offset: 0.7 }}>
          <PipeReducer startRadius={0.065} endRadius={0.035} />
        </Joint>
      </Joint>
      <mesh position={[0.35, 0.35, 0]}>
        <octahedronGeometry args={[0.05, 0]} />
        <meshPhysicalMaterial color="#60a5fa" roughness={0.2} metalness={0.6} emissive="#60a5fa" emissiveIntensity={0.5} />
      </mesh>
    </Joint>
  )
}

const HARNESS_CONFIGS = [
  { base: [-1.8, 1.4, -0.3], baseRot: [0.2, 0.3, -0.1], delay: 1.2, speed: 0.18, orbitRadius: 0.4, Cmp: Harness1 },
  { base: [1.6, 0.6, 0.3], baseRot: [-0.1, -0.4, 0.2], delay: 1.5, speed: 0.22, orbitRadius: 0.35, Cmp: Harness2 },
  { base: [-1.0, -0.6, 0.8], baseRot: [0.1, 0.5, -0.1], delay: 1.8, speed: 0.15, orbitRadius: 0.5, Cmp: Harness3 },
]

export default function FloatingElements() {
  return (
    <group name="floating-harnesses">
      {HARNESS_CONFIGS.map((cfg, i) => (
        <OrbitGroup key={i} config={cfg} index={i}>
          <cfg.Cmp />
        </OrbitGroup>
      ))}
    </group>
  )
}
