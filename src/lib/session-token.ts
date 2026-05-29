const STORAGE_KEY = "ourfund_session_token";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getStoredSessionToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function storeSessionToken(token: string | null | undefined) {
  if (!canUseStorage()) return;
  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearStoredSessionToken() {
  storeSessionToken(null);
}

export async function fetchWithSessionToken(url: string, requestInit: RequestInit) {
  const headers = new Headers(requestInit.headers);
  const token = getStoredSessionToken();

  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...requestInit,
    credentials: "include",
    headers,
  });
}
