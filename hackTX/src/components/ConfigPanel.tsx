import React from 'react'

// Type definitions
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

interface ConfigPanelProps {
  config: FinancialConfig
  setConfig: (config: FinancialConfig | ((prev: FinancialConfig) => FinancialConfig)) => void
  onAnalyze?: () => void
}

const vehicleTypeOptions = [
  { id: 'sedan', label: 'Sedan', description: 'Fuel-efficient and practical' },
  { id: 'suv', label: 'SUV', description: 'Spacious with cargo room' },
  { id: 'truck', label: 'Truck', description: 'Hauling and towing capacity' },
  { id: 'hybrid', label: 'Hybrid', description: 'Eco-friendly option' },
  { id: 'electric', label: 'Electric', description: 'Zero emissions' },
  { id: 'crossover', label: 'Crossover', description: 'Blend of sedan and SUV' }
]

const priorityOptions = [
  { id: 'safety', label: 'Safety', icon: ''},
  { id: 'fuel_efficiency', label: 'Fuel Efficiency', icon: ''},
  { id: 'cargo_space', label: 'Cargo Space', icon: ''},
  { id: 'towing', label: 'Towing', icon: ''},
  { id: 'technology', label: 'Technology', icon: ''},
  { id: 'reliability', label: 'Reliability', icon: ''},
  { id: 'resale_value', label: 'Resale Value', icon: ''},
  { id: 'comfort', label: 'Comfort', icon: ''}
]

const creditScoreRanges = [
  { value: '300-579', label: 'Poor (300-579)' },
  { value: '580-669', label: 'Fair (580-669)' },
  { value: '670-739', label: 'Good (670-739)' },
  { value: '740-799', label: 'Very Good (740-799)' },
  { value: '800-850', label: 'Excellent (800-850)' }
]

const loanTermOptions = [36, 48, 60, 72]

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  onAnalyze
}) => {
  const handleVehicleTypeToggle = (typeId: string) => {
    setConfig((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(typeId)
        ? prev.vehicleTypes.filter((id) => id !== typeId)
        : [...prev.vehicleTypes, typeId]
    }))
  }

  const handlePriorityToggle = (priorityId: string) => {
    setConfig((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priorityId)
        ? prev.priorities.filter((id) => id !== priorityId)
        : [...prev.priorities, priorityId]
    }))
  }

  return (
    <div className="config-panel">
      {/* Header */}
      <div className="config-header">
        <h1 className="config-title">Financial Constellation Console</h1>
        <p className="config-subtitle">Configure your financing journey</p>
      </div>

      {/* Controls Guide */}
      <div className="controls-section">
        <h2 className="section-title">Constellation Controls</h2>
        <div className="controls-list">
          <div className="control-item">
            <kbd className="kbd">Click</kbd>
            <span>View vehicle details</span>
          </div>
          <div className="control-item">
            <kbd className="kbd">Hover</kbd>
            <span>Quick preview</span>
          </div>
          <div className="control-item">
            <kbd className="kbd">Scroll</kbd>
            <span>Zoom constellation</span>
          </div>
        </div>
      </div>

      {/* Financial Parameters */}
      <div className="section-card">
        <h2 className="section-title">Financial Profile</h2>

        {/* Monthly Income */}
        <div className="param-control">
          <div className="param-header">
            <label htmlFor="income">Monthly Income</label>
            <span className="param-value">${config.income.toLocaleString()}</span>
          </div>
          <input
            id="income"
            type="range"
            min="2000"
            max="15000"
            step="100"
            value={config.income}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                income: parseInt(e.target.value)
              }))
            }
            className="range-slider"
          />
        </div>

        {/* Credit Score */}
        <div className="param-control">
          <label htmlFor="creditScore">Credit Score Range</label>
          <select
            id="creditScore"
            value={config.creditScore}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                creditScore: e.target.value
              }))
            }
            className="select-input"
          >
            {creditScoreRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Down Payment */}
        <div className="param-control">
          <div className="param-header">
            <label htmlFor="downPayment">Down Payment</label>
            <span className="param-value">${config.downPayment.toLocaleString()}</span>
          </div>
          <input
            id="downPayment"
            type="range"
            min="0"
            max="20000"
            step="500"
            value={config.downPayment}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                downPayment: parseInt(e.target.value)
              }))
            }
            className="range-slider"
          />
        </div>

        {/* Monthly Budget */}
        <div className="param-control">
          <div className="param-header">
            <label htmlFor="monthlyBudget">Monthly Payment Budget</label>
            <span className="param-value">${config.monthlyBudget.toLocaleString()}</span>
          </div>
          <input
            id="monthlyBudget"
            type="range"
            min="200"
            max="1000"
            step="25"
            value={config.monthlyBudget}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                monthlyBudget: parseInt(e.target.value)
              }))
            }
            className="range-slider"
          />
        </div>

        {/* Loan Term */}
        <div className="param-control">
          <label>Loan Term</label>
          <div className="loan-term-buttons">
            {loanTermOptions.map((term) => (
              <button
                key={term}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    loanTerm: term
                  }))
                }
                className={`term-button ${config.loanTerm === term ? 'active' : ''}`}
              >
                {term} mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle Type Toggles */}
      <div className="section-card">
        <h2 className="section-title">Vehicle Types</h2>
        <div className="toggle-grid">
          {vehicleTypeOptions.map((type) => (
            <button
              key={type.id}
              onClick={() => handleVehicleTypeToggle(type.id)}
              className={`toggle-button ${
                config.vehicleTypes.includes(type.id) ? 'active' : ''
              }`}
              title={type.description}
            >
              {type.label}
            </button>
          ))}
        </div>
        {config.vehicleTypes.length > 0 && (
          <div className="selection-count">
            Selected: {config.vehicleTypes.length} type{config.vehicleTypes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Priority Toggles */}
      <div className="section-card">
        <h2 className="section-title">Priorities</h2>
        <div className="toggle-grid">
          {priorityOptions.map((priority) => (
            <button
              key={priority.id}
              onClick={() => handlePriorityToggle(priority.id)}
              className={`toggle-button priority ${
                config.priorities.includes(priority.id) ? 'active' : ''
              }`}
            >
              <span className="priority-icon">{priority.icon}</span>
              {priority.label}
            </button>
          ))}
        </div>
        {config.priorities.length > 0 && (
          <div className="selection-count">
            Selected: {config.priorities.length} priorit{config.priorities.length !== 1 ? 'ies' : 'y'}
          </div>
        )}
      </div>

      {/* Additional Context */}
      <div className="section-card">
        <label htmlFor="context" className="section-title">
          Additional Context
        </label>
        <textarea
          id="context"
          placeholder="e.g., 'Need reliable winter performance' or 'Planning to start a family'"
          value={config.additionalContext}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              additionalContext: e.target.value
            }))
          }
          className="text-input"
          rows={3}
        />
      </div>

      {/* Analyze Button */}
      {onAnalyze && (
        <button onClick={onAnalyze} className="analyze-button">
            Regenerate Constellation
        </button>
      )}
    </div>
  )
}
