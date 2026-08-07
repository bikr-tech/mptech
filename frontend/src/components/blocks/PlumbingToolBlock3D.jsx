import { Canvas } from '@react-three/fiber'
import ToolBelt3D from '../3d/tools/ToolBelt3D'

export default function PlumbingToolBlock3D({ content }) {
  const {
    enabled = true,
    title = 'Tools We Use',
    subtitle = 'Professional-grade equipment',
    beltColor = '#8B4513',
    toolColor = '#C0C0C0',
    positionX = 0,
    positionY = 0,
    positionZ = 0,
    motionSpeed = 1.0,
    animationStyle = 'float',
    tools = ['wrench', 'plunger', 'pipe_cutter', 'tape_measure'],
  } = content || {}

  if (!enabled) return null

  return (
    <section className="relative w-full py-20 overflow-hidden bg-luminous">
      <div className="container mx-auto px-4 text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">{title}</h2>
        <p className="text-xl text-white/70">{subtitle}</p>
      </div>
      <div className="h-[500px] w-full">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-3, 2, 3]} intensity={0.4} color="#fbbf24" />
          <ToolBelt3D
            beltColor={beltColor}
            toolColor={toolColor}
            position={[positionX, positionY, positionZ]}
            motionSpeed={motionSpeed}
            animationStyle={animationStyle}
            tools={tools}
          />
        </Canvas>
      </div>
    </section>
  )
}
