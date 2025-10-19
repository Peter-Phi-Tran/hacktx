/**
 * Scenario Details Modal - Shows financing scenario details when a star is clicked
 */

import type { VehicleStar } from "../types";

interface ScenarioDetailsModalProps {
  star: VehicleStar | null;
  onClose: () => void;
}

export function ScenarioDetailsModal({
  star,
  onClose,
}: ScenarioDetailsModalProps) {
  if (!star) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: star.color }}
            ></div>
            <h2 className="text-2xl font-bold text-white">{star.vehicle}</h2>
          </div>
          <p className="text-gray-400">
            {star.affordability.toUpperCase()} Match
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Range */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4">
            <div className="text-3xl font-bold text-white mb-1">
              ${star.monthly_payment.toLocaleString()}
              <span className="text-lg text-gray-400">/mo</span>
            </div>
            <div className="text-sm text-gray-300">{star.price_range}</div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
            <div className="text-gray-300 whitespace-pre-line leading-relaxed">
              {star.why}
            </div>
          </div>

          {/* Scenario Type Badge */}
          {star.scenarioType && (
            <div className="flex gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  star.scenarioType === "finance"
                    ? "bg-blue-900/50 text-blue-200 border border-blue-700"
                    : "bg-green-900/50 text-green-200 border border-green-700"
                }`}
              >
                {star.scenarioType === "finance"
                  ? "🏦 Financing Plan"
                  : "📄 Lease Plan"}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
