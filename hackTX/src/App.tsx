import { useState, useEffect } from 'react'
import { LandingPage } from './components/LandingPage'
import { FinancialDashboard } from './components/FinancialDashboard'
import { LoadingSpinner } from './components/LoadingSpinner'
import InterviewPage from './components/InterviewPage'

// Workflow stages
type AppStage = 'landing' | 'interview' | 'dashboard'

function App() {
  const [stage, setStage] = useState<AppStage>('landing')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user is authenticated and restore their stage
    const authStatus = localStorage.getItem('isAuthenticated')
    const savedStage = localStorage.getItem('appStage') as AppStage
    
    if (authStatus === 'true') {
      // If authenticated, restore their previous stage or default to interview
      setStage(savedStage || 'interview')
    } else {
      setStage('landing')
    }
  }, [])

  const handleLogin = () => {
    // User logs in from landing page
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('appStage', 'interview')
    setStage('interview')
  }

  const handleCompleteInterview = () => {
    // User completes interview and moves to dashboard
    // Show loading spinner for 2-3 seconds
    setIsLoading(true)
    
    setTimeout(() => {
      localStorage.setItem('appStage', 'dashboard')
      setStage('dashboard')
      setIsLoading(false)
    }, 2500) // 2.5 second delay
  }

  const handleLogout = () => {
    // User logs out and returns to landing
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('appStage')
    setStage('landing')
  }

  const handleBackToInterview = () => {
    // Allow returning to interview (for testing)
    localStorage.setItem('appStage', 'interview')
    setStage('interview')
  }

  return (
    <>
      {isLoading && (
        <LoadingSpinner 
          message="Preparing your constellation..."
          subtext="Analyzing your responses and generating recommendations"
        />
      )}
      
      {!isLoading && stage === 'landing' && (
        <LandingPage onLogin={handleLogin} />
      )}
      
      {!isLoading && stage === 'interview' && (
        <InterviewPage 
          onComplete={handleCompleteInterview}
          onLogout={handleLogout}
        />
      )}
      
      {!isLoading && stage === 'dashboard' && (
        <FinancialDashboard 
          onLogout={handleLogout}
          onBackToInterview={handleBackToInterview}
        />
      )}
    </>
  )
}

export default App
