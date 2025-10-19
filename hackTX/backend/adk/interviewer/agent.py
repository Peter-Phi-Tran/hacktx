from google.adk.agents.llm_agent import Agent
import os
from typing import List, Dict, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

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

class InterviewerAgent:
    def __init__(self):
        # Configure AI model
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("[Interviewer] Warning: GOOGLE_API_KEY not set")
            self.model = None
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        
        # Agent state
        self.conversation_history: List[Dict] = []
        self.questions_asked = 0
        self.max_questions = 5
        self.current_question_text = ""
    
    def get_first_question(self) -> str:
        """Generate and return the first question"""
        question = "Thank you for your interest in Toyota Financial Services! To help us better understand your needs, could you tell me a bit about your current situation and what brings you here today?"
        
        self.conversation_history.append({
            "role": "assistant",
            "content": question
        })
        
        self.current_question_text = question
        self.questions_asked = 1
        
        return question
    
    def current_question(self) -> str:
        """Return the current question"""
        return self.current_question_text
    
    def next_question(self, answer: str) -> Optional[str]:
        """Generate next question based on answer, or return None if complete"""
        # Store user's answer
        self.conversation_history.append({
            "role": "user",
            "content": answer
        })
        
        # Check if we've asked enough questions
        if self.questions_asked >= self.max_questions:
            return None  # Interview complete
        
        # Generate next question using AI or predefined flow
        if self.model:
            next_q = self._generate_ai_question()
        else:
            next_q = self._get_fallback_question()
        
        self.conversation_history.append({
            "role": "assistant",
            "content": next_q
        })
        
        self.current_question_text = next_q
        self.questions_asked += 1
        
        return next_q
    
    def _generate_ai_question(self) -> str:
        """Use AI to generate contextual follow-up question"""
        try:
            conversation = "\n".join([
                f"{'Interviewer' if m['role']=='assistant' else 'User'}: {m['content']}"
                for m in self.conversation_history
            ])
            
            prompt = f"""You are conducting a financial interview for vehicle financing.

Previous conversation:
{conversation}

Based on the conversation, ask the next relevant question to understand:
- What type of vehicle they need
- Their budget/payment range
- Their financial situation
- Their timeline for purchase

Generate ONLY the next question (no explanation)."""
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[Interviewer] AI question generation failed: {e}")
            return self._get_fallback_question()
    
    def _get_fallback_question(self) -> str:
        """Fallback questions if AI is unavailable"""
        fallback_questions = [
            "What type of vehicle are you interested in?",
            "Do you have a budget range in mind for monthly payments?",
            "What is your current employment situation?",
            "When are you looking to make this purchase?",
            "Have you financed a vehicle before?"
        ]
        
        index = min(self.questions_asked, len(fallback_questions) - 1)
        return fallback_questions[index]