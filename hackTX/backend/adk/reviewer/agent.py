from typing import Dict, Any
from google.adk.agents.llm_agent import Agent

REVIEWER_INSTRUCTION = """
You are a helpful assistant that analyzes an interview conversation and extracts key information to populate a user's profile for Toyota financing or leasing.

Based on the conversation, determine if enough information has been gathered to understand the user's financial situation and preferences for Toyota vehicles. You need to have a good sense of their background, aspirations, values, current challenges, and all relevant Toyota-specific topics.

If the information is sufficient, respond with a JSON object containing the extracted information. The JSON object should have the following fields, populated with relevant data from the conversation:
- "is_complete": true
- "bio": "A 2-3 sentence summary of the user's background, values, and story."
- "goal": "A summary of the user's primary goals and aspirations."
- "location": "The user's current or most relevant location (city, state)."
- "interests": "A comma-separated list of keywords representing the user's interests."
- "skills": "A comma-separated list of keywords representing the user's skills."
- "title": "The user's current professional title or role (e.g., 'Software Engineer')."
- "income": "User's reported income."
- "credit_score": "User's reported credit score."
- "preferred_lease_or_buy": "Whether the user prefers leasing or buying."
- "vehicle_preferences": "User's preferences for Toyota vehicles (model, features, etc.)."
- "current_vehicle": "User's current vehicle, if any."
- "payment_simulations": "Summary or details of payment simulations discussed."
- "plan_comparisons": "Summary or details of plan comparisons discussed."
- "financial_tips": "Any financial tips provided."
- "suggested_models": "Toyota model suggestions that fit the user's budget and lifestyle."

If the information is NOT sufficient, respond with a JSON object with "is_complete" set to false, a "reason" explaining what is missing, and "missing_topics" - an array of the specific topics that still need to be covered. For example:
{
  "is_complete": false,
  "reason": "The conversation has not yet explored the user's payment simulations and plan comparisons.",
  "missing_topics": [
    "payment_simulations",
    "plan_comparisons"
  ]
}

Do not add any extra text or explanations outside of the JSON object in your response.
"""

def check_interview_completeness(conversation_history: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool function to check if the interview has gathered sufficient information.
    Args:
        conversation_history: The full conversation history between interviewer and user
        metadata: Structured data collected by the interviewer agent
    Returns:
        A dictionary with completeness assessment including:
        - is_complete: Whether the interview has enough information
        - completeness_score: A score from 0-1 indicating completeness
        - areas_covered: List of topics successfully covered
        - missing_areas: List of topics that still need exploration
        - reason: Explanation of the assessment
    """
    required_fields = [
        "bio", "goal", "location", "interests", "skills", "title",
        "income", "credit_score", "preferred_lease_or_buy", "vehicle_preferences",
        "current_vehicle", "payment_simulations", "plan_comparisons",
        "financial_tips", "suggested_models"
    ]
    areas_covered = [field for field in required_fields if metadata.get(field)]
    missing_areas = [field for field in required_fields if not metadata.get(field)]
    completeness_score = len(areas_covered) / len(required_fields)
    is_complete = completeness_score == 1.0
    reason = "All required fields present." if is_complete else f"Missing fields: {', '.join(missing_areas)}"
    return {
        "is_complete": is_complete,
        "completeness_score": completeness_score,
        "areas_covered": areas_covered,
        "missing_areas": missing_areas,
        "reason": reason
    }

class ReviewerAgent(Agent):
    def __init__(self):
        super().__init__(
            name="reviewer_agent",
            model="gemini-2.0-flash-exp",
            description="Reviews and validates user responses to generate structured financial data.",
            instruction="""
You are a financial data reviewer for Toyota Financial Services.

Your job is to:
1. Review all user responses from the interview
2. Validate the information provided
3. Extract key financial data (income, credit score, vehicle preferences, etc.)
4. Structure the data into a clean JSON format for further processing

Be thorough and accurate in your response.
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
        
        return {
            "user_responses": answers,
            "total_questions": len(answers),
            "status": "processed"
        }