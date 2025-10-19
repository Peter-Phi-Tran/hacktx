from dotenv import load_dotenv
load_dotenv()

from hackTX.backend.adk.reviewer.agent import reviewer_agent
from hackTX.backend.adk.node_maker.agent import node_maker_agent
import json

# Hardcoded interviewer output for testing
interviewer_output = {
    "conversation": "...",  # (your full conversation string here)
    "metadata": {
        "bio": "Jane is a software engineer living in Austin, TX, passionate about technology and cars.",
        "goal": "Buy a new Toyota Camry Hybrid.",
        "location": "Austin, TX",
        "interests": "cars, technology, travel",
        "skills": "programming, budgeting",
        "title": "Software Engineer",
        "income": 95000,
        "credit_score": 720,
        "preferred_lease_or_buy": "buy",
        "vehicle_preferences": "Toyota Camry Hybrid, safety features, fuel efficiency",
        "current_vehicle": "Honda Accord",
        "payment_simulations": "Estimated monthly payment: $350 for 60 months.",
        "plan_comparisons": "Compared lease and buy options; buying is more cost-effective for Jane.",
        "financial_tips": "Consider a larger down payment to reduce monthly payments.",
        "suggested_models": "Toyota Camry Hybrid, Toyota Prius"
    }
}

def main():
    reviewer_result = reviewer_agent.review(interviewer_output)
    node_maker_output = node_maker_agent.process(reviewer_result)
    print("\nRaw Node maker output:")
    print(node_maker_output)
    print("\nFormatted Node maker output:")
    for i, scenario in enumerate(node_maker_output, 1):
        print(f"\nScenario {i}:")
        for k, v in scenario.items():
            print(f"  {k}: {v}")

if __name__ == "__main__":
    main()