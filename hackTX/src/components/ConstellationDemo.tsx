/**
 * Constellation Demo - Main view for displaying financing scenarios
 * Integrates ConfigPanel (left) with Constellation3D (right) and ScenarioDetailsModal
 */

import { useState } from "react";
import { ConfigPanel } from "./ConfigPanel";
import { Constellation3D } from "./Constellation3D";
import { ScenarioDetailsModal } from "./ScenarioDetailsModal";
import {
  transformScenariosToStars,
  generateChildNodePositions,
} from "../utils/scenarioTransformer";
import { interviewAPI } from "../api/interview";
import type {
  VehicleStar,
  FinancialConfig,
  UserConfig,
  BranchType,
} from "../types";

// Branch type mapping for each level
const LEVEL_TO_BRANCH: Record<number, BranchType> = {
  1: "financing",
  2: "trim_levels",
  3: "add_ons",
  4: "insurance",
  5: "maintenance",
  6: "trade_in",
  7: "lease_vs_buy",
  8: "refinancing",
  9: "early_payoff",
  10: "alternatives",
};

// Branch display names
const BRANCH_NAMES: Record<BranchType, string> = {
  financing: " Payment Structures",
  trim_levels: " Vehicle Trims",
  add_ons: " Warranties & Packages",
  insurance: " Insurance Options",
  maintenance: " Service Plans",
  trade_in: " Trade-In Scenarios",
  lease_vs_buy: " Lease vs. Buy",
  refinancing: " Refinancing",
  early_payoff: " Early Payoff",
  alternatives: " Alternative Vehicles",
};

interface ConstellationDemoProps {
  scenarios: Record<string, unknown>[];
  onLogout?: () => void;
}

export const ConstellationDemo = ({
  scenarios,
  onLogout,
}: ConstellationDemoProps) => {
  const [selectedStar, setSelectedStar] = useState<VehicleStar | null>(null);
  const [allStars, setAllStars] = useState<VehicleStar[]>(() =>
    transformScenariosToStars(scenarios)
  );

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

  // Debug logging
  console.log("ConstellationDemo received scenarios:", scenarios);
  console.log("Transformed to stars:", allStars);

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
    console.log("Star clicked in ConstellationDemo:", star);
    setSelectedStar(star);
  };

  const handleExpandNode = async (parentStar: VehicleStar) => {
    console.log(" Expanding node:", parentStar);

    // Prepare parent scenario data for the API - ensure all required fields are present
    const parentScenario = {
      name: parentStar.vehicle || "Unknown Vehicle",
      suggested_model: parentStar.vehicle || "Unknown Vehicle",
      monthly_payment: parentStar.monthly_payment || 0,
      plan_type: parentStar.scenarioType || "finance",
      price_range:
        parentStar.price_range || `$${parentStar.monthly_payment}/mo`,
      why: parentStar.why || "No description available",
      affordability: parentStar.affordability || "good",
      term_months: config.loanTerm || 60,
      positivity_score: 70, // Default score
    };

    const userProfile = {
      income: config.income || 5000,
      credit_score: config.creditScore || "670-739",
      down_payment: config.downPayment || 5000,
      monthly_budget: config.monthlyBudget || 400,
      loan_term: config.loanTerm || 60,
    };

    console.log("📦 Prepared data:", { parentScenario, userProfile });

    try {
      // Calculate the next branch level
      const parentLevel = parentStar.level || 0;
      const nextLevel = parentLevel + 1;

      // Check if we've reached max depth (level 10)
      if (nextLevel > 10) {
        alert(
          "Maximum exploration depth reached! You've explored all 10 levels of financing scenarios."
        );
        return;
      }

      const branchType = LEVEL_TO_BRANCH[nextLevel];
      const branchName = BRANCH_NAMES[branchType];

      console.log(` Level ${nextLevel}: ${branchName}`);
      console.log(" Request data:", {
        parentScenario,
        userProfile,
        nextLevel,
      });

      // Call API to generate child scenarios with branch level
      const response = await interviewAPI.expandNode(
        parentScenario,
        userProfile,
        nextLevel
      );

      console.log(
        `Received ${response.children.length} level-${nextLevel} scenarios (${branchName})`
      );
      console.log("Response data:", response);

      // Collect all existing node positions for collision detection
      const existingPositions = allStars.map(star => ({
        x: star.x,
        y: star.y,
        z: star.z
      }));

      // Generate positions for child nodes with collision avoidance
      const childPositions = generateChildNodePositions(
        parentStar.x,
        parentStar.y,
        parentStar.z,
        response.children.length,
        existingPositions
      );

      // Create child stars
      const childStars: VehicleStar[] = response.children.map(
        (child, index) => {
          const c = child as {
            name: string;
            title: string;
            description: string;
            plan_type: "finance" | "lease";
            down_payment: number;
            monthly_payment: number;
            term_months: number;
            interest_rate: number;
            positivity_score: number;
            recommendations: string;
            suggested_model: string;
          };

          const pos = childPositions[index];
          const affordability: "excellent" | "good" | "stretch" =
            c.positivity_score >= 80
              ? "excellent"
              : c.positivity_score >= 60
              ? "good"
              : "stretch";

          // Child nodes INHERIT parent's plan type and color
          const inheritedPlanType = parentStar.scenarioType || "finance";
          const inheritedColor = inheritedPlanType === "finance" ? "#4A90E2" : "#10B981";
          
          console.log(`  Child ${index + 1}: Inheriting from parent - Type: ${inheritedPlanType}, Color: ${inheritedColor}`);

          return {
            id: allStars.length + index + 1,
            vehicle: c.suggested_model || c.name,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            size: 6 + (c.positivity_score / 100) * 6,
            color: inheritedColor,
            monthly_payment: c.monthly_payment,
            affordability: affordability,
            price_range: `$${c.monthly_payment}/mo for ${c.term_months} months`,
            why: `${c.title}\n\n${c.description}\n\n💡 ${c.recommendations}`,
            parentId: parentStar.id,
            scenarioType: inheritedPlanType,
            level: nextLevel,
            branchType: branchType,
            isExpanded: false,
          };
        }
      );

      // Update the parent star to mark it as expanded
      const updatedParent = {
        ...parentStar,
        isExpanded: true,
        children: childStars,
      };

      // Update all stars - replace parent and add children
      setAllStars((prevStars) => {
        const filtered = prevStars.filter((s) => s.id !== parentStar.id);
        return [...filtered, updatedParent, ...childStars];
      });

      console.log(" Node expanded successfully!");
    } catch (error) {
      console.error(" Error expanding node:", error);
      throw error;
    }
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
          stars={allStars}
          userConfig={userConfig}
          onStarClick={handleStarClick}
        />
      </div>

      {/* Scenario Details Modal - will be triggered by clicks in Constellation3D */}
      <ScenarioDetailsModal
        star={selectedStar}
        onClose={handleCloseModal}
        onExpand={handleExpandNode}
      />
    </div>
  );
};
