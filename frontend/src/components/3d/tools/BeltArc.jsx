import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

export default function BeltArc({ beltColor = '#8B4513', metalness = 0.2, roughness = 0.8 }) {
  const beltCurve = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) * Math.PI
      pts.push(new Vector3(Math.cos(t - Math.PI / 2) * 1.8, Math.sin(t - Math.PI / 2) * 1.5 + 1.5, 0))
    }
    return new CatmullRomCurve3(pts)
  }, [])

  return (
    <mesh>
      <tubeGeometry args={[beltCurve, 24, 0.04, 8, false]} />
      <meshStandardMaterial color={beltColor} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}
