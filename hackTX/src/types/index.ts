/**
 * Shared type definitions for the Tachyon Financial Constellation application
 */

// Financial configuration for user input
export interface FinancialConfig {
  income: number;
  creditScore: string;
  downPayment: number;
  monthlyBudget: number;
  loanTerm: number;
  vehicleTypes: string[];
  priorities: string[];
  additionalContext: string;
}

// Vehicle star representation in the 3D constellation
export interface VehicleStar {
  id: number;
  vehicle: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  monthly_payment: number;
  affordability: string;
  price_range?: string;
  why?: string;
  parentId?: number;
  scenarioType?: string;
  level?: number; // 0 = root level, 1 = first branch, 2 = second branch, etc.
  branchType?: BranchType; // What type of scenario this branch represents
  children?: VehicleStar[]; // Child nodes when expanded
  isExpanded?: boolean; // Whether this node has been expanded
}

// Branch types for each level of exploration
export type BranchType =
  | "financing" // Level 1: Payment structures
  | "trim_levels" // Level 2: Vehicle configurations
  | "add_ons" // Level 3: Warranties, packages
  | "insurance" // Level 4: Insurance scenarios
  | "maintenance" // Level 5: Service plans
  | "trade_in" // Level 6: Trade-in calculations
  | "lease_vs_buy" // Level 7: Ownership comparisons
  | "refinancing" // Level 8: Refinance options
  | "early_payoff" // Level 9: Early payment scenarios
  | "alternatives"; // Level 10: Similar vehicles

// Map level numbers to branch types
export const LEVEL_TO_BRANCH_TYPE: Record<number, BranchType> = {
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

// Financing scenario - extends VehicleStar with additional details
export interface FinancingScenario extends VehicleStar {
  parentId: number;
  scenarioType: string;
  scenarioName: string;
  details: {
    downPayment: number;
    loanTerm: number;
    interestRate: number;
    totalCost: number;
    savingsVsBase: number;
  };
  outcome: string;
}

// User configuration for display purposes
export interface UserConfig {
  income: number;
  creditScore: string;
  downPayment: number;
  monthlyBudget: number;
  loanTerm: number;
}

// Affordability rating types
export type AffordabilityRating = "excellent" | "good" | "stretch";

// Credit score ranges
export type CreditScoreRange =
  | "300-579"
  | "580-669"
  | "670-739"
  | "740-799"
  | "800-850";

// Vehicle types
export type VehicleType =
  | "sedan"
  | "suv"
  | "truck"
  | "hybrid"
  | "electric"
  | "crossover";

// Priority options
export type Priority =
  | "safety"
  | "fuel_efficiency"
  | "cargo_space"
  | "towing"
  | "technology"
  | "reliability"
  | "resale_value"
  | "comfort";

// API Response types (for future backend integration)
export interface VehicleRecommendation {
  id: number;
  vehicle: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  monthly_payment: number;
  affordability: AffordabilityRating;
  price_range: string;
  why: string;
}

export interface AnalysisResponse {
  recommendations: VehicleRecommendation[];
  user_profile: {
    income: number;
    credit_score: string;
    down_payment: number;
    monthly_budget: number;
  };
  timestamp: string;
}
