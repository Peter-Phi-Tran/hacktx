import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import TranscriptPanel from "./TranscriptPanel";

export interface TranscriptTurn {
  sender: "agent" | "user";
  username: string;
  text: string;
  time: string;
}

interface InterviewPageProps {
  onComplete: () => void;
  onLogout: () => void;
}

const INITIAL_QUESTION: TranscriptTurn = {
  sender: "agent",
  username: "INTERVIEWER",
  text: "Welcome to Tachyon! I'm here to help you find the perfect Toyota vehicle for your needs. To get started, could you tell me about your current financial situation? What's your approximate monthly income and how much are you comfortable spending on a car payment each month?",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function InterviewPage({ onComplete, onLogout }: InterviewPageProps) {
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
      <motion.div 
        className="chat-widget-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.header 
          className="chat-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.h1 
            className="chat-title"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Toyota Financial Interview
          </motion.h1>
          <motion.p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '0.95rem', 
              marginTop: '8px',
              marginBottom: '16px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Chat with our AI agent to discover your perfect vehicle match
          </motion.p>
          
          {/* Action buttons */}
          <motion.div 
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '16px'
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <motion.button
              onClick={onComplete}
              className="interview-action-btn interview-continue-btn"
              title="Continue to view your personalized vehicle recommendations"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={{ marginRight: '8px' }}>🚀</span>
              View My Constellation
            </motion.button>
            <motion.button
              onClick={onLogout}
              className="interview-action-btn interview-logout-btn"
              title="Sign out and return to landing page"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={{ marginRight: '8px' }}>👋</span>
              Logout
            </motion.button>
          </motion.div>
        </motion.header>

        <motion.div 
          className="chat-panel" 
          ref={transcriptRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <TranscriptPanel transcript={transcript} />
        </motion.div>

        <motion.form 
          className="chat-input-bar" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <textarea
            ref={textareaRef}
            className="chat-input-box"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            rows={1}
          />
          <motion.button 
            className="chat-submit-btn" 
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Send
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}