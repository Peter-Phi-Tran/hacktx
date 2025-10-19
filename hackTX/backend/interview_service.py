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
            model='gemini-2.0-flash',
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
            model='gemini-2.0-flash',
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
            model='gemini-2.0-flash',
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


def generate_child_scenarios(parent_scenario: Dict, user_profile: Dict, branch_level: int = 1) -> List[Dict]:
    """
    Generate 3 child scenarios branching from a parent scenario using node_maker agent
    Each level explores a different aspect of the car buying/financing journey
    
    Args:
        parent_scenario: The parent scenario to branch from
        user_profile: User's financial profile
        branch_level: The level of branching (1-10, each level has different focus)
    
    Returns:
        List of 3 child scenarios
    """
    
    # Define what each branch level focuses on
    branch_focus = {
        1: {
            "name": "Payment Structures",
            "instruction": "Generate 3 different PAYMENT STRUCTURE variations:\n- Short-term high payment (36-48 months)\n- Standard mid-term (60 months)\n- Extended low payment (72-84 months)\nFocus on how different loan terms affect monthly payments and total cost."
        },
        2: {
            "name": "Vehicle Trim Levels",
            "instruction": "Generate 3 different TRIM LEVEL options for the same model:\n- Base/LE trim (budget-friendly)\n- Mid-level/XLE trim (balanced features)\n- Premium/Limited trim (fully loaded)\nShow how trim upgrades affect pricing and value."
        },
        3: {
            "name": "Add-Ons & Packages",
            "instruction": "Generate 3 scenarios with different WARRANTY AND PACKAGE combinations:\n- Basic coverage only\n- Extended warranty + protection package\n- Premium coverage + maintenance package + GAP insurance\nExplain cost vs. protection trade-offs."
        },
        4: {
            "name": "Insurance Options",
            "instruction": "Generate 3 different INSURANCE SCENARIOS:\n- Minimum required coverage\n- Recommended full coverage\n- Premium coverage with low deductibles\nInclude estimated insurance costs in monthly budget."
        },
        5: {
            "name": "Maintenance Plans",
            "instruction": "Generate 3 SERVICE AND MAINTENANCE options:\n- Pay-as-you-go maintenance\n- Prepaid maintenance plan (3 years)\n- Premium ToyotaCare Plus (5 years)\nShow long-term cost savings and convenience."
        },
        6: {
            "name": "Trade-In Scenarios",
            "instruction": "Generate 3 TRADE-IN options:\n- No trade-in (higher loan amount)\n- Average trade-in value ($5,000-$8,000)\n- High trade-in value ($10,000+)\nShow how trade-in equity reduces financing needs."
        },
        7: {
            "name": "Lease vs. Buy Comparison",
            "instruction": "Generate 3 OWNERSHIP structure comparisons:\n- Traditional purchase/finance\n- Standard lease (36 months)\n- Lease with purchase option at end\nCompare long-term costs and flexibility."
        },
        8: {
            "name": "Refinancing Options",
            "instruction": "Generate 3 REFINANCING scenarios (assuming purchase after 2 years):\n- Refinance for lower rate\n- Refinance for shorter term\n- Refinance for lower payment\nShow potential savings and payoff timeline changes."
        },
        9: {
            "name": "Early Payoff Strategies",
            "instruction": "Generate 3 EARLY PAYMENT scenarios:\n- Extra $50/month toward principal\n- Extra $100/month toward principal\n- Bi-weekly payment strategy\nCalculate interest saved and time reduced."
        },
        10: {
            "name": "Alternative Vehicles",
            "instruction": "Generate 3 ALTERNATIVE TOYOTA MODELS with similar profiles:\n- Comparable model in different segment\n- Hybrid/electric alternative\n- Certified pre-owned recent model\nCompare value, features, and total cost of ownership."
        }
    }
    
    # Get the appropriate branch focus (default to level 1 if out of range)
    focus = branch_focus.get(branch_level, branch_focus[1])
    
    node_maker_instruction = f"""
You are an expert Auto Financing Scenario Generator for Toyota Financial Services.

BRANCH LEVEL {branch_level}: {focus['name']}

{focus['instruction']}

Each scenario object MUST include these fields:
- "name": Short label (2-4 words), e.g., "Extended Term Plan"
- "title": 5-10 word description specific to this branch level
- "description": Concise explanation (2-3 sentences) tailored to the user's profile and branch focus
- "plan_type": Either "finance" or "lease"
- "down_payment": Recommended down payment (numeric, in USD)
- "monthly_payment": Estimated monthly payment (numeric, in USD)
- "term_months": Total number of months for the plan (numeric)
- "interest_rate": Annual Percentage Rate (APR) for finance plans, or Money Factor for leases (numeric)
- "positivity_score": Number between 0-100 indicating how favorable the plan is (higher = better fit)
- "recommendations": Brief financial tips (1-2 sentences) specific to this branch type
- "suggested_model": Recommended Toyota model(s) (can vary for level 10 alternatives, otherwise same as parent)

CRITICAL RULES:
1. Create 3 DISTINCT variations focused on: {focus['name']}
2. Ensure numeric values are realistic and consistent
3. Output ONLY valid JSON - no explanations, comments, or additional text
4. Base variations on the user profile provided
5. Make scenarios SPECIFIC to level {branch_level} focus area

Output format: JSON array with exactly 3 objects.
"""

    prompt = f"""{node_maker_instruction}

PARENT SCENARIO:
{json.dumps(parent_scenario, indent=2)}

USER PROFILE:
{json.dumps(user_profile, indent=2)}

Generate 3 variations for {focus['name']}:"""

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        node_maker_response = response.text
    except Exception as e:
        error_msg = str(e)
        print(f"Error calling node_maker for expansion (level {branch_level}): {e}")
        
        # Provide helpful error messages for common issues
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            raise ValueError(f"API quota exceeded. Please wait a few minutes or upgrade your API plan. Original error: {error_msg}")
        elif "401" in error_msg or "UNAUTHENTICATED" in error_msg:
            raise ValueError(f"API authentication failed. Please check your API key. Original error: {error_msg}")
        else:
            raise ValueError(f"Failed to generate child scenarios: {error_msg}")

    # Parse node_maker response (should be JSON array)
    try:
        if "[" in node_maker_response:
            json_start = node_maker_response.index("[")
            json_end = node_maker_response.rindex("]") + 1
            json_str = node_maker_response[json_start:json_end]
            scenarios = json.loads(json_str)
        else:
            raise ValueError("No JSON array found in node_maker response for expansion")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing node_maker expansion response: {e}")
        print(f"Response was: {node_maker_response[:500]}")
        raise ValueError(f"Failed to parse child scenarios: {str(e)}")

    print(f"✅ Generated {len(scenarios)} level-{branch_level} ({focus['name']}) scenarios")
    return scenarios
