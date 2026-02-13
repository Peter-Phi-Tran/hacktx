import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import InterviewPage from "./components/InterviewPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [_user, setUser] = useState<{ email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const errorParam = params.get("error");

    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      setIsLoading(false);
      window.history.replaceState({}, document.title, "/");
      return;
    }

    if (token) {
      // Store token with correct key
      localStorage.setItem("authToken", token);

      // Fetch user info
      const backendUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/+$/, "");

      fetch(`${backendUrl}/auth/me?token=${token}`, {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to authenticate");
          return res.json();
        })
        .then((data) => {
          setUser(data);
          setIsAuthenticated(true);
          setError(null);
          window.history.replaceState({}, document.title, "/");
        })
        .catch((err) => {
          console.error("Failed to fetch user:", err);
          setError("Failed to authenticate. Please try again.");
          localStorage.removeItem("authToken");
        })
        .finally(() => setIsLoading(false));
    } else {
      // Check if we have a stored token
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        const backendUrl = (
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        ).replace(/\/+$/, "");

        fetch(`${backendUrl}/auth/me?token=${storedToken}`, {
          credentials: "include",
        })
          .then((res) => {
            if (!res.ok) throw new Error("Token expired");
            return res.json();
          })
          .then((data) => {
            setUser(data);
            setIsAuthenticated(true);
          })
          .catch((err) => {
            console.error("Token validation failed:", err);
            localStorage.removeItem("authToken");
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0a0a0a",
          color: "#fff",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0a0a0a",
          color: "#fff",
          gap: "20px",
        }}
      >
        <div style={{ color: "#ef4444" }}>{error}</div>
        <button
          onClick={() => {
            setError(null);
            window.location.href = "/";
          }}
          style={{
            padding: "10px 20px",
            background: "#667eea",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return isAuthenticated ? <InterviewPage /> : <LandingPage />;
}

export default App;
