import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_SESSION_STORAGE_KEY,
  clearAuthSession,
  persistAuthSession,
  readAuthSession,
} from "../src/utils/authSession.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const validSession = {
  token: "test.jwt.token",
  user: { id: "user-1", name: "Demo User", email: "demo@example.test", role: "USER" },
};

test("persists and restores the authenticated session from tab-scoped storage", () => {
  const storage = createStorage();
  assert.equal(persistAuthSession(validSession, storage), true);
  assert.deepEqual(readAuthSession(storage), validSession);
  assert.equal(JSON.parse(storage.getItem(AUTH_SESSION_STORAGE_KEY)).token, validSession.token);
});

test("rejects malformed or incomplete stored sessions and clears them", () => {
  const storage = createStorage();
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ ...validSession, user: { ...validSession.user, role: "ROOT" } }));
  assert.equal(readAuthSession(storage), null);
  assert.equal(storage.getItem(AUTH_SESSION_STORAGE_KEY), null);

  storage.setItem(AUTH_SESSION_STORAGE_KEY, "not-json");
  assert.equal(readAuthSession(storage), null);
  assert.equal(storage.getItem(AUTH_SESSION_STORAGE_KEY), null);
});

test("logout clears the persisted session", () => {
  const storage = createStorage();
  persistAuthSession(validSession, storage);
  clearAuthSession(storage);
  assert.equal(storage.getItem(AUTH_SESSION_STORAGE_KEY), null);
});
