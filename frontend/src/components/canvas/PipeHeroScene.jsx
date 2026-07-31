import { useMemo, useEffect, useRef } from 'react'
const _cw = console.warn; console.warn = (m, ...a) => { if (`${m}`.includes('THREE.Clock')) return; _cw(m, ...a) }
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CatmullRomCurve3, Vector3, Color } from 'three'
import { createWaterFlowShader } from './WaterFlowShader'

gsap.registerPlugin(ScrollTrigger)

const FIXTURE_DEFAULTS = {
  toilet: { visible: true },
  sink: { visible: true },
  bathtub: { visible: true },
  shower: { visible: true },
  water_heater: { visible: true },
  pipes: { visible: true },
}

const DEFAULTS = {
  sceneType: 'home',
  pipeColor: '#00aaff', waterFlowSpeed: 0.3, pipeCount: 2,
  curvature: 0.3, metalness: 0.6, roughness: 0.4,
  floatIntensity: 0.1, ambientIntensity: 0.5,
  pipeRadius: 0.15, cameraZ: 8, cameraY: 1.5,
  fixtures: { ...FIXTURE_DEFAULTS },
}

function useFixtureAnimation(ref, delay = 0) {
  useGSAP(() => {
    gsap.from(ref.current.position, {
      y: -1, duration: 0.8, delay,
      ease: 'back.out(1.7)', scrollTrigger: { trigger: '.hero-section', start: 'top top' },
    })
  }, [])
}

/* ──── FIXTURE: Toilet ──── */
function ToiletFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.1)
  if (!visible) return null
  return (
    <group ref={ref} position={[1.5, -1.5, 1.2]}>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.45, 0.3, 0.4]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0.1, 0.3, 0]}><cylinderGeometry args={[0.2, 0.15, 0.15, 16]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0.1, 0.38, 0]}><torusGeometry args={[0.18, 0.03, 8, 16]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
      <mesh position={[-0.15, 0.5, 0]}><boxGeometry args={[0.3, 0.45, 0.25]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[-0.3, 0.5, 0]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0.1, -0.8, 0]}><cylinderGeometry args={[0.06, 0.08, 0.7, 8]} /><meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} /></mesh>
    </group>
  )
}

/* ──── FIXTURE: Sink ──── */
function SinkFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.2)
  if (!visible) return null
  return (
    <group ref={ref} position={[-1.5, -1.5, 1.5]}>
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.7, 0.08, 0.5]} /><meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.3} /></mesh>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.5, 0.05, 0.3]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh position={[0, 0.45, 0.1]}><cylinderGeometry args={[0.03, 0.04, 0.18, 8]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.05} /></mesh>
      <mesh position={[0, 0.55, 0.15]}><torusGeometry args={[0.05, 0.015, 8, 12]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.05} /></mesh>
      <mesh position={[0, 0.35, -0.1]}><cylinderGeometry args={[0.04, 0.04, 0.02, 8]} /><meshStandardMaterial color="#475569" /></mesh>
      <mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.04, 0.05, 0.6, 8]} /><meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.025, 8, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/* ──── FIXTURE: Bathtub ──── */
function BathtubFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.3)
  if (!visible) return null
  return (
    <group ref={ref} position={[0, -1.5, -1.5]}>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[1.8, 0.3, 0.85]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 0.25, 0]}><boxGeometry args={[1.6, 0.04, 0.65]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.7, 0.02, 0.75]} /><meshStandardMaterial color="#e2e8f0" transparent opacity={0.3} /></mesh>
      <mesh position={[0.8, 0.15, 0]}><cylinderGeometry args={[0.04, 0.05, 0.2, 8]} /><meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.1} /></mesh>
      <mesh position={[0.8, 0.25, 0]}><torusGeometry args={[0.06, 0.02, 8, 12]} /><meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.1} /></mesh>
      <mesh position={[0.3, -0.5, 0]}><cylinderGeometry args={[0.05, 0.06, 0.8, 8]} /><meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} /></mesh>
    </group>
  )
}

