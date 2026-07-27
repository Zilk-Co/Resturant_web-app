declare module "@/lib/api-client" {
  import type { UseQueryOptions, QueryKey, QueryFunction, UseMutationOptions, MutationFunction } from "@tanstack/react-query";

  export function setBaseUrl(url: string | null): void;
  export function customFetch<T = unknown>(input: RequestInfo | URL, options?: RequestInit & { responseType?: "json" | "text" | "blob" | "auto" }): Promise<T>;

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

  export const getListAdminMenuItemsQueryKey: () => readonly [string];
  export function listAdminMenuItems(options?: RequestInit): Promise<AdminMenuItem[]>;
}
