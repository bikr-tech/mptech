import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function GaugeFace({ pressure }) {
  const needleRef = useRef(null)
  const targetAngle = useRef(0)

  const tickMarks = useMemo(() => {
    const ticks = []
    for (let i = 0; i <= 10; i++) {
      const angle = (i / 10) * Math.PI * 1.5 - Math.PI * 0.75
      const r1 = 1.1
      const r2 = i % 2 === 0 ? 1.3 : 1.2
      ticks.push({
        angle,
        x1: Math.cos(angle) * r1,
        y1: Math.sin(angle) * r1,
        x2: Math.cos(angle) * r2,
        y2: Math.sin(angle) * r2,
        label: i * 10,
      })
    }
    return ticks
  }, [])

  useFrame(() => {
    if (needleRef.current) {
      targetAngle.current += (pressure * 1.35 - Math.PI * 0.75 - targetAngle.current) * 0.1
      needleRef.current.rotation.z = targetAngle.current
    }
  })

  return (
    <group rotation={[0, 0, 0]}>
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[1.35, 1.5, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>
      {tickMarks.map((tick, i) => (
        <group key={i}>
          <mesh position={[(tick.x1 + tick.x2) / 2, (tick.y1 + tick.y2) / 2, 0.01]}>
            <boxGeometry args={[0.04, 0.15, 0.02]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
        </group>
      ))}
      <group ref={needleRef} position={[0, 0, 0.01]}>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[1.1, 0.04, 0.02]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh>
          <circleGeometry args={[0.1, 12]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  )
}

function GaugeScene({ pressure }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} intensity={0.8} />
      <GaugeFace pressure={pressure} />
    </>
  )
}

export default function Gauge3D({ pressure = 0 }) {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 35 }}>
      <GaugeScene pressure={pressure} />
    </Canvas>
  )
}
