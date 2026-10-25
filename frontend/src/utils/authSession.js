export const AUTH_SESSION_STORAGE_KEY = "incubyte.auth.session";
export const AUTH_SESSION_EXPIRED_EVENT = "incubyte:session-expired";

function getStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function isValidSession(value) {
  return Boolean(
    value && typeof value === "object" &&
    typeof value.token === "string" && value.token &&
    value.user && typeof value.user === "object" &&
    typeof value.user.id === "string" &&
    typeof value.user.name === "string" &&
    typeof value.user.email === "string" &&
    ["ADMIN", "USER"].includes(value.user.role),
  );
}

export function readAuthSession(storage) {
  const target = getStorage(storage);
  if (!target) return null;

  try {
    const serialized = target.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!serialized) return null;
    const session = JSON.parse(serialized);
    if (isValidSession(session)) return { token: session.token, user: session.user };
  } catch {
    // Treat unreadable or malformed browser storage as a signed-out session.
  }

  clearAuthSession(target);
  return null;
}

export function persistAuthSession(session, storage) {
  const target = getStorage(storage);
  if (!target || !isValidSession(session)) return false;

  try {
    target.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ token: session.token, user: session.user }));
    return true;
  } catch {
    return false;
  }
}

export function clearAuthSession(storage) {
  const target = getStorage(storage);
  if (!target) return;
  try {
    target.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Clearing in-memory auth state still signs the user out if storage is unavailable.
  }
}