/* ──── FIXTURE: Shower ──── */
function ShowerFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.4)
  if (!visible) return null
  return (
    <group ref={ref} position={[1.5, -1.5, -1.5]}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.015, 0.02, 1.2, 6]} /><meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.2} /></mesh>
      <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.1, 0.15, 0.04, 16]} /><meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.1} /></mesh>
      <mesh position={[0, 1.76, 0]}><cylinderGeometry args={[0.12, 0.16, 0.02, 16]} /><meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[-0.05, 1.3, 0]}><boxGeometry args={[0.02, 0.3, 0.02]} /><meshStandardMaterial color="#94a3b8" /></mesh>
    </group>
  )
}

/* ──── FIXTURE: Water Heater ──── */
function WaterHeaterFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.5)
  if (!visible) return null
  return (
    <group ref={ref} position={[-2.2, -1.5, -1.8]}>
      <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.3, 0.3, 1.2, 16]} /><meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.33, 0.33, 0.05, 16]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.33, 0.33, 0.05, 16]} /><meshStandardMaterial color="#475569" /></mesh>
      <mesh position={[0.32, 0.6, 0]}><cylinderGeometry args={[0.025, 0.025, 0.3, 6]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#dc2626" metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0, 0.6, 0.32]}><cylinderGeometry args={[0.025, 0.025, 0.3, 6]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.15, 0.08, 0.15]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </group>
  )
}

/* ──── FIXTURE: Plumbing Pipes ──── */
function PlumbingPipes({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.6)
  if (!visible) return null
  return (
    <group ref={ref}>
      <mesh position={[-0.5, -2.3, 0.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 5, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
      {[-2, -1, 0, 1, 2].map((x) => (
        <mesh key={x} position={[x + 0.5, -2.3, 0.5]}>
          <torusGeometry args={[0.1, 0.025, 8, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.8, -1.5, 2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 4.5, 6]} />
        <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0.2, -1.5, 2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 4.5, 6]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.3} />
      </mesh>
      {[[-1.5, -0.5, 1.5], [1.5, -0.5, 1.2], [0, -0.5, -1.5]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]}>
          <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
          <meshStandardMaterial color={i === 0 ? '#3b82f6' : '#64748b'} metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/* ──── SCENE: Home (Isometric cross-section) ──── */
function HomeScene({ sceneConfig }) {
  const cfg = { ...DEFAULTS, ...sceneConfig }
  const fx = { ...FIXTURE_DEFAULTS, ...cfg.fixtures }

  return (
    <group>
      <mesh position={[0, -1.5, 0]}><boxGeometry args={[6, 0.15, 6]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[-3, 0, 0]}><boxGeometry args={[0.12, 3, 6]} /><meshStandardMaterial color="#475569" /></mesh>
      <mesh position={[0, 0, -3]}><boxGeometry args={[6, 3, 0.12]} /><meshStandardMaterial color="#475569" /></mesh>
      <gridHelper args={[5.8, 8, '#475569', '#1e293b']} position={[0, -1.42, 0]} />
      <mesh position={[0.5, -0.3, -1.5]}><boxGeometry args={[0.08, 1.4, 2.5]} /><meshStandardMaterial color="#64748b" transparent opacity={0.5} /></mesh>

      <ToiletFixture visible={fx.toilet?.visible ?? true} />
      <SinkFixture visible={fx.sink?.visible ?? true} />
      <BathtubFixture visible={fx.bathtub?.visible ?? true} />
      <ShowerFixture visible={fx.shower?.visible ?? true} />
      <WaterHeaterFixture visible={fx.water_heater?.visible ?? true} />
      <PlumbingPipes visible={fx.pipes?.visible ?? true} />
    </group>
  )
}

/* ──── INDUSTRIAL: Fixture components ──── */
function BoilerFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.1)
  if (!visible) return null
  return (
    <group ref={ref} position={[-2.5, -1.2, -1]}>
      <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.7, 0.7, 1.4, 20]} /><meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.75, 0.75, 0.06, 20]} /><meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.75, 0.75, 0.06, 20]} /><meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} /></mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.65, 0, Math.sin(i * Math.PI / 3) * 0.65]}>
          <sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.06, 0.06, 0.4, 8]} /><meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  )
}

