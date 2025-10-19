/**
 * Interview Results View - Displays financing scenarios using ConstellationDemo
 */

import { ConstellationDemo } from "./ConstellationDemo";

interface InterviewResultsViewProps {
  scenarios: Record<string, unknown>[];
}

export function InterviewResultsView({ scenarios }: InterviewResultsViewProps) {
  return <ConstellationDemo scenarios={scenarios} />;
}
