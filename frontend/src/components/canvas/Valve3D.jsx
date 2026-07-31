import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

function ValveWheel({ onValveToggle, valveOpen }) {
  const groupRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [targetRotation, setTargetRotation] = useState(0)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z += (targetRotation - groupRef.current.rotation.z) * 0.08
    }
  })

  function handleClick() {
    const newOpen = !valveOpen
    const newRot = newOpen ? Math.PI * 3 : 0
    gsap.to(groupRef.current.rotation, { z: newRot, duration: 1.2, ease: 'power2.out' })
    setTargetRotation(newRot)
    onValveToggle(newOpen)
  }

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.12, 16, 32]} />
        <meshStandardMaterial
          color={hovered ? '#fbbf24' : '#b45309'}
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0, 0]} rotation={[0, 0, (i * Math.PI) / 2]}>
          <boxGeometry args={[0.1, 1.8, 0.1]} />
          <meshStandardMaterial color="#78350f" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.8, 12]} />
        <meshStandardMaterial color="#451a03" metalness={0.5} roughness={0.6} />
      </mesh>
      {hovered && (
        <Html distanceFactor={3}>
          <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {valveOpen ? 'Close Valve' : 'Open Valve'}
          </div>
        </Html>
      )}
    </group>
  )
}

function ValveScene({ onValveToggle, valveOpen }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      <pointLight position={[-2, 1, 2]} intensity={0.5} color="#fbbf24" />
      <ValveWheel onValveToggle={onValveToggle} valveOpen={valveOpen} />
    </>
  )
}

export default function Valve3D({ onValveToggle, valveOpen }) {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
      <ValveScene onValveToggle={onValveToggle} valveOpen={valveOpen} />
    </Canvas>
  )
}
