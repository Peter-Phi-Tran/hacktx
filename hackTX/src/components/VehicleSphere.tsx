import { useRef } from 'react'
import * as THREE from 'three'
import { type VehicleStar } from '../hooks/useConstellation'

interface VehicleSphereProps {
  star: VehicleStar
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onPointerOver: () => void
  onPointerOut: () => void
}

export const VehicleSphere = ({ 
  star, 
  isSelected, 
  isHovered, 
  onClick, 
  onPointerOver, 
  onPointerOut 
}: VehicleSphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const scale = isHovered || isSelected ? 1.5 : 1

  return (
    <group position={[star.x / 15, star.y / 15, star.z / 15]}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        scale={scale}
      >
        <sphereGeometry args={[star.size / 15, 32, 32]} />
        <meshStandardMaterial 
          color={star.color} 
          emissive={star.color}
          emissiveIntensity={isHovered || isSelected ? 1.5 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={isHovered || isSelected ? 2 : 1} 
        distance={3} 
        color={star.color} 
      />

      {/* Ring orbit when selected */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[star.size / 12, star.size / 10, 32]} />
          <meshBasicMaterial color={star.color} opacity={0.3} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
