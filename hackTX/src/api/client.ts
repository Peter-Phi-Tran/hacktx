/**
 * API Client for Tachyon Backend
 * Handles all communication with FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface FinancialConfig {
  income: number;
  credit_score: string;
  down_payment: number;
  monthly_budget: number;
  loan_term: number;
  vehicle_types: string[];
  priorities: string[];
  additional_context: string;
}

export interface VehicleRecommendation {
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

/**
 * Analyze user's financial profile and get vehicle recommendations
 */
export async function analyzeFinancialProfile(
  config: FinancialConfig
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ config }),
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
