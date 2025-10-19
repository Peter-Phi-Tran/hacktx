import React, { useState, useRef, useEffect } from "react";
import TranscriptPanel from "./TranscriptPanel";

export interface TranscriptTurn {
  sender: "agent" | "user";
  username: string;
  text: string;
  time: string;
}

const INITIAL_QUESTION: TranscriptTurn = {
  sender: "agent",
  username: "INTERVIEWER",
  text: "To get a better understanding of your background, could you tell me a bit about where you grew up and some of the experiences that have shaped who you are today?",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function InterviewPage() {
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([INITIAL_QUESTION]);
  const [input, setInput] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: TranscriptTurn = {
      sender: "user",
      username: "YOU",
      text: input,
      time: getTime(),
    };

    const agentResponse: TranscriptTurn = {
      sender: "agent",
      username: "INTERVIEWER",
      text: "Thank you! Can you share your current job title and a few of your key skills?",
      time: getTime(),
    };

    setTranscript([...transcript, userMessage, agentResponse]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="starry-bg">
      <div className="chat-widget-container">
        <header className="chat-header">
          <h1 className="chat-title">Toyota Questionnaire</h1>
        </header>

        <div className="chat-panel" ref={transcriptRef}>
          <TranscriptPanel transcript={transcript} />
        </div>

        <form className="chat-input-bar" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="chat-input-box"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            rows={1}
          />
          <button className="chat-submit-btn" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}