import asyncio
import uuid
from dotenv import load_dotenv
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types
from hackTX.backend.adk.root_agent import root_agent

load_dotenv()

async def main():
    """Test the full multi-agent workflow with a multi-turn conversation."""
    
    # Initialize session service
    session_service = InMemorySessionService()
    
    # Create runner with root agent
    runner = Runner(
        agent=root_agent,
        app_name="toyota_financing_assistant",
        session_service=session_service,
    )
    
    # Session identifiers
    user_id = "test_user_jane"
    session_id = str(uuid.uuid4())
    
    # Create the session first
    await session_service.create_session(
        app_name="toyota_financing_assistant",
        user_id=user_id,
        session_id=session_id,
        state={}
    )
    
    print("=" * 80)
    print("Toyota Financial Services Assistant - Multi-Turn Conversation Test")
    print(f"Session ID: {session_id}")
    print("=" * 80)
    print()
    
    # Simulate a multi-turn conversation
    conversation_turns = [
        "Hi, I'm interested in financing a Toyota vehicle.",
        "My name is Jane Smith.",
        "I'm in Austin, Texas.",
        "I currently drive a Honda Accord.",
        "I work as a Software Engineer.",
        "$95,000 per year.",
        "My credit score is 720.",
        "I want to buy a reliable hybrid vehicle for my daily commute.",
        "I prefer buying over leasing.",
        "I'm interested in the Toyota Camry Hybrid, and I care about fuel efficiency and safety features.",
        "I enjoy technology, travel, and outdoor activities.",
        "Programming, budgeting, and data analysis.",
    ]
    
    # Run the conversation
    for turn_num, user_message in enumerate(conversation_turns, 1):
        print(f"\n{'─' * 80}")
        print(f"Turn {turn_num}: User")
        print(f"{'─' * 80}")
        print(f"> {user_message}")
        print()
        
        print(f"Turn {turn_num}: Assistant")
        print(f"{'─' * 80}")
        
        # Create content message
        new_message = types.Content(
            role='user',
            parts=[types.Part(text=user_message)]
        )
        
        # Run the agent and collect response
        full_response = ""
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=new_message
        ):
            # Capture all event types
            if hasattr(event, 'text') and event.text:
                print(event.text, end='', flush=True)
                full_response += event.text
            
            # Also check for function calls and model responses
            if hasattr(event, 'candidates'):
                for candidate in event.candidates:
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        for part in candidate.content.parts:
                            if hasattr(part, 'text') and part.text:
                                text = part.text
                                print(text, end='', flush=True)
                                full_response += text
        
        print()  # New line after response
        
        # Add delay to avoid rate limiting (10 requests/min = ~6 sec between requests)
        await asyncio.sleep(6)
        
        # Check if we got the final JSON scenarios (node_maker output)
        if '[' in full_response and '"name":' in full_response and '"plan_type":' in full_response:
            print()
            print("=" * 80)
            print("FINAL RESULT: 5 Financing Scenarios Generated!")
            print("=" * 80)
            break
    
    print()
    print("=" * 80)
    print("Test Complete")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())
