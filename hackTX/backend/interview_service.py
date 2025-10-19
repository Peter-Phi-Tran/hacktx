"""
Interview service to handle agent interactions and session management
"""
import json
import uuid
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from google import genai

from .models import InterviewSession, User

# Initialize the Google Generative AI client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def create_interview_session(db: Session, user_id: int) -> Tuple[str, str]:
    """
    Create a new interview session and get the first question
    
    Returns:
        Tuple of (session_id, first_question)
    """
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Get first question from interviewer agent
    first_question = "Hi! I'm your Toyota Financial Services assistant. I'm here to help you find the best financing or leasing option for your dream Toyota vehicle. Let's start by getting to know you better. What's your name?"
    
    # Initialize conversation history
    conversation_history = [
        {
            "role": "agent",
            "content": first_question,
            "timestamp": datetime.now().isoformat()
        }
    ]
    
    # Create session in database
    session = InterviewSession(
        session_id=session_id,
        user_id=user_id,
        conversation_history=json.dumps(conversation_history),
        is_complete=False
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session_id, first_question


def process_interview_answer(
    db: Session,
    session_id: str,
    user_answer: str
) -> Tuple[str, bool]:
    """
    Process user's answer and get next question from agent
    
    Returns:
        Tuple of (next_question, is_complete)
    """
    # Get session from database
    session = db.query(InterviewSession).filter(
        InterviewSession.session_id == session_id
    ).first()
    
    if not session:
        raise ValueError(f"Interview session {session_id} not found")
    
    if session.is_complete:
        raise ValueError("Interview is already complete")
    
    # Load conversation history
    conversation_history = json.loads(session.conversation_history)
    
    # Add user's answer to history
    conversation_history.append({
        "role": "user",
        "content": user_answer,
        "timestamp": datetime.now().isoformat()
    })
    
    # Build conversation context for agent
    conversation_text = "\n\n".join([
        f"{'Agent' if msg['role'] == 'agent' else 'User'}: {msg['content']}"
        for msg in conversation_history
    ])
    
    # Get next question from interviewer agent
    try:
        # Build interviewer instruction
        interviewer_instruction = """
You are a smart, friendly Toyota Financial Services assistant. Your job is to help users find the best way to finance or lease their Toyota vehicle.

Your role is to conduct a conversational interview to gather all necessary information about the user's financial situation and vehicle preferences.

**IMPORTANT: Ask ONE question at a time and wait for the user's response before proceeding.**

Information you need to collect:
1. User's NAME
2. User's LOCATION (city, state)
3. User's CURRENT VEHICLE (if any)
4. User's PROFESSIONAL TITLE/ROLE
5. User's ANNUAL INCOME
6. User's CREDIT SCORE
7. Their primary GOAL (what they want to achieve with a Toyota vehicle)
8. Whether they prefer BUYING or LEASING
9. Their VEHICLE PREFERENCES (Toyota models, features they care about)
10. Their INTERESTS outside of cars
11. Their SKILLS

Once you have ALL this information, respond with "INTERVIEW_COMPLETE" followed by a thank you message.
"""
        
        # Use the client to generate next question
        prompt = f"""{interviewer_instruction}

Based on this conversation so far, determine your next question.

Conversation:
{conversation_text}

Your response:"""
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        agent_response = response.text
        
        # Check if interview is complete
        is_complete = "INTERVIEW_COMPLETE" in agent_response.upper()
        
        if is_complete:
            # Extract the thank you message (everything after INTERVIEW_COMPLETE)
            next_question = agent_response.split("INTERVIEW_COMPLETE")[-1].strip()
            if not next_question:
                next_question = "Thank you for providing all this information! I'm now analyzing your profile to create personalized financing options for you."
        else:
            next_question = agent_response
        
    except Exception as e:
        print(f"Error getting agent response: {e}")
        # Fallback to simple continuation
        next_question = "Thank you! Could you tell me more about your financial situation?"
        is_complete = False
    
    # Add agent's response to history
    conversation_history.append({
        "role": "agent",
        "content": next_question,
        "timestamp": datetime.now().isoformat()
    })
    
    # Update session
    session.conversation_history = json.dumps(conversation_history)
    
    if is_complete:
        session.is_complete = True
        session.completed_at = datetime.now()
        
        # Process with reviewer and node_maker agents
        try:
            extracted_profile, scenarios = process_complete_interview(conversation_text)
            session.extracted_profile = json.dumps(extracted_profile)
            session.financing_scenarios = json.dumps(scenarios)
        except Exception as e:
            print(f"Error processing complete interview: {e}")
    
    db.commit()
    db.refresh(session)
    
    return next_question, is_complete


def process_complete_interview(conversation_text: str) -> Tuple[Dict, List[Dict]]:
    """
    Process completed interview with reviewer and node_maker agents
    
    Returns:
        Tuple of (extracted_profile, financing_scenarios)
    """
    # Step 1: Use reviewer agent to extract and validate profile
    reviewer_instruction = """
You are a helpful assistant that analyzes an interview conversation and extracts key information to populate a user's profile for Toyota financing or leasing.

Based on the conversation, determine if enough information has been gathered to understand the user's financial situation and preferences.

If the information is sufficient, respond with a JSON object containing the extracted information with these fields:
- "is_complete": true
- "bio": User's background summary
- "goal": User's goals
- "location": User's location
- "interests": User's interests
- "skills": User's skills
- "title": User's job title
- "income": User's income (numeric)
- "credit_score": User's credit score (numeric)
- "preferred_lease_or_buy": "lease" or "buy"
- "vehicle_preferences": Vehicle preferences
- "current_vehicle": Current vehicle if any

If NOT sufficient, respond with:
{
  "is_complete": false,
  "reason": "Explanation of what is missing"
}

IMPORTANT: Output ONLY the JSON object. No extra text.
"""
    
    reviewer_prompt = f"""{reviewer_instruction}

Conversation:
{conversation_text}

Your analysis (JSON only):"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=reviewer_prompt
        )
        reviewer_response = response.text
    except Exception as e:
        print(f"Error calling reviewer: {e}")
        return {"is_complete": False, "reason": "Error processing"}, []
    
    # Parse reviewer response (should be JSON)
    try:
        # Try to extract JSON from response
        if "{" in reviewer_response:
            json_start = reviewer_response.index("{")
            json_end = reviewer_response.rindex("}") + 1
            json_str = reviewer_response[json_start:json_end]
            extracted_profile = json.loads(json_str)
        else:
            raise ValueError("No JSON found in reviewer response")
        
        # Check if profile is complete
        if not extracted_profile.get("is_complete", False):
            print(f"Profile incomplete: {extracted_profile.get('reason', 'Unknown')}")
            return extracted_profile, []
            
    except Exception as e:
        print(f"Error parsing reviewer response: {e}")
        extracted_profile = {"is_complete": False, "reason": "Failed to parse profile"}
        return extracted_profile, []
    
    # Step 2: Use node_maker agent to generate scenarios
    node_maker_instruction = """
You are an expert Auto Financing Scenario Generator for Toyota Financial Services.

Create exactly 5 realistic, personalized, and financially sound vehicle financing or leasing scenarios.

Each scenario object MUST include:
- "name": Short label (2-4 words)
- "title": 5-10 word description
- "description": 2-3 sentence explanation
- "plan_type": "finance" or "lease"
- "down_payment": Down payment (numeric, USD)
- "monthly_payment": Monthly payment (numeric, USD)
- "term_months": Total months (numeric)
- "interest_rate": APR for finance or Money Factor for lease (numeric)
- "positivity_score": 0-100 score (higher = better fit)
- "recommendations": 1-2 sentence tips
- "suggested_model": Recommended Toyota model

Output ONLY valid JSON array - no explanations or additional text.
"""
    
    node_maker_prompt = f"""{node_maker_instruction}

Customer Profile:
{json.dumps(extracted_profile, indent=2)}

Generate 5 scenarios (JSON array only):"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=node_maker_prompt
        )
        node_maker_response = response.text
    except Exception as e:
        print(f"Error calling node_maker: {e}")
        return extracted_profile, []
    
    # Parse node_maker response (should be JSON array)
    try:
        if "[" in node_maker_response:
            json_start = node_maker_response.index("[")
            json_end = node_maker_response.rindex("]") + 1
            json_str = node_maker_response[json_start:json_end]
            scenarios = json.loads(json_str)
        else:
            raise ValueError("No JSON array found in node_maker response")
    except Exception as e:
        print(f"Error parsing node_maker response: {e}")
        scenarios = []
    
    return extracted_profile, scenarios


def get_interview_status(db: Session, session_id: str) -> Dict:
    """
    Get the current status of an interview session
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.session_id == session_id
    ).first()
    
    if not session:
        raise ValueError(f"Interview session {session_id} not found")
    
    result = {
        "session_id": session.session_id,
        "is_complete": session.is_complete,
        "scenarios": None
    }
    
    if session.is_complete and session.financing_scenarios:
        result["scenarios"] = json.loads(session.financing_scenarios)
    
    return result
