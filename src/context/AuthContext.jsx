// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
const SOFTWALL_KEYS = ['pl_guest_seen_count_v1', 'pl_soft_wall_shown_at_v1']
const TOKEN_KEY = "token";
const USER_KEY = "user";


function clearGuestSoftWall() {
  try { SOFTWALL_KEYS.forEach(k => localStorage.removeItem(k)) } catch {}
}

export const AuthContext = createContext();

function readFrom(storage) {
  try {
    const t = storage.getItem(TOKEN_KEY);
    const u = storage.getItem(USER_KEY);
    return {
      token: t || null,
      user: u ? JSON.parse(u) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

function writeTo(storage, { token, user }) {
  if (!storage) return;
  if (token) storage.setItem(TOKEN_KEY, token);
  if (user) storage.setItem(USER_KEY, JSON.stringify(user));
}

function clearFrom(storage) {
  if (!storage) return;
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Which storage are we using for the current session?
  // Keep a ref so we can clear the right place on logout.
  const storageRef = useRef(null);

  // Rehydrate on mount: prefer sessionStorage, then localStorage
  useEffect(() => {
    const ss = readFrom(sessionStorage);
    if (ss.token) {
      storageRef.current = sessionStorage;
      setToken(ss.token);
      setUser(ss.user);
      setLoading(false);
      return;
    }
    const ls = readFrom(localStorage);
    if (ls.token) {
      storageRef.current = localStorage;
      setToken(ls.token);
      setUser(ls.user);
    }
    setLoading(false);
  }, []);

  // Public API: login writes atomically to chosen storage BEFORE we navigate
  const login = ({ token, user, remember }) => {
    const store = remember ? localStorage : sessionStorage;
    storageRef.current = store;

    // write synchronously to chosen storage
    writeTo(store, { token, user });

    // update React state
    setToken(token);
    setUser(user);
    clearGuestSoftWall();
  };

  // Public API: logout clears both storages + state
  const logout = () => {
    clearFrom(sessionStorage);
    clearFrom(localStorage);
    storageRef.current = null;
    setToken(null);
    setUser(null);
  };

  const authed = useMemo(() => !!token && !!user, [token, user]);

  return (
    <AuthContext.Provider value={{
      user, setUser,
      token, setToken,
      login, logout,
      authed,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
