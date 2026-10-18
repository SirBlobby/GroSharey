import { useEffect, useRef, useState } from "react";

import { assistantApi } from "../api/assistantApi";
import { useDeviceActions } from "../context/DeviceActionsContext";
import {
  canRecordInBrowser,
  describeMicrophoneError,
  startVoiceRecording,
  VoiceClip,
  VoiceRecording,
} from "../media/voiceRecording";
import { AssistantReply, AssistantTurn } from "../types/assistant";
import { readErrorMessage } from "../utils";

export type AssistantStatus = "idle" | "listening" | "thinking" | "speaking";

const MAX_HISTORY_TURNS = 10;
const MAX_BROWSER_RECORDING_MILLISECONDS = 30000;

function speakWithBrowser(replyText: string, onDone: () => void) {
  if (!("speechSynthesis" in window)) {
    onDone();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(replyText);
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.speak(utterance);
}

export function useVoiceAssistant(onDataChanged: () => void) {
  const { recordVoice } = useDeviceActions();
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const browserRecordingRef = useRef<VoiceRecording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyAudioRef = useRef<HTMLAudioElement | null>(null);
  const canUseVoice = Boolean(recordVoice) || canRecordInBrowser();

  function stopSpeaking() {
    replyAudioRef.current?.pause();
    replyAudioRef.current = null;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  useEffect(
    () => () => {
      stopSpeaking();
      browserRecordingRef.current?.cancel();
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    },
    [],
  );

  function playReply(assistantReply: AssistantReply) {
    setStatus("speaking");
    const finishSpeaking = () => setStatus((currentStatus) => (currentStatus === "speaking" ? "idle" : currentStatus));
    if (!assistantReply.audio_base64) {
      speakWithBrowser(assistantReply.reply, finishSpeaking);
      return;
    }
    const replyAudio = new Audio(`data:audio/mpeg;base64,${assistantReply.audio_base64}`);
    replyAudioRef.current = replyAudio;
    replyAudio.onended = finishSpeaking;
    replyAudio.play().catch(() => speakWithBrowser(assistantReply.reply, finishSpeaking));
  }

  async function sendQuestion(question: { voiceClip?: VoiceClip; text?: string }) {
    setStatus("thinking");
    setErrorMessage(null);
    try {
      const assistantReply = await assistantApi.ask({
        audio_base64: question.voiceClip?.base64,
        mime_type: question.voiceClip?.mimeType,
        text: question.text,
        history: turns.slice(-MAX_HISTORY_TURNS),
        wants_audio: true,
      });
      const youSaid = assistantReply.heard ?? question.text ?? "(voice message)";
      setTurns((currentTurns) => [
        ...currentTurns,
        { role: "user", text: youSaid },
        { role: "assistant", text: assistantReply.reply },
      ]);
      if (assistantReply.changed_data) {
        onDataChanged();
      }
      playReply(assistantReply);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "The assistant couldn't answer right now"));
      setStatus("idle");
    }
  }

  async function finishBrowserRecording() {
    const browserRecording = browserRecordingRef.current;
    browserRecordingRef.current = null;
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
    }
    if (browserRecording) {
      await sendQuestion({ voiceClip: await browserRecording.stop() });
    }
  }

  async function toggleListening() {
    if (status === "listening") {
      await finishBrowserRecording();
      return;
    }
    stopSpeaking();
    setErrorMessage(null);
    if (recordVoice) {
      setStatus("listening");
      const voiceClip = await recordVoice();
      if (voiceClip) {
        await sendQuestion({ voiceClip });
      } else {
        setStatus("idle");
      }
      return;
    }
    try {
      browserRecordingRef.current = await startVoiceRecording();
      setStatus("listening");
      recordingTimerRef.current = setTimeout(finishBrowserRecording, MAX_BROWSER_RECORDING_MILLISECONDS);
    } catch (error) {
      setErrorMessage(describeMicrophoneError(error));
      setStatus("idle");
    }
  }

  function askByText(text: string) {
    stopSpeaking();
    return sendQuestion({ text });
  }

  return { turns, status, errorMessage, canUseVoice, toggleListening, askByText, stopSpeaking };
}
