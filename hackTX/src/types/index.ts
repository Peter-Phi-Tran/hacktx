/**
 * Shared type definitions for the Tachyon Financial Constellation application
 */

// Financial configuration for user input
export interface FinancialConfig {
  income: number
  creditScore: string
  downPayment: number
  monthlyBudget: number
  loanTerm: number
  vehicleTypes: string[]
  priorities: string[]
  additionalContext: string
}

// Vehicle star representation in the 3D constellation
export interface VehicleStar {
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

// Financing scenario - extends VehicleStar with additional details
export interface FinancingScenario extends VehicleStar {
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

// User configuration for display purposes
export interface UserConfig {
  income: number
  creditScore: string
  downPayment: number
  monthlyBudget: number
  loanTerm: number
}

// Affordability rating types
export type AffordabilityRating = 'excellent' | 'good' | 'stretch'

// Credit score ranges
export type CreditScoreRange = '300-579' | '580-669' | '670-739' | '740-799' | '800-850'

// Vehicle types
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'hybrid' | 'electric' | 'crossover'

// Priority options
export type Priority = 'safety' | 'fuel_efficiency' | 'cargo_space' | 'towing' | 'technology' | 'reliability' | 'resale_value' | 'comfort'

// API Response types (for future backend integration)
export interface VehicleRecommendation {
  id: number
  vehicle: string
  monthly_payment: number
  affordability: AffordabilityRating
  price_range: string
  why: string
  position: {
    x: number
    y: number
    z: number
  }
}

export interface AnalysisResponse {
  recommendations: VehicleRecommendation[]
  user_profile: {
    income: number
    credit_score: string
    down_payment: number
    monthly_budget: number
  }
  timestamp: string
}
