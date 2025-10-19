from typing import Dict, List, Optional
from .interviewer.agent import InterviewerAgent
from .financial_analyzer.agent import FinancialAnalyzerAgent
from .recommendation.agent import RecommendationAgent
from .validator.agent import ResponseValidatorAgent

class RootAgent:
    def __init__(self):
        self.interviewer = InterviewerAgent()
        self.financial_analyzer = FinancialAnalyzerAgent()
        self.recommendation_agent = RecommendationAgent()
        self.validator = ResponseValidatorAgent()
        
        self.session_data = {
            "answers": [],
            "metadata": {},
            "analysis": None,
            "recommendations": None,
            "validation_history": []
        }
        
    def start_interview(self) -> str:
        """Initialize interview and get first question"""
        return self.interviewer.get_first_question()
    
    def process_answer(self, answer: str) -> Dict:
        """Process user answer with validation and get next question or complete interview"""
        
        print(f"[RootAgent] Processing answer: {answer[:50]}...")
        
        # Get current question
        current_question = self.interviewer.conversation_history[-1]["content"] if self.interviewer.conversation_history else ""
        
        # Ask validator to validate AND decide what to do
        should_proceed, validation, repeat_message = self.validator.validate_and_decide(
            question=current_question,
            answer=answer,
            conversation_context=self.interviewer.conversation_history
        )
        
        # Store validation history
        self.session_data["validation_history"].append({
            "question": current_question,
            "answer": answer,
            "validation": validation,
            "accepted": should_proceed
        })
        
        # If validator says NO - repeat the question
        if not should_proceed:
            print(f"[RootAgent] Validator rejected answer, repeating question")
            
            # Add to conversation history
            self.interviewer.conversation_history.append({
                "role": "user",
                "content": answer
            })
            self.interviewer.conversation_history.append({
                "role": "assistant",
                "content": repeat_message
            })
            
            return {
                "next_question": repeat_message,
                "is_complete": False,
                "is_followup": True,
                "validation": validation,
                "progress": {
                    "current": self.interviewer.questions_asked,
                    "total": self.interviewer.max_questions
                }
            }
        
        # Validator says YES - proceed with answer
        print(f"[RootAgent] Validator accepted answer, proceeding")
        
        # Store valid answer
        self.session_data["answers"].append({
            "question_number": self.interviewer.questions_asked,
            "question": current_question,
            "answer": answer,
            "validation": validation,
            "quality_score": validation.get("quality_score", 0.5)
        })
        
        # Get next question
        next_question = self.interviewer.get_next_question(answer, self.session_data["answers"])
        
        # Check completion
        is_complete = self.interviewer.questions_asked > self.interviewer.max_questions
        
        if is_complete:
            print("[RootAgent] Interview complete, running analysis...")
            self._run_analysis()
        
        return {
            "next_question": next_question,
            "is_complete": is_complete,
            "is_followup": False,
            "validation": validation,
            "progress": {
                "current": self.interviewer.questions_asked,
                "total": self.interviewer.max_questions
            },
            "analysis": self.session_data.get("analysis") if is_complete else None,
            "recommendations": self.session_data.get("recommendations") if is_complete else None
        }
    
    def _run_analysis(self):
        """Run financial analysis and generate recommendations"""
        try:
            # Step 1: Financial Analysis
            print("[RootAgent] Running financial analysis...")
            analysis = self.financial_analyzer.analyze_responses(
                self.interviewer.conversation_history
            )
            self.session_data["analysis"] = analysis
            print(f"[RootAgent] Analysis complete. Risk score: {analysis.get('risk_score', 'N/A')}")
            
            # Step 2: Generate Recommendations
            print("[RootAgent] Generating recommendations...")
            recommendations = self.recommendation_agent.generate_recommendations(
                analysis,
                self.interviewer.conversation_history
            )
            self.session_data["recommendations"] = recommendations
            print(f"[RootAgent] Recommendations complete. Vehicles: {recommendations.get('recommended_vehicles', [])}")
            
        except Exception as e:
            print(f"[RootAgent] Error in analysis/recommendations: {e}")
            import traceback
            traceback.print_exc()
    
    def get_session_data(self) -> Dict:
        """Get all session data including analysis and recommendations"""
        return {
            **self.session_data,
            "conversation_summary": self.interviewer.get_conversation_summary(),
            "average_quality_score": self._calculate_average_quality()
        }
    
    def _calculate_average_quality(self) -> float:
        """Calculate average quality score of all answers"""
        scores = [
            answer.get("quality_score", 0.5) 
            for answer in self.session_data["answers"]
        ]
        return sum(scores) / len(scores) if scores else 0.5
    
    def get_analysis(self) -> Optional[Dict]:
        """Get financial analysis results"""
        return self.session_data.get("analysis")
    
    def get_recommendations(self) -> Optional[Dict]:
        """Get recommendation results"""
        return self.session_data.get("recommendations")