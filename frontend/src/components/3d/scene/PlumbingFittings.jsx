/* ──── 90° & 45° Pipe Elbow ──── */
export function PipeElbow({ position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.2, tubeRadius = 0.06, angle = Math.PI / 2 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[radius, tubeRadius, 12, 12, angle]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
      </mesh>
      {[...Array(2)].map((_, i) => {
        const a = i === 0 ? 0 : angle
        const flarePos = [Math.cos(a) * radius, 0, Math.sin(a) * -radius]
        return (
          <group key={i} position={[flarePos[0], 0, flarePos[2]]} rotation={[0, 0, i === 0 ? -Math.PI / 2 + angle : Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[tubeRadius * 1.3, tubeRadius * 1.5, 0.025, 12]} />
              <meshPhysicalMaterial color="#94a3b8" roughness={0.35} metalness={0.75} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[tubeRadius * 0.9, tubeRadius * 0.9, 0.04, 12]} />
              <meshPhysicalMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ──── Sanitary Tee ──── */
export function PipeTee({ position = [0, 0, 0], rotation = [0, 0, 0], length = 0.5, branchLength = 0.15, radius = 0.06 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position={[0, branchLength / 2, 0]}>
        <cylinderGeometry args={[radius, radius, branchLength, 12]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position={[0, (branchLength + 0.01) / 2, 0]}>
        <cylinderGeometry args={[radius * 1.2, radius * 1.4, 0.025, 12]} />
        <meshPhysicalMaterial color="#94a3b8" roughness={0.35} metalness={0.75} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 1.3, radius * 1.5, 0.025, 12]} />
          <meshPhysicalMaterial color="#94a3b8" roughness={0.35} metalness={0.75} />
        </mesh>
      ))}
    </group>
  )
}

/* ──── Y-Tee Wye ──── */
export function PipeWye({ position = [0, 0, 0], rotation = [0, 0, 0], length = 0.5, radius = 0.06, branchAngle = Math.PI / 4 }) {
  const bl = 0.2
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position={[Math.sin(branchAngle) * bl * 0.5, Math.cos(branchAngle) * bl * 0.5, 0]}
        rotation={[0, 0, Math.PI / 2 - branchAngle]}>
        <cylinderGeometry args={[radius * 0.9, radius * 0.9, bl, 12]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
      </mesh>
    </group>
  )
}

/* ──── Socket Hub / Coupling ──── */
export function PipeSocket({ position = [0, 0, 0], rotation = [0, 0, 0], length = 0.12, radius = 0.088 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshPhysicalMaterial color="#94a3b8" roughness={0.35} metalness={0.75} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * length / 2.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 1.2, radius * 1.25, 0.02, 12]} />
          <meshPhysicalMaterial color="#64748b" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

/* ──── Reducer Coupling ──── */
export function PipeReducer({ position = [0, 0, 0], rotation = [0, 0, 0], length = 0.15, startRadius = 0.08, endRadius = 0.05 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[startRadius, endRadius, length, 12, 1, true]} />
        <meshPhysicalMaterial color="#94a3b8" roughness={0.35} metalness={0.75} side={2} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[startRadius, endRadius, length, 12]} />
        <meshPhysicalMaterial color="#94a3b8" roughness={0.35} metalness={0.75} transparent opacity={0.5} />
      </mesh>
      {[-1, 1].map((s, i) => {
        const r = i === 0 ? startRadius : endRadius
        return (
          <mesh key={i} position={[s * length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[r * 1.3, r * 1.35, 0.02, 12]} />
            <meshPhysicalMaterial color="#64748b" roughness={0.4} metalness={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
