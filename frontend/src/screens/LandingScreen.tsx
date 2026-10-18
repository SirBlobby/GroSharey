import { LANDING_FEATURES, LANDING_STEPS } from "../components/landing/landingContent";
import Logo from "../components/Logo";
import "../styles/landing.css";

type LandingScreenProps = {
  onShowLogIn: () => void;
  onShowSignUp: () => void;
};

export default function LandingScreen({ onShowLogIn, onShowSignUp }: LandingScreenProps) {
  return (
    <section className="screen landing">
      <div className="landing-band landing-band--top">
        <header className="landing-nav">
          <span className="brand">
            <Logo className="brand-logo" />
            groSharey
          </span>
          <div className="landing-nav-actions">
            <button type="button" className="landing-nav-link" onClick={onShowLogIn}>
              Log In
            </button>
            <button type="button" className="btn landing-nav-signup" onClick={onShowSignUp}>
              Sign Up
            </button>
          </div>
        </header>

        <div className="landing-hero">
          <Logo className="landing-hero-logo" />
          <h1>Split groceries, not friendships.</h1>
          <p className="landing-hero-text">
            Wanna save the time you spend splitting grocery costs with your roommates? With groSharey, keep one
            shared list, scan your receipt, and AI hands each item to whoever asked for it. Or just say what you
            need out loud. Bam! Everyone knows exactly what they owe.
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="btn landing-primary" onClick={onShowSignUp}>
              Get Started
            </button>
            <button type="button" className="btn" onClick={onShowLogIn}>
              I have an account
            </button>
          </div>
        </div>
      </div>

      <div className="card landing-section">
        <h2>How it works</h2>
        <ol className="landing-steps">
          {LANDING_STEPS.map((step, stepIndex) => (
            <li key={step.title} className="landing-step">
              <span className="landing-step-number">{stepIndex + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="card landing-section">
        <h2>Everything you need</h2>
        <ul className="landing-features">
          {LANDING_FEATURES.map((feature) => (
            <li key={feature.title} className="landing-feature">
              <span className="landing-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="landing-band landing-band--bottom">
        <div className="landing-cta">
          <h2>Ready to stop doing grocery math?</h2>
          <button type="button" className="btn landing-primary" onClick={onShowSignUp}>
            Create your free account
          </button>
        </div>
      </div>
    </section>
  );
}
