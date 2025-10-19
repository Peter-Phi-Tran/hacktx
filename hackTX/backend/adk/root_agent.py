from .interviewer.agent import InterviewerAgent
from .reviewer.agent import ReviewerAgent
from .node_maker.agent import NodeMakerAgent

class RootAgent:
    def __init__(self):
        self.interviewer = InterviewerAgent()
        self.reviewer = ReviewerAgent()
        self.node_maker = NodeMakerAgent()
        self.answers = []
        self.session_data = {
            "answers": [],
            "analysis": None,
            "recommendations": None
        }

    def start_interview(self):
        return self.interviewer.get_first_question()
    
    def _validate_answer(self, question: str, answer: str) -> tuple[bool, str]:
        """
        Validate if answer is satisfactory
        Returns: (is_valid, feedback_message)
        """
        answer_lower = answer.lower().strip()
        question_lower = question.lower()
        
        # Check for generic non-answers FIRST
        non_answers = [
            "hi", "hello", "hey", "sup", "yo",
            "idk", "i don't know", "dunno", 
            "n/a", "nothing",
            "ok", "okay", "fine", "whatever"
        ]
        
        if answer_lower in non_answers:
            return False, "Could you provide a bit more detail? This will help us give you better recommendations."
        
        # CONTEXT-AWARE validation - check question type BEFORE general length checks
        
        # 1. Budget questions - accept numbers
        if any(kw in question_lower for kw in ["budget", "payment", "monthly", "afford", "spend"]):
            if any(char.isdigit() for char in answer):
                print(f"[RootAgent] Accepting numeric budget answer: {answer}")
                return True, ""
        
        # 2. Vehicle type questions - accept vehicle types
        vehicle_types = ["sedan", "suv", "truck", "van", "coupe", "hatchback", "crossover", "minivan",
                        "camry", "corolla", "rav4", "tacoma", "highlander", "4runner", "tundra", "sienna",
                        "prius", "avalon", "chr"]
        if any(kw in question_lower for kw in ["vehicle", "car", "type", "model", "interested in"]):
            if any(vtype in answer_lower for vtype in vehicle_types):
                print(f"[RootAgent] Accepting vehicle type answer: {answer}")
                return True, ""
        
        # 3. Timeline questions - accept time-related answers (EXPANDED)
        time_keywords = ["today", "tomorrow", "soon", "asap", "immediately", "now", "later",
                        "week", "weeks", "month", "months", "year", "years", 
                        "day", "days", "next", "this", "within", "january", "february", "march",
                        "april", "may", "june", "july", "august", "september", "october", 
                        "november", "december", "spring", "summer", "fall", "winter"]
        if any(kw in question_lower for kw in ["when", "timeline", "time", "purchase", "looking to"]):
            # Accept any time-related keyword OR numbers (like "2 months")
            if any(tk in answer_lower for tk in time_keywords) or any(char.isdigit() for char in answer):
                print(f"[RootAgent] Accepting timeline answer: {answer}")
                return True, ""
            # Also accept if it's just one word (likely a time reference)
            if len(answer.split()) == 1 and len(answer) > 2:
                print(f"[RootAgent] Accepting single-word timeline answer: {answer}")
                return True, ""
        
        # 4. Employment/financial questions - accept job titles, income mentions
        employment_keywords = ["employed", "student", "work", "job", "business", "income", "salary", 
                              "self-employed", "freelance", "retired", "unemployed", "engineer",
                              "teacher", "nurse", "manager", "developer", "doctor", "lawyer"]
        if any(kw in question_lower for kw in ["employment", "work", "job", "income", "financial", "situation"]):
            if any(ek in answer_lower for ek in employment_keywords) or any(char.isdigit() for char in answer):
                print(f"[RootAgent] Accepting employment/financial answer: {answer}")
                return True, ""
        
        # 5. Yes/no questions - be more lenient
        if any(kw in question_lower for kw in ["have you", "do you", "are you", "will you", "did you"]):
            if answer_lower in ["yes", "no", "yeah", "nope", "yep", "nah"]:
                # Accept simple yes/no but encourage detail
                print(f"[RootAgent] Accepting yes/no answer: {answer}")
                return True, ""
        
        # GENERAL validation for other cases
        word_count = len(answer.split())
        
        # Minimum 2 words for general questions
        if word_count < 2:
            return False, "Please provide a more detailed answer."
        
        # If it's 2-3 words and doesn't match context above, ask for more
        if word_count < 3:
            return False, "Could you provide a bit more detail? This will help us give you better recommendations."
        
        # 3+ words are generally acceptable
        print(f"[RootAgent] Accepting detailed answer: {answer}")
        return True, ""

    def process_answer(self, answer):
        question = self.interviewer.current_question()
        
        # Validate the answer first
        is_valid, feedback = self._validate_answer(question, answer)
        
        if not is_valid:
            # Return the same question with feedback
            print(f"[RootAgent] Invalid answer, repeating question. Feedback: {feedback}")
            return {
                "next_question": question,
                "is_complete": False,
                "is_followup": True,
                "validation": {
                    "is_valid": False,
                    "feedback": feedback
                },
                "progress": {
                    "current": self.interviewer.questions_asked,
                    "total": self.interviewer.max_questions
                }
            }
        
        # Answer is valid, store it and proceed
        self.answers.append({"question": question, "answer": answer})
        
        next_q = self.interviewer.next_question(answer)
        
        if next_q:
            # Interview continues
            return {
                "next_question": next_q,
                "is_complete": False,
                "is_followup": False,
                "validation": {
                    "is_valid": True,
                    "feedback": ""
                },
                "progress": {
                    "current": self.interviewer.questions_asked,
                    "total": self.interviewer.max_questions
                }
            }
        
        # Interview is complete, process with reviewer
        print("[RootAgent] Interview complete, processing with reviewer...")
        json_data = self.reviewer.process(self.answers)
        
        # Pass to node_maker for database comparison and node processing
        print("[RootAgent] Generating recommendations with node_maker...")
        nodes = self.node_maker.process(json_data)
        
        # Store results
        self.session_data["analysis"] = json_data
        self.session_data["recommendations"] = nodes
        
        return {
            "next_question": "Thank you for completing the interview! Your responses are being processed.",
            "is_complete": True,
            "is_followup": False,
            "validation": {
                "is_valid": True,
                "feedback": ""
            },
            "progress": {
                "current": self.interviewer.questions_asked,
                "total": self.interviewer.max_questions
            },
            "analysis": json_data,
            "recommendations": nodes
        }
    
    def get_session_data(self):
        """Get all session data"""
        return self.session_data
    
    def get_analysis(self):
        """Get analysis results"""
        return self.session_data.get("analysis")
    
    def get_recommendations(self):
        """Get recommendations"""
        return self.session_data.get("recommendations")