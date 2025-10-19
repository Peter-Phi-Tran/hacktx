from google.adk.agents import LlmAgent

AGENT_INSTRUCTION = """
... (your prompt as above) ...
"""

class NodeMakerAgent(LlmAgent):
    """An agent designed to generate life path nodes and scenarios."""

    def __init__(self, **kwargs):
        super().__init__(
            instruction=AGENT_INSTRUCTION,
            **kwargs,
        )

node_maker_agent = NodeMakerAgent(
    name="node_maker_agent",
    description="An analytical agent that generates realistic life path scenarios and decision nodes.",
    model="gemini-2.0-flash-exp",
)