// Simple audio recorder helper using MediaRecorder
let mediaStream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];

export async function start(): Promise<void> {
  if (recorder && recorder.state === "recording") return;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];
  try {
    recorder = new MediaRecorder(mediaStream, { mimeType: "audio/webm" });
  } catch (e) {
    recorder = new MediaRecorder(mediaStream);
  }
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };
  recorder.start();
}

export async function stop(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!recorder) return reject(new Error("No recorder available"));
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      // stop tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
      recorder = null;
      chunks = [];
      resolve(blob);
    };
    try {
      recorder.stop();
    } catch (e) {
      reject(e);
    }
  });
}

const audioRecorder = { start, stop };
export default audioRecorder;
