from dotenv import load_dotenv
load_dotenv()

from hackTX.backend.adk.reviewer.agent import reviewer_agent

# Hardcoded interviewer output for testing
interviewer_output = {
    "conversation": (
        "Agent: What is your name?\n"
        "User: Jane Doe\n"
        "Agent: What is your income?\n"
        "User: $95,000\n"
        "Agent: What is your credit score?\n"
        "User: 720\n"
        "Agent: Do you prefer buying or leasing?\n"
        "User: Buying\n"
        "Agent: What Toyota model are you interested in?\n"
        "User: Camry Hybrid\n"
        "Agent: Where are you located?\n"
        "User: Austin, TX\n"
        "Agent: What is your current vehicle?\n"
        "User: Honda Accord\n"
        "Agent: Here are payment simulations...\n"
        "Agent: Here are plan comparisons...\n"
        "Agent: Here are some financial tips...\n"
        "Agent: Suggested Toyota models: Camry Hybrid, Prius\n"
    ),
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
    result = reviewer_agent.review(interviewer_output)
    print("Completeness logic output:")
    print(result)

if __name__ == "__main__":
    main()