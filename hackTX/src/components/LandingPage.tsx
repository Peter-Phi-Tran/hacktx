import { StarField } from './StarField'
import { NebulaBg } from './NebulaBg'
import { Logo } from './Logo'
import { Title } from './Title'
import { Tagline } from './Tagline'
import { GoogleLoginButton } from './GoogleLoginButton'
import { Features } from './Features'

export const LandingPage = () => {
  const handleSignIn = () => {
    const raw = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5000";
    const backend = raw.replace(/\/+$/, "");
    // redirect browser to backend OAuth starter
    window.location.href = `${backend}/auth/google`;
  };

  return (
    <div className="landing-page">
      <StarField />
      <NebulaBg />
      
      <div className="landing-content">
        <Logo />
        <Title />
        <Tagline />
        <GoogleLoginButton onClick={handleSignIn} />
        <Features />
      </div>
    </div>
  )
}
