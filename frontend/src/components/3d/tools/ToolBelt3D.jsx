import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import BeltArc from './BeltArc'
import Wrench3D from './Wrench3D'
import Plunger3D from './Plunger3D'
import PipeCutter3D from './PipeCutter3D'
import TapeMeasure3D from './TapeMeasure3D'

const toolComponents = {
  wrench: Wrench3D,
  plunger: Plunger3D,
  pipe_cutter: PipeCutter3D,
  tape_measure: TapeMeasure3D,
}

const toolPositions = [
  { x: -0.9, y: 0.6, z: 0 },
  { x: -0.3, y: 1.2, z: 0 },
  { x: 0.3, y: 1.2, z: 0 },
  { x: 0.9, y: 0.6, z: 0 },
]

const toolNames = ['wrench', 'plunger', 'pipe_cutter', 'tape_measure']

function AnimatedTool({ name, color, motionSpeed, animationStyle, position, index }) {
  const groupRef = useRef(null)
  const phase = useMemo(() => index * Math.PI * 0.5, [index])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime() * motionSpeed
    switch (animationStyle) {
      case 'float':
        groupRef.current.position.y = Math.sin(t * 0.8 + phase) * 0.08
        break
      case 'rotate':
        groupRef.current.rotation.z = Math.sin(t * 0.5 + phase) * 0.3
        break
      case 'bob':
        groupRef.current.position.y = Math.abs(Math.sin(t * 0.6 + phase)) * 0.1
        break
      case 'pulse': {
        const scale = 1 + Math.sin(t * 1.2 + phase) * 0.03
        groupRef.current.scale.setScalar(scale)
        break
      }
      default:
        break
    }
  })

  const Component = toolComponents[name]
  if (!Component) return null

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Component color={color} />
    </group>
  )
}

export default function ToolBelt3D({
  beltColor,
  toolColor,
  position = [0, 0, 0],
  motionSpeed = 1,
  animationStyle = 'float',
  tools,
}) {
  const visibleTools = useMemo(() => {
    return toolNames.filter((name) => tools?.includes(name))
  }, [tools])

  const activePositions = useMemo(() => {
    return toolPositions.slice(0, visibleTools.length)
  }, [visibleTools])

  return (
    <group position={[position[0], position[1], position[2]]}>
      <BeltArc beltColor={beltColor} />
      {visibleTools.map((name, i) => (
        <AnimatedTool
          key={name}
          name={name}
          color={toolColor}
          motionSpeed={motionSpeed}
          animationStyle={animationStyle}
          position={activePositions[i] || { x: 0, y: 0.6, z: 0 }}
          index={i}
        />
      ))}
    </group>
  )
}
