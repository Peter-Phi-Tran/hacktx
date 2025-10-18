import { useState } from 'react'
import { Constellation3D } from './Constellation3D'
import { ConfigPanel } from './ConfigPanel'

interface FinancialConfig {
  income: number
  creditScore: string
  downPayment: number
  monthlyBudget: number
  loanTerm: number
  vehicleTypes: string[]
  priorities: string[]
  additionalContext: string
}

interface VehicleStar {
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
}

// Generate mock stars based on config
const generateStars = (config: FinancialConfig): VehicleStar[] => {
  const baseStars: VehicleStar[] = [
    {
      id: 1,
      vehicle: 'Toyota Camry',
      x: 50,
      y: -30,
      z: 0,
      size: 10,
      color: '#4ade80',
      monthly_payment: 385,
      affordability: 'excellent',
      price_range: '$28,000 - $32,000',
      why: 'Perfect balance of reliability and affordability within your budget.'
    },
    {
      id: 2,
      vehicle: 'Toyota RAV4',
      x: -45,
      y: -25,
      z: 0,
      size: 9,
      color: '#4ade80',
      monthly_payment: 420,
      affordability: 'excellent',
      price_range: '$30,000 - $35,000',
      why: 'Great SUV option with excellent resale value.'
    },
    {
      id: 3,
      vehicle: 'Toyota Corolla',
      x: 30,
      y: 40,
      z: 0,
      size: 8,
      color: '#4ade80',
      monthly_payment: 320,
      affordability: 'excellent',
      price_range: '$22,000 - $26,000',
      why: 'Most economical choice with lower monthly payments.'
    },
    {
      id: 4,
      vehicle: 'Toyota Highlander',
      x: -60,
      y: 20,
      z: 0,
      size: 8,
      color: '#60a5fa',
      monthly_payment: 545,
      affordability: 'good',
      price_range: '$38,000 - $45,000',
      why: 'Spacious 3-row SUV for families.'
    },
    {
      id: 5,
      vehicle: 'Toyota Prius',
      x: 65,
      y: 15,
      z: 0,
      size: 9,
      color: '#4ade80',
      monthly_payment: 360,
      affordability: 'excellent',
      price_range: '$27,000 - $32,000',
      why: 'Exceptional fuel economy saves you money long-term.'
    },
    {
      id: 6,
      vehicle: 'Toyota 4Runner',
      x: 0,
      y: -60,
      z: 0,
      size: 7,
      color: '#60a5fa',
      monthly_payment: 595,
      affordability: 'good',
      price_range: '$42,000 - $50,000',
      why: 'Premium SUV with legendary reliability.'
    },
    {
      id: 7,
      vehicle: 'Toyota Tacoma',
      x: -25,
      y: 55,
      z: 0,
      size: 7,
      color: '#60a5fa',
      monthly_payment: 515,
      affordability: 'good',
      price_range: '$35,000 - $42,000',
      why: 'Reliable mid-size truck with great resale value.'
    },
    {
      id: 8,
      vehicle: 'Toyota Tundra',
      x: 40,
      y: -50,
      z: 0,
      size: 6,
      color: '#fbbf24',
      monthly_payment: 675,
      affordability: 'stretch',
      price_range: '$45,000 - $55,000',
      why: 'Full-size truck capability. Requires careful budgeting.'
    }
  ]

  // Filter based on budget and adjust affordability
  return baseStars.map(star => {
    const ratio = star.monthly_payment / config.monthlyBudget
    let affordability = 'excellent'
    let color = '#4ade80'
    
    if (ratio > 1.1) {
      affordability = 'stretch'
      color = '#fbbf24'
    } else if (ratio > 0.85) {
      affordability = 'good'
      color = '#60a5fa'
    }

    return {
      ...star,
      affordability,
      color,
      size: affordability === 'excellent' ? 10 : affordability === 'good' ? 8 : 6
    }
  }).filter(star => star.monthly_payment <= config.monthlyBudget * 1.2)
}

export const FinancialDashboard = () => {
  const [config, setConfig] = useState<FinancialConfig>({
    income: 5000,
    creditScore: '670-739',
    downPayment: 3000,
    monthlyBudget: 450,
    loanTerm: 60,
    vehicleTypes: ['sedan', 'suv'],
    priorities: ['safety', 'reliability', 'fuel_efficiency'],
    additionalContext: ''
  })

  const [stars, setStars] = useState<VehicleStar[]>(generateStars(config))

  const handleAnalyze = () => {
    // Regenerate constellation based on new config
    const newStars = generateStars(config)
    setStars(newStars)
  }

  return (
    <div className="financial-dashboard">
      {/* Left Panel - Configuration */}
      <div className="dashboard-panel config-side">
        <ConfigPanel 
          config={config} 
          setConfig={setConfig} 
          onAnalyze={handleAnalyze}
        />
      </div>

      {/* Right Panel - Constellation View */}
      <div className="dashboard-panel constellation-side">
        <Constellation3D stars={stars} />
        
        {/* Floating Stats */}
        <div className="floating-stats">
          <div className="stat-card">
            <span className="stat-label">Monthly Budget</span>
            <span className="stat-value">${config.monthlyBudget}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Down Payment</span>
            <span className="stat-value">${config.downPayment.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Loan Term</span>
            <span className="stat-value">{config.loanTerm} mo</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Options Found</span>
            <span className="stat-value">{stars.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
