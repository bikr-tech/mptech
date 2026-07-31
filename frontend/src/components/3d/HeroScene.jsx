import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import StoneStructure from './scene/StoneStructure'
import FloatingElements from './scene/FloatingElements'

gsap.registerPlugin(ScrollTrigger)

function SceneContent() {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(2.5, 1.5, 3.5)
    camera.lookAt(0, 0.2, 0)
  }, [])

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: '.hero-section', start: 'top top', end: 'bottom top',
      onUpdate: (self) => { camera.position.y = 1.5 - self.progress * 1.2 },
    })
  }, [])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 4]} intensity={0.6} />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#60a5fa" />
      <pointLight position={[0, 2, 1]} intensity={0.4} color="#fbbf24" />
      <pointLight position={[-2, 0.5, -1]} intensity={0.3} color="#3b82f6" />
      <hemisphereLight args={['#88ccff', '#1e293b', 0.5]} />
      <spotLight position={[0, 3, 2]} angle={0.4} penumbra={0.5} intensity={0.3} color="#fbbf24" />

     
      <FloatingElements />
    </>
  )
}

export default function HeroScene() {
  return (
    <Canvas camera={{ position: [2.5, 1.5, 3.5], fov: 35 }}>
      <SceneContent />
    </Canvas>
  )
}
