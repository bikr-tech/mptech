import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

function WaterStream() {
  const ref = useRef(null)

  useGSAP(() => {
    if (ref.current) gsap.from(ref.current.position, { y: -1, duration: 0.8, delay: 0.9, ease: 'power3.out' })
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        if (child.isMesh) {
          child.position.y = -0.3 + Math.sin(state.clock.getElapsedTime() * 3 + i * 0.5) * 0.02
        }
      })
    }
  })

  const segments = useMemo(() => {
    const result = []
    for (let i = 0; i < 8; i++) {
      const t = i / 7
      result.push({
        position: [0.85 - t * 0.7, 1.25 - t * 2.1, (Math.sin(t * Math.PI * 2) * 0.08)],
        scale: 1 - t * 0.3,
      })
    }
    return result
  }, [])

  return (
    <group ref={ref}>
      {segments.map((s, i) => (
        <mesh key={i} position={s.position} scale={[s.scale, s.scale, s.scale]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.7 - i * 0.07} />
        </mesh>
      ))}
    </group>
  )
}

function RipplePlane() {
  const ref = useRef(null)

  useGSAP(() => {
    if (ref.current) gsap.from(ref.current, { opacity: 0, duration: 1, delay: 1.2, ease: 'power2.out' })
  }, [])

  useFrame((state) => {
    if (ref.current) {
      const pos = ref.current.geometry.attributes.position
      const time = state.clock.getElapsedTime()
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const z = pos.getZ(i)
        const dist = Math.sqrt(x * x + z * z)
        const y = Math.sin(dist * 8 - time * 2) * 0.008 + Math.sin(dist * 12 + time * 1.5) * 0.004
        pos.setY(i, y)
      }
      pos.needsUpdate = true
      ref.current.geometry.computeVertexNormals()
    }
  })

  return (
    <mesh ref={ref} position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.6, 1.6, 24, 24]} />
      <meshStandardMaterial color="#3b82f6" transparent opacity={0.25} roughness={0.1} metalness={0.8} side={2} />
    </mesh>
  )
}

function Droplets() {
  const ref = useRef(null)
  const count = 12

  useGSAP(() => {
    if (ref.current) gsap.from(ref.current.children, { opacity: 0, stagger: 0.05, delay: 1.3, duration: 0.3 })
  }, [])

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime()
      ref.current.children.forEach((child, i) => {
        const phase = i * 1.2
        child.position.y = -0.3 - ((t * 0.6 + phase) % 1.2) * 0.5
        child.position.x = 0.3 + Math.sin(t * 2 + phase) * 0.1
        child.position.z = Math.cos(t * 3 + phase) * 0.05
        const s = 0.5 + Math.sin(t * 4 + phase) * 0.3
        child.scale.setScalar(Math.max(0.3, s))
      })
    }
  })

  return (
    <group ref={ref} position={[0.5, 0.3, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Bubbles() {
  const ref = useRef(null)
  const count = 8

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime()
      ref.current.children.forEach((child, i) => {
        const phase = i * 0.8
        child.position.y = -0.7 + ((t * 0.4 + phase) % 1.0) * 0.5
        child.position.x = Math.sin(t * 1.5 + phase) * 0.2
        child.position.z = Math.cos(t * 1.8 + phase) * 0.15
        const s = 0.3 + Math.sin(t * 2 + phase) * 0.2
        child.scale.setScalar(Math.max(0.2, s))
      })
    }
  })

  return (
    <group ref={ref} position={[0.3, -0.5, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color="#bfdbfe" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

export default function WaterSystem() {
  return (
    <group>
      <WaterStream />
      <RipplePlane />
      <Droplets />
      <Bubbles />
    </group>
  )
}
