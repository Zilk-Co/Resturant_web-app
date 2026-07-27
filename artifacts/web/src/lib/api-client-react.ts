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

async function doFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${_baseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-type")?.includes("text/plain")) {
    return (await res.text()) as unknown as T;
  }
  return res.json() as Promise<T>;
}

function customFetchFn<T = unknown>(path: string): Promise<T> {
  return doFetch<T>(path);
}

customFetchFn.get = <T = unknown>(path: string): Promise<T> => doFetch<T>(path);
customFetchFn.post = <T = unknown>(path: string, body?: unknown): Promise<T> =>
  doFetch<T>(path, { method: "POST", body: body != null ? JSON.stringify(body) : undefined });
customFetchFn.put = <T = unknown>(path: string, body?: unknown): Promise<T> =>
  doFetch<T>(path, { method: "PUT", body: body != null ? JSON.stringify(body) : undefined });
customFetchFn.patch = <T = unknown>(path: string, body?: unknown): Promise<T> =>
  doFetch<T>(path, { method: "PATCH", body: body != null ? JSON.stringify(body) : undefined });
customFetchFn.delete = <T = unknown>(path: string): Promise<T> =>
  doFetch<T>(path, { method: "DELETE" });
customFetchFn.getBaseUrl = () => _baseUrl;

export const customFetch = customFetchFn as {
  <T = unknown>(path: string): Promise<T>;
  get: <T = unknown>(path: string) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  put: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  patch: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  delete: <T = unknown>(path: string) => Promise<T>;
  getBaseUrl: () => string;
};

export const getListAdminOrdersQueryKey = () => ["admin", "orders"] as const;
export const getListAdminMenuItemsQueryKey = () => ["admin", "menu"] as const;
export const getListAdminCategoriesQueryKey = () => ["admin", "categories"] as const;

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
