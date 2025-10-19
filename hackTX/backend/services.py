"""
Business logic for vehicle recommendations and financial calculations
"""
from typing import List, Tuple
from .models.schemas import FinancialConfig, VehicleRecommendation


# Toyota vehicle database
TOYOTA_VEHICLES = [
    {
        "id": 1,
        "vehicle": "Toyota Camry",
        "x": 110, "y": -70, "z": 55,
        "base_price": 28000,
        "monthly_payment": 385,
        "price_range": "$28,000 - $32,000",
        "why": "Perfect balance of reliability and affordability within your budget."
    },
    {
        "id": 2,
        "vehicle": "Toyota RAV4",
        "x": -105, "y": -55, "z": -70,
        "base_price": 30000,
        "monthly_payment": 420,
        "price_range": "$30,000 - $35,000",
        "why": "Great SUV option with excellent resale value."
    },
    {
        "id": 3,
        "vehicle": "Toyota Corolla",
        "x": 70, "y": 90, "z": 35,
        "base_price": 22000,
        "monthly_payment": 320,
        "price_range": "$22,000 - $26,000",
        "why": "Most economical choice with lower monthly payments."
    },
    {
        "id": 4,
        "vehicle": "Toyota Highlander",
        "x": -130, "y": 50, "z": -50,
        "base_price": 38000,
        "monthly_payment": 545,
        "price_range": "$38,000 - $45,000",
        "why": "Spacious 3-row SUV for families."
    },
    {
        "id": 5,
        "vehicle": "Toyota Prius",
        "x": 135, "y": 35, "z": 75,
        "base_price": 27000,
        "monthly_payment": 360,
        "price_range": "$27,000 - $32,000",
        "why": "Exceptional fuel economy saves you money long-term."
    },
    {
        "id": 6,
        "vehicle": "Toyota 4Runner",
        "x": 0, "y": -130, "z": -90,
        "base_price": 42000,
        "monthly_payment": 595,
        "price_range": "$42,000 - $50,000",
        "why": "Premium SUV with legendary reliability."
    },
    {
        "id": 7,
        "vehicle": "Toyota Tacoma",
        "x": -55, "y": 115, "z": 40,
        "base_price": 35000,
        "monthly_payment": 515,
        "price_range": "$35,000 - $42,000",
        "why": "Reliable mid-size truck with great resale value."
    },
    {
        "id": 8,
        "vehicle": "Toyota Tundra",
        "x": 90, "y": -110, "z": -35,
        "base_price": 45000,
        "monthly_payment": 675,
        "price_range": "$45,000 - $55,000",
        "why": "Full-size truck capability. Requires careful budgeting."
    }
]


def calculate_affordability(monthly_payment: float, budget: float) -> Tuple[str, str]:
    """
    Calculate affordability rating and color based on payment-to-budget ratio
    
    Args:
        monthly_payment: Monthly payment amount
        budget: User's monthly budget
        
    Returns:
        Tuple of (affordability_rating, color_hex)
    """
    ratio = monthly_payment / budget
    
    if ratio <= 0.85:
        return "excellent", "#4ade80"
    elif ratio <= 1.1:
        return "good", "#60a5fa"
    else:
        return "stretch", "#fbbf24"


def generate_vehicle_recommendations(config: FinancialConfig) -> List[VehicleRecommendation]:
    """
    Generate vehicle recommendations based on financial configuration
    
    Args:
        config: User's financial configuration
        
    Returns:
        List of vehicle recommendations
    """
    recommendations = []
    
    for vehicle in TOYOTA_VEHICLES:
        monthly_payment = vehicle["monthly_payment"]
        
        # Only include vehicles within 120% of budget
        if monthly_payment <= config.monthly_budget * 1.2:
            affordability, color = calculate_affordability(monthly_payment, config.monthly_budget)
            
            # Adjust size based on affordability
            size = 10 if affordability == "excellent" else (8 if affordability == "good" else 6)
            
            recommendations.append(VehicleRecommendation(
                id=vehicle["id"],
                vehicle=vehicle["vehicle"],
                x=vehicle["x"],
                y=vehicle["y"],
                z=vehicle["z"],
                size=size,
                color=color,
                monthly_payment=monthly_payment,
                affordability=affordability,
                price_range=vehicle.get("price_range"),
                why=vehicle.get("why")
            ))
    
    return recommendations


def calculate_monthly_payment(
    principal: float,
    annual_rate: float,
    num_months: int
) -> float:
    """
    Calculate monthly payment using amortization formula
    
    Args:
        principal: Loan principal amount
        annual_rate: Annual interest rate (as percentage, e.g., 5.5 for 5.5%)
        num_months: Number of monthly payments
        
    Returns:
        Monthly payment amount
    """
    if annual_rate == 0:
        return principal / num_months
    
    monthly_rate = annual_rate / 100 / 12
    payment = (principal * monthly_rate * (1 + monthly_rate) ** num_months) / \
              ((1 + monthly_rate) ** num_months - 1)
    
    return payment


def generate_financing_scenarios(vehicle_id: int, base_monthly_payment: float) -> List[dict]:
    """
    Generate 5 financing scenarios for a vehicle
    
    Args:
        vehicle_id: Vehicle ID
        base_monthly_payment: Current monthly payment
        
    Returns:
        List of financing scenario dictionaries
    """
    base_price = base_monthly_payment * 60  # Estimate base price
    
    scenarios_config = [
        {
            "name": "Low Down Payment",
            "down_payment_pct": 0.0,
            "loan_term": 72,
            "interest_rate": 6.5
        },
        {
            "name": "Standard Plan",
            "down_payment_pct": 0.1,
            "loan_term": 60,
            "interest_rate": 5.5
        },
        {
            "name": "High Down Payment",
            "down_payment_pct": 0.2,
            "loan_term": 48,
            "interest_rate": 4.5
        },
        {
            "name": "Short Term",
            "down_payment_pct": 0.15,
            "loan_term": 36,
            "interest_rate": 4.0
        },
        {
            "name": "Extended Term",
            "down_payment_pct": 0.05,
            "loan_term": 84,
            "interest_rate": 7.0
        }
    ]
    
    scenarios = []
    base_total_cost = base_monthly_payment * 60 + (base_price * 0.1)
    
    for idx, config in enumerate(scenarios_config):
        down_payment = base_price * config["down_payment_pct"]
        loan_amount = base_price - down_payment
        
        monthly_payment = calculate_monthly_payment(
            loan_amount,
            config["interest_rate"],
            config["loan_term"]
        )
        
        total_cost = monthly_payment * config["loan_term"] + down_payment
        savings = base_total_cost - total_cost
        
        scenarios.append({
            "id": vehicle_id * 1000 + idx + 1,
            "scenario_name": config["name"],
            "down_payment": round(down_payment, 2),
            "loan_term": config["loan_term"],
            "interest_rate": config["interest_rate"],
            "monthly_payment": round(monthly_payment, 2),
            "total_cost": round(total_cost, 2),
            "savings_vs_base": round(savings, 2),
            "outcome": f"Save ${abs(round(savings)):,}" if savings >= 0 else f"Costs ${abs(round(savings)):,} more"
        })
    
    return scenarios
