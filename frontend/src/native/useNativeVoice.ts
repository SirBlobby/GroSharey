import { useCallback, useRef, useState } from "react";

import type { VoiceClip } from "../media/voiceRecording";

export function useNativeVoice() {
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const finishRecordingRef = useRef<((voiceClip: VoiceClip | null) => void) | null>(null);

  const recordVoice = useCallback(
    () =>
      new Promise<VoiceClip | null>((resolve) => {
        finishRecordingRef.current?.(null);
        finishRecordingRef.current = resolve;
        setIsRecorderOpen(true);
      }),
    [],
  );

  function finishRecording(voiceClip: VoiceClip | null) {
    setIsRecorderOpen(false);
    finishRecordingRef.current?.(voiceClip);
    finishRecordingRef.current = null;
  }

  return { isRecorderOpen, recordVoice, finishRecording };
}
