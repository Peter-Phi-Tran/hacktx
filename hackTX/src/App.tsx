import { useState, useEffect } from 'react'
import { LandingPage } from './components/LandingPage'
import { FinancialDashboard } from './components/FinancialDashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated (for testing, check localStorage)
    const authStatus = localStorage.getItem('isAuthenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    // For testing purposes, simulate login
    localStorage.setItem('isAuthenticated', 'true')
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0e27'
      }}>
        <div style={{ color: '#fff' }}>Loading...</div>
      </div>
    )
  }

  return (
    <>
      {!isAuthenticated ? (
        <LandingPage onLogin={handleLogin} />
      ) : (
        <FinancialDashboard onLogout={handleLogout} />
      )}
    </>
  )
}

export default App
