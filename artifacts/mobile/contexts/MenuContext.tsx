import React, { createContext, useContext, useMemo } from "react";

import { type MenuItem } from "@/constants/data";
import { apiToMenuItem, type ApiMenuItem } from "@/lib/menuUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch, type AdminMenuItem } from "@/lib/api-client";

type MenuContextValue = {
  menuItems: MenuItem[];
  loaded: boolean;
  getItemById: (id: string) => MenuItem | undefined;
  refresh: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

const MENU_QUERY_KEY = ["/api/mobile/menu"];

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: apiItems, isFetched } = useQuery<AdminMenuItem[]>({
    queryKey: MENU_QUERY_KEY,
    queryFn: () => customFetch<AdminMenuItem[]>("/api/mobile/menu"),
    refetchInterval: 5000,
  });

  const menuItems = useMemo<MenuItem[]>(() => {
    if (!apiItems?.length) return [];
    return (apiItems as ApiMenuItem[]).filter((a) => a.available).map(apiToMenuItem);
  }, [apiItems]);

  const getItemById = (id: string) =>
    menuItems.find((i) => i.id === id);

  const value = useMemo(
    () => ({
      menuItems,
      loaded: isFetched,
      getItemById,
      refresh: () => queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY }),
    }),
    [menuItems, isFetched, queryClient],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("useMenu must be used within MenuProvider");
  }
  return ctx;
}
