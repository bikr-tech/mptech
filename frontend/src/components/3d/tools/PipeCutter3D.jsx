export default function PipeCutter3D({ color = '#C0C0C0', metalness = 0.85, roughness = 0.3 }) {
  return (
    <group>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.1, 0.025, 8, 12, Math.PI * 1.5]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[0.06, -0.06, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.15, 0.025, 0.025]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.01, 8]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}
