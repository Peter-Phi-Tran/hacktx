import { StarField } from './StarField'
import { NebulaBg } from './NebulaBg'

interface LandingPageProps {
  onLogin: () => void
}

/**
 * Consolidated Landing Page Component
 * All landing page UI elements are contained here for simplicity
 */
export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const handleSignIn = () => {
    // For testing: just call onLogin to simulate authentication
    // In production, this would redirect to Google OAuth
    onLogin()
    
    // Production code (commented out for testing):
    // const raw = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5000"
    // const backend = raw.replace(/\/+$/, "")
    // window.location.href = `${backend}/auth/google`
  }

  return (
    <div className="landing-page">
      <StarField />
      <NebulaBg />
      
      <div className="landing-content">
        {/* Logo with animated orbit rings */}
        <div className="logo-container">
          <div className="orbit-ring"></div>
          <div className="orbit-ring orbit-ring-2"></div>
          <div className="central-star"></div>
        </div>

        {/* Title */}
        <h1 className="app-title">
          <span className="title-main">Tachyon</span>
          <span className="title-subtitle">Navigate Your Financial Constellation</span>
        </h1>

        {/* Tagline */}
        <p className="tagline">
          Chart your path through vehicle financing with AI-powered celestial guidance
        </p>

        {/* Google Login Button */}
        <button className="google-login-btn" onClick={handleSignIn}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Features */}
        <div className="features">
          <div className="feature">
            <div className="feature-icon">✦</div>
            <span>AI-Powered Insights</span>
          </div>
          <div className="feature">
            <div className="feature-icon">⊛</div>
            <span>Vehicle Financial Services</span>
          </div>
          <div className="feature">
            <div className="feature-icon">✧</div>
            <span>Personalized Path</span>
          </div>
        </div>
      </div>
    </div>
  )
}
