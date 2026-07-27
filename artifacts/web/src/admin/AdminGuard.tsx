import { useEffect, useState } from "react";
import { useLocation } from "wouter";

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    const token = sessionStorage.getItem("admin_token");
    if (auth === "true" && isTokenValid(token)) {
      setOk(true);
    } else {
      sessionStorage.removeItem("admin_auth");
      sessionStorage.removeItem("admin_token");
      setLocation("/admin-login");
    }
  }, [setLocation]);

  if (!ok) return null;
  return <>{children}</>;
}
