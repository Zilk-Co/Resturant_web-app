import React, { createContext, useContext, useEffect, useState } from "react";

interface Settings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  taxRate: number;
  deliveryFee: number;
  freeDeliveryOver: number;
  minOrderAmount: number;
  preparationTime: number;
  deliveryTime: number;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  storyHeroImageUrl?: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
}

const defaultSettings: Settings = {
  storeName: "The Hunger Bite Istanbul",
  storePhone: "+92 300 1234567",
  storeAddress: "Karachi, Pakistan",
  taxRate: 17,
  deliveryFee: 99,
  freeDeliveryOver: 2000,
  minOrderAmount: 500,
  preparationTime: 15,
  deliveryTime: 45,
  deliveryEnabled: true,
  takeawayEnabled: true,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/mobile/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.storeName) {
          setSettings(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
