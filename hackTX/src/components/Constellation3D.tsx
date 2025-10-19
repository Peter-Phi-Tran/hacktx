import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei'
import { useEffect } from 'react'
import { Car3D } from './Car3D'
import {
  useConstellationSelection,
  useFinancingScenarios,
  useCameraControls,
  useCarTarget,
  type VehicleStar,
  type FinancingScenario
} from '../hooks/useConstellation'
import { generateFinancingScenarios } from '../utils/financing'
import { VehicleSphere } from './VehicleSphere'
import { UserNode } from './UserNode'
import type { UserConfig } from '../types'

interface Constellation3DProps {
  stars: VehicleStar[]
  userConfig: UserConfig
}

export const Constellation3D = ({ stars, userConfig }: Constellation3DProps) => {
  // Use custom hooks for state management
  const {
    selectedStar, setSelectedStar,
    hoveredStar, setHoveredStar,
    selectedScenario, setSelectedScenario,
    showUserInfo, setShowUserInfo,
    isHoveringUser, setIsHoveringUser
  } = useConstellationSelection()

  const {
    financingScenarios,
    expandedStarId,
    addScenarios
  } = useFinancingScenarios()

  const {
    cameraTarget,
    controlsRef,
    focusOnNode
  } = useCameraControls()

  // Get target position for car to move to
  const targetPosition = useCarTarget(
    selectedStar,
    hoveredStar,
    selectedScenario,
    isHoveringUser,
    showUserInfo
  )

  // Update camera target when a node is clicked
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...cameraTarget)
      controlsRef.current.update()
    }
  }, [cameraTarget])

  // Handle node selection and update camera focus
  const handleStarClick = (star: VehicleStar) => {
    setSelectedStar(star)
    focusOnNode(star.x / 15, star.y / 15, star.z / 15)
  }

  const handleScenarioClick = (scenario: FinancingScenario) => {
    setSelectedScenario(scenario)
    focusOnNode(scenario.x / 15, scenario.y / 15, scenario.z / 15)
  }

  const handleUserNodeClick = () => {
    setShowUserInfo(!showUserInfo)
    focusOnNode(0, 0, 0)
  }

  // Handle exploring financing options
  const handleExploreFinancing = () => {
    if (selectedStar && !selectedStar.parentId) {
      const scenarios = generateFinancingScenarios(selectedStar, selectedStar.id)
      addScenarios(scenarios, selectedStar.id)
      setSelectedStar(null) // Close the details panel
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 20]} fov={60} />
        <OrbitControls 
          ref={controlsRef}
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          target={[0, 0, 0]}
          enableDamping={true}
          dampingFactor={0.05}
          panSpeed={1.5}
          rotateSpeed={1}
          zoomSpeed={1.2}
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
          onClick={handleUserNodeClick}
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
            onClick={() => handleStarClick(star)}
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
                onClick={() => handleScenarioClick(scenario)}
                onPointerOver={() => {}}
                onPointerOut={() => {}}
              />
            </group>
          )
        })}
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
        <div>🚗 <strong>Car:</strong> Orbits hovered/selected vehicles</div>
        <div>👆 <strong>Hover:</strong> Vehicle stars to explore</div>
        <div>👉 <strong>Click:</strong> View detailed information</div>
        <div>🖱️ <strong>Drag:</strong> Rotate • <strong>Scroll:</strong> Zoom</div>
      </div>
    </div>
  )
}
