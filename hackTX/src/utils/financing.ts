/**
 * Financing calculation utilities
 */
import type { VehicleStar, FinancingScenario, AffordabilityRating } from '../types'

export interface FinancingScenarioConfig {
  name: string
  downPaymentPct: number
  loanTerm: number
  interestRate: number
}

/**
 * Calculate monthly payment using amortization formula
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  numMonths: number
): number {
  if (annualRate === 0) {
    return principal / numMonths
  }

  const monthlyRate = annualRate / 100 / 12
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numMonths)) /
    (Math.pow(1 + monthlyRate, numMonths) - 1)

  return payment
}

/**
 * Generate financing scenarios for a vehicle
 */
export function generateFinancingScenarios(
  parentStar: VehicleStar,
  parentIndex: number
): FinancingScenario[] {
  const basePrice = parentStar.monthly_payment * 60

  const scenarios: FinancingScenarioConfig[] = [
    {
      name: 'Low Down Payment',
      downPaymentPct: 0.0,
      loanTerm: 72,
      interestRate: 6.5
    },
    {
      name: 'Standard Plan',
      downPaymentPct: 0.1,
      loanTerm: 60,
      interestRate: 5.5
    },
    {
      name: 'High Down Payment',
      downPaymentPct: 0.2,
      loanTerm: 48,
      interestRate: 4.5
    },
    {
      name: 'Short Term',
      downPaymentPct: 0.15,
      loanTerm: 36,
      interestRate: 4.0
    },
    {
      name: 'Extended Term',
      downPaymentPct: 0.05,
      loanTerm: 84,
      interestRate: 7.0
    }
  ]

  const radiusVariations = [2, 3, 2.5, 3.5, 2.8]
  const zOffsets = [-1.5, 1, -1, 2, 0.5]
  const angleOffsets = [0.3, -0.2, 0.5, -0.4, 0.1]

  return scenarios.map((scenario, index) => {
    const baseAngle = (index / scenarios.length) * Math.PI * 2
    const angle = baseAngle + angleOffsets[index]
    const radius = radiusVariations[index]

    const xOffset = Math.cos(angle) * radius
    const yOffset = Math.sin(angle) * radius
    const zOffset = zOffsets[index]

    const downPayment = basePrice * scenario.downPaymentPct
    const loanAmount = basePrice - downPayment
    const monthlyPayment = calculateMonthlyPayment(
      loanAmount,
      scenario.interestRate,
      scenario.loanTerm
    )

    const totalCost = monthlyPayment * scenario.loanTerm + downPayment
    const baseTotalCost = parentStar.monthly_payment * 60 + basePrice * 0.1

    return {
      id: parentIndex * 1000 + index + 1,
      vehicle: `${parentStar.vehicle} - ${scenario.name}`,
      x: parentStar.x + xOffset * 15,
      y: parentStar.y + yOffset * 15,
      z: parentStar.z + zOffset * 15,
      size: 6,
      color: getAffordabilityColor(scenario.name),
      monthly_payment: Math.round(monthlyPayment),
      affordability: getAffordabilityRating(scenario.name),
      parentId: parentStar.id,
      scenarioType: scenario.name.toLowerCase().replace(/ /g, '_'),
      scenarioName: scenario.name,
      details: {
        downPayment: Math.round(downPayment),
        loanTerm: scenario.loanTerm,
        interestRate: scenario.interestRate,
        totalCost: Math.round(totalCost),
        savingsVsBase: Math.round(baseTotalCost - totalCost)
      },
      outcome:
        totalCost < baseTotalCost
          ? `Save $${Math.abs(Math.round(baseTotalCost - totalCost)).toLocaleString()} over standard plan`
          : `Costs $${Math.abs(Math.round(baseTotalCost - totalCost)).toLocaleString()} more than standard plan`
    }
  })
}

/**
 * Get color based on scenario type
 */
function getAffordabilityColor(scenarioName: string): string {
  if (scenarioName.includes('High Down') || scenarioName.includes('Short Term')) {
    return '#4ade80' // green
  } else if (scenarioName.includes('Standard')) {
    return '#60a5fa' // blue
  } else {
    return '#fbbf24' // yellow
  }
}

/**
 * Get affordability rating based on scenario type
 */
function getAffordabilityRating(scenarioName: string): AffordabilityRating {
  if (scenarioName.includes('High Down') || scenarioName.includes('Short Term')) {
    return 'excellent'
  } else if (scenarioName.includes('Standard')) {
    return 'good'
  } else {
    return 'stretch'
  }
}
