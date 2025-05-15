import React, { createContext, useReducer, useContext } from "react";

// PUBLIC_INTERFACE
/**
 * MediaContext provides centralized state for media resources (video, audio, transformations, timeline, etc.).
 */

const initialState = {
  video: null,         // { url, fileName, type, ... }
  audio: null,         // { url, fileName, type, ... }
  timeline: [],        // Array of timeline editing events (to be defined in future)
  transformations: {}, // Effects/settings applied on media (future)
  // Add additional fields as needed
};

function mediaReducer(state, action) {
  switch (action.type) {
    case "SET_VIDEO":
      return { ...state, video: action.payload };
    case "CLEAR_VIDEO":
      return { ...state, video: null };
    case "SET_AUDIO":
      return { ...state, audio: action.payload };
    case "CLEAR_AUDIO":
      return { ...state, audio: null };
    case "SET_TRANSFORMATIONS":
      return { ...state, transformations: action.payload };
    case "SET_TIMELINE":
      return { ...state, timeline: action.payload };
    default:
      return state;
  }
}

const MediaContext = createContext();

/**
 * PUBLIC_INTERFACE
 * MediaProvider wraps children with media state and dispatch.
 */
function MediaProvider({ children }) {
  const [state, dispatch] = useReducer(mediaReducer, initialState);
  return (
    <MediaContext.Provider value={{ state, dispatch }}>
      {children}
    </MediaContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * useMediaContext - direct media context (advanced usage)
 */
function useMediaContext() {
  const ctx = useContext(MediaContext);
  if (!ctx) {
    throw new Error("useMediaContext must be used within a MediaProvider");
  }
  return ctx;
}

export { MediaProvider, useMediaContext };
