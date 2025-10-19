import os
from typing import Dict, Optional, Tuple
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class ResponseValidatorAgent:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("[Validator] Warning: GOOGLE_API_KEY not set, using fallback validation")
            self.model = None
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        
        self.validation_prompt = """You are a response validator for a vehicle financing interview.

Your job is to analyze if the user's answer:
1. Actually answers the question asked
2. Is realistic and makes sense
3. Provides useful information for financial assessment

Return a JSON response with:
{
    "is_valid": true/false,
    "is_relevant": true/false,
    "quality_score": 0.0-1.0,
    "should_accept": true/false,
    "issues": ["list of issues if any"],
    "reason": "why the answer is accepted or rejected"
}

Be strict with:
- One-word answers like "hi", "hello", "yes", "no", "ok"
- Completely off-topic responses
- Nonsensical or joke answers
- Answers that dodge the question

Mark should_accept as FALSE if the answer doesn't genuinely address the question."""

    def validate_and_decide(
        self, 
        question: str, 
        answer: str, 
        conversation_context: list = None
    ) -> Tuple[bool, Dict, Optional[str]]:
        """
        Validate response and decide whether to accept or repeat question.
        
        Args:
            question: The question that was asked
            answer: The user's answer
            conversation_context: Previous conversation for context
            
        Returns:
            Tuple of (should_proceed, validation_result, repeated_question_or_none)
        """
        
        # Run validation
        validation = self.validate_response(question, answer, conversation_context)
        
        # Decision logic: Should we accept this answer?
        should_accept = validation.get("is_valid", False) and validation.get("is_relevant", False)
        
        if not should_accept:
            # Generate message to repeat the question
            repeat_message = self._generate_repeat_message(question, validation)
            print(f"[Validator] REJECTING answer. Reason: {validation.get('issues', [])}")
            return False, validation, repeat_message
        else:
            print(f"[Validator] ACCEPTING answer. Quality: {validation.get('quality_score', 0):.2f}")
            return True, validation, None
    
    def _generate_repeat_message(self, original_question: str, validation: Dict) -> str:
        """Generate a helpful message to repeat the question"""
        
        # Use AI to generate contextual repeat message if available
        if self.model:
            try:
                prompt = f"""The user gave an inadequate answer to this question:
"{original_question}"

Issues: {', '.join(validation.get('issues', []))}

Generate a brief, encouraging message that:
1. Politely asks them to provide more detail
2. Restates ONLY the original question (don't add prefixes)
3. Is friendly and helpful
4. Keep it concise

Return ONLY the message text (no quotes)."""

                response = self.model.generate_content(prompt)
                message = response.text.strip().strip('"\'')
                
                # Remove duplicate phrases if AI generated them
                if message.count("I'd like to understand better") > 1:
                    message = message.replace("I'd like to understand better. ", "", 1)
                
                return message
            except Exception as e:
                print(f"[Validator] Error generating repeat message: {e}")
    
        # Fallback: Just the question with minimal prefix
        return f"Could you provide more detail? {original_question}"
    
    def validate_response(
        self, 
        question: str, 
        answer: str, 
        conversation_context: list = None
    ) -> Dict:
        """
        Validate if the user's response is appropriate and answers the question
        """
        
        # Basic checks first
        answer_stripped = answer.strip()
        
        # Empty or too short
        if not answer_stripped or len(answer_stripped) < 2:
            return {
                "is_valid": False,
                "is_relevant": False,
                "quality_score": 0.0,
                "issues": ["Answer is too short or empty"],
                "suggestion": "Please provide a more detailed answer to help us understand your needs.",
                "validated_answer": answer
            }
        
        # Use AI validation if available
        if self.model:
            try:
                return self._ai_validate(question, answer, conversation_context)
            except Exception as e:
                print(f"[Validator] AI validation failed: {e}, using fallback")
                return self._fallback_validate(question, answer)
        else:
            return self._fallback_validate(question, answer)
    
    def _ai_validate(self, question: str, answer: str, conversation_context: list = None) -> Dict:
        """Use AI to validate the response"""
        
        context_text = ""
        if conversation_context:
            context_text = "Previous conversation:\n"
            for msg in conversation_context[-4:]:
                role = "Interviewer" if msg.get("role") == "assistant" else "User"
                context_text += f"{role}: {msg.get('content', '')}\n"
        
        prompt = f"""{self.validation_prompt}

{context_text}

Current Question: {question}

User's Answer: {answer}

Analyze this response and return ONLY a JSON object with the validation results."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            import json
            import re
            
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                result["validated_answer"] = answer
                
                print(f"[Validator] AI validation: quality={result.get('quality_score', 0):.2f}, should_accept={result.get('should_accept', True)}")
                return result
            else:
                print("[Validator] Could not parse AI response, using fallback")
                return self._fallback_validate(question, answer)
                
        except Exception as e:
            print(f"[Validator] Error in AI validation: {e}")
            return self._fallback_validate(question, answer)
    
    def _fallback_validate(self, question: str, answer: str) -> Dict:
        """Fallback validation using rules-based logic with context awareness"""
    
        answer_lower = answer.lower().strip()
        question_lower = question.lower()
    
        issues = []
        quality_score = 0.5
        is_valid = True
        is_relevant = True
    
        # STRICT: Check for generic non-answers (greetings, dodges)
        generic_non_answers = [
            "hi", "hello", "hey", "sup", "yo",
            "idk", "i don't know", "dunno", 
            "n/a", "none", "nothing",
            "ok", "okay", "fine", "whatever"
        ]
    
        if answer_lower in generic_non_answers:
            return {
                "is_valid": False,
                "is_relevant": False,
                "quality_score": 0.0,
                "issues": [f"'{answer}' does not answer the question"],
                "suggestion": "Please provide a meaningful answer to the question.",
                "validated_answer": answer
            }
    
        # CONTEXT-AWARE: Check if short answer is actually valid based on question type
        word_count = len(answer.split())
    
        # Questions that can have short, valid answers
        budget_question = any(kw in question_lower for kw in ["budget", "payment", "monthly", "afford", "spend"])
        vehicle_question = any(kw in question_lower for kw in ["vehicle", "car", "type", "model", "interested in"])
        yes_no_question = any(kw in question_lower for kw in ["have you", "do you", "are you", "will you"])
    
        # Check if answer contains numbers (for budget questions)
        has_numbers = any(char.isdigit() for char in answer)
    
        # Check if answer contains vehicle-related words
        vehicle_types = ["sedan", "suv", "truck", "van", "coupe", "hatchback", "crossover", "minivan", "camry", "corolla", "rav4", "tacoma", "highlander"]
        is_vehicle_type = any(vtype in answer_lower for vtype in vehicle_types)
    
        # ACCEPT short but contextually valid answers
        if budget_question and has_numbers:
            # "500", "$300", "200-400" are valid for budget questions
            quality_score = 0.7
            is_valid = True
            is_relevant = True
            print(f"[Validator] Accepting numeric budget answer: {answer}")
    
        elif vehicle_question and is_vehicle_type:
            # "sedan", "SUV", "Camry" are valid for vehicle questions
            quality_score = 0.7
            is_valid = True
            is_relevant = True
            print(f"[Validator] Accepting vehicle type answer: {answer}")
    
        elif yes_no_question and answer_lower in ["yes", "no", "nope", "yeah", "yep"]:
            # Yes/No questions can have short answers
            quality_score = 0.6
            is_valid = True
            is_relevant = True
            print(f"[Validator] Accepting yes/no answer: {answer}")
    
        elif word_count < 2:
            # Still reject truly meaningless short answers
            return {
                "is_valid": False,
                "is_relevant": False,
                "quality_score": 0.1,
                "issues": ["Answer is too brief to be meaningful"],
                "suggestion": "Please provide more details in your answer.",
                "validated_answer": answer
            }
    
        # For longer answers, continue with normal validation
        if word_count >= 2 and not (budget_question and has_numbers) and not is_vehicle_type:
            if word_count < 3:
                issues.append("Answer could be more detailed")
                quality_score = 0.5
            elif word_count >= 5:
                quality_score += 0.2
    
            # Check relevance to question
            question_words = set(question_lower.split())
            answer_words = set(answer_lower.split())
            common_words = question_words.intersection(answer_words)
    
            stop_words = {"a", "an", "the", "is", "are", "what", "how", "do", "you", "your", "my", "i", "in", "for", "to"}
            meaningful_common = [w for w in common_words if w not in stop_words and len(w) > 2]
    
            # More lenient relevance check
            is_relevant = len(meaningful_common) > 0 or word_count >= 3
    
            if not is_relevant:
                quality_score -= 0.2
                issues.append("Answer might not be related to the question")
    
            # Context keywords boost
            financial_keywords = ["job", "work", "income", "salary", "employed", "student", "business", "freelance", "self-employed"]
            vehicle_keywords = vehicle_types + ["car", "drive", "commute", "toyota", "honda", "ford", "lease", "buy"]
            budget_keywords = ["budget", "afford", "payment", "monthly", "price", "cost", "dollar", "thousand", "$"]
    
            has_context = any(kw in answer_lower for kw in financial_keywords + vehicle_keywords + budget_keywords)
            if has_context:
                quality_score += 0.2
                is_relevant = True
    
        quality_score = max(0.0, min(1.0, quality_score))
    
        # More lenient validity threshold
        is_valid = quality_score >= 0.4 and is_relevant
    
        suggestion = None
        if not is_valid:
            suggestion = "Could you provide a bit more detail? This helps us give you better recommendations."
    
        return {
            "is_valid": is_valid,
            "is_relevant": is_relevant,
            "quality_score": quality_score,
            "issues": issues if issues else None,
            "suggestion": suggestion,
            "validated_answer": answer
        }
    
    def should_ask_followup(self, validation_result: Dict) -> bool:
        """Determine if interviewer should ask a follow-up clarifying question"""
        return (
            validation_result.get("quality_score", 1.0) < 0.5 or
            not validation_result.get("is_relevant", True)
        )
    
    def generate_followup_question(self, original_question: str, answer: str, validation_result: Dict) -> Optional[str]:
        """Generate a follow-up question if the answer needs clarification"""
        
        if not self.should_ask_followup(validation_result):
            return None
        
        if self.model:
            try:
                prompt = f"""The user was asked: "{original_question}"

They answered: "{answer}"

Issues: {', '.join(validation_result.get('issues', []))}

Generate a brief, friendly follow-up question to get more useful information. 
Keep it conversational and encouraging. Return ONLY the question text."""

                response = self.model.generate_content(prompt)
                followup = response.text.strip().strip('"\'')
                
                print(f"[Validator] Generated follow-up: {followup}")
                return followup
                
            except Exception as e:
                print(f"[Validator] Error generating follow-up: {e}")
        
        # Fallback follow-up questions
        fallback_followups = [
            "Could you tell me a bit more about that?",
            "That's interesting! Can you provide more details?",
            "I'd love to hear more - could you elaborate?",
            "Thanks for sharing. Can you give me some more context?",
        ]
        
        import random
        return random.choice(fallback_followups)