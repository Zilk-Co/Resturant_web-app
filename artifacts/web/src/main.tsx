import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "@/lib/api";
import App from "./App";

const API_BASE = import.meta.env.VITE_API_URL || "";

const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

  if (url.startsWith("/api/")) {
    url = API_BASE + url;
  }

  const token = sessionStorage.getItem("admin_token");
  const headers = new Headers(init?.headers);
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return originalFetch.call(window, url, { ...init, headers });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
