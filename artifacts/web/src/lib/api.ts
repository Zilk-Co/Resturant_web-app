import { setBaseUrl, setAuthTokenGetter } from "@/lib/api-client-react";

setBaseUrl(import.meta.env.VITE_API_URL || "");

setAuthTokenGetter(() => localStorage.getItem("rfc_token"));
