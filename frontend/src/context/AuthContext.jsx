import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";
import { STORAGE_KEYS } from "../config/constants";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeAuth();
  }, []);

const initializeAuth = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!token) {
        setLoading(false);
        return;
      }

      // Restore the cached user (with roles) immediately so the UI doesn't
      // lose the role context on refresh before the profile request completes.
      const cachedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }

      const response = await authService.getProfile();

      // AuthController.getMe uses handleSuccess(response.data.data = user object)
      // response = { success, message, data: { id, email, firstName, ... } }
      const profileData = response.data || response;

      // The getMe endpoint returns a slim DTO without roles. Merge the fresh
      // profile data with the cached user (which contains roles) so that
      // role-based navigation and routing keep working after a refresh.
      let mergedUser = { ...profileData };
      if (profileData && profileData.id) {
        if (cachedUser) {
          try {
            const cached = JSON.parse(cachedUser);
            mergedUser = { ...cached, ...profileData };
          } catch (e) {
            /* ignore */
          }
        }
        setUser(mergedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mergedUser));
      }
    } catch (error) {
      console.error(error);

      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
  const response = await authService.login(credentials);

  // AuthController.login uses handleSuccess() which wraps data in ApiResponse
  // response = { success, message, data: { user, tokens: { accessToken } } }
  const loginData = response.data || response;
  const user = loginData.user || response.user;
  const accessToken = loginData.tokens?.accessToken || response.tokens?.accessToken;

  if (accessToken) {
    localStorage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN,
      accessToken
    );
  }

  if (user) {
    setUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  return response;
};

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {}

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);