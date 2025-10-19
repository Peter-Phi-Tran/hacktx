interface ErrorMessageProps {
  message: string
  onRetry: () => void
  onDismiss?: () => void
}

export const ErrorMessage = ({ message, onRetry, onDismiss }: ErrorMessageProps) => {
  return (
    <div className="error-overlay">
      <div className="error-message">
        <h3 className="error-title">Oops! Something went wrong</h3>
        <p className="error-text">{message}</p>
        <div className="error-actions">
          <button onClick={onRetry} className="error-retry-btn">
            Try Again
          </button>
          {onDismiss && (
            <button onClick={onDismiss} className="error-dismiss-btn">
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
