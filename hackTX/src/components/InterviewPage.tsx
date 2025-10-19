import React, { useState, useRef, useEffect } from "react";
import TranscriptPanel from "./TranscriptPanel";

export interface TranscriptTurn {
  sender: "agent" | "user";
  username: string;
  text: string;
  time: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function InterviewPage() {
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Start interview on mount
  useEffect(() => {
    const startInterview = async () => {
      console.log('[Frontend] Starting interview...');
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to start interview');
        }

        const data = await response.json();
        console.log('[Frontend] Interview started:', data);
        
        setSessionId(data.session_id);
        
        const initialMessage: TranscriptTurn = {
          sender: "agent",
          username: "INTERVIEWER",
          text: data.question,
          time: getTime(),
        };
        
        setTranscript([initialMessage]);
      } catch (err) {
        console.error('[Frontend] Failed to start interview:', err);
        setError("Failed to start interview. Please refresh and try again.");
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
      behavior: "smooth" 
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

    console.log('[Frontend] Submitting answer:', input);

    const userMessage: TranscriptTurn = {
      sender: "user",
      username: "YOU",
      text: input,
      time: getTime(),
    };

    setTranscript(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          answer: currentInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit answer');
      }

      const data = await response.json();
      console.log('[Frontend] Received response:', data);

      // Show validation feedback if quality is low
      if (data.validation && data.validation.quality_score < 0.5) {
        console.log('[Frontend] Low quality answer, showing suggestion');
        
        if (data.validation.suggestion && !data.is_followup) {
          const suggestionMessage: TranscriptTurn = {
            sender: "agent",
            username: "SYSTEM",
            text: `💡 ${data.validation.suggestion}`,
            time: getTime(),
          };
          setTranscript(prev => [...prev, suggestionMessage]);
        }
      }

      const agentResponse: TranscriptTurn = {
        sender: "agent",
        username: data.is_followup ? "INTERVIEWER (Follow-up)" : "INTERVIEWER",
        text: data.next_question,
        time: getTime(),
      };

      setTranscript(prev => [...prev, agentResponse]);
      
      if (data.is_complete) {
        console.log('[Frontend] Interview complete');
        setIsComplete(true);
        
        // Store analysis and recommendations
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      console.error('[Frontend] Failed to send answer:', err);
      setError("Failed to send answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isLoading && transcript.length === 0) {
    return (
      <div className="starry-bg">
        <div className="chat-widget-container">
          <div className="loading-message">✨ Starting your interview...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="starry-bg">
      <div className="chat-widget-container">
        <header className="chat-header">
          <h1 className="chat-title">Toyota Questionnaire</h1>
          {isComplete && <span className="complete-badge">✓ Complete</span>}
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="chat-panel" ref={transcriptRef}>
          <TranscriptPanel transcript={transcript} />
          {isLoading && (
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
        </div>

        {!isComplete && (
          <form className="chat-input-bar" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="chat-input-box"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              rows={1}
              disabled={isLoading}
            />
            <button 
              className="chat-submit-btn" 
              type="submit"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </form>
        )}

        {isComplete && (
          <div className="interview-complete">
            <h2>🎉 Interview Complete!</h2>
            <p>Thank you for your time. Your responses are being processed.</p>
            <button onClick={() => window.location.href = '/'}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}