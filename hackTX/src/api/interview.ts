const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface InterviewStartResponse {
  session_id: string;
  question: string;
}

export interface InterviewAnswerRequest {
  session_id: string;
  answer: string;
}

export interface InterviewAnswerResponse {
  next_question: string;
  is_complete: boolean;
}

export const interviewAPI = {
  // Start a new interview session
  async startInterview(): Promise<InterviewStartResponse> {
    const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to start interview');
    }

    return response.json();
  },

  // Submit an answer and get next question
  async submitAnswer(data: InterviewAnswerRequest): Promise<InterviewAnswerResponse> {
    const response = await fetch(`${API_BASE_URL}/api/interview/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }

    return response.json();
  },

  // End interview session
  async endInterview(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/interview/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to end interview');
    }
  },
};