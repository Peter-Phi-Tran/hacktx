import * as THREE from 'three'

interface UserConfig {
  income: number
  creditScore: string
  downPayment: number
  monthlyBudget: number
  loanTerm: number
}

interface UserNodeProps {
  userConfig: UserConfig
  isHovered: boolean
  onPointerOver: () => void
  onPointerOut: () => void
  onClick: () => void
}

export const UserNode = ({ 
  userConfig: _userConfig, 
  isHovered, 
  onPointerOver, 
  onPointerOut,
  onClick 
}: UserNodeProps) => {
  const scale = isHovered ? 1.3 : 1

  return (
    <group position={[0, 0, 0]}>
      {/* Main sphere */}
      <mesh
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        scale={scale}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#93c5fd" 
          emissive="#93c5fd"
          emissiveIntensity={isHovered ? 1.2 : 0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Pulsing glow effect */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={isHovered ? 3 : 2} 
        distance={5} 
        color="#93c5fd" 
      />

      {/* Rotating ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial color="#93c5fd" opacity={0.5} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
