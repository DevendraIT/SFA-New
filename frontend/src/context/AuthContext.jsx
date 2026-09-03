import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";
import { STORAGE_KEYS } from "../config/constants";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const getStoredItem = (key) => {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  };

  const setStoredItem = (key, value) => {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  };

  const removeStoredItem = (key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  };

  let initAuthPromise = null;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    if (initAuthPromise) return initAuthPromise;

    initAuthPromise = (async () => {
      try {
        const token = getStoredItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (!token) {
          setLoading(false);
          return;
        }

        // Restore the cached user (with roles) immediately so the UI doesn't
        // lose context or redirect to login on page refresh before network request finishes.
        const cachedUserRaw = getStoredItem(STORAGE_KEYS.USER);
        let parsedCachedUser = null;
        if (cachedUserRaw) {
          try {
            parsedCachedUser = JSON.parse(cachedUserRaw);
            setUser(parsedCachedUser);
          } catch (e) {
            removeStoredItem(STORAGE_KEYS.USER);
          }
        }

        const response = await authService.getProfile();
        const profileData = response.data || response;

        let mergedUser = { ...profileData };
        if (profileData && (profileData.id || profileData.email)) {
          if (parsedCachedUser) {
            mergedUser = {
              ...parsedCachedUser,
              ...profileData,
              roles: profileData.roles?.length ? profileData.roles : parsedCachedUser.roles,
            };
          }
          setUser(mergedUser);
          setStoredItem(STORAGE_KEYS.USER, JSON.stringify(mergedUser));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);

        // ONLY wipe session if server explicitly returned 401 Unauthorized
        if (error?.response?.status === 401) {
          removeStoredItem(STORAGE_KEYS.ACCESS_TOKEN);
          removeStoredItem(STORAGE_KEYS.USER);
          setUser(null);
        }
      } finally {
        setLoading(false);
        initAuthPromise = null;
      }
    })();

    return initAuthPromise;
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);

    const loginData = response.data || response;
    const userObj = loginData.user || response.user;
    const accessToken =
      loginData.accessToken ||
      loginData.tokens?.accessToken ||
      response.tokens?.accessToken ||
      response.accessToken ||
      loginData.token ||
      response.token;

    if (accessToken) {
      setStoredItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }

    if (userObj) {
      setUser(userObj);
      setStoredItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
    }

    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      /* ignore */
    }

    removeStoredItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeStoredItem(STORAGE_KEYS.USER);
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