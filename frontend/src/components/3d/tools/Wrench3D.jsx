export default function Wrench3D({ color = '#C0C0C0', metalness = 0.85, roughness = 0.3 }) {
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.15, 0.05, 0.08]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[-0.07, 0.33, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.08]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[0.07, 0.33, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.08]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, -0.1 - i * 0.09, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.06, 6]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
      ))}
    </group>
  )
}
