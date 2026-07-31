export default function Plunger3D({ color = '#C0C0C0', metalness = 0.3, roughness = 0.6 }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#4a3728" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d32f2f" metalness={0} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.05, 12]} />
        <meshStandardMaterial color="#d32f2f" metalness={0} roughness={0.9} />
      </mesh>
    </group>
  )
}
