/**
 * Browser recorder for Teams/Zoom/Meet on Windows Chrome or Edge.
 *
 * Left channel  = your microphone
 * Right channel = the meeting's audio, captured by screen-sharing with "Share system audio" on
 *                 (or sharing the meeting's browser tab with "Share tab audio").
 *
 * Keeping the two apart lets the server tell you from everyone else without voice matching.
 */

export type RecorderMode = "meeting" | "in-person";

export interface Levels {
  mic: number; // 0..1
  meeting: number; // 0..1
}

export class RecorderError extends Error {}

export class MeetingRecorder {
  private ctx?: AudioContext;
  private mic?: MediaStream;
  private display?: MediaStream;
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private micAnalyser?: AnalyserNode;
  private meetingAnalyser?: AnalyserNode;
  private stopped?: Promise<Blob>;
  onEnded?: () => void;
  readonly mimeType: string;

  constructor(public mode: RecorderMode) {
    const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
    this.mimeType = preferred.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
  }

  static supported(): boolean {
    return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(): Promise<void> {
    if (!MeetingRecorder.supported()) throw new RecorderError("This browser can't record audio. Use Chrome or Edge.");
    try {
      this.mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      throw new RecorderError("Microphone access was blocked. Allow the microphone for this site and try again.");
    }

    if (this.mode === "meeting") {
      try {
        this.display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } catch {
        this.cleanup();
        throw new RecorderError("Screen sharing was cancelled, so there's no meeting audio to record.");
      }
      if (this.display.getAudioTracks().length === 0) {
        this.cleanup();
        throw new RecorderError(
          "No meeting audio was shared. Pick “Entire screen” and turn on “Share system audio”, or share the meeting's browser tab with “Share tab audio”.",
        );
      }
      // If the person clicks the browser's "Stop sharing" bar, finish the recording.
      this.display.getTracks().forEach((t) => t.addEventListener("ended", () => this.onEnded?.()));
    }

    const ctx = new AudioContext({ sampleRate: 48000 });
    this.ctx = ctx;
    const merger = ctx.createChannelMerger(2);
    const micSource = ctx.createMediaStreamSource(this.mic);
    this.micAnalyser = ctx.createAnalyser();
    micSource.connect(this.micAnalyser);
    micSource.connect(merger, 0, 0);

    if (this.display) {
      const meetingSource = ctx.createMediaStreamSource(new MediaStream(this.display.getAudioTracks()));
      this.meetingAnalyser = ctx.createAnalyser();
      meetingSource.connect(this.meetingAnalyser);
      meetingSource.connect(merger, 0, 1);
    }

    const dest = ctx.createMediaStreamDestination();
    dest.channelCount = this.mode === "meeting" ? 2 : 1;
    (this.mode === "meeting" ? merger : micSource).connect(dest);

    this.recorder = new MediaRecorder(dest.stream, {
      ...(this.mimeType ? { mimeType: this.mimeType } : {}),
      audioBitsPerSecond: 96_000,
    });
    this.chunks = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.stopped = new Promise((resolve) => {
      this.recorder!.onstop = () => resolve(new Blob(this.chunks, { type: this.mimeType || "audio/webm" }));
    });
    this.recorder.start(1000);
  }

  levels(): Levels {
    return { mic: level(this.micAnalyser), meeting: level(this.meetingAnalyser) };
  }

  pause() {
    if (this.recorder?.state === "recording") this.recorder.pause();
  }

  resume() {
    if (this.recorder?.state === "paused") this.recorder.resume();
  }

  get state(): RecordingState | "idle" {
    return this.recorder?.state ?? "idle";
  }

  async stop(): Promise<Blob> {
    if (!this.recorder || !this.stopped) throw new RecorderError("Recording hasn't started.");
    if (this.recorder.state !== "inactive") this.recorder.stop();
    const blob = await this.stopped;
    this.cleanup();
    return blob;
  }

  cleanup() {
    this.mic?.getTracks().forEach((t) => t.stop());
    this.display?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => undefined);
  }
}

function level(analyser?: AnalyserNode): number {
  if (!analyser) return 0;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  let sum = 0;
  for (const v of buf) sum += v * v;
  const rms = Math.sqrt(sum / buf.length);
  // map roughly -60 dBFS..0 dBFS to 0..1
  const db = 20 * Math.log10(rms || 1e-6);
  return Math.min(1, Math.max(0, (db + 60) / 60));
}
