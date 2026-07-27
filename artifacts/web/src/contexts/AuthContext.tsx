import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { customFetch } from "@workspace/api-client-react";

export interface SavedAddress {
  id: string;
  label: "Home" | "Work" | "Other";
  address: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  username?: string;
  email?: string;
  profilePicUrl?: string;
  addresses: SavedAddress[];
  loyaltyPoints: number;
}

export const LOYALTY_TIERS = [
  { points: 50, discount: 10, label: "10% off" },
  { points: 75, discount: 15, label: "15% off" },
  { points: 100, discount: 25, label: "25% off" },
] as const;

export const MAX_LOYALTY_POINTS = 100;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  signIn: (name: string, phone: string) => Promise<void>;
  signUp: (phone: string, username: string, password: string, name?: string) => Promise<void>;
  verifySignup: (phone: string, code: string) => Promise<void>;
  firebaseVerify: (idToken: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "phone" | "email" | "profilePicUrl" | "loyaltyPoints">>) => Promise<void>;
  addAddress: (address: Omit<SavedAddress, "id">) => Promise<void>;
  updateAddress: (id: string, updates: Partial<Omit<SavedAddress, "id">>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  defaultAddress: SavedAddress | null;
  awardPoints: (orderTotal: number) => Promise<number>;
  redeemPoints: (points: number) => Promise<void>;
  availableTier: (typeof LOYALTY_TIERS)[number] | null;
}

const AuthContext = createContext<AuthContextType>(null!);

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

function getAccessToken(): string | null {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    return null;
  }
}

async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options?.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, { ...options, credentials: "include", headers });

  if (res.status === 401 && !url.includes("/auth/")) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, credentials: "include", headers });
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          const u = await fetchWithAuth<User>("/api/auth/me");
          setUser({ ...u, loyaltyPoints: u.loyaltyPoints ?? 0 });
        }
      } catch {
        accessToken = null;
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      refreshTimerRef.current = setInterval(async () => {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          setUser(null);
          accessToken = null;
        }
      }, 10 * 60 * 1000);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [user]);

  const requestOtp = useCallback(async (phone: string) => {
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to send OTP");
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, name?: string) => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Invalid OTP");
    }
    const data = await res.json();
    accessToken = data.accessToken;
    setUser({ ...data.user, loyaltyPoints: data.user.loyaltyPoints ?? 0 });
  }, []);

  const signIn = useCallback(async (name: string, phone: string) => {
    const res = await fetch("/api/mobile/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    accessToken = data.token;
    setUser({
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      profilePicUrl: data.profilePicUrl,
      addresses: data.addresses ?? [],
      loyaltyPoints: data.loyaltyPoints ?? 0,
    });
  }, []);

  const signUp = useCallback(async (phone: string, username: string, password: string, name?: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, username, password, name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to sign up");
    }
  }, []);

  const verifySignup = useCallback(async (phone: string, code: string) => {
    const res = await fetch("/api/auth/verify-signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Invalid OTP");
    }
    const data = await res.json();
    accessToken = data.accessToken;
    setUser({ ...data.user, loyaltyPoints: data.user.loyaltyPoints ?? 0 });
  }, []);

  const firebaseVerify = useCallback(async (idToken: string) => {
    const res = await fetch("/api/auth/firebase-verify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Verification failed");
    }
    const data = await res.json();
    accessToken = data.accessToken;
    setUser({ ...data.user, loyaltyPoints: data.user.loyaltyPoints ?? 0 });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Invalid username or password");
    }
    const data = await res.json();
    accessToken = data.accessToken;
    setUser({ ...data.user, loyaltyPoints: data.user.loyaltyPoints ?? 0 });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetchWithAuth("/api/auth/logout", { method: "POST" });
    } catch {}
    accessToken = null;
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "name" | "phone" | "email" | "profilePicUrl" | "loyaltyPoints">>) => {
      const u = await fetchWithAuth<User>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setUser((prev) => prev ? { ...prev, ...u, loyaltyPoints: u.loyaltyPoints ?? 0 } : prev);
    },
    []
  );

  const addAddress = useCallback(async (address: Omit<SavedAddress, "id">) => {
    const addr = await fetchWithAuth<SavedAddress>("/api/auth/addresses", {
      method: "POST",
      body: JSON.stringify(address),
    });
    setUser((prev) => {
      if (!prev) return prev;
      const addresses = address.isDefault
        ? prev.addresses.map((a) => ({ ...a, isDefault: false }))
        : [...prev.addresses];
      addresses.push(addr);
      return { ...prev, addresses };
    });
  }, []);

  const updateAddress = useCallback(
    async (id: string, updates: Partial<Omit<SavedAddress, "id">>) => {
      const addr = await fetchWithAuth<SavedAddress>(`/api/auth/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setUser((prev) => {
        if (!prev) return prev;
        const addresses = updates.isDefault
          ? prev.addresses.map((a) => ({ ...a, isDefault: a.id === id }))
          : prev.addresses.map((a) => (a.id === id ? addr : a));
        return { ...prev, addresses };
      });
    },
    []
  );

  const removeAddress = useCallback(async (id: string) => {
    await fetchWithAuth<void>(`/api/auth/addresses/${id}`, { method: "DELETE" });
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, addresses: prev.addresses.filter((a) => a.id !== id) };
    });
  }, []);

  const awardPoints = useCallback(async (orderTotal: number): Promise<number> => {
    const earned = Math.floor(orderTotal / 100);
    if (earned <= 0) return 0;
    let newPoints = 0;
    let actualAwarded = 0;
    setUser((prev) => {
      if (!prev) return prev;
      const current = prev.loyaltyPoints;
      newPoints = Math.min(current + earned, MAX_LOYALTY_POINTS);
      actualAwarded = newPoints - current;
      return { ...prev, loyaltyPoints: newPoints };
    });
    if (actualAwarded > 0) {
      try { await updateProfile({ loyaltyPoints: newPoints } as any); } catch {}
    }
    return actualAwarded;
  }, [updateProfile]);

  const redeemPoints = useCallback(async (points: number) => {
    let newPoints = 0;
    setUser((prev) => {
      if (!prev) return prev;
      newPoints = Math.max(0, prev.loyaltyPoints - points);
      return { ...prev, loyaltyPoints: newPoints };
    });
    try { await updateProfile({ loyaltyPoints: newPoints } as any); } catch {}
  }, [updateProfile]);

  const defaultAddress = user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0] ?? null;

  const availableTier =
    user
      ? ([...LOYALTY_TIERS].reverse().find((t) => (user.loyaltyPoints ?? 0) >= t.points) ?? null)
      : null;

  return (
    <AuthContext.Provider
      value={{
        user, isLoading, requestOtp, verifyOtp, signIn, signUp, verifySignup, firebaseVerify, login, signOut, updateProfile,
        addAddress, updateAddress, removeAddress,
        defaultAddress, awardPoints, redeemPoints, availableTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
