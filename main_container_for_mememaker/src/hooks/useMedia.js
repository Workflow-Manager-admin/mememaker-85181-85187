import { useMediaContext } from "../context/MediaContext";

/**
 * PUBLIC_INTERFACE
 * useMedia custom hook for interacting with global media context.
 *
 * Usage: const { video, setVideo, clearVideo, ... } = useMedia();
 */
function useMedia() {
  const { state, dispatch } = useMediaContext();

  // Setters/clearers for convenience
  const setVideo = (videoObj) => dispatch({ type: "SET_VIDEO", payload: videoObj });
  const clearVideo = () => dispatch({ type: "CLEAR_VIDEO" });
  const setAudio = (audioObj) => dispatch({ type: "SET_AUDIO", payload: audioObj });
  const clearAudio = () => dispatch({ type: "CLEAR_AUDIO" });
  const setTransformations = (t) => dispatch({ type: "SET_TRANSFORMATIONS", payload: t });
  const setTimeline = (timelineArray) => dispatch({ type: "SET_TIMELINE", payload: timelineArray });

  return {
    video: state.video,
    audio: state.audio,
    transformations: state.transformations,
    timeline: state.timeline,
    setVideo,
    clearVideo,
    setAudio,
    clearAudio,
    setTransformations,
    setTimeline,
  };
}

export default useMedia;
