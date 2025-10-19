import { useState } from 'react'
import type { VehicleStar } from '../types'

interface ConstellationDemoProps {
  stars: VehicleStar[]
}

export const ConstellationDemo = ({ stars }: ConstellationDemoProps) => {
  const [selectedStar, setSelectedStar] = useState<VehicleStar | null>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  return (
    <div className="constellation-demo">
      {/* SVG Constellation View */}
      <div className="constellation-container">
        <svg 
          className="constellation-svg" 
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Background gradient */}
          <defs>
            <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            
            {/* Glow filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="url(#bgGradient)" />

          {/* Background stars */}
          {Array.from({ length: 100 }).map((_, i) => (
            <circle
              key={`bg-star-${i}`}
              cx={Math.random() * 1000}
              cy={Math.random() * 600}
              r={Math.random() * 1.5}
              fill="white"
              opacity={Math.random() * 0.5 + 0.3}
            />
          ))}

          {/* User position (center) */}
          <g transform="translate(500, 300)">
            <circle
              r="15"
              fill="#93c5fd"
              filter="url(#glow)"
              opacity="0.8"
            />
            <circle r="10" fill="#ffffff" />
            <text
              y="35"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              You
            </text>
          </g>

          {/* Vehicle stars */}
          {stars.map((star) => {
            const isHovered = hoveredStar === star.id
            const isSelected = selectedStar?.id === star.id
            const scale = isHovered || isSelected ? 1.5 : 1

            return (
              <g
                key={star.id}
                transform={`translate(${star.x * 3.5 + 500}, ${star.y * 2 + 300})`}
                onClick={() => setSelectedStar(star)}
                onMouseEnter={() => setHoveredStar(star.id)}
                onMouseLeave={() => setHoveredStar(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow */}
                <circle
                  r={star.size * 2 * scale}
                  fill={star.color}
                  opacity="0.3"
                  filter="url(#glow)"
                />
                
                {/* Star */}
                <circle
                  r={star.size * scale}
                  fill={star.color}
                  filter="url(#glow)"
                />
                
                {/* Label on hover */}
                {isHovered && (
                  <>
                    <text
                      y={star.size * -2 - 10}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {star.vehicle}
                    </text>
                    <text
                      y={star.size * -2 + 5}
                      textAnchor="middle"
                      fill="#93c5fd"
                      fontSize="10"
                    >
                      ${star.monthly_payment}/mo
                    </text>
                  </>
                )}

                {/* Connection line to user (optional) */}
                {isSelected && (
                  <line
                    x1={0}
                    y1={0}
                    x2={-star.x * 3.5}
                    y2={-star.y * 2}
                    stroke={star.color}
                    strokeWidth="2"
                    opacity="0.5"
                    strokeDasharray="5,5"
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="constellation-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#4ade80' }}></span>
            <span>Excellent Match</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#60a5fa' }}></span>
            <span>Good Match</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#fbbf24' }}></span>
            <span>Stretch Option</span>
          </div>
        </div>
      </div>

      {/* Vehicle Details Panel */}
      {selectedStar && (
        <div className="vehicle-details">
          <div className="details-header">
            <h2>{selectedStar.vehicle}</h2>
            <button
              className="close-btn"
              onClick={() => setSelectedStar(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="details-body">
            <div className="detail-row">
              <span className="label">Monthly Payment:</span>
              <span className="value">${selectedStar.monthly_payment}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Affordability:</span>
              <span
                className="value affordability-badge"
                style={{
                  background:
                    selectedStar.affordability === 'excellent'
                      ? '#4ade8033'
                      : selectedStar.affordability === 'good'
                      ? '#60a5fa33'
                      : '#fbbf2433',
                  color:
                    selectedStar.affordability === 'excellent'
                      ? '#4ade80'
                      : selectedStar.affordability === 'good'
                      ? '#60a5fa'
                      : '#fbbf24',
                }}
              >
                {selectedStar.affordability.charAt(0).toUpperCase() +
                  selectedStar.affordability.slice(1)}
              </span>
            </div>

            {selectedStar.price_range && (
              <div className="detail-row">
                <span className="label">Price Range:</span>
                <span className="value">{selectedStar.price_range}</span>
              </div>
            )}

            {selectedStar.why && (
              <div className="detail-row">
                <span className="label">Why This Vehicle:</span>
                <p className="why-text">{selectedStar.why}</p>
              </div>
            )}
          </div>

          <button className="explore-btn">
            Explore Financing Options →
          </button>
        </div>
      )}
    </div>
  )
}
