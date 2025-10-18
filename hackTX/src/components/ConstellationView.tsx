import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Text } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

interface VehicleStar {
  id: number
  vehicle: string
  x: number
  y: number
  z: number
  size: number
  color: string
  monthly_payment: number
  affordability: string
}

interface ConstellationProps {
  stars: VehicleStar[]
  onStarClick?: (star: VehicleStar) => void
}

function VehicleStarMesh({ star, onClick }: { star: VehicleStar; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <group position={[star.x - 50, star.y - 50, star.z]}>
      {/* Main star sphere */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.3 : 1}
      >
        <sphereGeometry args={[star.size, 32, 32]} />
        <meshStandardMaterial
          color={star.color}
          emissive={star.color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Glow effect */}
      <mesh scale={hovered ? 2.5 : 2}>
        <sphereGeometry args={[star.size, 32, 32]} />
        <meshBasicMaterial
          color={star.color}
          transparent
          opacity={hovered ? 0.3 : 0.15}
        />
      </mesh>

      {/* Label */}
      {hovered && (
        <Text
          position={[0, star.size + 8, 0]}
          fontSize={4}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {star.vehicle}
        </Text>
      )}
    </group>
  )
}

export const ConstellationView = ({ stars, onStarClick }: ConstellationProps) => {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#0a0e1a' }}>
      <Canvas camera={{ position: [0, 0, 150], fov: 75 }}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Background stars */}
        <Stars
          radius={300}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* Vehicle stars */}
        {stars.map((star) => (
          <VehicleStarMesh
            key={star.id}
            star={star}
            onClick={() => onStarClick?.(star)}
          />
        ))}

        {/* User position (center) */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#93c5fd"
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Orbit controls for interaction */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={300}
        />
      </Canvas>
    </div>
  )
}
