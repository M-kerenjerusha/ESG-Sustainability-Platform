import { createContext, useContext, useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("esg_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem("esg_user", JSON.stringify(user));
    else localStorage.removeItem("esg_user");
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("esg_token", data.data.token);
      setUser(data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("esg_token", data.data.token);
      setUser(data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("esg_token");
    localStorage.removeItem("esg_user");
    setUser(null);
  };

  const updateUser = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
