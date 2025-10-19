import React, { useState, useRef, useEffect } from "react";
import TranscriptPanel from "./TranscriptPanel";
import { interviewAPI } from "../api/interview";
import { InterviewResultsView } from "./InterviewResultsView";

export interface TranscriptTurn {
  sender: "agent" | "user";
  username: string;
  text: string;
  time: string;
}

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function InterviewPage() {
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [scenarios, setScenarios] = useState<Record<string, unknown>[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Start interview on mount
  useEffect(() => {
    const startInterview = async () => {
      try {
        setIsLoading(true);
        const response = await interviewAPI.startInterview();
        setSessionId(response.session_id);

        const initialQuestion: TranscriptTurn = {
          sender: "agent",
          username: "INTERVIEWER",
          text: response.question,
          time: getTime(),
        };

        setTranscript([initialQuestion]);
        setError(null);
      } catch (err) {
        console.error("Failed to start interview:", err);
        setError(
          "Failed to start interview. Please make sure you're logged in."
        );
      } finally {
        setIsLoading(false);
      }
    };

    startInterview();
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isLoading || isComplete) return;

    const userMessage: TranscriptTurn = {
      sender: "user",
      username: "YOU",
      text: input,
      time: getTime(),
    };

    // Add user message immediately
    setTranscript((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Submit answer to API
      const response = await interviewAPI.submitAnswer({
        session_id: sessionId,
        answer: input,
      });

      // Add agent response
      const agentResponse: TranscriptTurn = {
        sender: "agent",
        username: "INTERVIEWER",
        text: response.question,
        time: getTime(),
      };

      setTranscript((prev) => [...prev, agentResponse]);

      // Check if interview is complete
      if (response.is_complete) {
        setIsComplete(true);

        // Wait a moment, then check status and load scenarios
        setTimeout(async () => {
          try {
            const status = await interviewAPI.checkStatus(sessionId);
            if (status.scenarios && status.scenarios.length > 0) {
              setScenarios(status.scenarios);
              console.log("Interview complete! Scenarios:", status.scenarios);
              // Show results view
              setTimeout(() => {
                setShowResults(true);
              }, 1000);
            }
          } catch (err) {
            console.error("Failed to get scenarios:", err);
            setError("Interview complete, but failed to load scenarios.");
          }
        }, 2000);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setError("Failed to submit answer. Please try again.");
      setIsLoading(false);
    } finally {
      if (!isComplete) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  // If we have scenarios and should show results, display constellation
  if (showResults && scenarios.length > 0) {
    return <InterviewResultsView scenarios={scenarios} />;
  }

  return (
    <div className="starry-bg">
      <div className="chat-widget-container">
        <header className="chat-header">
          <h1 className="chat-title">Toyota Questionnaire</h1>
          {isComplete && (
            <p className="text-sm text-green-400">
              Interview complete! Loading your financing options...
            </p>
          )}
        </header>

        <div className="chat-panel" ref={transcriptRef}>
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4">
              {error}
            </div>
          )}
          <TranscriptPanel transcript={transcript} />
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400 mt-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span>Interviewer is thinking...</span>
            </div>
          )}
        </div>

        <form className="chat-input-bar" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="chat-input-box"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isComplete ? "Interview completed!" : "Type your answer..."
            }
            rows={1}
            disabled={isLoading || isComplete || !sessionId}
          />
          <button
            className="chat-submit-btn"
            type="submit"
            disabled={isLoading || isComplete || !sessionId || !input.trim()}
          >
            {isLoading ? "..." : "Send"}
          </button>
          <button
            className="chat-logout-btn"
            type="button"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
