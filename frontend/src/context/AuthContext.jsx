import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getProfile, loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("akb_token"));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getProfile();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("akb_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem("akb_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (userData) => {
    const data = await registerUser(userData);
    localStorage.setItem("akb_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("akb_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const refreshUser = async () => {
    if (!token) return null;
    const data = await getProfile();
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user && token),
      loading,
      login,
      logout,
      refreshUser,
      signup,
      token,
      updateUser,
      user,
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
