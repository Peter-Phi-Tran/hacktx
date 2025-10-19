/**
 * Custom React hooks for managing constellation state
 */
import { useState, useRef, useEffect } from "react";
import type { VehicleStar, FinancingScenario } from "../types";

// Re-export types for convenience
export type { VehicleStar, FinancingScenario };

/**
 * Hook for managing constellation selection state
 */
export function useConstellationSelection() {
  const [selectedStar, setSelectedStar] = useState<VehicleStar | null>(null);
  const [hoveredStar, setHoveredStar] = useState<VehicleStar | null>(null);
  const [selectedScenario, setSelectedScenario] =
    useState<FinancingScenario | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isHoveringUser, setIsHoveringUser] = useState(false);

  const clearSelections = () => {
    setSelectedStar(null);
    setHoveredStar(null);
    setSelectedScenario(null);
    setShowUserInfo(false);
  };

  return {
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
    clearSelections,
  };
}

/**
 * Hook for managing financing scenarios
 */
export function useFinancingScenarios() {
  const [financingScenarios, setFinancingScenarios] = useState<
    FinancingScenario[]
  >([]);
  const [expandedStarId, setExpandedStarId] = useState<number | null>(null);

  const addScenarios = (scenarios: FinancingScenario[], starId: number) => {
    setFinancingScenarios((prev) => [...prev, ...scenarios]);
    setExpandedStarId(starId);
  };

  const clearScenarios = () => {
    setFinancingScenarios([]);
    setExpandedStarId(null);
  };

  const hasScenarios = (starId: number) => {
    return expandedStarId === starId;
  };

  return {
    financingScenarios,
    expandedStarId,
    addScenarios,
    clearScenarios,
    hasScenarios,
  };
}

/**
 * Hook for managing camera controls
 */
export function useCameraControls() {
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      // Smoothly animate camera target
      const controls = controlsRef.current;
      const newTarget = {
        x: cameraTarget[0],
        y: cameraTarget[1],
        z: cameraTarget[2],
      };

      // Use dampingFactor for smooth transition
      controls.target.set(newTarget.x, newTarget.y, newTarget.z);
      controls.update();
    }
  }, [cameraTarget]);

  const focusOnNode = (x: number, y: number, z: number) => {
    setCameraTarget([x, y, z]);
  };

  const focusOnCenter = () => {
    setCameraTarget([0, 0, 0]);
  };

  return {
    cameraTarget,
    controlsRef,
    focusOnNode,
    focusOnCenter,
  };
}

/**
 * Hook for calculating car target position
 */
export function useCarTarget(
  selectedStar: VehicleStar | null,
  hoveredStar: VehicleStar | null,
  selectedScenario: FinancingScenario | null,
  isHoveringUser: boolean,
  showUserInfo: boolean
) {
  const targetPosition = selectedScenario
    ? ([
        selectedScenario.x / 15,
        selectedScenario.y / 15,
        selectedScenario.z / 15,
      ] as [number, number, number])
    : hoveredStar || selectedStar
    ? ([
        (hoveredStar || selectedStar)!.x / 15,
        (hoveredStar || selectedStar)!.y / 15,
        (hoveredStar || selectedStar)!.z / 15,
      ] as [number, number, number])
    : isHoveringUser || showUserInfo
    ? ([0, 0, 0] as [number, number, number])
    : null;

  return targetPosition;
}
