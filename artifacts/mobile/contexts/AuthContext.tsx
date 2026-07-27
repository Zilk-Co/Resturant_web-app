import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { customFetch, setCachedToken } from "../lib/api-client";

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
  login: (username: string, password: string) => Promise<void>;
  signUp: (data: { phone: string; username: string; password: string; name?: string }) => Promise<{ message: string; phone: string; devOtp?: string }>;
  verifySignup: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "phone" | "email" | "profilePicUrl" | "loyaltyPoints">>) => Promise<void>;
  addAddress: (address: Omit<SavedAddress, "id">) => Promise<void>;
  updateAddress: (id: string, updates: Partial<Omit<SavedAddress, "id">>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  defaultAddress: SavedAddress | null;
  awardPoints: (orderTotal: number) => Promise<number>;
  redeemPoints: (points: number) => Promise<void>;
  availableTier: (typeof LOYALTY_TIERS)[number] | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  signUp: async () => ({ message: "", phone: "" }),
  verifySignup: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  addAddress: async () => {},
  updateAddress: async () => {},
  removeAddress: async () => {},
  setDefaultAddress: async () => {},
  defaultAddress: null,
  awardPoints: async () => 0,
  redeemPoints: async () => {},
  availableTier: null,
});

function applyUserFields(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    username: raw.username,
    email: raw.email,
    profilePicUrl: raw.profilePicUrl,
    addresses: raw.addresses ?? [],
    loyaltyPoints: raw.loyaltyPoints ?? 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const restoringRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("thb_token").then((token) => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      restoringRef.current = true;
      customFetch<any>("/api/auth/me")
        .then((u) => {
          setUser(applyUserFields(u));
        })
        .catch(() => {
          setCachedToken(null);
        })
        .finally(() => {
          restoringRef.current = false;
          setIsLoading(false);
        });
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await customFetch<any>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    if (!result.success) {
      throw new Error(result.error || "Login failed");
    }

    setCachedToken(result.accessToken);
    setUser(applyUserFields(result.user));

    if (result.refreshToken) {
      AsyncStorage.setItem("thb_refresh", result.refreshToken);
    }
  }, []);

  const signUp = useCallback(async (data: { phone: string; username: string; password: string; name?: string }) => {
    const result = await customFetch<any>("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: data.phone.trim(),
        username: data.username.trim(),
        password: data.password,
        name: data.name?.trim(),
      }),
    });

    if (!result.success) {
      throw new Error(result.error || "Signup failed");
    }

    return { message: result.message, phone: result.phone, devOtp: result.devOtp };
  }, []);

  const verifySignup = useCallback(async (phone: string, code: string) => {
    const result = await customFetch<any>("/api/auth/verify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
    });

    if (!result.success) {
      throw new Error(result.error || "Verification failed");
    }

    setCachedToken(result.accessToken);
    setUser(applyUserFields(result.user));

    if (result.refreshToken) {
      AsyncStorage.setItem("thb_refresh", result.refreshToken);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await customFetch<any>("/api/auth/logout", { method: "POST" });
    } catch {}
    setCachedToken(null);
    await AsyncStorage.removeItem("thb_refresh");
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "name" | "phone" | "email" | "profilePicUrl" | "loyaltyPoints">>) => {
      const u = await customFetch<any>("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setUser((prev) => prev ? { ...prev, ...applyUserFields(u) } : prev);
    },
    []
  );

  const addAddress = useCallback(async (address: Omit<SavedAddress, "id">) => {
    const addr = await customFetch<SavedAddress>("/api/auth/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      const addr = await customFetch<SavedAddress>(`/api/auth/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
    await customFetch<void>(`/api/auth/addresses/${id}`, { method: "DELETE" });
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, addresses: prev.addresses.filter((a) => a.id !== id) };
    });
  }, []);

  const setDefaultAddress = useCallback(async (id: string) => {
    await updateAddress(id, { isDefault: true } as Partial<Omit<SavedAddress, "id">>);
  }, [updateAddress]);

  const awardPoints = useCallback(async (orderTotal: number): Promise<number> => {
    const earned = Math.floor(orderTotal / 100);
    if (earned <= 0) return 0;
    let actualAwarded = 0;
    let newPoints = 0;
    setUser((prev) => {
      if (!prev) return prev;
      const current = prev.loyaltyPoints;
      newPoints = Math.min(current + earned, MAX_LOYALTY_POINTS);
      actualAwarded = newPoints - current;
      return { ...prev, loyaltyPoints: newPoints };
    });
    if (actualAwarded > 0) {
      try {
        await updateProfile({ loyaltyPoints: newPoints } as any);
      } catch {}
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
    try {
      await updateProfile({ loyaltyPoints: newPoints } as any);
    } catch {}
  }, [updateProfile]);

  const defaultAddress = user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0] ?? null;

  const availableTier =
    user
      ? ([...LOYALTY_TIERS].reverse().find((t) => (user.loyaltyPoints ?? 0) >= t.points) ?? null)
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signUp,
        verifySignup,
        signOut,
        updateProfile,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        defaultAddress,
        awardPoints,
        redeemPoints,
        availableTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
