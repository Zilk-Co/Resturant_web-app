import { Platform } from "react-native";

// Import from api-client to use the same base URL
import { _baseUrl } from "./api-client";

export function getApiBase(): string {
  if (_baseUrl) {
    return _baseUrl;
  }

  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) {
    const trimmed = domain.replace(/\/+$/, "");
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.includes("localhost") || trimmed.startsWith("127.")) {
      return `http://${trimmed}`;
    }
    return `https://${trimmed}`;
  }

  // Local dev: default API port when EXPO_PUBLIC_DOMAIN is not baked in
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return "http://localhost:8080";
  }

  return "";
}
