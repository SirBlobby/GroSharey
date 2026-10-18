import { FormEvent, useEffect, useRef, useState } from "react";

import { AssistantStatus, useVoiceAssistant } from "../../hooks/useVoiceAssistant";
import { CloseIcon, MicrophoneIcon, StopIcon } from "../icons";
import "../../styles/modal.css";
import "../../styles/assistant.css";

type VoiceAssistantPanelProps = {
  onDataChanged: () => void;
  onClose: () => void;
};

const EXAMPLE_QUESTIONS = [
  "Add milk and eggs for Sam to the apartment list",
  "We're running low on coffee",
  "Who owes me money?",
  "I'm going to Trader Joe's",
];

const STATUS_LABELS: Record<AssistantStatus, string> = {
  idle: "Tap the mic and ask",
  listening: "Listening... tap again when you're done",
  thinking: "Thinking...",
  speaking: "Speaking...",
};

export default function VoiceAssistantPanel({ onDataChanged, onClose }: VoiceAssistantPanelProps) {
  const assistant = useVoiceAssistant(onDataChanged);
  const [typedQuestion, setTypedQuestion] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const isBusy = assistant.status === "thinking";

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [assistant.turns.length, assistant.status]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function askTypedQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = typedQuestion.trim();
    if (!question || isBusy) {
      return;
    }
    setTypedQuestion("");
    assistant.askByText(question);
  }

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card modal assistant-panel" role="dialog" aria-modal="true" aria-label="Voice assistant">
        <div className="assistant-header">
          <h2>Ask groSharey</h2>
          <button type="button" className="assistant-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="assistant-conversation" aria-live="polite">
          {assistant.turns.length === 0 && (
            <div className="assistant-examples">
              <p className="description">
                Manage lists, the pantry, groups, trips, budgets, and payments, or ask who owes what. Try:
              </p>
              {EXAMPLE_QUESTIONS.map((exampleQuestion) => (
                <button
                  key={exampleQuestion}
                  type="button"
                  className="assistant-example"
                  disabled={isBusy}
                  onClick={() => assistant.askByText(exampleQuestion)}
                >
                  "{exampleQuestion}"
                </button>
              ))}
            </div>
          )}
          {assistant.turns.map((turn, turnIndex) => (
            <p key={turnIndex} className={`assistant-bubble assistant-bubble--${turn.role}`}>
              {turn.text}
            </p>
          ))}
          <div ref={conversationEndRef} />
        </div>

        {assistant.errorMessage && <p className="error-text">{assistant.errorMessage}</p>}

        {assistant.canUseVoice && (
          <div className="assistant-mic-area">
            <button
              type="button"
              className={`assistant-mic assistant-mic--${assistant.status}`}
              aria-label={assistant.status === "listening" ? "Stop listening" : "Start talking"}
              disabled={isBusy}
              onClick={assistant.toggleListening}
            >
              {assistant.status === "listening" ? <StopIcon /> : <MicrophoneIcon />}
            </button>
            <span className="assistant-status">{STATUS_LABELS[assistant.status]}</span>
            {assistant.status === "speaking" && (
              <button type="button" className="history-button" onClick={assistant.stopSpeaking}>
                Stop speaking
              </button>
            )}
          </div>
        )}

        <form className="assistant-type-row" onSubmit={askTypedQuestion}>
          <input
            value={typedQuestion}
            maxLength={500}
            placeholder="Or type a question"
            aria-label="Type a question"
            onChange={(event) => setTypedQuestion(event.target.value)}
          />
          <button type="submit" className="btn" disabled={isBusy || typedQuestion.trim().length === 0}>
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
