import { useRef } from 'react'
import { Mesh, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'

interface Car3DProps {
  position?: [number, number, number]
  color?: string
  scale?: number
  targetPosition?: [number, number, number] | null
}

export const Car3D = ({ position = [0, 0, 0], color = '#3b82f6', scale = 1, targetPosition = null }: Car3DProps) => {
  const carRef = useRef<Mesh>(null)
  const currentPos = useRef(new Vector3(...position))
  const orbitAngle = useRef(0)

  // Smooth movement and orbiting animation
  useFrame((state, delta) => {
    if (carRef.current) {
      if (targetPosition) {
        // Calculate orbit position around target
        const targetVec = new Vector3(...targetPosition)
        const orbitRadius = 2 // Distance from target to orbit
        
        // Increment orbit angle
        orbitAngle.current += delta * 0.8
        
        // Calculate orbit position (circle around target)
        const orbitX = targetVec.x + Math.cos(orbitAngle.current) * orbitRadius
        const orbitZ = targetVec.z + Math.sin(orbitAngle.current) * orbitRadius
        const orbitY = targetVec.y
        
        // Smoothly lerp to orbit position
        currentPos.current.lerp(new Vector3(orbitX, orbitY, orbitZ), delta * 2)
        
        // Make car face the direction of movement (tangent to orbit)
        const lookAtX = targetVec.x - Math.sin(orbitAngle.current) * orbitRadius
        const lookAtZ = targetVec.z + Math.cos(orbitAngle.current) * orbitRadius
        carRef.current.lookAt(lookAtX, orbitY, lookAtZ)
      } else {
        // Return to center position with gentle float
        currentPos.current.lerp(new Vector3(...position), delta * 1.5)
        carRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
        orbitAngle.current = 0 // Reset orbit angle when returning
      }
      
      // Apply position
      carRef.current.position.copy(currentPos.current)
      
      // Add gentle bobbing
      carRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group ref={carRef} position={position} scale={scale}>
      {/* Main body */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.6, 1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.2, 0.5, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Windows */}
      <mesh position={[0.3, 0.8, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.92]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.7} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Front wheel */}
      <mesh position={[0.6, -0.1, 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Front wheel inner */}
      <mesh position={[0.6, -0.1, -0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rear wheel */}
      <mesh position={[-0.6, -0.1, 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rear wheel inner */}
      <mesh position={[-0.6, -0.1, -0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Headlights */}
      <mesh position={[1.05, 0.2, 0.3]}>
        <boxGeometry args={[0.1, 0.15, 0.15]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={2} />
      </mesh>
      <mesh position={[1.05, 0.2, -0.3]}>
        <boxGeometry args={[0.1, 0.15, 0.15]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={2} />
      </mesh>

      {/* Glow effect under car */}
      <pointLight position={[0, -0.5, 0]} intensity={0.5} distance={3} color={color} />
    </group>
  )
}