function GaugeFixture({ visible }) {
  const ref = useRef(null)
  const needleRef = useRef(null)
  useFixtureAnimation(ref, 0.2)
  useFrame((state) => {
    if (needleRef.current) needleRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.3 + 0.5
  })
  if (!visible) return null
  return (
    <group ref={ref} position={[1.8, -0.2, -2.3]}>
      <mesh><cylinderGeometry args={[0.22, 0.22, 0.05, 20]} /><meshStandardMaterial color="#b45309" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 0.03, 0]}><circleGeometry args={[0.18, 20]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 0.03, 0]}><circleGeometry args={[0.14, 20]} /><meshStandardMaterial color="#1e293b" /></mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = -0.8 + i * 0.4
        return <mesh key={i} position={[Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.04]}><boxGeometry args={[0.015, 0.005, 0.01]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      })}
      <mesh ref={needleRef} position={[0, 0.03, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.08, 0.005, 0.01]} /><meshStandardMaterial color="#dc2626" />
      </mesh>
    </group>
  )
}

function ValveFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.3)
  if (!visible) return null
  return (
    <group ref={ref} position={[2.8, -0.8, -2.3]}>
      <mesh><cylinderGeometry args={[0.05, 0.05, 0.5, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.25, 0.04, 8, 20]} /><meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.4} /></mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = i * Math.PI / 2
        return <mesh key={i} position={[Math.cos(a) * 0.22, 0.3, Math.sin(a) * 0.22]}><boxGeometry args={[0.04, 0.06, 0.04]} /><meshStandardMaterial color="#92400e" /></mesh>
      })}
    </group>
  )
}

function IndustrialPipeFixtures({ visible, cfg }) {
  const pipes = buildIndustrialPipes(cfg.pipeCount)
  return <PipeGroup curves={pipes} cfg={cfg} visible={visible} />
}

/* ──── SCENE: Industrial ──── */
function IndustrialScene({ sceneConfig }) {
  const cfg = { ...DEFAULTS, ...sceneConfig }
  const fx = { ...FIXTURE_DEFAULTS, ...cfg.fixtures }
  const groupRef = useRef(null)

  useGSAP(() => {
    gsap.from(groupRef.current.position, { y: -2, duration: 1, ease: 'power3.out' })
  }, [])

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.5, -3]}><boxGeometry args={[10, 4, 0.3]} /><meshStandardMaterial color="#8B4513" roughness={0.9} /></mesh>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[(-4.5 + (i % 10) * 1), (-1.5 + Math.floor(i / 10) * 1.2), -2.85]}>
          <boxGeometry args={[0.9, 0.5, 0.05]} /><meshStandardMaterial color="#A0522D" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.5, -2.8]}><boxGeometry args={[9, 0.15, 0.2]} /><meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} /></mesh>
      <mesh position={[0, -1.5, 0]}><boxGeometry args={[8, 0.15, 5]} /><meshStandardMaterial color="#3a3f47" roughness={0.9} /></mesh>
      {[-3, -1, 1, 3].map((x) => (
        <group key={x} position={[x, 0, -2.7]}>
          <mesh><cylinderGeometry args={[0.12, 0.12, 0.04, 12]} /><meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, 0, 0.03]}><cylinderGeometry args={[0.08, 0.08, 0.02, 12]} /><meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} /></mesh>
        </group>
      ))}
      <BoilerFixture visible={fx.boiler?.visible ?? true} />
      <GaugeFixture visible={fx.gauge?.visible ?? true} />
      <ValveFixture visible={fx.valve?.visible ?? true} />
      <IndustrialPipeFixtures visible={fx.pipes?.visible ?? true} cfg={cfg} />
    </group>
  )
}

function buildIndustrialPipes(count) {
  const p = [
    [new Vector3(-4, -1.5, -1), new Vector3(-2.5, -0.8, -0.5), new Vector3(-1, 0, 0), new Vector3(0.5, 0.8, 0.5)],
    [new Vector3(-3, -1.5, 0.5), new Vector3(-1.5, -0.5, 1), new Vector3(0, 0.2, 1.5), new Vector3(2, 0.5, 1.8)],
    [new Vector3(-1, 1, -1), new Vector3(0.5, 1, -0.5), new Vector3(1.5, 1, 0), new Vector3(3, 1, 0.5)],
  ]
  for (let i = 0; i < count; i++) {
    p.push([new Vector3(-3 + i * 1.2, -1.5, -1.5), new Vector3(-2 + i * 1.2, -0.2, -1), new Vector3(-1 + i * 1.2, 0.6, -0.5), new Vector3(0 + i * 1.2, 1.2, 0)])
  }
  return p
}

