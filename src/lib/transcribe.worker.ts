/// <reference lib="webworker" />
// On-device transcription worker. Runs OpenAI Whisper via Transformers.js,
// preferring WebGPU and falling back to WASM. Diarization is added in a later
// step; for now this produces a timestamped transcript.

import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import type { WorkerInbound, WorkerOutbound, TranscriptSegment } from "./meeting-types";

// Models are fetched from the Hugging Face CDN (data coming in, not audio going
// out). Inference runs entirely in this worker.
env.allowLocalModels = false;

// Xenova/whisper-base ships only fp32 + int8 weights (no 4-bit / MatMulNBits),
// which avoids the onnxruntime-web q4 "missing scale" session bug entirely.
const MODEL_ID = "Xenova/whisper-base";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: WorkerOutbound, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer);
}

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;

async function loadTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) return transcriber;
  const onProgress = (p: { status?: string; file?: string; progress?: number }) => {
    if (p.status === "progress" && typeof p.progress === "number") {
      post({ type: "progress", stage: "model", pct: p.progress, detail: `Loading model (${p.file ?? "weights"})…` });
    }
  };
  // fp32 weights everywhere — no quantization, so no MatMulNBits path to break.
  const dtype = { encoder_model: "fp32" as const, decoder_model_merged: "fp32" as const };
  console.info(`[meetings] loading ASR model=${MODEL_ID} dtype=fp32`);
  try {
    transcriber = await pipeline("automatic-speech-recognition", MODEL_ID, {
      device: "webgpu",
      dtype,
      progress_callback: onProgress,
    });
  } catch {
    // No WebGPU — fall back to WASM (slower but works everywhere).
    post({ type: "progress", stage: "model", detail: "WebGPU unavailable — using CPU (WASM)…" });
    transcriber = await pipeline("automatic-speech-recognition", MODEL_ID, {
      device: "wasm",
      dtype,
      progress_callback: onProgress,
    });
  }
  return transcriber;
}

ctx.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const msg = event.data;
  if (msg.type !== "transcribe") return;

  try {
    post({ type: "progress", stage: "model", detail: "Loading transcription model…" });
    const asr = await loadTranscriber();

    post({ type: "progress", stage: "transcribe", detail: "Transcribing audio…" });
    const output = await asr(msg.pcm, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    const raw = Array.isArray(output) ? output[0] : output;
    const chunks = (raw?.chunks ?? []) as Array<{ timestamp: [number, number | null]; text: string }>;
    const segments: TranscriptSegment[] = chunks
      .map((chunk) => ({
        start: chunk.timestamp[0] ?? 0,
        end: chunk.timestamp[1] ?? chunk.timestamp[0] ?? 0,
        text: chunk.text.trim(),
      }))
      .filter((segment) => segment.text.length > 0);

    post({
      type: "result",
      result: { segments, durationSec: msg.pcm.length / msg.sampleRate },
    });
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
