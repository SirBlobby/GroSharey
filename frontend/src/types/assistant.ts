export type AssistantTurn = {
  role: "user" | "assistant";
  text: string;
};

export type AssistantRequest = {
  audio_base64?: string;
  mime_type?: string;
  text?: string;
  history: AssistantTurn[];
  wants_audio: boolean;
};

export type AssistantReply = {
  heard: string | null;
  reply: string;
  audio_base64: string | null;
  changed_data: boolean;
};
