/**
 * API Client for Tachyon Backend
 * Handles all communication with FastAPI backend
 */

import type { FinancialConfig as FrontendFinancialConfig, VehicleRecommendation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Backend API uses snake_case, so we define the backend-specific interface
export interface BackendFinancialConfig {
  income: number;
  credit_score: string;
  down_payment: number;
  monthly_budget: number;
  loan_term: number;
  vehicle_types: string[];
  priorities: string[];
  additional_context: string;
}

export interface AnalysisResponse {
  vehicles: VehicleRecommendation[];
  timestamp: string;
  message: string;
}

export interface FinancingScenario {
  id: number;
  scenario_name: string;
  down_payment: number;
  loan_term: number;
  interest_rate: number;
  monthly_payment: number;
  total_cost: number;
  savings_vs_base: number;
  outcome: string;
}

// Convert frontend camelCase to backend snake_case
function toBackendConfig(config: FrontendFinancialConfig): BackendFinancialConfig {
  return {
    income: config.income,
    credit_score: config.creditScore,
    down_payment: config.downPayment,
    monthly_budget: config.monthlyBudget,
    loan_term: config.loanTerm,
    vehicle_types: config.vehicleTypes,
    priorities: config.priorities,
    additional_context: config.additionalContext,
  };
}

/**
 * Analyze user's financial profile and get vehicle recommendations
 */
export async function analyzeFinancialProfile(
  config: FrontendFinancialConfig
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ config: toBackendConfig(config) }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all available vehicles
 */
export async function getAllVehicles() {
  const response = await fetch(`${API_BASE_URL}/api/vehicles`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate financing scenarios for a specific vehicle
 */
export async function generateFinancingScenarios(
  vehicleId: number,
  monthlyPayment: number
): Promise<{ scenarios: FinancingScenario[] }> {
  const response = await fetch(
    `${API_BASE_URL}/api/scenarios/${vehicleId}?monthly_payment=${monthlyPayment}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Health check endpoint
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
