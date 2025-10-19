export const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p className="loading-text">Analyzing your financial constellation...</p>
        <p className="loading-subtext">Calculating optimal vehicle matches</p>
      </div>
    </div>
  )
}
