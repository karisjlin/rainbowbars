import React, { createContext, useContext, useMemo, useState } from 'react';

export interface CurrentUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoggedIn: boolean;
  login: (user: CurrentUser) => void;
  logout: () => void;
}

const CURRENT_USER_STORAGE_KEY = 'currentUser';

function getStoredCurrentUser(): CurrentUser | null {
  const currentUserRaw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!currentUserRaw) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(currentUserRaw) as CurrentUser;
    if (typeof parsedUser?.email !== 'string' || typeof parsedUser?.name !== 'string') {
      return null;
    }

    return {
      name: parsedUser.name,
      email: parsedUser.email.trim().toLowerCase(),
    };
  } catch (error) {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getStoredCurrentUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isLoggedIn: Boolean(currentUser?.email),
      login: (user: CurrentUser) => {
        const normalizedUser = {
          name: user.name.trim(),
          email: user.email.trim().toLowerCase(),
        };
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(normalizedUser));
        setCurrentUser(normalizedUser);
      },
      logout: () => {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        setCurrentUser(null);
      },
    }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
