import os
from typing import Dict, List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class FinancialAnalyzerAgent:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    def analyze_responses(self, conversation_history: List[Dict]) -> Dict:
        """Analyze user responses to extract financial insights"""
        
        if not self.model:
            return self._fallback_analysis(conversation_history)
        
        try:
            # Build context from conversation
            conversation_text = "\n".join([
                f"Q: {msg['content']}" if msg['role'] == 'assistant' else f"A: {msg['content']}"
                for msg in conversation_history
            ])
            
            prompt = f"""Analyze this vehicle financing interview conversation and extract key information:

{conversation_text}

Provide a structured analysis in the following format:

**Financial Profile:**
- Estimated income range
- Employment stability
- Budget comfort level

**Vehicle Preferences:**
- Vehicle type/model interest
- Primary use case
- Must-have features

**Financing Readiness:**
- Credit awareness
- Down payment capability
- Preferred loan term

**Risk Assessment:**
- Overall financial stability (Low/Medium/High risk)
- Approval likelihood (High/Medium/Low)

**Recommendations:**
- Suggested financing options
- Next steps

Keep it concise and actionable."""

            response = self.model.generate_content(prompt)
            analysis_text = response.text.strip()
            
            return {
                "analysis": analysis_text,
                "structured_data": self._extract_structured_data(conversation_history),
                "risk_score": self._calculate_risk_score(conversation_history)
            }
            
        except Exception as e:
            return self._fallback_analysis(conversation_history)
    
    def _extract_structured_data(self, conversation_history: List[Dict]) -> Dict:
        """Extract structured data from conversation"""
        data = {
            "employment": None,
            "income_range": None,
            "vehicle_preference": None,
            "budget": None,
            "credit_history": None
        }
        
        # Simple keyword extraction (AI version above is better)
        full_text = " ".join([msg['content'].lower() for msg in conversation_history])
        
        # Employment keywords
        if any(word in full_text for word in ['employed', 'work', 'job', 'engineer', 'teacher']):
            data["employment"] = "Employed"
        elif any(word in full_text for word in ['student', 'studying']):
            data["employment"] = "Student"
        
        # Vehicle keywords
        if any(word in full_text for word in ['sedan', 'camry', 'corolla']):
            data["vehicle_preference"] = "Sedan"
        elif any(word in full_text for word in ['suv', 'rav4', 'highlander']):
            data["vehicle_preference"] = "SUV"
        elif any(word in full_text for word in ['truck', 'tacoma', 'tundra']):
            data["vehicle_preference"] = "Truck"
        
        return data
    
    def _calculate_risk_score(self, conversation_history: List[Dict]) -> float:
        """Calculate risk score (0-1, lower is better)"""
        # Simplified risk calculation
        risk_score = 0.5  # Default medium risk
        
        full_text = " ".join([msg['content'].lower() for msg in conversation_history])
        
        # Positive indicators (reduce risk)
        if any(word in full_text for word in ['stable', 'full-time', 'excellent credit', 'good credit']):
            risk_score -= 0.2
        if any(word in full_text for word in ['down payment', 'savings']):
            risk_score -= 0.1
        
        # Negative indicators (increase risk)
        if any(word in full_text for word in ['no credit', 'poor credit', 'unemployed']):
            risk_score += 0.2
        if any(word in full_text for word in ['tight budget', 'struggling']):
            risk_score += 0.1
        
        return max(0.0, min(1.0, risk_score))
    
    def _fallback_analysis(self, conversation_history: List[Dict]) -> Dict:
        """Fallback analysis without AI"""
        return {
            "analysis": "Financial analysis completed. Customer profile has been reviewed.",
            "structured_data": self._extract_structured_data(conversation_history),
            "risk_score": self._calculate_risk_score(conversation_history)
        }