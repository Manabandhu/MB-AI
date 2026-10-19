/**
 * Live capture for the browser: streams 16 kHz PCM16 to the live gateway.
 *
 * "meeting" mode: two channels, left = your mic, right = the meeting audio shared from the screen
 * (Share system audio / Share tab audio), so you are told apart from everyone else without voiceprints.
 * "room" mode: one channel from your mic (in-person; speakers are separated by voice).
 */

export type CaptureMode = "meeting" | "room";

const TARGET_RATE = 16000;

const WORKLET = `
class Tap extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input.length) this.port.postMessage(input.map((ch) => ch.slice(0)));
    return true;
  }
}
registerProcessor("tap", Tap);
`;

export class CaptureError extends Error {}

export class LiveCapture {
  private ctx?: AudioContext;
  private mic?: MediaStream;
  private display?: MediaStream;
  private node?: AudioWorkletNode;
  private micAnalyser?: AnalyserNode;
  private meetingAnalyser?: AnalyserNode;
  private pending: Float32Array[][] = [];
  private pendingFrames = 0;
  private carry = 0;
  paused = false;
  onEnded?: () => void;

  constructor(
    public mode: CaptureMode,
    private onPcm: (chunk: ArrayBuffer) => void,
  ) {}

  get channels(): number {
    return this.mode === "meeting" ? 2 : 1;
  }

  static supported(): boolean {
    return !!navigator.mediaDevices?.getUserMedia && typeof AudioWorkletNode !== "undefined";
  }

  async start(): Promise<void> {
    try {
      this.mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      throw new CaptureError("Microphone access was blocked. Allow the microphone for this site and try again.");
    }
    if (this.mode === "meeting") {
      try {
        this.display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } catch {
        this.stop();
        throw new CaptureError("Screen sharing was cancelled, so there's no meeting audio to listen to.");
      }
      if (!this.display.getAudioTracks().length) {
        this.stop();
        throw new CaptureError(
          "No meeting audio was shared. Pick “Entire screen” with “Share system audio”, or the meeting's tab with “Share tab audio”.",
        );
      }
      this.display.getTracks().forEach((t) => t.addEventListener("ended", () => this.onEnded?.()));
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    const merger = ctx.createChannelMerger(this.channels);
    const micSrc = ctx.createMediaStreamSource(this.mic);
    this.micAnalyser = ctx.createAnalyser();
    micSrc.connect(this.micAnalyser);
    micSrc.connect(merger, 0, 0);
    if (this.display) {
      const meetSrc = ctx.createMediaStreamSource(new MediaStream(this.display.getAudioTracks()));
      this.meetingAnalyser = ctx.createAnalyser();
      meetSrc.connect(this.meetingAnalyser);
      meetSrc.connect(merger, 0, 1);
    }
    this.node = new AudioWorkletNode(ctx, "tap", {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: this.channels,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
    });
    merger.connect(this.node);
    this.node.port.onmessage = (e: MessageEvent<Float32Array[]>) => this.collect(e.data);
  }

  /** Batch ~100 ms of audio, resample to 16 kHz, interleave as PCM16LE, and hand it off. */
  private collect(block: Float32Array[]) {
    const chans = Array.from({ length: this.channels }, (_, i) => block[i] ?? block[0]);
    this.pending.push(chans);
    this.pendingFrames += chans[0].length;
    const rate = this.ctx!.sampleRate;
    if (this.pendingFrames < rate / 10) return;
    const joined = Array.from({ length: this.channels }, (_, c) => {
      const out = new Float32Array(this.pendingFrames);
      let o = 0;
      for (const b of this.pending) {
        out.set(b[c], o);
        o += b[c].length;
      }
      return out;
    });
    this.pending = [];
    this.pendingFrames = 0;
    const ratio = rate / TARGET_RATE;
    const n = Math.floor((joined[0].length - this.carry) / ratio);
    const pcm = new Int16Array(n * this.channels);
    for (let i = 0; i < n; i++) {
      const pos = this.carry + i * ratio;
      const k = Math.floor(pos);
      const frac = pos - k;
      for (let c = 0; c < this.channels; c++) {
        const a = joined[c][k] ?? 0;
        const b = joined[c][k + 1] ?? a;
        const v = this.paused ? 0 : a + (b - a) * frac;
        pcm[i * this.channels + c] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
      }
    }
    this.carry = this.carry + n * ratio - joined[0].length;
    if (this.carry < 0) this.carry = 0;
    this.onPcm(pcm.buffer);
  }

  levels(): { mic: number; meeting: number } {
    return { mic: level(this.micAnalyser), meeting: level(this.meetingAnalyser) };
  }

  stop() {
    this.node?.disconnect();
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
  const db = 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-6);
  return Math.min(1, Math.max(0, (db + 60) / 60));
}
