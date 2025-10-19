import React from "react";
import type { TranscriptTurn } from "./InterviewPage";

interface TranscriptPanelProps {
  transcript: TranscriptTurn[];
}

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  if (transcript.length === 0) {
    return <div className="empty-chat">No transcript yet.</div>;
  }

  return (
    <div className="transcript-messages">
      {transcript.map((turn, idx) => (
        <MessageBubble key={idx} turn={turn} />
      ))}
    </div>
  );
}

function MessageBubble({ turn }: { turn: TranscriptTurn }) {
  const isAgent = turn.sender === "agent";

  return (
    <div className={`message-row ${isAgent ? "agent-row" : "user-row"}`}>
      {isAgent && <Avatar type="agent" />}
      
      <div className={`chat-bubble-widget ${isAgent ? "agent-widget" : "user-widget"}`}>
        <div className="bubble-header">
          <span className="bubble-username">{turn.username}</span>
          <span className="bubble-meta-widget">{turn.time}</span>
        </div>
        <div className="bubble-content-widget">{turn.text}</div>
      </div>

      {!isAgent && <Avatar type="user" />}
    </div>
  );
}

function Avatar({ type }: { type: "agent" | "user" }) {
  return (
    <div className={`avatar ${type}-avatar`}>
      {type === "agent" ? <span className="star-icon">⭐</span> : <span>👤</span>}
    </div>
  );
}