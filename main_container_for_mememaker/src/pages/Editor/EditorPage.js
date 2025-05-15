import React from 'react';
import VideoInput from '../../components/VideoInput/VideoInput';
import AudioInput from '../../components/AudioInput/AudioInput';
import TransformationPanel from '../../components/TransformationPanel/TransformationPanel';
import useMedia from '../../hooks/useMedia';

// PUBLIC_INTERFACE
/**
 * EditorPage - Logical layout to organize video, audio, and transformation input components.
 * Integrates with app-wide media state.
 */
function EditorPage() {
  const { video, audio } = useMedia();

  // Enhanced layout: Video/Audio inputs on top, TransformationPanel below.
  return (
    <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="title" style={{ marginBottom: 0 }}>Editor</h2>
      <div className="description" style={{ marginBottom: 34 }}>
        This is where you will upload/select a video, add captions, apply visual effects, and create your meme.
      </div>
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22 // spacing between stacked inputs
        }}
      >
        {/* Media Inputs */}
        <VideoInput />
        <AudioInput />
        {/* Transformation Panel integrated below inputs */}
        <TransformationPanel />

        {/* Preview the state managed by context: */}
        <div style={{
          marginTop: 24,
          background: "rgba(240,156,72,0.07)", fontSize: 13, color: "#E87A41",
          borderRadius: 4, padding: "11px 18px", maxWidth: 480
        }}>
          <b>Context Media State:</b>
          <div>Video: {video ? (video.fileName || '[has video]') : "none"}</div>
          <div>Audio: {audio ? (audio.fileName || '[has audio]') : "none"}</div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
