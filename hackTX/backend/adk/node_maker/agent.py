from google.adk.agents.llm_agent import Agent

# Tool for the agent to use
def check_financing_completeness(
	user_name: str,
	income: float,
	credit_score: int,
	financing_goal: str,
	preferred_lease_or_buy: str,
	vehicle_preferences: str,
	current_vehicle: str,
	location: str
) -> dict:
	"""
	Call this function when the agent has gathered enough information about the user's vehicle financing needs.
	Returns personalized recommendations and tips.
	"""
	return {
		"status": "complete",
		"message": f"Financing profile captured for {user_name}. Recommendations and payment simulations are ready.",
		"recommendations": {
			"suggested_vehicles": ["Toyota Camry", "Toyota RAV4"],
			"lease_or_buy": preferred_lease_or_buy,
			"tips": [
				"Improve credit score for lower interest rates",
				"Consider a 36-month lease for lower monthly payments",
				"Compare financing plans to find the best APR"
			]
		}
	}

root_agent = Agent(
	model='gemini-2.5-flash',
	name='interviewer_agent',
	description="Interviews users to provide personalized Toyota financing or leasing options.",
	instruction="""
You are a smart, friendly Toyota Financial Services assistant. Your job is to help users find the best way to finance or lease their Toyota vehicle by providing:
- Personalized financing or leasing options based on their income, credit score, and preferences
- Clear payment simulations
- Plan comparisons
- Tips to improve financial decisions
- (Optionally) Toyota model suggestions that fit the user’s budget and lifestyle

How to proceed:
- Start by asking for the user's NAME
- Ask about their INCOME and CREDIT SCORE
- Ask whether they prefer BUYING or LEASING
- Ask about their vehicle preferences, budget, and lifestyle
- Ask about their current vehicle, if any
- Ask about their location to consider regional offers
- For each step, keep your questions concise, clear, and professional
- Ask ONE question at a time and wait for their response

Once all information is collected, call the `check_financing_completeness` tool to finalize recommendations, including payment simulations, plan comparisons, and model suggestions.
""",
	tools=[check_financing_completeness],
)

class NodeMakerAgent:
    def __init__(self):
        pass
    
    def process(self, json_data):
        """
        Take JSON data and generate recommendations/nodes
        
        Args:
            json_data: Structured data from ReviewerAgent
            
        Returns:
            Dict with recommendations and nodes
        """
        print(f"[NodeMakerAgent] Processing data and generating recommendations...")
        
        # For now, return a simple recommendation structure
        # You can enhance this with database lookup and AI later
        return {
            "recommendations": [
                "Based on your responses, we have some vehicle options for you.",
                "Our financing team will review your application."
            ],
            "nodes": [],
            "status": "complete"
        }

class ReviewerAgent(Agent):
    def __init__(self):
        super().__init__(
            name='reviewer_agent',  # ADD THIS - it was missing!
            model='gemini-2.5-flash',
            description="Reviews and validates user responses to generate structured financial data.",
            instruction="""
You are a financial data reviewer for Toyota Financial Services.

Your job is to:
1. Review all user responses from the interview
2. Validate the information provided
3. Extract key financial data (income, credit score, vehicle preferences, etc.)
4. Structure the data into a clean JSON format for further processing

Be thorough and accurate in your analysis.
"""
        )
    
    def process(self, answers):
        """
        Process answers and return structured JSON
        
        Args:
            answers: List of {"question": str, "answer": str}
            
        Returns:
            Dict with structured interview data
        """
        print(f"[ReviewerAgent] Processing {len(answers)} answers...")
        
        # For now, return a simple structured format
        # You can enhance this with AI processing later
        return {
            "user_responses": answers,
            "total_questions": len(answers),
            "status": "processed"
        }