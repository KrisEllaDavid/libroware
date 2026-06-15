import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { User, Role } from "../types";
import { client } from "../apollo-client";
import { LOGOUT } from "../graphql/mutations";

// Electron and Capacitor identify themselves via global APIs.
// In those environments we fall back to bearer-token auth (stored in localStorage)
// because httpOnly cookies don't reliably cross the custom-scheme boundary
// (libroware:// / capacitor://). Web uses the httpOnly cookie exclusively.
const isNativeApp =
  typeof window !== "undefined" &&
  (!!(window as any).electronAPI || !!(window as any).Capacitor);

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  isAdmin: () => boolean;
  isLibrarian: () => boolean;
  isUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Rehydrate session from localStorage.
    // Web: only user JSON is stored (token lives in the httpOnly cookie).
    // Electron/Capacitor: both token and user are stored.
    const storedToken = localStorage.getItem("token");
    const storedUser  = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setToken(storedToken || null);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    if (isNativeApp && newToken) {
      // Electron/Capacitor: persist bearer token for Authorization header
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      // Web: token lives in the httpOnly cookie set by the server; remove any
      // stale bearer token from localStorage to avoid accidental header leaks.
      localStorage.removeItem("token");
      setToken(null);
    }
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear local state immediately for instant UI response.
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Clear Apollo cache and ask the server to clear the httpOnly cookie.
    // Both are best-effort — swallowed if network is down.
    client.clearStore().catch(() => {});
    client.mutate({ mutation: LOGOUT }).catch(() => {});
  };

  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const isAdmin = () => user?.role?.toUpperCase() === "ADMIN";

  const isLibrarian = () => {
    const role = user?.role?.toUpperCase();
    return role === "LIBRARIAN" || role === "ADMIN";
  };

  const isUser = () => user?.role?.toUpperCase() === "USER";

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        logout,
        updateUser,
        isAdmin,
        isLibrarian,
        isUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
