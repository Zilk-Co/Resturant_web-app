import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

setBaseUrl(import.meta.env.VITE_API_URL || "");

setAuthTokenGetter(() => localStorage.getItem("rfc_token"));
