# Tachyon - AI-Powered Financial Constellation Platform

**Tachyon** is an AI-powered financial advisor for Toyota vehicle financing. It guides users through a multi-turn conversational interview and visualizes personalized financing and leasing options as an interactive 3D "financial constellation".

## ✨ Features

* **AI-Powered Interview:** Conducts a conversational interview to gather detailed user data on financial status, vehicle needs, and lifestyle preferences.
* **Multi-Agent Orchestration:** Uses a Google Agent Development Kit (ADK) root agent to coordinate three specialized sub-agents (Interviewer, Reviewer, Node Maker) to ensure a complete profile and generate accurate scenarios.
* **3D Financial Constellation:** Visualizes 5 initial, personalized financing/leasing scenarios using a 3D physics-based engine (React-Three-Fiber).
* **Scenario Deep-Dive:** Allows users to "expand" a scenario node, triggering the Node Maker agent to generate up to 10 levels of branching options (e.g., different payment structures, trim levels, add-ons, or alternative vehicles).
* **Secure Authentication:** Integrates Google OAuth for user sign-in and session management.

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | Python, FastAPI | High-performance API server for routing and business logic. |
| **Database** | SQLAlchemy, PostgreSQL/SQLite | ORM for managing user profiles and interview sessions. |
| **AI Agents** | Google Gemini API (via ADK) | Multi-agent framework for conversational AI and structured data generation. |
| **Frontend** | React, TypeScript, Vite | Modern frontend framework and build tool. |
| **Visualization** | React-Three-Fiber, Three.js | Used for rendering the interactive 3D Financial Constellation. |

## 📐 AI Architecture (Agent Workflow)

The core logic is driven by an AI multi-agent system orchestrated by the `root_agent`:

1.  **`root_agent` (Orchestrator):** Manages the overall conversational flow.
2.  **`interviewer_agent`:** Conducts a multi-turn conversation, collecting 11 key pieces of information (Name, Income, Credit Score, Preferences, etc.).
3.  **`reviewer_agent`:** After the interview, it validates the conversation, extracts a comprehensive financial profile into a strict JSON schema, and checks for completeness.
4.  **`node_maker_agent`:** Takes the validated profile and generates 5 distinct, personalized financing/leasing scenarios (the "root" nodes of the constellation).
5.  **Node Expansion:** The `node_maker_agent` is re-invoked with a specific `branch_level` (1-10) to generate child scenarios when a user clicks "Let's Go Places" on a node in the 3D view.
