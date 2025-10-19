/**
 * Transform financing scenarios from the agent into VehicleStar format for constellation display
 * Updated: Circular positioning around center node
 */

import type { VehicleStar } from "../types";

interface AgentScenario {
  name: string;
  title: string;
  description: string;
  plan_type: "finance" | "lease";
  down_payment: number;
  monthly_payment: number;
  term_months: number;
  interest_rate: number;
  positivity_score: number;
  recommendations: string;
  suggested_model: string;
}

/**
 * Get star color based on plan type
 */
function getColorByPlanType(planType: "finance" | "lease"): string {
  return planType === "finance" ? "#4A90E2" : "#10B981"; // Blue for finance, Green for lease
}

/**
 * Get affordability rating based on positivity score
 */
function getAffordability(
  positivityScore: number
): "excellent" | "good" | "stretch" {
  if (positivityScore >= 80) return "excellent";
  if (positivityScore >= 60) return "good";
  return "stretch";
}

/**
 * Calculate star size based on positivity score
 * Higher score = bigger star (range: 6-12)
 */
function calculateStarSize(positivityScore: number): number {
  return 6 + (positivityScore / 100) * 6;
}

/**
 * Generate 3D position for star in a structured circle around the center
 * Creates a dispersed circular arrangement around the user node at origin (0,0,0)
 * with significant z-axis variation to prevent overlap when nodes expand/branch
 */
function generateCircularPosition(
  index: number,
  total: number
): { x: number; y: number; z: number } {
  // Calculate angle for even distribution around the circle
  const angle = (index / total) * Math.PI * 2;
  const angleDegrees = ((angle * 180) / Math.PI).toFixed(1);

  // Much larger radius to allow space for branching child nodes
  // Will be divided by 15 in rendering, so radius of 120 = ~8 units in world space
  // This gives plenty of room for expansion when a node is clicked
  const radius = 120;

  // Add significant Z-depth variation to create a 3D dispersed effect
  // Each node gets a unique z position based on its index
  // Creates a spiral/helix pattern with alternating depths
  const zVariation = Math.sin(angle * 3) * 30 + (index % 2 === 0 ? 15 : -15);

  // Center at 0,0,0 (matching UserNode position)
  const position = {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: zVariation,
  };

  console.log(
    `🎯 Node ${
      index + 1
    }/${total} positioned at ${angleDegrees}° - (x: ${position.x.toFixed(
      1
    )}, y: ${position.y.toFixed(1)}, z: ${position.z.toFixed(1)})`
  );

  return position;
}

/**
 * Transform agent scenarios to VehicleStar array for constellation view
 */
export function transformScenariosToStars(
  scenarios: Record<string, unknown>[]
): VehicleStar[] {
  console.log("🎨 Transforming scenarios with plan types:");
  
  return scenarios.map((scenario, index) => {
    // Type cast the scenario (convert through unknown first for safety)
    const s = scenario as unknown as AgentScenario;

    // Generate position in circular pattern
    const position = generateCircularPosition(index, scenarios.length);
    
    // Get color based on plan type
    const color = getColorByPlanType(s.plan_type);
    
    console.log(`  → Scenario ${index + 1}: ${s.suggested_model} - Plan: ${s.plan_type} - Color: ${color}`);

    // Create the star object
    const star: VehicleStar = {
      id: index + 1,
      vehicle: s.suggested_model || "Toyota Vehicle",
      x: position.x,
      y: position.y,
      z: position.z,
      size: calculateStarSize(s.positivity_score),
      color: color,
      monthly_payment: s.monthly_payment,
      affordability: getAffordability(s.positivity_score),
      price_range: `$${s.monthly_payment}/mo for ${s.term_months} months`,
      why: `${s.title}\n\n${s.description}\n\n💡 ${s.recommendations}`,
      scenarioType: s.plan_type,
    };

    return star;
  });
}

/**
 * Get detailed scenario info for display in popup
 */
export function getScenarioDetails(scenario: Record<string, unknown>): string {
  const s = scenario as unknown as AgentScenario;

  return `
🚗 ${s.suggested_model}

📋 Plan: ${s.title}
${s.description}

💰 Financial Details:
• Down Payment: $${s.down_payment.toLocaleString()}
• Monthly Payment: $${s.monthly_payment.toLocaleString()}
• Term: ${s.term_months} months (${Math.floor(s.term_months / 12)} years)
• Interest Rate: ${s.interest_rate}%
• Type: ${s.plan_type === "finance" ? "🏦 Financing" : "📄 Lease"}

⭐ Match Score: ${s.positivity_score}/100

💡 Expert Recommendation:
${s.recommendations}
  `.trim();
}

/**
 * Generate positions for child nodes around a parent node
 * Children are positioned AWAY from the center (radially outward from parent)
 * with increased z-axis variability and collision avoidance
 */
