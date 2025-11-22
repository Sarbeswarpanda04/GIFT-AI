import { ConversationSession, SavedCreation, UserProfile } from "../types";

const KEYS = {
  PROFILE: 'gemini_app_profile',
  SESSIONS: 'gemini_app_sessions',
  LIBRARY: 'gemini_app_library',
  CURRENT_SESSION: 'gemini_app_current_session_id'
};

// --- Profile ---
export const getProfile = (): UserProfile | null => {
  const stored = localStorage.getItem(KEYS.PROFILE);
  return stored ? JSON.parse(stored) : null;
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
};

// --- Sessions (History) ---
export const getSessions = (): ConversationSession[] => {
  const stored = localStorage.getItem(KEYS.SESSIONS);
  return stored ? JSON.parse(stored) : [];
};

export const saveSession = (session: ConversationSession) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  // Limit history to 20 sessions to prevent localStorage quota issues
  const trimmed = sessions.slice(0, 20);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(trimmed));
};

export const deleteSession = (id: string) => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
};

export const getLastSessionId = (): string | null => {
  return localStorage.getItem(KEYS.CURRENT_SESSION);
};

export const setLastSessionId = (id: string) => {
  localStorage.setItem(KEYS.CURRENT_SESSION, id);
};

// --- Library (Saved Creations) ---
export const getLibrary = (): SavedCreation[] => {
  const stored = localStorage.getItem(KEYS.LIBRARY);
  return stored ? JSON.parse(stored) : [];
};

export const saveToLibrary = (creation: SavedCreation) => {
  const lib = getLibrary();
  // Dedupe
  if (!lib.find(i => i.id === creation.id)) {
    lib.unshift(creation);
    // Limit library items to 50
    const trimmed = lib.slice(0, 50);
    localStorage.setItem(KEYS.LIBRARY, JSON.stringify(trimmed));
  }
};

export const deleteFromLibrary = (id: string) => {
  const lib = getLibrary().filter(i => i.id !== id);
  localStorage.setItem(KEYS.LIBRARY, JSON.stringify(lib));
};
