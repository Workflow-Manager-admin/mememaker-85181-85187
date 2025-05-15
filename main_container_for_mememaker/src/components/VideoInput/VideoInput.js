import React, { useRef, useState } from "react";
import "./VideoInput.css";

// PUBLIC_INTERFACE
function VideoInput({ maxFileSizeMB = 50, supportedFormats = ["video/mp4", "video/webm", "video/ogg"] }) {
  const [videoURL, setVideoURL] = useState(null); // for preview (Blob URL)
  const [fileName, setFileName] = useState(null);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [mediaStream, setMediaStream] = useState(null); // MediaStream object
  const [chunks, setChunks] = useState([]); // for recording
  const [recorder, setRecorder] = useState(null); // MediaRecorder instance
  const [error, setError] = useState(null);

  const videoRef = useRef();

  // Helpers
  const validFile = file => {
    if (!file) return { ok: false, error: "No file provided." };
    if (!supportedFormats.includes(file.type)) {
      return { ok: false, error: "Invalid file format. Supported: MP4, WebM, Ogg." };
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return { ok: false, error: `File too large. Maximum allowed: ${maxFileSizeMB}MB.` };
    }
    return { ok: true };
  };

  const handleFileChange = e => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (videoURL) URL.revokeObjectURL(videoURL);
    setFileName(file.name);
    setVideoURL(URL.createObjectURL(file));
    setChunks([]);
    setMediaStream(null);
    setRecorder(null);
  };

  const handleStartCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      setMediaStream(stream);
      // show live browser stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.controls = false;
        videoRef.current.muted = true;
        videoRef.current.play();
      }
      setRecording(false);
      setRecorder(null);
      setVideoURL(null);
      setChunks([]);
      setFileName(null);
    } catch (err) {
      setError("Camera access denied or unavailable.");
    }
  };

  const handleStopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      setRecorder(null);
      setRecording(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  };

  const handleStartRecording = () => {
    setError(null);
    if (!mediaStream) {
      setError("No camera stream. Please enable camera first.");
      return;
    }
    try {
      const rec = new window.MediaRecorder(mediaStream, {
        mimeType: supportedFormats.includes("video/webm") ? "video/webm" : "video/mp4",
      });
      setRecorder(rec);
      setChunks([]);
      rec.ondataavailable = e => {
        if (e.data.size > 0) setChunks(prev => prev.concat(e.data));
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType });
        if (videoURL) URL.revokeObjectURL(videoURL);
        setVideoURL(URL.createObjectURL(blob));
        setFileName("recorded-video." + (rec.mimeType.split("/")[1] || "mp4"));
        // Post-processing file validation for size
        if (blob.size > maxFileSizeMB * 1024 * 1024) {
          setError(`Recording too large (${(blob.size / 1024 / 1024).toFixed(2)}MB). Max ${maxFileSizeMB}MB.`);
          setVideoURL(null);
          setFileName(null);
        }
        // Stop showing live stream
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.controls = true;
        }
        setMediaStream(null);
      };
      rec.start();
      setRecording(true);
      setError(null);
      // Disable controls & show live preview
      if (videoRef.current) {
        videoRef.current.controls = false;
        videoRef.current.muted = true;
      }
    } catch (err) {
      setError("Recording failed: " + (err?.message || "Unknown error."));
    }
  };

  const handleStopRecording = () => {
    if (recorder && recording) {
      recorder.stop();
      setRecording(false);
    }
  };

  const handlePlay = () => {
    if (videoRef.current && videoURL) {
      videoRef.current.play();
      setPlaying(true);
      videoRef.current.onended = () => setPlaying(false);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleClear = () => {
    setError(null);
    if (videoURL) URL.revokeObjectURL(videoURL);
    setVideoURL(null);
    setChunks([]);
    setFileName(null);
    setMediaStream(null);
    setRecorder(null);
    setRecording(false);
    setPlaying(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  };

  return (
    <div className="video-input-root">
      <label className="video-input-label">Upload or Record Video</label>
      <div className="video-input-btn-group">
        <button
          className="btn"
          type="button"
          onClick={mediaStream ? handleStopCamera : handleStartCamera}
        >
          {mediaStream ? "Stop Camera" : "Use Camera"}
        </button>
        <label className="btn btn-file">
          Upload File
          <input
            type="file"
            accept={supportedFormats.join(",")}
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={recording || !!mediaStream}
          />
        </label>
        {mediaStream && (
          <button
            className="btn"
            type="button"
            onClick={recording ? handleStopRecording : handleStartRecording}
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
        )}
        {(videoURL || mediaStream) && (
          <button className="btn" type="button" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      {error && <div className="video-input-error">{error}</div>}

      <div className="video-preview-section">
        <video
          className="video-preview"
          ref={videoRef}
          src={mediaStream ? undefined : videoURL || ""}
          controls={Boolean(videoURL) && !mediaStream}
          autoPlay={!!mediaStream}
          muted={!!mediaStream}
        />
        {fileName && !mediaStream && <div className="video-preview-filename">{fileName}</div>}
        {videoURL && !mediaStream && (
          <div className="video-preview-controls">
            {!playing ? (
              <button className="btn" onClick={handlePlay}>Play</button>
            ) : (
              <button className="btn" onClick={handlePause}>Pause</button>
            )}
          </div>
        )}
        {mediaStream && (
          <div className="video-preview-hint">
            {recording ? "Recording..." : "Camera ON"}
          </div>
        )}
      </div>
      <div className="video-input-note">
        Formats: MP4, WebM, Ogg. Max {maxFileSizeMB}MB. Camera requires permission.
      </div>
    </div>
  );
}

export default VideoInput;