/* ──── LUXURY: Fixture components ──── */
function FaucetFixture({ visible }) {
  const ref = useRef(null)
  const dripRef = useRef(null)
  useFixtureAnimation(ref, 0.1)
  useFrame((state) => {
    if (dripRef.current) {
      const t = state.clock.getElapsedTime()
      dripRef.current.position.y = -0.2 - Math.abs(Math.sin(t * 1.5)) * 0.15
      dripRef.current.scale.setScalar(0.5 + Math.abs(Math.sin(t * 1.5)) * 0.5)
    }
  })
  if (!visible) return null
  return (
    <group ref={ref}>
      <mesh position={[0, -0.78, -1.8]}><boxGeometry args={[0.5, 0.04, 0.35]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <group position={[0, -0.55, -1.75]}>
        <mesh><cylinderGeometry args={[0.025, 0.035, 0.25, 10]} /><meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.02} /></mesh>
        <mesh position={[0, 0.18, 0.12]} rotation={[0.3, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.08, 8]} /><meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.02} /></mesh>
        <mesh position={[0, 0.22, 0.15]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.02} /></mesh>
        <mesh position={[0.08, 0.2, 0]}><boxGeometry args={[0.06, 0.01, 0.025]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.02} /></mesh>
      </group>
      <mesh ref={dripRef} position={[0, -0.25, -1.8]}>
        <sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#93c5fd" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function MirrorFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.2)
  if (!visible) return null
  return (
    <group ref={ref}>
      <mesh position={[0, 0.6, -2.68]}><boxGeometry args={[1.45, 0.95, 0.02]} /><meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0.6, -2.7]}><boxGeometry args={[1.4, 0.9, 0.04]} /><meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} /></mesh>
      <mesh position={[0, 0.6, -2.74]}><boxGeometry args={[1.3, 0.8, 0.02]} /><meshStandardMaterial color="#f1f5f9" metalness={0.3} roughness={0.1} transparent opacity={0.6} emissive="#f8fafc" emissiveIntensity={0.1} /></mesh>
      <mesh position={[0.5, 0.9, -2.6]}><octahedronGeometry args={[0.05]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} /></mesh>
      <mesh position={[-0.5, 0.9, -2.6]}><octahedronGeometry args={[0.04]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} /></mesh>
    </group>
  )
}

function CabinetFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.3)
  if (!visible) return null
  return (
    <group ref={ref}>
      <mesh position={[0, -0.9, -1.8]}><boxGeometry args={[1.2, 0.08, 0.5]} /><meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.2} /></mesh>
      <mesh position={[0, -1.05, -1.8]}><boxGeometry args={[1.1, 0.25, 0.45]} /><meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.4} /></mesh>
      <mesh position={[0.3, -1.05, -1.55]}><boxGeometry args={[0.08, 0.015, 0.01]} /><meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[-0.3, -1.05, -1.55]}><boxGeometry args={[0.08, 0.015, 0.01]} /><meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} /></mesh>
    </group>
  )
}

function TowelFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.4)
  if (!visible) return null
  return (
    <group ref={ref} position={[-0.8, -0.4, -2.7]}>
      <mesh><cylinderGeometry args={[0.015, 0.015, 0.8, 8]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[0.4, -0.15, 0]}><boxGeometry args={[0.35, 0.3, 0.01]} /><meshStandardMaterial color="#f1f5f9" roughness={0.8} /></mesh>
    </group>
  )
}

