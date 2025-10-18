import { StarField } from './StarField'
import { NebulaBg } from './NebulaBg'
import { Logo } from './Logo'
import { Title } from './Title'
import { Tagline } from './Tagline'
import { GoogleLoginButton } from './GoogleLoginButton'
import { Features } from './Features'

export const LandingPage = () => {
  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth authentication
    console.log('Google login clicked')
    // This will be connected to your backend OAuth endpoint
  }

  return (
    <div className="landing-page">
      <StarField />
      <NebulaBg />
      
      <div className="landing-content">
        <Logo />
        <Title />
        <Tagline />
        <GoogleLoginButton onClick={handleGoogleLogin} />
        <Features />
      </div>
    </div>
  )
}
