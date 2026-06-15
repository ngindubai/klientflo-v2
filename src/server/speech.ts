// Speech-to-text adapter. Real transcription fires when SPEECH_TO_TEXT_API_KEY
// is set (OpenAI Whisper by default); otherwise returns an empty string so the
// caller can fall back gracefully. The browser command bar / dictation use the
// Web Speech API client-side and don't need this.

export function isSpeechConfigured() {
  return Boolean(process.env.SPEECH_TO_TEXT_API_KEY);
}

export async function transcribeAudio(
  data: Buffer,
  mime: string,
): Promise<string> {
  if (!isSpeechConfigured()) return "";

  const provider = process.env.SPEECH_TO_TEXT_PROVIDER || "openai-whisper";
  if (provider.startsWith("openai")) {
    const form = new FormData();
    const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "mp4" : "wav";
    form.append("file", new Blob([new Uint8Array(data)], { type: mime }), `audio.${ext}`);
    form.append("model", "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SPEECH_TO_TEXT_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Transcription failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    return (json.text ?? "").trim();
  }

  throw new Error(`Unsupported speech provider: ${provider}`);
}
