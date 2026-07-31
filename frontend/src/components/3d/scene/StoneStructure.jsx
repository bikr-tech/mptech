import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

const TIERS = [
  { y: -0.5, radius: 0.9, height: 0.15, segments: 8 },
  { y: -0.25, radius: 0.75, height: 0.2, segments: 8 },
  { y: 0.05, radius: 0.6, height: 0.18, segments: 8 },
  { y: 0.35, radius: 0.5, height: 0.22, segments: 8 },
  { y: 0.7, radius: 0.4, height: 0.16, segments: 8 },
  { y: 1.0, radius: 0.3, height: 0.2, segments: 8 },
  { y: 1.35, radius: 0.2, height: 0.18, segments: 8 },
]

const STONE_COLORS = ['#4a4e52', '#5a5e62', '#3e4246', '#6a6e72', '#4e5256']

function StoneTier({ tier, index }) {
  const ref = useRef(null)
  const color = STONE_COLORS[index % STONE_COLORS.length]

  useGSAP(() => {
    if (ref.current) {
      gsap.from(ref.current.position, { y: -2, duration: 0.6, delay: 0.1 * index, ease: 'back.out(1.7)' })
      gsap.from(ref.current.scale, { x: 0, z: 0, duration: 0.5, delay: 0.1 * index, ease: 'power3.out' })
    }
  }, [])

  return (
    <group ref={ref}>
      <mesh position={[0, tier.y, 0]}>
        <cylinderGeometry args={[tier.radius, tier.radius * 1.05, tier.height, tier.segments]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  )
}

function MakaraSpout() {
  const ref = useRef(null)

  useGSAP(() => {
    if (ref.current) {
      gsap.from(ref.current.position, { y: -1, duration: 0.8, delay: 0.7, ease: 'back.out(1.7)' })
    }
  }, [])

  return (
    <group ref={ref} position={[0.7, 1.5, 0]}>
      <mesh position={[0.15, 0, 0]}>
        <coneGeometry args={[0.18, 0.5, 8]} />
        <meshStandardMaterial color="#5a5e62" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[-0.05, 0.08, 0]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#4a4e52" roughness={0.85} />
      </mesh>
      <mesh position={[0.25, 0.05, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.08, 0.02, 0.06]} />
        <meshStandardMaterial color="#6a6e72" roughness={0.7} />
      </mesh>
      <mesh position={[0.5, -0.05, 0]} rotation={[-0.1, 0, 0.3]}>
        <coneGeometry args={[0.06, 0.15, 6]} />
        <meshStandardMaterial color="#5a5e62" roughness={0.8} />
      </mesh>
    </group>
  )
}

function NagaMotifs() {
  const ref = useRef(null)

  useGSAP(() => {
    if (ref.current) {
      gsap.from(ref.current.children, { opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.8, ease: 'power2.out' })
    }
  }, [])

  const coils = useMemo(() => {
    const result = []
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2
      for (let j = 0; j < 4; j++) {
        const r = 0.15 + j * 0.08
        result.push({
          x: Math.cos(angle) * 0.6,
          z: Math.sin(angle) * 0.6,
          y: 1.1 + j * 0.15,
          radius: r,
        })
      }
    }
    return result
  }, [])

  return (
    <group ref={ref}>
      {coils.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} rotation={[Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3]}>
          <torusGeometry args={[c.radius, 0.02, 6, 8]} />
          <meshStandardMaterial color="#6a6e72" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function Basin() {
  const ref = useRef(null)

  useGSAP(() => {
    if (ref.current) {
      gsap.from(ref.current.position, { y: -2, duration: 0.7, delay: 0.4, ease: 'back.out(1.7)' })
    }
  }, [])

  return (
    <group ref={ref} position={[0, -0.85, 0]}>
      <mesh>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 32]} />
        <meshStandardMaterial color="#3e4246" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.0, 1.05, 0.04, 32]} />
        <meshStandardMaterial color="#2a2e32" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.25, 1.3, 0.06, 32]} />
        <meshStandardMaterial color="#4a4e52" roughness={0.9} />
      </mesh>
    </group>
  )
}

export default function StoneStructure() {
  return (
    <group>
      {TIERS.map((tier, i) => (
        <StoneTier key={i} tier={tier} index={i} />
      ))}
      <MakaraSpout />
      <NagaMotifs />
      <Basin />
    </group>
  )
}
