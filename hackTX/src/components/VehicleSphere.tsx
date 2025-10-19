import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { type VehicleStar } from "../hooks/useConstellation";

interface VehicleSphereProps {
  star: VehicleStar;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

export const VehicleSphere = ({
  star,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}: VehicleSphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = isHovered || isSelected ? 1.5 : 1;

  // Extract scenario title from the 'why' field (first line before \n)
  const scenarioTitle = star.why?.split("\n")[0] || star.vehicle;

  // Determine node visual style based on level and ID
  const nodeStyle = useMemo(() => {
    const level = star.level || 0;
    const id = star.id || 0;
    
    // Different styles: 'star', 'planet', 'ringed-planet', 'glowing-star'
    if (level === 0) return 'glowing-star'; // First level = bright stars
    if (level % 3 === 0) return 'ringed-planet'; // Every 3rd level = ringed planets
    if (id % 2 === 0) return 'planet'; // Even IDs = solid planets
    return 'star'; // Odd IDs = stars
  }, [star.level, star.id]);

  return (
    <group position={[star.x / 15, star.y / 15, star.z / 15]}>
      {/* Label above the node */}
      <Text
        position={[0, star.size / 10 + 0.8, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
        maxWidth={5}
        textAlign="center"
      >
        {scenarioTitle}
      </Text>

      {/* Monthly payment label below title */}
      <Text
        position={[0, star.size / 10 + 0.4, 0]}
        fontSize={0.25}
        color={star.color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        ${star.monthly_payment}/mo
      </Text>

      {/* Render based on node style */}
      {nodeStyle === 'glowing-star' && (
        <>
          {/* Bright star with multiple glow layers */}
          <mesh
            ref={meshRef}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            scale={scale}
          >
            <sphereGeometry args={[star.size / 15, 8, 8]} />
            <meshStandardMaterial
              color={star.color}
              emissive={star.color}
              emissiveIntensity={isHovered || isSelected ? 2 : 1.2}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
          
          {/* Outer glow */}
          <mesh scale={scale * 1.5}>
            <sphereGeometry args={[star.size / 15, 16, 16]} />
            <meshBasicMaterial
              color={star.color}
              opacity={0.15}
              transparent
            />
          </mesh>
          
          {/* Strong point light */}
          <pointLight
            position={[0, 0, 0]}
            intensity={isHovered || isSelected ? 3 : 2}
            distance={4}
            color={star.color}
          />
        </>
      )}

      {nodeStyle === 'star' && (
        <>
          {/* Star shape - pointed */}
          <mesh
            ref={meshRef}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            scale={scale}
          >
            <sphereGeometry args={[star.size / 15, 5, 5]} />
            <meshStandardMaterial
              color={star.color}
              emissive={star.color}
              emissiveIntensity={isHovered || isSelected ? 1.5 : 0.8}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
          
          {/* Subtle glow */}
          <pointLight
            position={[0, 0, 0]}
            intensity={isHovered || isSelected ? 2 : 1}
            distance={2.5}
            color={star.color}
          />
        </>
      )}

      {nodeStyle === 'planet' && (
        <>
          {/* Solid planet */}
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
              emissiveIntensity={isHovered || isSelected ? 0.5 : 0.2}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          
          {/* Soft ambient light */}
          <pointLight
            position={[0, 0, 0]}
            intensity={isHovered || isSelected ? 1.5 : 0.8}
            distance={2}
            color={star.color}
          />
        </>
      )}

      {nodeStyle === 'ringed-planet' && (
        <>
          {/* Planet with rings */}
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
              emissiveIntensity={isHovered || isSelected ? 0.6 : 0.3}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {/* Ring system */}
          <mesh rotation={[Math.PI / 3, 0, Math.PI / 6]} scale={scale}>
            <ringGeometry args={[star.size / 12, star.size / 8, 32]} />
            <meshStandardMaterial
              color={star.color}
              opacity={0.5}
              transparent
              side={THREE.DoubleSide}
              emissive={star.color}
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Ambient light */}
          <pointLight
            position={[0, 0, 0]}
            intensity={isHovered || isSelected ? 1.5 : 1}
            distance={2.5}
            color={star.color}
          />
        </>
      )}

      {/* Selection ring orbit (for all types) */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[star.size / 10, star.size / 9, 32]} />
          <meshBasicMaterial
            color={star.color}
            opacity={0.4}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};
