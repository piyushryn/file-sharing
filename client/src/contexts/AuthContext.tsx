import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { API as api } from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token && !!user;

  // Check if user is authenticated on initial load
  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      try {
        if (token) {
          // Set default authorization header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Get current user data
          const response = await api.get("/auth/me");
          setUser(response.data.user);
        }
      } catch (err) {
        console.error("Error verifying token:", err);
        // Clear token if invalid
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: userData } = response.data;

      // Save token to localStorage
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);

      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "An error occurred during login");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      const { token: newToken, user: userData } = response.data;

      // Save token to localStorage
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);

      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || "An error occurred during registration"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);

    // Remove authorization header
    delete api.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    error,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
