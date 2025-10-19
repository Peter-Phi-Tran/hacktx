interface LoadingSpinnerProps {
  message?: string
  subtext?: string
}

export const LoadingSpinner = ({ 
  message = "Loading Tachyon...", 
  subtext = "Preparing your financial constellation experience" 
}: LoadingSpinnerProps) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p className="loading-text">{message}</p>
        <p className="loading-subtext">{subtext}</p>
      </div>
    </div>
  )
}
