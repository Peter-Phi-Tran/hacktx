interface Feature {
  icon: string
  text: string
}

const features: Feature[] = [
  { icon: '✦', text: 'AI-Powered Insights' },
  { icon: '⊛', text: 'Vehicle Financial Services' },
  { icon: '✧', text: 'Personalized Path' },
]

export const Features = () => {
  return (
    <div className="features">
      {features.map((feature, index) => (
        <div key={index} className="feature">
          <div className="feature-icon">{feature.icon}</div>
          <span>{feature.text}</span>
        </div>
      ))}
    </div>
  )
}
