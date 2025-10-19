from typing import Dict, List, Optional
from .interviewer.agent import InterviewerAgent

class RootAgent:
    def __init__(self):
        self.interviewer = InterviewerAgent()
        self.session_data = {
            "answers": [],
            "metadata": {}
        }
        
    def start_interview(self) -> str:
        """Initialize interview and get first question"""
        return self.interviewer.get_first_question()
    
    def process_answer(self, answer: str) -> Dict:
        """Process user answer and get next question or complete interview"""
        
        # Store the answer
        self.session_data["answers"].append({
            "question_number": self.interviewer.questions_asked,
            "answer": answer,
            "question": self.interviewer.conversation_history[-1]["content"] if self.interviewer.conversation_history else ""
        })
        
        # Get next question
        next_question = self.interviewer.get_next_question(answer, self.session_data["answers"])
        
        # Check if interview is complete
        is_complete = self.interviewer.questions_asked > self.interviewer.max_questions
        
        return {
            "next_question": next_question,
            "is_complete": is_complete,
            "progress": {
                "current": self.interviewer.questions_asked,
                "total": self.interviewer.max_questions
            },
            "conversation_summary": self.interviewer.get_conversation_summary() if is_complete else None
        }
    
    def get_session_data(self) -> Dict:
        """Get all session data"""
        return {
            **self.session_data,
            "conversation_summary": self.interviewer.get_conversation_summary()
        }