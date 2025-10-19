import { useState, useEffect } from 'react'
import { Constellation3D } from './Constellation3D'
import { ConfigPanel } from './ConfigPanel'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import type { FinancialConfig, VehicleStar } from '../types'
import { analyzeFinancialProfile } from '../api/client'

interface FinancialDashboardProps {
  onLogout?: () => void
  onBackToInterview?: () => void
}

// Generate mock stars based on config with varied 3D positioning
const generateStars = (config: FinancialConfig): VehicleStar[] => {
  const baseStars: VehicleStar[] = [
    {
      id: 1,
      vehicle: 'Toyota Camry',
      x: 110,
      y: -70,
      z: 55,
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
      x: -105,
      y: -55,
      z: -70,
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
      x: 70,
      y: 90,
      z: 35,
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
      x: -130,
      y: 50,
      z: -50,
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
      x: 135,
      y: 35,
      z: 75,
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
      y: -130,
      z: -90,
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
      x: -55,
      y: 115,
      z: 40,
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
      x: 90,
      y: -110,
      z: -35,
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

export const FinancialDashboard = ({ onLogout, onBackToInterview }: FinancialDashboardProps = {}) => {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Toggle to switch between API and mock data (for development/fallback)
  const useApi = true

  // Load initial data on mount
  useEffect(() => {
    if (useApi) {
      handleAnalyze()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = async () => {
    // Fallback to mock data if API is disabled
    if (!useApi) {
      const newStars = generateStars(config)
      setStars(newStars)
      return
    }

    setLoading(true)
    setError(null)

    // Track start time for minimum loading duration
    const startTime = Date.now()
    const minLoadTime = 2500 // 2.5 seconds

    try {
      // Call the real API
      const response = await analyzeFinancialProfile(config)
      
      // Convert backend response to VehicleStar format
      const vehicleStars: VehicleStar[] = response.vehicles.map(vehicle => ({
        id: vehicle.id,
        vehicle: vehicle.vehicle,
        x: vehicle.x,
        y: vehicle.y,
        z: vehicle.z,
        size: vehicle.size,
        color: vehicle.color,
        monthly_payment: vehicle.monthly_payment,
        affordability: vehicle.affordability,
        price_range: vehicle.price_range,
        why: vehicle.why
      }))

      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadTime - elapsed)
      
      await new Promise(resolve => setTimeout(resolve, remainingTime))
      
      setStars(vehicleStars)
    } catch (err) {
      console.error('API Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze financial profile')
      
      // Fallback to mock data on error
      const fallbackStars = generateStars(config)
      setStars(fallbackStars)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleAnalyze()
  }

  const handleDismissError = () => {
    setError(null)
  }

  return (
    <div className="financial-dashboard">
      {/* Loading Overlay */}
      {loading && (
        <LoadingSpinner 
          message="Analyzing your financial constellation..."
          subtext="Calculating optimal vehicle matches"
        />
      )}
      
      {/* Error Overlay */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      )}

      {/* Left Panel - Configuration */}
      <div className="dashboard-panel config-side">
        <ConfigPanel 
          config={config} 
          setConfig={setConfig} 
          onAnalyze={handleAnalyze}
          onLogout={onLogout}
          onBackToInterview={onBackToInterview}
        />
      </div>

      {/* Right Panel - Constellation View */}
      <div className="dashboard-panel constellation-side">
        <Constellation3D stars={stars} userConfig={config} />
        
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
