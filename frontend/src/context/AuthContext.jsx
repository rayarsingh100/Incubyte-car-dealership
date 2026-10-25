import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { loginRequest } from "../services/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  const login = useCallback(async (credentials) => {
    const nextSession = await loginRequest(credentials);
    setSession(nextSession);
    return nextSession.user;
  }, []);

  const logout = useCallback(() => {
    // The backend has no token-revocation endpoint; this clears only this browser session.
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
