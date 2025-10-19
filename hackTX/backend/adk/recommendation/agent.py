import os
from typing import Dict, List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class RecommendationAgent:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
        
        # Toyota vehicle catalog
        self.vehicle_catalog = {
            "sedan": ["Camry", "Corolla", "Avalon"],
            "suv": ["RAV4", "Highlander", "4Runner", "Sequoia"],
            "truck": ["Tacoma", "Tundra"],
            "hybrid": ["Prius", "Camry Hybrid", "RAV4 Hybrid"],
            "electric": ["bZ4X"]
        }
        
        # Financing options
        self.financing_options = {
            "excellent_credit": {
                "apr_range": "2.9% - 4.9%",
                "terms": ["36 months", "48 months", "60 months"],
                "down_payment": "10-20%"
            },
            "good_credit": {
                "apr_range": "4.9% - 7.9%",
                "terms": ["48 months", "60 months", "72 months"],
                "down_payment": "15-25%"
            },
            "fair_credit": {
                "apr_range": "7.9% - 12.9%",
                "terms": ["60 months", "72 months"],
                "down_payment": "20-30%"
            }
        }
    
    def generate_recommendations(self, financial_analysis: Dict, conversation_history: List[Dict]) -> Dict:
        """Generate personalized vehicle and financing recommendations"""
        
        if not self.model:
            return self._fallback_recommendations(financial_analysis)
        
        try:
            # Build context
            conversation_text = "\n".join([
                f"{'Q' if msg['role'] == 'assistant' else 'A'}: {msg['content']}"
                for msg in conversation_history
            ])
            
            structured_data = financial_analysis.get("structured_data", {})
            risk_score = financial_analysis.get("risk_score", 0.5)
            
            prompt = f"""Based on this customer interview and financial analysis, provide personalized Toyota vehicle and financing recommendations:

**Interview Conversation:**
{conversation_text}

**Financial Analysis:**
Risk Score: {risk_score:.2f} (0=low risk, 1=high risk)
Structured Data: {structured_data}

**Available Toyota Vehicles:**
Sedans: {', '.join(self.vehicle_catalog['sedan'])}
SUVs: {', '.join(self.vehicle_catalog['suv'])}
Trucks: {', '.join(self.vehicle_catalog['truck'])}
Hybrids: {', '.join(self.vehicle_catalog['hybrid'])}

Provide recommendations in this format:

**Recommended Vehicles:**
1. [Primary recommendation with reasoning]
2. [Alternative option]

**Financing Plan:**
- Estimated APR range
- Recommended loan term
- Suggested down payment
- Estimated monthly payment range

**Next Steps:**
1. [Action item]
2. [Action item]
3. [Action item]

Keep it personalized, specific, and actionable."""

            response = self.model.generate_content(prompt)
            recommendations_text = response.text.strip()
            
            print(f"[Recommendation Agent] Generated recommendations")
            
            return {
                "recommendations": recommendations_text,
                "recommended_vehicles": self._extract_vehicle_recommendations(structured_data),
                "financing_plan": self._suggest_financing_plan(risk_score),
                "next_steps": self._generate_next_steps()
            }
            
        except Exception as e:
            print(f"[Recommendation Agent] Error: {e}")
            return self._fallback_recommendations(financial_analysis)
    
    def _extract_vehicle_recommendations(self, structured_data: Dict) -> List[str]:
        """Extract vehicle recommendations based on preferences"""
        vehicle_pref = structured_data.get("vehicle_preference", "").lower()
        
        if "sedan" in vehicle_pref:
            return ["Camry", "Corolla"]
        elif "suv" in vehicle_pref:
            return ["RAV4", "Highlander"]
        elif "truck" in vehicle_pref:
            return ["Tacoma", "Tundra"]
        else:
            return ["Camry", "RAV4"]  # Default recommendations
    
    def _suggest_financing_plan(self, risk_score: float) -> Dict:
        """Suggest financing plan based on risk score"""
        if risk_score < 0.3:
            tier = "excellent_credit"
        elif risk_score < 0.6:
            tier = "good_credit"
        else:
            tier = "fair_credit"
        
        return self.financing_options[tier]
    
    def _generate_next_steps(self) -> List[str]:
        """Generate next steps for the customer"""
        return [
            "Schedule a test drive at your nearest Toyota dealership",
            "Review and compare financing options",
            "Prepare required documents (ID, proof of income, proof of residence)",
            "Get pre-approved for financing",
            "Contact our financing team for personalized assistance"
        ]
    
    def _fallback_recommendations(self, financial_analysis: Dict) -> Dict:
        """Fallback recommendations without AI"""
        structured_data = financial_analysis.get("structured_data", {})
        risk_score = financial_analysis.get("risk_score", 0.5)
        
        return {
            "recommendations": "Based on your profile, we recommend exploring our popular models and financing options that match your budget.",
            "recommended_vehicles": self._extract_vehicle_recommendations(structured_data),
            "financing_plan": self._suggest_financing_plan(risk_score),
            "next_steps": self._generate_next_steps()
        }