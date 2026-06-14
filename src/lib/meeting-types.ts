// Shared types for the on-device meeting transcription + diarization pipeline.
// The audio is decoded on the main thread, then PCM is handed to a Web Worker
// that runs Whisper (transcription) and, later, speaker diarization. No audio
// ever leaves the browser.

export type TranscriptSegment = {
  start: number; // seconds
  end: number; // seconds
  text: string;
  speaker?: string; // populated once diarization is wired in
};

export type MeetingResult = {
  segments: TranscriptSegment[];
  durationSec: number;
};

// AI briefing produced from the transcript (server-side, via DeepSeek).
export type MeetingFollowUp = { text: string; owner?: string };
export type MeetingSummary = {
  summary: string;
  decisions: string[];
  followUps: MeetingFollowUp[];
};

// main thread -> worker
export type WorkerInbound = {
  type: "transcribe";
  pcm: Float32Array;
  sampleRate: number;
};

// worker -> main thread
export type WorkerOutbound =
  | { type: "progress"; stage: "model" | "transcribe" | "diarize"; pct?: number; detail?: string }
  | { type: "result"; result: MeetingResult }
  | { type: "error"; message: string };
