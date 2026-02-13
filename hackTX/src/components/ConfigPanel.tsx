import React from "react";
import type { FinancialConfig } from "../types";

interface ConfigPanelProps {
  config: FinancialConfig;
  setConfig: (
    config: FinancialConfig | ((prev: FinancialConfig) => FinancialConfig)
  ) => void;
  onLogout?: () => void;
}

const vehicleTypeOptions = [
  { id: "sedan", label: "Sedan" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "hybrid", label: "Hybrid" },
];

const loanTermOptions = [36, 48, 60, 72];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  onLogout,
}) => {
  const handleVehicleTypeToggle = (typeId: string) => {
    setConfig((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(typeId)
        ? prev.vehicleTypes.filter((id) => id !== typeId)
        : [...prev.vehicleTypes, typeId],
    }));
  };

  return (
    <div className="config-panel">
      {/* Header */}
      <div className="config-header">
        <h1 className="config-title">Constellation View</h1>
        <p className="config-subtitle">Explore your financing options</p>
      </div>

      {/* Quick Stats Display */}
      <div className="stats-display">
        <div className="stat-item">
          <span className="stat-label">Monthly Budget</span>
          <span className="stat-value">${config.monthlyBudget}/mo</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Down Payment</span>
          <span className="stat-value">
            ${config.downPayment.toLocaleString()}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Credit Score</span>
          <span className="stat-value">
            {config.creditScore.split("-")[0]}-
            {config.creditScore.split("-")[1]}
          </span>
        </div>
      </div>

      {/* Controls Guide */}
      <div className="controls-section">
        <h2 className="section-title">Controls</h2>
        <div className="controls-list">
          <div className="control-item">
            <kbd className="kbd">Click</kbd>
            <span>View details & expand</span>
          </div>
          <div className="control-item">
            <kbd className="kbd">Drag</kbd>
            <span>Rotate view</span>
          </div>
          <div className="control-item">
            <kbd className="kbd">Scroll</kbd>
            <span>Zoom in/out</span>
          </div>
        </div>
      </div>

      {/* Simplified Filters */}
      <div className="section-card">
        <h2 className="section-title">Budget Settings</h2>

        {/* Monthly Budget */}
        <div className="param-control">
          <div className="param-header">
            <label htmlFor="monthlyBudget">Target Payment</label>
            <span className="param-value">${config.monthlyBudget}/mo</span>
          </div>
          <input
            id="monthlyBudget"
            type="range"
            min="200"
            max="2000"
            step="50"
            value={config.monthlyBudget}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                monthlyBudget: parseInt(e.target.value),
              }))
            }
            className="range-slider"
          />
        </div>

        {/* Loan Term */}
        <div className="param-control">
          <label htmlFor="loanTerm">Loan Term</label>
          <select
            id="loanTerm"
            value={config.loanTerm}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                loanTerm: parseInt(e.target.value),
              }))
            }
            className="select-input"
          >
            {loanTermOptions.map((term) => (
              <option key={term} value={term}>
                {term} months ({Math.floor(term / 12)} years)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simplified Vehicle Types */}
      <div className="section-card">
        <h2 className="section-title">Vehicle Types</h2>
        <div className="vehicle-types-grid">
          {vehicleTypeOptions.slice(0, 4).map((type) => (
            <button
              key={type.id}
              onClick={() => handleVehicleTypeToggle(type.id)}
              className={`vehicle-type-btn ${
                config.vehicleTypes.includes(type.id) ? "active" : ""
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      {onLogout && (
        <button onClick={onLogout} className="logout-btn">
          Sign Out
        </button>
      )}
    </div>
  );
};
