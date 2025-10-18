# Backend - Google ADK Agent

This folder contains the Google Agent Development Kit (ADK) backend for the Toyota Financial Services project.

## 📁 Structure

```
backend/
├── .venv/                    # Python virtual environment
├── multi_tool_agent/         # ADK agent code
│   ├── __init__.py
│   ├── agent.py             # Main agent definition
│   └── .env                 # API keys (DO NOT COMMIT)
└── README.md
```

## 🚀 Quick Start

### 1. Activate Virtual Environment

```bash
cd backend
source .venv/bin/activate
```

### 2. Run the Agent Dev UI

```bash
# Make sure you're in the backend directory
cd /Users/chatchawanillyes/Desktop/HackTX/backend

# Launch the interactive UI
adk web
```

Then open http://localhost:8000 in your browser.

### 3. Test in Terminal (Optional)

```bash
adk run multi_tool_agent
```

## 🔧 Configuration

The `.env` file in `multi_tool_agent/` contains:

- `GOOGLE_API_KEY`: Your Google AI Studio API key
- `GOOGLE_GENAI_USE_VERTEXAI`: Set to FALSE for AI Studio

## 📝 Example Prompts

Try these in the dev UI:

- "What is the weather in New York?"
- "What is the time in New York?"
- "What is the weather in Paris?"

## 🛠️ Customizing the Agent

Edit `multi_tool_agent/agent.py` to:

- Add new tools/functions
- Change the model (e.g., to `gemini-2.0-flash-live-001` for voice)
- Modify agent instructions
- Add memory, session management, etc.

## 📚 Next Steps

- Check the [Google ADK Documentation](https://google.adk.dev)
- Add Toyota-specific tools (financing calculator, vehicle recommendations)
- Integrate with the frontend React app
