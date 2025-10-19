/**
 * Transform financing scenarios from the agent into VehicleStar format for constellation display
 */

import type { VehicleStar } from "../types";

interface AgentScenario {
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
}

/**
 * Get star color based on plan type
 */
function getColorByPlanType(planType: "finance" | "lease"): string {
  return planType === "finance" ? "#4A90E2" : "#10B981"; // Blue for finance, Green for lease
}

/**
 * Get affordability rating based on positivity score
 */
function getAffordability(
  positivityScore: number
): "excellent" | "good" | "stretch" {
  if (positivityScore >= 80) return "excellent";
  if (positivityScore >= 60) return "good";
  return "stretch";
}

/**
 * Calculate star size based on positivity score
 * Higher score = bigger star (range: 6-12)
 */
function calculateStarSize(positivityScore: number): number {
  return 6 + (positivityScore / 100) * 6;
}

/**
 * Generate random 3D position for star
 * Spreads stars across the constellation space
 */
function generateRandomPosition(
  index: number,
  total: number
): { x: number; y: number; z: number } {
  // Add some randomness but spread them out nicely
  const angle = (index / total) * Math.PI * 2;
  const radius = 30 + Math.random() * 30;

  return {
    x: 50 + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
    y: 50 + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
    z: 10 + Math.random() * 30,
  };
}

/**
 * Transform agent scenarios to VehicleStar array for constellation view
 */
export function transformScenariosToStars(
  scenarios: Record<string, unknown>[]
): VehicleStar[] {
  return scenarios.map((scenario, index) => {
    // Type cast the scenario (convert through unknown first for safety)
    const s = scenario as unknown as AgentScenario;

    // Generate random position
    const position = generateRandomPosition(index, scenarios.length);

    // Create the star object
    const star: VehicleStar = {
      id: index + 1,
      vehicle: s.suggested_model || "Toyota Vehicle",
      x: position.x,
      y: position.y,
      z: position.z,
      size: calculateStarSize(s.positivity_score),
      color: getColorByPlanType(s.plan_type),
      monthly_payment: s.monthly_payment,
      affordability: getAffordability(s.positivity_score),
      price_range: `$${s.monthly_payment}/mo for ${s.term_months} months`,
      why: `${s.title}\n\n${s.description}\n\n💡 ${s.recommendations}`,
      scenarioType: s.plan_type,
    };

    return star;
  });
}

/**
 * Get detailed scenario info for display in popup
 */
export function getScenarioDetails(scenario: Record<string, unknown>): string {
  const s = scenario as unknown as AgentScenario;

  return `
🚗 ${s.suggested_model}

📋 Plan: ${s.title}
${s.description}

💰 Financial Details:
• Down Payment: $${s.down_payment.toLocaleString()}
• Monthly Payment: $${s.monthly_payment.toLocaleString()}
• Term: ${s.term_months} months (${Math.floor(s.term_months / 12)} years)
• Interest Rate: ${s.interest_rate}%
• Type: ${s.plan_type === "finance" ? "🏦 Financing" : "📄 Lease"}

⭐ Match Score: ${s.positivity_score}/100

💡 Expert Recommendation:
${s.recommendations}
  `.trim();
}
