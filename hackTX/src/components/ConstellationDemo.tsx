/**
 * Constellation Demo - Main view for displaying financing scenarios
 * Integrates ConfigPanel (left) with Constellation3D (right) and ScenarioDetailsModal
 */

import { useState } from "react";
import { ConfigPanel } from "./ConfigPanel";
import { Constellation3D } from "./Constellation3D";
import { ScenarioDetailsModal } from "./ScenarioDetailsModal";
import { transformScenariosToStars } from "../utils/scenarioTransformer";
import type { VehicleStar, FinancialConfig, UserConfig } from "../types";

interface ConstellationDemoProps {
  scenarios: Record<string, unknown>[];
  onLogout?: () => void;
}

export const ConstellationDemo = ({
  scenarios,
  onLogout,
}: ConstellationDemoProps) => {
  const [selectedStar, setSelectedStar] = useState<VehicleStar | null>(null);

  // Financial configuration state
  const [config, setConfig] = useState<FinancialConfig>({
    income: 5000,
    creditScore: "670-739",
    downPayment: 5000,
    monthlyBudget: 400,
    loanTerm: 60,
    vehicleTypes: ["sedan", "suv"],
    priorities: ["safety", "fuel_efficiency", "reliability"],
    additionalContext: "",
  });

  // Transform scenarios to stars using the transformer
  const stars: VehicleStar[] = transformScenariosToStars(scenarios);

  // Debug logging
  console.log("ConstellationDemo received scenarios:", scenarios);
  console.log("Transformed to stars:", stars);

  // Create user config from financial config (only fields that match UserConfig type)
  const userConfig: UserConfig = {
    income: config.income,
    creditScore: config.creditScore,
    downPayment: config.downPayment,
    monthlyBudget: config.monthlyBudget,
    loanTerm: config.loanTerm,
  };

  const handleCloseModal = () => {
    setSelectedStar(null);
  };

  const handleStarClick = (star: VehicleStar) => {
    setSelectedStar(star);
  };

  return (
    <div className="constellation-demo">
      {/* Left side: Config Panel */}
      <div className="config-side">
        <ConfigPanel
          config={config}
          setConfig={setConfig}
          onLogout={onLogout}
        />
      </div>

      {/* Right side: 3D Constellation */}
      <div className="constellation-side">
        <Constellation3D
          stars={stars}
          userConfig={userConfig}
          onStarClick={handleStarClick}
        />
      </div>

      {/* Scenario Details Modal - will be triggered by clicks in Constellation3D */}
      <ScenarioDetailsModal star={selectedStar} onClose={handleCloseModal} />
    </div>
  );
};