export function generateChildNodePositions(
  parentX: number,
  parentY: number,
  parentZ: number,
  childCount: number,
  existingNodes?: Array<{ x: number; y: number; z: number }>
): Array<{ x: number; y: number; z: number }> {
  const positions = [];
  const allExistingNodes = existingNodes || [];
  
  // Minimum safe distance between nodes to prevent overlap
  const MIN_DISTANCE = 45;
  
  // Calculate the direction vector from center (0,0,0) to parent
  const centerToParent = {
    x: parentX,
    y: parentY,
    z: parentZ,
  };
  
  // Normalize the vector to get the "outward" direction
  const magnitude = Math.sqrt(
    centerToParent.x ** 2 + centerToParent.y ** 2 + centerToParent.z ** 2
  );
  const outwardDirection = {
    x: centerToParent.x / magnitude,
    y: centerToParent.y / magnitude,
    z: centerToParent.z / magnitude,
  };

  // Larger radius for more spacing between child nodes
  const childRadius = 60;
  
  // Distance to push children away from parent (outward from center)
  const outwardDistance = 40;

  // Helper function to check if a position collides with existing nodes
  const hasCollision = (x: number, y: number, z: number): boolean => {
    for (const node of allExistingNodes) {
      const distance = Math.sqrt(
        (x - node.x) ** 2 + 
        (y - node.y) ** 2 + 
        (z - node.z) ** 2
      );
      if (distance < MIN_DISTANCE) {
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < childCount; i++) {
    let position = null;
    let attempts = 0;
    const maxAttempts = 20;

    // Try to find a collision-free position
    while (!position && attempts < maxAttempts) {
      // Distribute children in a cone/arc pattern away from center
      const angle = (i / childCount) * Math.PI * 2;
      
      // Add random angle variation to avoid perfect symmetry
      const angleVariation = (Math.random() - 0.5) * 0.3; // ±0.15 radians (~8.6 degrees)
      const adjustedAngle = angle + angleVariation;
      
      // Create a perpendicular plane to the outward direction
      const perpX = -outwardDirection.y;
      const perpY = outwardDirection.x;
      
      // Add variability to the radius for each child
      const radiusVariation = childRadius + (Math.random() - 0.5) * 20; // ±10 units
      
      // ENHANCED Z-AXIS VARIABILITY
      // Add significant random z-offset for each child (±30 units)
      const zVariation = (Math.random() - 0.5) * 60;
      
      // Add radial variation to outward distance
      const outwardVariation = outwardDistance + (Math.random() - 0.5) * 20; // ±10 units
      
      // Position on the circle perpendicular to outward direction
      const circleX = Math.cos(adjustedAngle) * perpX + Math.sin(adjustedAngle) * outwardDirection.z;
      const circleY = Math.cos(adjustedAngle) * perpY - Math.sin(adjustedAngle) * outwardDirection.z;
      const circleZ = Math.cos(adjustedAngle) * (-outwardDirection.x * perpX - outwardDirection.y * perpY);
      
      // Final position: parent + outward push + circular offset + z-variation
      const x = parentX + outwardDirection.x * outwardVariation + circleX * radiusVariation;
      const y = parentY + outwardDirection.y * outwardVariation + circleY * radiusVariation;
      const z = parentZ + outwardDirection.z * outwardVariation + circleZ * radiusVariation + zVariation;

      // Check for collisions with existing nodes
      if (!hasCollision(x, y, z)) {
        position = { x, y, z };
        allExistingNodes.push(position); // Add to tracking array
        
        // Calculate distance from center for verification
        const distFromCenter = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
        const parentDistFromCenter = Math.sqrt(parentX ** 2 + parentY ** 2 + parentZ ** 2);
        
        console.log(
          `   🌿 Child ${i + 1}/${childCount} at ${(
            (adjustedAngle * 180) /
            Math.PI
          ).toFixed(1)}° - Distance from center: ${distFromCenter.toFixed(1)} (parent: ${parentDistFromCenter.toFixed(1)}) z-offset: ${zVariation.toFixed(1)}`
        );
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`   ⚠️ Collision detected for child ${i + 1}, retrying (attempt ${attempts}/${maxAttempts})...`);
        }
      }
    }

    // If we couldn't find a collision-free spot after max attempts, use the last calculated position anyway
    // but warn about it
    if (!position) {
      const angle = (i / childCount) * Math.PI * 2;
      const perpX = -outwardDirection.y;
      const perpY = outwardDirection.x;
      const zVariation = (Math.random() - 0.5) * 60;
      
      const circleX = Math.cos(angle) * perpX + Math.sin(angle) * outwardDirection.z;
      const circleY = Math.cos(angle) * perpY - Math.sin(angle) * outwardDirection.z;
      const circleZ = Math.cos(angle) * (-outwardDirection.x * perpX - outwardDirection.y * perpY);
      
      const x = parentX + outwardDirection.x * outwardDistance + circleX * childRadius;
      const y = parentY + outwardDirection.y * outwardDistance + circleY * childRadius;
      const z = parentZ + outwardDirection.z * outwardDistance + circleZ * childRadius + zVariation;
      
      position = { x, y, z };
      console.warn(`   ⚠️ Child ${i + 1} placed despite potential collision (max attempts reached)`);
    }

    positions.push(position);
  }

  return positions;
}
