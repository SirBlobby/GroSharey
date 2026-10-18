import { ReactNode } from "react";

import { BackIcon } from "./icons";
import Logo from "./Logo";
import "../styles/login.css";

type AuthCardProps = {
  switchPageLabel: string;
  onSwitchPage: () => void;
  onBack?: () => void;
  children: ReactNode;
};

export default function AuthCard({ switchPageLabel, onSwitchPage, onBack, children }: AuthCardProps) {
  return (
    <section className="screen login">
      {onBack && (
        <button type="button" className="auth-back" onClick={onBack}>
          <BackIcon /> Back to home
        </button>
      )}
      <div className="card">
        <Logo className="login-logo" />
        <p className="welcome">Welcome to</p>
        <h1>groSharey</h1>
        <p className="tag">
          A reliable grocery
          <br />
          price-splitting app!
        </p>
        {children}
        <button type="button" className="switch-link" onClick={onSwitchPage}>
          {switchPageLabel}
        </button>
      </div>
    </section>
  );
}
