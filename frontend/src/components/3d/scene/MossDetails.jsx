import { useRef, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

const MOSS_SPOTS = [
  { pos: [-0.4, -0.35, 0.5], scale: [0.06, 0.03, 0.05], rot: [0.2, 0.5, 0.1] },
  { pos: [0.6, -0.2, -0.3], scale: [0.08, 0.025, 0.06], rot: [-0.1, 0.8, 0.3] },
  { pos: [-0.5, 0.0, -0.4], scale: [0.05, 0.02, 0.04], rot: [0.3, 1.2, -0.2] },
  { pos: [0.3, 0.15, 0.5], scale: [0.07, 0.03, 0.05], rot: [0.1, -0.3, 0.4] },
  { pos: [-0.2, -0.5, -0.5], scale: [0.09, 0.03, 0.07], rot: [-0.2, 0.6, 0.1] },
  { pos: [0.5, 0.25, -0.2], scale: [0.04, 0.02, 0.04], rot: [0.4, 0.0, -0.3] },
  { pos: [-0.6, -0.1, 0.2], scale: [0.06, 0.025, 0.05], rot: [0.0, 0.9, 0.2] },
  { pos: [0.2, 0.5, 0.3], scale: [0.05, 0.02, 0.04], rot: [0.1, 1.5, 0.0] },
  { pos: [-0.3, 0.4, -0.3], scale: [0.07, 0.03, 0.06], rot: [-0.3, 0.2, 0.3] },
  { pos: [0.1, -0.4, 0.4], scale: [0.05, 0.02, 0.04], rot: [0.2, -0.5, -0.1] },
]

function MossPatch({ spot, index }) {
  const ref = useRef(null)

  useGSAP(() => {
    if (ref.current) {
      gsap.from(ref.current.scale, { x: 0, y: 0, z: 0, duration: 0.4, delay: 1.0 + index * 0.06, ease: 'back.out(2)' })
    }
  }, [])

  return (
    <mesh ref={ref} position={spot.pos} rotation={spot.rot} scale={spot.scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={index % 2 === 0 ? '#3a5a2a' : '#4a6a3a'} roughness={0.9} />
    </mesh>
  )
}

export default function MossDetails() {
  return (
    <group>
      {MOSS_SPOTS.map((spot, i) => (
        <MossPatch key={i} spot={spot} index={i} />
      ))}
    </group>
  )
}
