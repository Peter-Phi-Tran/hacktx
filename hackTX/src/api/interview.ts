const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Get token from localStorage or sessionStorage
function getAuthToken(): string | null {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
}

// Headers with authentication
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Using auth token:", token.substring(0, 10) + "...");
  } else {
    console.warn("No auth token found!");
  }

  return headers;
}

export interface InterviewStartResponse {
  session_id: string;
  question: string;
}

export interface InterviewAnswerRequest {
  session_id: string;
  answer: string;
}

export interface InterviewAnswerResponse {
  question: string;
  is_complete: boolean;
}

export interface InterviewStatusResponse {
  session_id: string;
  is_complete: boolean;
  scenarios: Record<string, unknown>[] | null;
}

export const interviewAPI = {
  // Start a new interview session
  async startInterview(): Promise<InterviewStartResponse> {
    const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start interview: ${error}`);
    }

    return response.json();
  },

  // Submit an answer and get next question
  async submitAnswer(
    data: InterviewAnswerRequest
  ): Promise<InterviewAnswerResponse> {
    const response = await fetch(`${API_BASE_URL}/api/interview/answer`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit answer: ${error}`);
    }

    return response.json();
  },

  // Check interview status
  async checkStatus(sessionId: string): Promise<InterviewStatusResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/interview/status/${sessionId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to check status: ${error}`);
    }

    return response.json();
  },

  // Expand a node to generate child scenarios
  async expandNode(
    parentScenario: Record<string, unknown>,
    userProfile: Record<string, unknown>,
    branchLevel: number = 1
  ): Promise<{
    success: boolean;
    children: Record<string, unknown>[];
    branch_level: number;
  }> {
    console.log("expandNode API call:", {
      parentScenario,
      userProfile,
      branchLevel,
    });

    const response = await fetch(`${API_BASE_URL}/api/expand-node`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        parent_scenario: parentScenario,
        user_profile: userProfile,
        branch_level: branchLevel,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to expand node: ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response Success:", data);
    return data;
  },
};
