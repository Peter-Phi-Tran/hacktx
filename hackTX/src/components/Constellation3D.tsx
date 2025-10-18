import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei'
import { useState, useRef } from 'react'
import { Car3D } from './Car3D'
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
  price_range?: string
  why?: string
}

interface Constellation3DProps {
  stars: VehicleStar[]
}

const VehicleSphere = ({ 
  star, 
  isSelected, 
  isHovered, 
  onClick, 
  onPointerOver, 
  onPointerOut 
}: { 
  star: VehicleStar
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onPointerOver: () => void
  onPointerOut: () => void
}) => {
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

export const Constellation3D = ({ stars }: Constellation3DProps) => {
  const [selectedStar, setSelectedStar] = useState<VehicleStar | null>(null)
  const [hoveredStar, setHoveredStar] = useState<VehicleStar | null>(null)

  // Get target position for car to move to
  const targetPosition = hoveredStar 
    ? [hoveredStar.x / 15, hoveredStar.y / 15, hoveredStar.z / 15] as [number, number, number]
    : null

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 20]} fov={60} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={10}
          maxDistance={50}
        />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#93c5fd" />

        {/* Background stars */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Center car (representing user) - smaller and moves to hovered star */}
        <Car3D position={[0, 0, 0]} color="#93c5fd" scale={0.4} targetPosition={targetPosition} />

        {/* Vehicle stars */}
        {stars.map((star) => (
          <VehicleSphere
            key={star.id}
            star={star}
            isSelected={selectedStar?.id === star.id}
            isHovered={hoveredStar?.id === star.id}
            onClick={() => setSelectedStar(star)}
            onPointerOver={() => setHoveredStar(star)}
            onPointerOut={() => setHoveredStar(null)}
          />
        ))}

        {/* Grid helper removed - was visible at bottom */}
      </Canvas>

      {/* Legend - positioned over the 3D scene */}
      <div className="constellation-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#4ade80' }}></span>
          <span>Excellent Match</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#60a5fa' }}></span>
          <span>Good Match</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#fbbf24' }}></span>
          <span>Stretch Option</span>
        </div>
      </div>

      {/* Vehicle Details Panel */}
      {selectedStar && (
        <div className="vehicle-details">
          <div className="details-header">
            <h2>{selectedStar.vehicle}</h2>
            <button
              className="close-btn"
              onClick={() => setSelectedStar(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="details-body">
            <div className="detail-row">
              <span className="label">Monthly Payment:</span>
              <span className="value">${selectedStar.monthly_payment}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Affordability:</span>
              <span
                className="value affordability-badge"
                style={{
                  background:
                    selectedStar.affordability === 'excellent'
                      ? '#4ade8033'
                      : selectedStar.affordability === 'good'
                      ? '#60a5fa33'
                      : '#fbbf2433',
                  color:
                    selectedStar.affordability === 'excellent'
                      ? '#4ade80'
                      : selectedStar.affordability === 'good'
                      ? '#60a5fa'
                      : '#fbbf24',
                }}
              >
                {selectedStar.affordability.charAt(0).toUpperCase() +
                  selectedStar.affordability.slice(1)}
              </span>
            </div>

            {selectedStar.price_range && (
              <div className="detail-row">
                <span className="label">Price Range:</span>
                <span className="value">{selectedStar.price_range}</span>
              </div>
            )}

            {selectedStar.why && (
              <div className="detail-row">
                <span className="label">Why This Vehicle:</span>
                <p className="why-text">{selectedStar.why}</p>
              </div>
            )}
          </div>

          <button className="explore-btn">
            Explore Financing Options →
          </button>
        </div>
      )}

      {/* Camera controls hint */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: '#94a3b8',
        fontSize: '12px',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(147, 197, 253, 0.2)',
      }}>
        <div>🖱️ Left click + drag to rotate</div>
        <div>🔍 Scroll to zoom</div>
        <div>👆 Hover stars to orbit with car</div>
        <div>🚗 Click stars for details</div>
      </div>
    </div>
  )
}
