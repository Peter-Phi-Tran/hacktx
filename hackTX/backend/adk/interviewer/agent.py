import os
from typing import List, Dict, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class InterviewerAgent:
    def __init__(self):
        # Configure Google AI
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        self.conversation_history: List[Dict[str, str]] = []
        self.questions_asked = 0
        self.max_questions = 5
        
        # System prompt for the AI interviewer
        self.system_prompt = """You are a friendly and professional automotive finance interviewer for Toyota Financial Services. 

Your goal is to have a natural conversation to understand:
- Customer's personal background and current situation
- Employment status and income stability
- Vehicle needs and preferences
- Budget and financial goals
- Credit history and financing preferences

Guidelines:
- Ask ONE question at a time
- Keep questions conversational and friendly (2-3 sentences max)
- Listen to their answers and ask relevant follow-ups
- Be empathetic and understanding
- After getting key information, naturally conclude

Important: Return ONLY the question text, nothing else."""
    
    def get_first_question(self) -> str:
        """Generate the first interview question using AI"""
        self.questions_asked = 1
        
        try:
            prompt = f"""{self.system_prompt}

This is the start of a vehicle financing interview. Ask an engaging opening question to learn about the customer's situation and why they're interested in vehicle financing today.

Question:"""
            
            response = self.model.generate_content(prompt)
            question = response.text.strip()
            
            self.conversation_history.append({
                "role": "assistant",
                "content": question
            })
            
            print(f"[AI] Generated first question: {question}")
            return question
            
        except Exception as e:
            print(f"[ERROR] Failed to generate first question: {e}")
            # Fallback
            fallback = "Thank you for your interest in Toyota Financial Services! To help us better understand your needs, could you tell me a bit about your current situation and what brings you here today?"
            self.conversation_history.append({
                "role": "assistant",
                "content": fallback
            })
            return fallback
    
    def get_next_question(self, user_answer: str, all_answers: List[Dict]) -> str:
        """Generate next question based on conversation using AI"""
        self.questions_asked += 1
        
        # Store user's answer
        self.conversation_history.append({
            "role": "user",
            "content": user_answer
        })
        
        # Check if we should end the interview
        if self.questions_asked > self.max_questions:
            closing = "Thank you so much for your time! We have all the information we need. Our team will review your responses and get back to you shortly with personalized vehicle financing options."
            self.conversation_history.append({
                "role": "assistant",
                "content": closing
            })
            return closing
        
        try:
            # Build conversation context for AI
            conversation_text = ""
            for msg in self.conversation_history:
                role = "Interviewer" if msg["role"] == "assistant" else "Customer"
                conversation_text += f"{role}: {msg['content']}\n\n"
            
            prompt = f"""{self.system_prompt}

Conversation so far:
{conversation_text}

This is question {self.questions_asked} of {self.max_questions}. Based on what the customer just said, ask a relevant follow-up question to learn more about their vehicle financing needs.

Question:"""
            
            response = self.model.generate_content(prompt)
            next_question = response.text.strip()
            
            # Remove any quotes or extra formatting
            next_question = next_question.strip('"').strip("'").strip()
            
            self.conversation_history.append({
                "role": "assistant",
                "content": next_question
            })
            
            print(f"[AI] Generated question {self.questions_asked}: {next_question}")
            return next_question
            
        except Exception as e:
            print(f"[ERROR] AI generation failed: {e}")
            # Fallback to generic question
            return self._get_fallback_question()
    
    def _get_fallback_question(self) -> str:
        """Fallback predefined questions if AI fails"""
        questions = [
            "Could you tell me about your current employment status?",
            "What type of vehicle are you interested in?",
            "Do you have a budget range in mind for monthly payments?",
            "Have you financed a vehicle before?",
            "What's most important to you in a financing plan?"
        ]
        
        index = min(self.questions_asked - 1, len(questions) - 1)
        question = questions[index]
        
        self.conversation_history.append({
            "role": "assistant",
            "content": question
        })
        
        print(f"[FALLBACK] Using predefined question: {question}")
        return question
    
    def get_conversation_summary(self) -> Dict:
        """Get a summary of the conversation"""
        return {
            "total_questions": self.questions_asked,
            "conversation": self.conversation_history
        }