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
  parentId?: number
  scenarioType?: string
}

interface FinancingScenario {
  id: number
  vehicle: string
  x: number
  y: number
  z: number
  size: number
  color: string
  monthly_payment: number
  affordability: string
  parentId: number
  scenarioType: string
  scenarioName: string
  details: {
    downPayment: number
    loanTerm: number
    interestRate: number
    totalCost: number
    savingsVsBase: number
  }
  outcome: string
}

interface UserConfig {
  income: number
  creditScore: string
  downPayment: number
  monthlyBudget: number
  loanTerm: number
}

interface Constellation3DProps {
  stars: VehicleStar[]
  userConfig: UserConfig
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

// Center User Node Component - represents the user's financial starting point
const UserNode = ({ 
  userConfig: _userConfig, 
  isHovered, 
  onPointerOver, 
  onPointerOut,
  onClick 
}: { 
  userConfig: UserConfig
  isHovered: boolean
  onPointerOver: () => void
  onPointerOut: () => void
  onClick: () => void
}) => {
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

// Generate 5 financing scenario child nodes around a parent star
const generateFinancingScenarios = (parentStar: VehicleStar, parentIndex: number): FinancingScenario[] => {
  const basePrice = parentStar.monthly_payment * 60 // Estimate base price from 60-month payment
  const scenarios = [
    {
      name: 'Low Down Payment',
      downPayment: 0,
      loanTerm: 72,
      interestRate: 6.5,
      color: '#fbbf24',
      affordability: 'stretch'
    },
    {
      name: 'Standard Plan',
      downPayment: basePrice * 0.1,
      loanTerm: 60,
      interestRate: 5.5,
      color: '#60a5fa',
      affordability: 'good'
    },
    {
      name: 'High Down Payment',
      downPayment: basePrice * 0.2,
      loanTerm: 48,
      interestRate: 4.5,
      color: '#4ade80',
      affordability: 'excellent'
    },
    {
      name: 'Short Term',
      downPayment: basePrice * 0.15,
      loanTerm: 36,
      interestRate: 4.0,
      color: '#4ade80',
      affordability: 'excellent'
    },
    {
      name: 'Extended Term',
      downPayment: basePrice * 0.05,
      loanTerm: 84,
      interestRate: 7.0,
      color: '#fbbf24',
      affordability: 'stretch'
    }
  ]

  // Position child nodes close together in 3D space around the parent for constellation effect
  const radiusVariations = [2, 3, 2.5, 3.5, 2.8] // Close distances from parent
  const zOffsets = [-1.5, 1, -1, 2, 0.5] // Small varied Z positions
  const angleOffsets = [0.3, -0.2, 0.5, -0.4, 0.1] // Asymmetry
  
  return scenarios.map((scenario, index) => {
    const baseAngle = (index / scenarios.length) * Math.PI * 2
    const angle = baseAngle + angleOffsets[index]
    const radius = radiusVariations[index]
    
    const xOffset = Math.cos(angle) * radius
    const yOffset = Math.sin(angle) * radius
    const zOffset = zOffsets[index]

    const loanAmount = basePrice - scenario.downPayment
    const monthlyRate = scenario.interestRate / 100 / 12
    const numPayments = scenario.loanTerm
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1)
    const totalCost = monthlyPayment * scenario.loanTerm + scenario.downPayment
    const baseTotalCost = parentStar.monthly_payment * 60 + (basePrice * 0.1)

    return {
      id: parentIndex * 1000 + index + 1,
      vehicle: `${parentStar.vehicle} - ${scenario.name}`,
      x: parentStar.x + xOffset * 15,
      y: parentStar.y + yOffset * 15,
      z: parentStar.z + zOffset * 15,
      size: 6,
      color: scenario.color,
      monthly_payment: Math.round(monthlyPayment),
      affordability: scenario.affordability,
      parentId: parentStar.id,
      scenarioType: scenario.name.toLowerCase().replace(/ /g, '_'),
      scenarioName: scenario.name,
      details: {
        downPayment: Math.round(scenario.downPayment),
        loanTerm: scenario.loanTerm,
        interestRate: scenario.interestRate,
        totalCost: Math.round(totalCost),
        savingsVsBase: Math.round(baseTotalCost - totalCost)
      },
      outcome: totalCost < baseTotalCost 
        ? `Save $${Math.abs(Math.round(baseTotalCost - totalCost)).toLocaleString()} over standard plan`
        : `Costs $${Math.abs(Math.round(baseTotalCost - totalCost)).toLocaleString()} more than standard plan`
    }
  })
}

export const Constellation3D = ({ stars, userConfig }: Constellation3DProps) => {
  const [selectedStar, setSelectedStar] = useState<VehicleStar | null>(null)
  const [hoveredStar, setHoveredStar] = useState<VehicleStar | null>(null)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [isHoveringUser, setIsHoveringUser] = useState(false)
  const [financingScenarios, setFinancingScenarios] = useState<FinancingScenario[]>([])
  const [expandedStarId, setExpandedStarId] = useState<number | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<FinancingScenario | null>(null)

  // Handle exploring financing options
  const handleExploreFinancing = () => {
    if (selectedStar && !selectedStar.parentId) {
      const scenarios = generateFinancingScenarios(selectedStar, selectedStar.id)
      setFinancingScenarios(prev => [...prev, ...scenarios])
      setExpandedStarId(selectedStar.id)
      setSelectedStar(null) // Close the details panel
    }
  }

  // Get target position for car to move to (vehicle star, scenario, or user node)
  const targetPosition = selectedScenario
    ? [selectedScenario.x / 15, selectedScenario.y / 15, selectedScenario.z / 15] as [number, number, number]
    : (hoveredStar || selectedStar)
      ? [(hoveredStar || selectedStar)!.x / 15, (hoveredStar || selectedStar)!.y / 15, (hoveredStar || selectedStar)!.z / 15] as [number, number, number]
      : (isHoveringUser || showUserInfo) 
        ? [0, 0, 0] as [number, number, number]
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

        {/* Center User Node */}
        <UserNode 
          userConfig={userConfig}
          isHovered={isHoveringUser}
          onPointerOver={() => setIsHoveringUser(true)}
          onPointerOut={() => setIsHoveringUser(false)}
          onClick={() => setShowUserInfo(!showUserInfo)}
        />

        {/* Car starts at user node and moves to hovered/selected stars */}
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

        {/* Financing scenario child nodes */}
        {financingScenarios.map((scenario) => {
          const parentStar = stars.find(s => s.id === scenario.parentId)
          return (
            <group key={`scenario-${scenario.id}`}>
              {/* Connection line from parent to child */}
              {parentStar && (
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={new Float32Array([
                        parentStar.x / 15, parentStar.y / 15, parentStar.z / 15,
                        scenario.x / 15, scenario.y / 15, scenario.z / 15
                      ])}
                      itemSize={3}
                      args={[new Float32Array([
                        parentStar.x / 15, parentStar.y / 15, parentStar.z / 15,
                        scenario.x / 15, scenario.y / 15, scenario.z / 15
                      ]), 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color={scenario.color} opacity={0.6} transparent linewidth={2} />
                </line>
              )}
              
              {/* Scenario sphere */}
              <VehicleSphere
                star={scenario as VehicleStar}
                isSelected={selectedScenario?.id === scenario.id}
                isHovered={false}
                onClick={() => setSelectedScenario(scenario)}
                onPointerOver={() => {}}
                onPointerOut={() => {}}
              />
            </group>
          )
        })}

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

      {/* User Info Panel */}
      {showUserInfo && (
        <div className="vehicle-details">
          <div className="details-header">
            <h2>Your Financial Profile</h2>
            <button
              className="close-btn"
              onClick={() => setShowUserInfo(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="details-body">
            <div className="detail-row">
              <span className="label">Monthly Income:</span>
              <span className="value">${userConfig.income.toLocaleString()}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Credit Score:</span>
              <span className="value">{userConfig.creditScore}</span>
            </div>

            <div className="detail-row">
              <span className="label">Down Payment:</span>
              <span className="value">${userConfig.downPayment.toLocaleString()}</span>
            </div>

            <div className="detail-row">
              <span className="label">Monthly Budget:</span>
              <span className="value">${userConfig.monthlyBudget}</span>
            </div>

            <div className="detail-row">
              <span className="label">Loan Term:</span>
              <span className="value">{userConfig.loanTerm} months</span>
            </div>
          </div>

          <button className="explore-btn" onClick={() => setShowUserInfo(false)}>
            Explore Vehicle Options →
          </button>
        </div>
      )}

      {/* Vehicle Details Panel */}
      {selectedStar && !showUserInfo && !selectedScenario && (
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

          <button 
            className="explore-btn"
            onClick={handleExploreFinancing}
            disabled={expandedStarId === selectedStar.id}
          >
            {expandedStarId === selectedStar.id 
              ? '✓ Scenarios Generated' 
              : 'Explore Financing Options →'}
          </button>
        </div>
      )}

      {/* Scenario Details Panel */}
      {selectedScenario && (
        <div className="vehicle-details">
          <div className="details-header">
            <h2>{selectedScenario.scenarioName}</h2>
            <button
              className="close-btn"
              onClick={() => setSelectedScenario(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="details-body">
            <div className="detail-row">
              <span className="label">Down Payment:</span>
              <span className="value">${selectedScenario.details.downPayment.toFixed(0)}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Monthly Payment:</span>
              <span className="value">${selectedScenario.monthly_payment}</span>
            </div>

            <div className="detail-row">
              <span className="label">Loan Term:</span>
              <span className="value">{selectedScenario.details.loanTerm} months</span>
            </div>

            <div className="detail-row">
              <span className="label">Interest Rate:</span>
              <span className="value">{selectedScenario.details.interestRate}%</span>
            </div>

            <div className="detail-row">
              <span className="label">Total Cost:</span>
              <span className="value">${selectedScenario.details.totalCost.toFixed(0)}</span>
            </div>

            <div className="detail-row">
              <span className="label">Comparison:</span>
              <span 
                className="value"
                style={{ 
                  color: selectedScenario.details.savingsVsBase >= 0 ? '#4ade80' : '#fbbf24' 
                }}
              >
                {selectedScenario.details.savingsVsBase >= 0 ? 'Save' : 'Cost'} ${Math.abs(selectedScenario.details.savingsVsBase).toFixed(0)}
              </span>
            </div>

            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '8px', 
              borderLeft: '3px solid #3b82f6' 
            }}>
              <p style={{ fontSize: '0.875rem', color: '#e0e7ff', margin: 0 }}>
                {selectedScenario.outcome}
              </p>
            </div>
          </div>
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
        <div>🌟 <strong>Center node:</strong> Your financial profile</div>
        <div>� <strong>Car:</strong> Orbits hovered/selected vehicles</div>
        <div>👆 <strong>Hover:</strong> Vehicle stars to explore</div>
        <div>� <strong>Click:</strong> View detailed information</div>
        <div>🖱️ <strong>Drag:</strong> Rotate • <strong>Scroll:</strong> Zoom</div>
      </div>
    </div>
  )
}
