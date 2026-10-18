import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { File } from "expo-file-system";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { VoiceClip } from "../media/voiceRecording";

type NativeVoiceRecorderProps = {
  isVisible: boolean;
  onRecorded: (voiceClip: VoiceClip) => void;
  onCancel: () => void;
};

type RecorderStatus = "starting" | "listening" | "saving" | "blocked";

const BUTTON_GREEN = "#2a6100";
const LISTENING_RED = "#e63946";
const MAX_RECORDING_MILLISECONDS = 30000;

export default function NativeVoiceRecorder({ isVisible, onRecorded, onCancel }: NativeVoiceRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<RecorderStatus>("starting");

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    let isCurrentRecording = true;
    setStatus("starting");

    async function startRecording() {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setStatus("blocked");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (isCurrentRecording) {
        recorder.record();
        setStatus("listening");
      }
    }

    startRecording().catch(() => setStatus("blocked"));
    const stopTimer = setTimeout(() => finishRecording(), MAX_RECORDING_MILLISECONDS);
    return () => {
      isCurrentRecording = false;
      clearTimeout(stopTimer);
    };
  }, [isVisible]);

  async function stopRecorder() {
    if (recorder.isRecording) {
      await recorder.stop();
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  }

  async function finishRecording() {
    if (!recorder.isRecording) {
      return;
    }
    setStatus("saving");
    await stopRecorder();
    if (!recorder.uri) {
      onCancel();
      return;
    }
    onRecorded({ base64: await new File(recorder.uri).base64(), mimeType: "audio/mp4" });
  }

  async function cancelRecording() {
    await stopRecorder().catch(() => null);
    onCancel();
  }

  const statusText = {
    starting: "Getting the microphone ready...",
    listening: "Listening... tap Done when you finish",
    saving: "Sending...",
    blocked: "Microphone access is off. Turn it on for this app in Settings.",
  }[status];

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={cancelRecording}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={[styles.micCircle, status === "listening" && styles.micCircleListening]} />
          <Text style={styles.statusText}>{statusText}</Text>
          <Text style={styles.exampleText}>Try "Add milk for Sam to the apartment list" or "Who owes me money?"</Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={cancelRecording} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, status !== "listening" && styles.buttonDisabled]}
              onPress={finishRecording}
              disabled={status !== "listening"}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#dbfacf",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 4,
    borderColor: BUTTON_GREEN,
    padding: 28,
    paddingBottom: 48,
    alignItems: "center",
    gap: 16,
  },
  micCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: BUTTON_GREEN,
    opacity: 0.5,
  },
  micCircleListening: {
    backgroundColor: LISTENING_RED,
    opacity: 1,
  },
  statusText: {
    color: "#1a1856",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  exampleText: {
    color: "#1a1856",
    fontSize: 15,
    textAlign: "center",
    opacity: 0.75,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    minWidth: 120,
    backgroundColor: BUTTON_GREEN,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: BUTTON_GREEN,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  cancelText: {
    color: BUTTON_GREEN,
    fontSize: 18,
    fontWeight: "700",
  },
});
