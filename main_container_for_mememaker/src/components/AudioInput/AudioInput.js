import React, { useRef, useState } from "react";
import "./AudioInput.css";

// PUBLIC_INTERFACE
/**
 * AudioInput component for uploading, recording, or selecting audio.
 * Features:
 *   - Upload audio files.
 *   - Record audio with microphone (WebRTC).
 *   - Pick from a set of public audio samples (extensible).
 *   - Shows waveform visualization.
 *   - Validates file format/size, handles errors.
 *
 * Props:
 *   maxFileSizeMB?: number (default: 10)
 *   supportedFormats?: Array<string> (default: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"])
 *   publicSources?: Array<{ label: string, url: string }>
 */
function AudioInput({
  maxFileSizeMB = 10,
  supportedFormats = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
  publicSources = [
    {
      label: "Sample: Ding",
      url: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows_Notify_Public.wav"
    },
    {
      label: "Sample: Pop",
      url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Computer_Error.mp3"
    }
  ]
}) {
  const [audioURL, setAudioURL] = useState(null); // Blob URL or public URL
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  const [recording, setRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [recChunks, setRecChunks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const [pickedSource, setPickedSource] = useState(null);

  // For waveform visualization
  const waveformCanvasRef = useRef();
  const audioRef = useRef();

  // Helpers
  const validFile = file => {
    if (!file) return { ok: false, error: "No file provided." };
    if (!supportedFormats.includes(file.type)) {
      return { ok: false, error: "Invalid file format. Supported: MP3, WAV, Ogg, WebM." };
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return { ok: false, error: `File too large. Maximum allowed: ${maxFileSizeMB}MB.` };
    }
    return { ok: true };
  };

  // --- Event handlers ---
  const handleFileChange = e => {
    setError(null);
    setPickedSource(null); // Deselect public source
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (audioURL) URL.revokeObjectURL(audioURL);
    setFileName(file.name);
    setAudioURL(URL.createObjectURL(file));
    setRecChunks([]);
    setMediaStream(null);
    setRecorder(null);
    visualizeWaveformFromBlob(file);
  };

  const handleStartRecording = async () => {
    setError(null);
    setPickedSource(null); // Deselect public source
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const mimeType = supportedFormats.includes("audio/webm") ? "audio/webm" : (MediaRecorder.isTypeSupported("audio/wav") ? "audio/wav" : "");
      const rec = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      setMediaStream(stream);
      setRecorder(rec);
      setRecChunks([]);
      setFileName(null);
      setAudioURL(null);

      rec.ondataavailable = e => {
        if (e.data.size > 0) setRecChunks(prev => prev.concat(e.data));
      };
      rec.onstop = () => {
        const blob = new Blob(recChunks, { type: rec.mimeType });
        if (audioURL) URL.revokeObjectURL(audioURL);
        setAudioURL(URL.createObjectURL(blob));
        setFileName("recorded-audio." + (rec.mimeType.split("/")[1] || "webm"));
        if (blob.size > maxFileSizeMB * 1024 * 1024) {
          setError(`Recording too large (${(blob.size / 1024 / 1024).toFixed(2)}MB). Max ${maxFileSizeMB}MB.`);
          setFileName(null);
          setAudioURL(null);
        } else {
          visualizeWaveformFromBlob(blob);
        }
      };
      rec.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const handleStopRecording = () => {
    if (recorder && recording) {
      recorder.stop();
      setRecording(false);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    }
  };

  const handlePickSource = src => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(src.url);
    setFileName(src.label);
    setPickedSource(src.label);
    setError(null);
    setRecChunks([]);
    setRecorder(null);
    setRecording(false);
    visualizeWaveformFromURL(src.url); // public sources are remote URLs
  };

  const handleClear = () => {
    setError(null);
    if (audioURL && (!pickedSource)) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setFileName(null);
    setPickedSource(null);
    setRecording(false);
    setRecChunks([]);
    setRecorder(null);
    setMediaStream(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    clearWaveform();
  };

  const handlePlay = () => {
    if (audioRef.current && audioURL) {
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // --- Waveform visualization ---
  function clearWaveform() {
    const canvas = waveformCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function visualizeWaveformFromBlob(blob) {
    if (!blob) return;
    const reader = new FileReader();
    reader.onload = e => {
      drawWaveformFromAudioBuffer(e.target.result);
    };
    reader.readAsArrayBuffer(blob);
  }

  function visualizeWaveformFromURL(url) {
    fetch(url)
      .then(resp => resp.arrayBuffer())
      .then(buffer => {
        drawWaveformFromAudioBuffer(buffer);
      }).catch(() => {});
  }

  function drawWaveformFromAudioBuffer(buffer) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.decodeAudioData(buffer.slice(0), audioBuffer => {
        const rawData = audioBuffer.getChannelData(0);
        const size = 128;
        const blockSize = Math.floor(rawData.length / size);
        const filteredData = [];
        for (let i = 0; i < size; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          filteredData.push(sum / blockSize);
        }
        // Scale for display
        const canvas = waveformCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#E87A41";
          ctx.beginPath();
          filteredData.forEach((val, i) => {
            const x = (i / size) * canvas.width;
            const y = canvas.height - (val * 0.92 * canvas.height);
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }
      });
    } catch (e) {
      // Waveform is only for UX, silently fail if not supported.
    }
  }

  // --- Render ---
  return (
    <div className="audio-input-root">
      <label className="audio-input-label">Upload, Record, or Pick Audio</label>
      <div className="audio-input-btn-group">
        <button
          className="btn"
          type="button"
          onClick={recording ? handleStopRecording : handleStartRecording}
          disabled={mediaStream && !recording}
        >
          {recording ? "Stop Recording" : "Record Audio"}
        </button>
        <label className="btn btn-file">
          Upload File
          <input
            type="file"
            accept={supportedFormats.join(",")}
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={Boolean(recording)}
          />
        </label>
        <div className="audio-input-public">
          <span style={{ color: "#aaa", fontSize: "0.98rem" }}>Or Pick:</span>
          {publicSources.map(src => (
            <button
              type="button"
              key={src.label}
              className={
                "btn btn-source" +
                (pickedSource === src.label ? " picked" : "")
              }
              onClick={() => handlePickSource(src)}
              disabled={recording}
            >
              {src.label}
            </button>
          ))}
        </div>
        {(audioURL || recording) && (
          <button className="btn" type="button" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      {error && <div className="audio-input-error">{error}</div>}

      <div className="audio-preview-section">
        <audio
          className="audio-preview"
          ref={audioRef}
          src={audioURL || ""}
          controls={Boolean(audioURL) && !recording}
          autoPlay={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            display: audioURL && !recording ? "block" : "none",
            width: 260,
            marginBottom: 7
          }}
        />
        {/* Waveform only shows when not recording and audio data is present */}
        <canvas
          ref={waveformCanvasRef}
          width={260}
          height={36}
          className="audio-waveform"
          style={{
            display: audioURL && !recording ? "block" : "none",
            background: "#171717",
            borderRadius: "4px",
            border: "1px solid var(--border-color, #232323)",
            marginBottom: 5
          }}
        />
        {fileName && <div className="audio-preview-filename">{fileName}</div>}
        {audioURL && !recording && (
          <div className="audio-preview-controls">
            {!isPlaying ? (
              <button className="btn" onClick={handlePlay}>Play</button>
            ) : (
              <button className="btn" onClick={handlePause}>Pause</button>
            )}
          </div>
        )}
        {recording && (
          <div className="audio-preview-hint">
            Recording...
          </div>
        )}
      </div>
      <div className="audio-input-note">
        Formats: MP3, WAV, Ogg, WebM. Max {maxFileSizeMB}MB. Microphone requires permission.
      </div>
    </div>
  );
}

export default AudioInput;
