import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, logout as apiLogout } from "~/api/auth";
import { getToken, removeTokens, getRefreshToken } from "~/api/client";
import type { User } from "~/types";
import { ApiException } from "~/api/errors";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const token = getToken();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      if (error instanceof ApiException && error.status === 401) {
        removeTokens();
        setUser(null);
      } else {
        removeTokens();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        if (e.newValue) {
          fetchUser();
        } else {
          setUser(null);
        }
      }
    };

    const handleTokenChange = () => {
      const token = getToken();
      if (token) {
        fetchUser();
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tokenChange", handleTokenChange);

    const interval = setInterval(() => {
      const token = getToken();
      const refreshToken = getRefreshToken();
      
      if (token && refreshToken) {
        fetchUser();
      } else if (!token && !refreshToken) {
        setUser(null);
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenChange", handleTokenChange);
      clearInterval(interval);
    };
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    setUser,
    logout,
    refetchUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth нужно использовать внутри AuthProvider");
  }

  return context;
}
