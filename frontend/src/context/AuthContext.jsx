import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest } from "../services/authApi.js";
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession, persistAuthSession, readAuthSession } from "../utils/authSession.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readAuthSession);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthSession();
      setSession(null);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const nextSession = await loginRequest(credentials);
    persistAuthSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  }, []);

  const logout = useCallback(() => {
    // The backend has no token-revocation endpoint; this clears only this browser session.
    clearAuthSession();
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    login,
    logout,
  }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
