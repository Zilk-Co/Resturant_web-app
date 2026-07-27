import AsyncStorage from "@react-native-async-storage/async-storage";

export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export let _baseUrl: string | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (typeof URL !== "undefined" && input instanceof URL) return input.toString();
  return (input as Request).url;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  if (!url.startsWith("/")) return input;
  return `${_baseUrl}${url}`;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function mergeHeaders(...sources: Array<Headers | Record<string, string> | undefined>): Headers {
  const headers = new Headers();
  for (const source of sources) {
    if (!source) continue;
    new Headers(source as any).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
}

let _cachedToken: string | null = null;
let _tokenLoadPromise: Promise<void> | null = null;

async function getStoredToken(): Promise<string | null> {
  if (_cachedToken !== null) return _cachedToken;
  if (!_tokenLoadPromise) {
    _tokenLoadPromise = AsyncStorage.getItem("thb_token").then((t) => {
      _cachedToken = t;
      return;
    });
  }
  await _tokenLoadPromise;
  return _cachedToken;
}

export function setCachedToken(token: string | null): void {
  _cachedToken = token;
  if (token) {
    AsyncStorage.setItem("thb_token", token);
  } else {
    AsyncStorage.removeItem("thb_token");
  }
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem("thb_refresh");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${_baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.accessToken) {
      setCachedToken(data.accessToken);
      if (data.refreshToken) {
        AsyncStorage.setItem("thb_refresh", data.refreshToken);
      }
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  input = applyBaseUrl(input);
  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = init.method ? init.method.toUpperCase() : "GET";

  const headers = mergeHeaders(headersInit);

  const token = await getStoredToken();
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  let response = await fetch(input, { ...init, method, headers });

  if (response.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed && refreshed !== token) {
      headers.set("authorization", `Bearer ${refreshed}`);
      response = await fetch(input, { ...init, method, headers });
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} ${response.statusText}${text ? ": " + text.slice(0, 300) : ""}`);
  }

  if (response.status === 204 || response.status === 205) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as T;
}

customFetch.getBaseUrl = function getBaseUrl(): string {
  return _baseUrl || "";
};

export interface AdminMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  [key: string]: unknown;
}

export const getListAdminMenuItemsQueryKey = () => ["/api/admin/menu"] as const;

export async function listAdminMenuItems(options?: RequestInit): Promise<AdminMenuItem[]> {
  return customFetch<AdminMenuItem[]>("/api/admin/menu", { ...options, method: "GET" });
}