/* ──── SCENE: Luxury ──── */
function LuxuryScene({ sceneConfig }) {
  const cfg = { ...DEFAULTS, ...sceneConfig }
  const fx = { ...FIXTURE_DEFAULTS, ...cfg.fixtures }
  const pipes = buildLuxuryPipes(cfg.pipeCount)
  const groupRef = useRef(null)

  useGSAP(() => {
    gsap.from(groupRef.current.position, { y: -2, duration: 1, ease: 'power3.out' })
  }, [])

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.5, -2.8]}><boxGeometry args={[8, 3, 0.2]} /><meshStandardMaterial color="#f3e8d6" metalness={0.2} roughness={0.1} /></mesh>
      <mesh position={[0, -1.5, 0]}><boxGeometry args={[8, 0.15, 4]} /><meshStandardMaterial color="#e8ddd0" metalness={0.1} roughness={0.2} /></mesh>
      <gridHelper args={[7, 14, '#d4c5a9', '#e8ddd0']} position={[0, -1.42, 0]} />
      <FaucetFixture visible={fx.faucet?.visible ?? true} />
      <MirrorFixture visible={fx.mirror?.visible ?? true} />
      <CabinetFixture visible={fx.cabinet?.visible ?? true} />
      <TowelFixture visible={fx.towel?.visible ?? true} />
      <PipeGroup curves={pipes} cfg={cfg} visible={fx.pipes?.visible ?? true} />
    </group>
  )
}

function buildLuxuryPipes(count) {
  const p = [
    [new Vector3(-3, -1.2, 0), new Vector3(-1.5, -0.6, 0), new Vector3(0, 0, 0), new Vector3(1.5, 0.6, 0)],
    [new Vector3(-2, -1, 0.5), new Vector3(-0.5, -0.3, 1), new Vector3(1, 0.2, 1.2), new Vector3(2.5, 0.4, 1)],
  ]
  for (let i = 0; i < count; i++) {
    p.push([new Vector3(-2.5 + i, -0.8, -1), new Vector3(-1.5 + i, 0, -0.5), new Vector3(-0.5 + i, 0.5, 0), new Vector3(0.5 + i, 0.8, 0.5)])
  }
  return p
}

/* ──── OUTDOOR: Fixture components ──── */
function SpigotFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.1)
  if (!visible) return null
  return (
    <group ref={ref} position={[-2.45, -0.6, -1.5]}>
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.06, 0.08, 0.2, 10]} /><meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0.15, 0]}><sphereGeometry args={[0.065, 8, 8]} /><meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0.08, 0.05, 0]}><cylinderGeometry args={[0.015, 0.015, 0.12, 6]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0.1, 0.05, 0]}><boxGeometry args={[0.06, 0.04, 0.04]} /><meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0.1, -0.05, 0]}><sphereGeometry args={[0.02, 6, 6]} /><meshStandardMaterial color="#93c5fd" transparent opacity={0.6} /></mesh>
    </group>
  )
}

function HoseFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.2)
  if (!visible) return null
  return (
    <group ref={ref} position={[1.5, -1.4, 1.2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.35, 0.04, 8, 20]} /><meshStandardMaterial color="#16a34a" roughness={0.8} /></mesh>
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.3, 0.04, 8, 20]} /><meshStandardMaterial color="#15803d" roughness={0.8} /></mesh>
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.25, 0.035, 8, 20]} /><meshStandardMaterial color="#16a34a" roughness={0.8} /></mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.04, 0.08, 8]} /><meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  )
}

function SprinklerFixture({ visible }) {
  const ref = useRef(null)
  const sprayRef = useRef(null)
  useFixtureAnimation(ref, 0.3)
  useFrame((state) => {
    if (sprayRef.current) {
      const t = state.clock.getElapsedTime()
      sprayRef.current.children.forEach((drop, i) => {
        const phase = i * 1.2
        drop.position.x = Math.sin(t * 2 + phase) * 0.25
        drop.position.z = Math.cos(t * 2.5 + phase) * 0.15 - 0.1
        drop.position.y = -0.1 - (t * 0.8 + phase) % 1.2 * 0.3
        const s = 0.5 + Math.sin(t * 3 + phase) * 0.3
        drop.scale.setScalar(Math.max(0.2, s))
      })
    }
  })
  if (!visible) return null
  return (
    <group ref={ref}>
      <group position={[-1, -1.3, 1.5]}>
        <mesh><cylinderGeometry args={[0.015, 0.025, 0.15, 6]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      </group>
      <group ref={sprayRef} position={[-1, -1.2, 1.5]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i}><sphereGeometry args={[0.015, 6, 6]} /><meshStandardMaterial color="#93c5fd" transparent opacity={0.5} /></mesh>
        ))}
      </group>
    </group>
  )
}

function PlantFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.4)
  if (!visible) return null
  return (
    <group ref={ref} position={[2.8, -1.5, -1.2]}>
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.15, 0.12, 0.3, 10]} /><meshStandardMaterial color="#a16207" roughness={0.9} /></mesh>
      <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color="#22c55e" roughness={0.8} /></mesh>
      <mesh position={[0.06, 0.45, 0.05]}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#4ade80" roughness={0.8} /></mesh>
    </group>
  )
}

function FenceFixture({ visible }) {
  const ref = useRef(null)
  useFixtureAnimation(ref, 0.5)
  if (!visible) return null
  return (
    <group ref={ref}>
      {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
        <mesh key={x} position={[x, -1.35, -1.95]}><boxGeometry args={[0.03, 0.25, 0.03]} /><meshStandardMaterial color="#a16207" roughness={0.8} /></mesh>
      ))}
    </group>
  )
}

/* ──── SCENE: Outdoor ──── */
function OutdoorScene({ sceneConfig }) {
  const cfg = { ...DEFAULTS, ...sceneConfig }
  const fx = { ...FIXTURE_DEFAULTS, ...cfg.fixtures }
  const pipes = buildOutdoorPipes(cfg.pipeCount)
  const groupRef = useRef(null)

  useGSAP(() => {
    gsap.from(groupRef.current.position, { y: -2, duration: 1, ease: 'power3.out' })
  }, [])

  return (
    <group ref={groupRef}>
      <mesh position={[0, -1.5, 0]}><boxGeometry args={[8, 0.08, 4]} /><meshStandardMaterial color="#4a7c3f" roughness={0.9} /></mesh>
      <mesh position={[0, -1.56, 0]}><boxGeometry args={[8, 0.08, 4]} /><meshStandardMaterial color="#5c4033" roughness={1} /></mesh>
      <mesh position={[0, -1.45, 1]}><boxGeometry args={[1.2, 0.02, 0.4]} /><meshStandardMaterial color="#3d2b1f" roughness={1} /></mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const x = -3 + i * 0.55
        return <mesh key={i} position={[x, -1.4, -1.2 + Math.sin(i * 2) * 0.8]} rotation={[0.1, Math.sin(i), 0.1]}><boxGeometry args={[0.01, 0.12 + Math.sin(i) * 0.04, 0.01]} /><meshStandardMaterial color={i % 2 === 0 ? '#4ade80' : '#22c55e'} roughness={0.8} /></mesh>
      })}
      <mesh position={[-2.5, 0, -2]}><boxGeometry args={[0.12, 3, 3]} /><meshStandardMaterial color="#92400e" roughness={0.8} /></mesh>
      <SpigotFixture visible={fx.spigot?.visible ?? true} />
      <HoseFixture visible={fx.hose?.visible ?? true} />
      <SprinklerFixture visible={fx.sprinkler?.visible ?? true} />
      <PlantFixture visible={fx.plant?.visible ?? true} />
      <FenceFixture visible={fx.fence?.visible ?? true} />
      <mesh position={[3.2, -1.45, -0.5]}><sphereGeometry args={[0.08, 6, 6]} /><meshStandardMaterial color="#78716c" roughness={0.9} /></mesh>
      <mesh position={[-2.8, -1.48, 1.8]}><sphereGeometry args={[0.06, 6, 6]} /><meshStandardMaterial color="#78716c" roughness={0.9} /></mesh>
      <mesh position={[2, -1.46, -1.8]}><dodecahedronGeometry args={[0.07]} /><meshStandardMaterial color="#57534e" roughness={0.9} /></mesh>
      <PipeGroup curves={pipes} cfg={cfg} visible={fx.pipes?.visible ?? true} />
    </group>
  )
}

