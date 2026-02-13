/**
 * Scenario Details Popup - Compact window showing financing scenario metadata
 */

import { useState } from "react";
import type { VehicleStar } from "../types";

interface ScenarioDetailsModalProps {
  star: VehicleStar | null;
  onClose: () => void;
  onExpand?: (star: VehicleStar) => Promise<void>;
}

export function ScenarioDetailsModal({
  star,
  onClose,
  onExpand,
}: ScenarioDetailsModalProps) {
  const [isExpanding, setIsExpanding] = useState(false);

  if (!star) return null;

  console.log("ScenarioDetailsModal rendering with star:", star);

  const handleExpand = async () => {
    if (!onExpand || !star) return;

    setIsExpanding(true);
    try {
      await onExpand(star);
      onClose(); // Close modal after successful expansion
    } catch (error) {
      console.error("Error expanding node:", error);

      // Check error type and provide helpful message
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Invalid or expired token")
      ) {
        alert(
          "Session Expired\n\nYour login session has expired.\n\nPlease refresh the page and log in again to continue."
        );
        // Optionally trigger logout
        window.location.reload();
      } else if (
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("quota")
      ) {
        alert(
          "API Quota Exceeded\n\nThe Google Gemini API free tier limit (50 requests/day) has been reached.\n\nPlease:\n1. Wait a few minutes and try again\n2. Or upgrade to a paid API plan\n3. Or use a different API key"
        );
      } else {
        alert(
          "Failed to expand node. Please try again.\n\nError: " + errorMessage
        );
      }
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <div className="vehicle-details">
      {/* Header */}
      <div className="details-header">
        <h2>{star.vehicle}</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Body */}
      <div className="details-body">
        <div className="detail-row">
          <span className="label">Monthly Payment</span>
          <span className="value">
            ${star.monthly_payment.toLocaleString()}/mo
          </span>
        </div>

        <div className="detail-row">
          <span className="label">Price Range</span>
          <span className="value">{star.price_range}</span>
        </div>

        <div className="detail-row">
          <span className="label">Affordability</span>
          <span
            className="affordability-badge"
            style={{
              background:
                star.affordability === "excellent"
                  ? "rgba(34, 197, 94, 0.2)"
                  : star.affordability === "good"
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(234, 179, 8, 0.2)",
              color:
                star.affordability === "excellent"
                  ? "#86efac"
                  : star.affordability === "good"
                  ? "#93c5fd"
                  : "#fde047",
            }}
          >
            {star.affordability.toUpperCase()}
          </span>
        </div>

        {star.scenarioType && (
          <div className="detail-row">
            <span className="label">Plan Type</span>
            <span className="value">
              {star.scenarioType === "finance" ? "Financing" : "Lease"}
            </span>
          </div>
        )}

        <div className="detail-row">
          <span className="label">Why This Vehicle?</span>
          <p className="why-text">{star.why}</p>
        </div>
      </div>

      {/* Footer */}
      <button
        className="explore-btn"
        onClick={star.isExpanded ? onClose : handleExpand}
        disabled={isExpanding}
        style={{
          background: star.isExpanded
            ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
            : isExpanding
            ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
            : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          cursor: isExpanding ? "wait" : "pointer",
        }}
      >
        {isExpanding
          ? "Generating..."
          : star.isExpanded
          ? "Already Expanded"
          : "Let's Go Places"}
      </button>
    </div>
  );
}
