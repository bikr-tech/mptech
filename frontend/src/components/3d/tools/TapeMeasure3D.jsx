export default function TapeMeasure3D({ color = '#C0C0C0', metalness = 0.3, roughness = 0.5 }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.04]} />
        <meshStandardMaterial color="#f5c842" metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.06, 0.002, 0.025]} />
        <meshStandardMaterial color="#f5c842" metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  )
}
