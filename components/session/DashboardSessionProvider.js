import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";

import api from "@/lib/api";

const DashboardSessionContext = createContext(null);

export function DashboardSessionProvider({ children }) {
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    removeCookie("auth_token", { path: "/" });
    setUser(null);
    router.push("/login");
  }, [removeCookie, router]);

  useEffect(() => {
    let ignore = false;

    const loadUser = async () => {
      if (!cookies.auth_token) {
        setUser(null);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      setIsLoading(true);
      const { data, error } = await api.getCurrentUser();

      if (ignore) {
        return;
      }

      if (error) {
        removeCookie("auth_token", { path: "/" });
        setUser(null);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      setUser(data);
      setIsLoading(false);
    };

    loadUser();

    return () => {
      ignore = true;
    };
  }, [cookies.auth_token, removeCookie, router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, isLoading, logout],
  );

  return <DashboardSessionContext.Provider value={value}>{children}</DashboardSessionContext.Provider>;
}

export function useDashboardSession() {
  const context = useContext(DashboardSessionContext);

  if (!context) {
    throw new Error("useDashboardSession must be used within DashboardSessionProvider");
  }

  return context;
}
