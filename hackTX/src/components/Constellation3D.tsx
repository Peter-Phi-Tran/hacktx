import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";
import { useEffect } from "react";
import { Car3D } from "./Car3D";
import {
  useConstellationSelection,
  useFinancingScenarios,
  useCameraControls,
  useCarTarget,
  type VehicleStar,
  type FinancingScenario,
} from "../hooks/useConstellation";
import { VehicleSphere } from "./VehicleSphere";
import { UserNode } from "./UserNode";
import type { UserConfig } from "../types";

interface Constellation3DProps {
  stars: VehicleStar[];
  userConfig: UserConfig;
  onStarClick?: (star: VehicleStar) => void;
}

export const Constellation3D = ({
  stars,
  userConfig,
  onStarClick,
}: Constellation3DProps) => {
  // Use custom hooks for state management
  const {
    selectedStar,
    setSelectedStar,
    hoveredStar,
    setHoveredStar,
    selectedScenario,
    setSelectedScenario,
    showUserInfo,
    setShowUserInfo,
    isHoveringUser,
    setIsHoveringUser,
  } = useConstellationSelection();

  const { financingScenarios } = useFinancingScenarios();

  const { cameraTarget, controlsRef, focusOnNode } = useCameraControls();

  // Get target position for car to move to
  const targetPosition = useCarTarget(
    selectedStar,
    hoveredStar,
    selectedScenario,
    isHoveringUser,
    showUserInfo
  );

  // Update camera target when a node is clicked
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...cameraTarget);
      controlsRef.current.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);

  // Handle node selection and update camera focus
  const handleStarClick = (star: VehicleStar) => {
    setSelectedStar(star);
    // Focus camera on the node - center it in view
    focusOnNode(star.x / 15, star.y / 15, star.z / 15);
    // Trigger external callback if provided (for modal popup)
    if (onStarClick) {
      onStarClick(star);
    }
  };

  const handleScenarioClick = (scenario: FinancingScenario) => {
    setSelectedScenario(scenario);
    focusOnNode(scenario.x / 15, scenario.y / 15, scenario.z / 15);
  };

  const handleUserNodeClick = () => {
    setShowUserInfo(!showUserInfo);
    focusOnNode(0, 0, 0);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
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
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.3}
          color="#93c5fd"
        />

        {/* Background stars */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* Center User Node */}
        <UserNode
          userConfig={userConfig}
          isHovered={isHoveringUser}
          onPointerOver={() => setIsHoveringUser(true)}
          onPointerOut={() => setIsHoveringUser(false)}
          onClick={handleUserNodeClick}
        />

        {/* Car starts at user node and moves to hovered/selected stars */}
        <Car3D
          position={[0, 0, 0]}
          color="#93c5fd"
          scale={0.4}
          targetPosition={targetPosition}
        />

        {/* Vehicle stars */}
        {stars.map((star) => (
          <group key={`star-group-${star.id}`}>
            {/* Connection line from parent to child OR from center to first-level nodes */}
            {(() => {
              if (star.parentId) {
                // Child node - connect to parent
                const parentStar = stars.find((s) => s.id === star.parentId);
                return parentStar ? (
                  <line>
                    <bufferGeometry>
                      <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={
                          new Float32Array([
                            parentStar.x / 15,
                            parentStar.y / 15,
                            parentStar.z / 15,
                            star.x / 15,
                            star.y / 15,
                            star.z / 15,
                          ])
                        }
                        itemSize={3}
                        args={[
                          new Float32Array([
                            parentStar.x / 15,
                            parentStar.y / 15,
                            parentStar.z / 15,
                            star.x / 15,
                            star.y / 15,
                            star.z / 15,
                          ]),
                          3,
                        ]}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial
                      color={star.color}
                      opacity={0.2}
                      transparent
                      linewidth={1}
                    />
                  </line>
                ) : null;
              } else {
                // First-level node (no parent) - connect to center (0,0,0)
                return (
                  <line>
                    <bufferGeometry>
                      <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={
                          new Float32Array([
                            0, 0, 0, // Center node position
                            star.x / 15,
                            star.y / 15,
                            star.z / 15,
                          ])
                        }
                        itemSize={3}
                        args={[
                          new Float32Array([
                            0, 0, 0, // Center node position
                            star.x / 15,
                            star.y / 15,
                            star.z / 15,
                          ]),
                          3,
                        ]}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial
                      color={star.color}
                      opacity={0.15}
                      transparent
                      linewidth={1}
                    />
                  </line>
                );
              }
            })()}
            
            {/* Star sphere */}
            <VehicleSphere
              star={star}
              isSelected={selectedStar?.id === star.id}
              isHovered={hoveredStar?.id === star.id}
              onClick={() => handleStarClick(star)}
              onPointerOver={() => setHoveredStar(star)}
              onPointerOut={() => setHoveredStar(null)}
            />
          </group>
        ))}

        {/* Financing scenario child nodes */}
        {financingScenarios.map((scenario) => {
          const parentStar = stars.find((s) => s.id === scenario.parentId);
          return (
            <group key={`scenario-${scenario.id}`}>
              {/* Connection line from parent to child */}
              {parentStar && (
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={
                        new Float32Array([
                          parentStar.x / 15,
                          parentStar.y / 15,
                          parentStar.z / 15,
                          scenario.x / 15,
                          scenario.y / 15,
                          scenario.z / 15,
                        ])
                      }
                      itemSize={3}
                      args={[
                        new Float32Array([
                          parentStar.x / 15,
                          parentStar.y / 15,
                          parentStar.z / 15,
                          scenario.x / 15,
                          scenario.y / 15,
                          scenario.z / 15,
                        ]),
                        3,
                      ]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={scenario.color}
                    opacity={0.2}
                    transparent
                    linewidth={1}
                  />
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
          );
        })}
      </Canvas>

      {/* Legend - positioned over the 3D scene */}
      <div className="constellation-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#4A90E2" }}></span>
          <span>Financing Plans</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#10B981" }}></span>
          <span>Lease Plans</span>
        </div>
        <div className="legend-item">
          <span className="legend-text">*</span>
          <span>Larger = Better Match</span>
        </div>
      </div>

      {/* Camera controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          color: "#94a3b8",
          fontSize: "12px",
          background: "rgba(15, 23, 42, 0.8)",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(147, 197, 253, 0.2)",
        }}
      >
        <div>
          <strong>Center node:</strong> Your financial profile
        </div>
        <div>
          <strong>Car:</strong> Orbits hovered/selected vehicles
        </div>
        <div>
          <strong>Hover:</strong> Vehicle stars to explore
        </div>
        <div>
          <strong>Click:</strong> View detailed information
        </div>
        <div>
          <strong>Drag:</strong> Rotate • <strong>Scroll:</strong> Zoom
        </div>
      </div>
    </div>
  );
};
