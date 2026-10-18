export type VoiceClip = {
  base64: string;
  mimeType: string;
};

export type VoiceRecording = {
  stop: () => Promise<VoiceClip>;
  cancel: () => void;
};

const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string {
  return PREFERRED_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

function readBlobAsBase64(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(String(fileReader.result).split(",")[1] ?? "");
    fileReader.onerror = () => reject(new Error("Couldn't read the recording"));
    fileReader.readAsDataURL(audioBlob);
  });
}

export function canRecordInBrowser(): boolean {
  return typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && "MediaRecorder" in window;
}

export async function startVoiceRecording(): Promise<VoiceRecording> {
  const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(microphoneStream, mimeType ? { mimeType } : undefined);
  const audioChunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };
  recorder.start();

  function stopMicrophone() {
    microphoneStream.getTracks().forEach((track) => track.stop());
  }

  return {
    stop: () =>
      new Promise<VoiceClip>((resolve, reject) => {
        recorder.onstop = async () => {
          stopMicrophone();
          const audioBlob = new Blob(audioChunks, { type: recorder.mimeType || "audio/webm" });
          try {
            resolve({ base64: await readBlobAsBase64(audioBlob), mimeType: audioBlob.type });
          } catch (error) {
            reject(error);
          }
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = stopMicrophone;
      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        stopMicrophone();
      }
    },
  };
}

export function describeMicrophoneError(error: unknown): string {
  const errorName = error instanceof DOMException ? error.name : "";
  if (errorName === "NotAllowedError") {
    return "Microphone access is blocked. Allow it in your browser, or type your question.";
  }
  if (errorName === "NotFoundError") {
    return "No microphone was found. Type your question instead.";
  }
  return "The microphone couldn't start. Type your question instead.";
}