function buildOutdoorPipes(count) {
  const p = [
    [new Vector3(-4, -1.2, 0), new Vector3(-2.8, -1.0, -0.3), new Vector3(-1.5, -0.8, 0.2), new Vector3(0, -0.6, 0.5)],
    [new Vector3(0, -0.6, 0.5), new Vector3(1, -0.7, 1), new Vector3(2, -0.9, 1.3), new Vector3(3, -1.0, 1.5)],
    [new Vector3(-1.5, -0.8, 0.2), new Vector3(-1, -0.9, 1), new Vector3(-0.5, -1.0, 1.5), new Vector3(0, -1.1, 1.8)],
  ]
  for (let i = 0; i < count; i++) {
    p.push([new Vector3(-3 + i * 1.2, -0.5, -1), new Vector3(-2 + i * 1.2, -0.3, 0), new Vector3(-1 + i * 1.2, -0.1, 0.5), new Vector3(0 + i * 1.2, 0, 1)])
  }
  return p
}

/* ──── Shared pipe geometry ──── */
function PipeGroup({ curves, cfg, visible = true }) {
  if (!visible) return null
  const cc = curves.map((pts) => new CatmullRomCurve3(pts))
  const materials = useMemo(() => cc.map(() =>
    createWaterFlowShader({ color: cfg.pipeColor, speed: cfg.waterFlowSpeed })
  ), [cc.length, cfg.pipeColor, cfg.waterFlowSpeed])

  useEffect(() => {
    materials.forEach((m) => {
      m.uniforms.uSpeed.value = cfg.waterFlowSpeed
      m.uniforms.uColor.value = new Color(cfg.pipeColor)
    })
  }, [cfg.waterFlowSpeed, cfg.pipeColor])

  useFrame((state) => {
    materials.forEach((m) => { if (m.uniforms) m.uniforms.uTime.value = state.clock.getElapsedTime() })
  })

  return (
    <group>
      {cc.map((curve, i) => (
        <group key={i}>
          <mesh>
            <tubeGeometry args={[curve, 32, cfg.pipeRadius, 8, false]} />
            <meshStandardMaterial metalness={cfg.metalness} roughness={cfg.roughness} color="#8899aa" transparent opacity={0.25} />
          </mesh>
          <mesh>
            <tubeGeometry args={[curve, 32, cfg.pipeRadius * 0.7, 8, false]} />
            <primitive object={materials[i]} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ──── Scene switcher ──── */
function SceneContent({ sceneConfig }) {
  const cfg = { ...DEFAULTS, ...sceneConfig }
  const { camera } = useThree()

  useEffect(() => {
    if (cfg.sceneType === 'home') {
      camera.position.set(4.5, 3.5, 4.5)
      camera.lookAt(0, -0.5, 0)
    } else {
      camera.position.set(0, cfg.cameraY, cfg.cameraZ)
      camera.lookAt(0, 0, 0)
    }
  }, [cfg.sceneType, cfg.cameraZ, cfg.cameraY])

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: '.hero-section', start: 'top top', end: 'bottom top',
      onUpdate: (self) => { camera.position.y = cfg.sceneType === 'home' ? 3.5 - self.progress * 1.5 : 1.5 - self.progress * 0.8 },
    })
  }, [])

  const Scene = cfg.sceneType === 'industrial' ? IndustrialScene
    : cfg.sceneType === 'luxury' ? LuxuryScene
    : cfg.sceneType === 'outdoor' ? OutdoorScene
    : HomeScene

  return (
    <>
      <ambientLight intensity={cfg.ambientIntensity} />
      <directionalLight position={[8, 10, 6]} intensity={0.8} />
      <pointLight position={[0, 3, 2]} intensity={0.3} color="#fbbf24" />
      <hemisphereLight args={['#88ccff', '#445566', 0.4]} />
      <Float speed={0.2} rotationIntensity={0.005} floatIntensity={cfg.floatIntensity}>
        <Scene sceneConfig={cfg} />
      </Float>
    </>
  )
}

export default function PipeHeroScene({ sceneConfig }) {
  const cfg = { ...DEFAULTS, ...sceneConfig }
  const sceneKey = `${cfg.sceneType}-${cfg.pipeCount}-${cfg.pipeColor}`

  const camCfg = cfg.sceneType === 'home'
    ? { position: [4.5, 3.5, 4.5], fov: 28 }
    : { position: [0, cfg.cameraY, cfg.cameraZ], fov: 40 }

  return (
    <Canvas key={sceneKey} camera={camCfg}>
      <SceneContent sceneConfig={cfg} />
    </Canvas>
  )
}
