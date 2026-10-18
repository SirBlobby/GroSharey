import { ReactNode } from "react";

import "../styles/cardScreen.css";

type CardScreenProps = {
  title: string;
  onBack?: () => void;
  children: ReactNode;
};

export default function CardScreen({ title, onBack, children }: CardScreenProps) {
  return (
    <section className="screen">
      <div className="title-top">{title}</div>
      <div className="card card-screen">{children}</div>
      {onBack && (
        <div className="footer">
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
        </div>
      )}
    </section>
  );
}
