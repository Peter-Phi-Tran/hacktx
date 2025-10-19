/**
 * Interview Results View - Displays financing scenarios using ConstellationDemo
 */

import { ConstellationDemo } from "./ConstellationDemo";

interface InterviewResultsViewProps {
  scenarios: Record<string, unknown>[];
}

export function InterviewResultsView({ scenarios }: InterviewResultsViewProps) {
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  return <ConstellationDemo scenarios={scenarios} onLogout={handleLogout} />;
}
