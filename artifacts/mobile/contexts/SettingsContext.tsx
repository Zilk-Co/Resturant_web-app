import React, { createContext, useContext, useMemo, useEffect, useState } from "react";
import { customFetch } from "@/lib/api-client";

type Settings = {
  storeName: string;
  storePhone: string;
  taxRate: number;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryOver: number;
  takeawayDiscount: number;
  preparationTime: number;
  deliveryTime: number;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  maxDeliveryRadius: number;
};

const DEFAULT_SETTINGS: Settings = {
  storeName: "The Hunger Bite Istanbul",
  storePhone: "+92 300 1234567",
  taxRate: 17,
  deliveryFee: 99,
  minOrderAmount: 500,
  freeDeliveryOver: 2000,
  takeawayDiscount: 10,
  preparationTime: 15,
  deliveryTime: 45,
  deliveryEnabled: true,
  takeawayEnabled: true,
  maxDeliveryRadius: 5,
};

type SettingsContextValue = {
  settings: Settings;
  loaded: boolean;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loaded: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    customFetch<Settings>("/api/mobile/settings")
      .then((data) => {
        if (data) setSettings({ ...DEFAULT_SETTINGS, ...data });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo(() => ({ settings, loaded }), [settings, loaded]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
