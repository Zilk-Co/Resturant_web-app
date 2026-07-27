import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "@/lib/api";
import App from "./App";

const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const token = sessionStorage.getItem("admin_token");
  if (token) {
    const headers = new Headers(init?.headers);
    if (!headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return originalFetch.call(window, input, { ...init, headers });
  }
  return originalFetch.call(window, input, init);
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
