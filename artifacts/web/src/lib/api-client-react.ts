import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

let _baseUrl = "";
let _authTokenGetter: (() => string | null) | null = null;

export function setBaseUrl(url: string) {
  _baseUrl = url;
}

export function setAuthTokenGetter(fn: () => string | null) {
  _authTokenGetter = fn;
}

function authHeaders(): Record<string, string> {
  const token = _authTokenGetter?.();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const customFetch = {
  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${_baseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${_baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${_baseUrl}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${_baseUrl}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async delete<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${_baseUrl}${path}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  getBaseUrl() {
    return _baseUrl;
  },
};

// Query key factories
export const getListAdminOrdersQueryKey = () => ["admin", "orders"] as const;
export const getListAdminMenuItemsQueryKey = () => ["admin", "menu"] as const;
export const getListAdminCategoriesQueryKey = () => ["admin", "categories"] as const;

// Admin hooks
export function useGetAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => customFetch.get("/api/admin/analytics"),
  });
}

export function useListAdminOrders() {
  return useQuery({
    queryKey: getListAdminOrdersQueryKey(),
    queryFn: () => customFetch.get("/api/admin/orders"),
  });
}

export function useListAdminMenuItems() {
  return useQuery({
    queryKey: getListAdminMenuItemsQueryKey(),
    queryFn: () => customFetch.get("/api/admin/menu"),
  });
}

export function useListAdminCategories() {
  return useQuery({
    queryKey: getListAdminCategoriesQueryKey(),
    queryFn: () => customFetch.get("/api/admin/categories"),
  });
}

export function useCreateAdminMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => customFetch.post("/api/admin/menu", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "menu"] }),
  });
}

export function useUpdateAdminMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      customFetch.patch(`/api/admin/menu/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "menu"] }),
  });
}

export function useDeleteAdminMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customFetch.delete(`/api/admin/menu/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "menu"] }),
  });
}

export function useCreateAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => customFetch.post("/api/admin/categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customFetch.delete(`/api/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useUpdateAdminOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      customFetch.patch(`/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useRequestUploadUrl() {
  return useMutation({
    mutationFn: (filename: string) =>
      customFetch.post("/api/admin/upload", { filename }),
  });
}
