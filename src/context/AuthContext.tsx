import React, { createContext, useContext, useMemo, useState } from 'react';

// Shape of a logged-in user stored in context and localStorage.
export interface CurrentUser {
  name: string;
  email: string;
}

// Everything components can read/call through useAuth().
interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoggedIn: boolean;
  login: (user: CurrentUser) => void;
  logout: () => void;
}

// localStorage key for persisting the current user across page refreshes.
const CURRENT_USER_STORAGE_KEY = 'currentUser';

// Reads and validates the current user from localStorage.
// Returns null if nothing is stored or the stored value is malformed.
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
      // Normalize email to lowercase so comparisons are case-insensitive everywhere.
      email: parsedUser.email.trim().toLowerCase(),
    };
  } catch (error) {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Wraps the app and provides auth state to all descendants via context.
function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage so the user stays logged in after a page refresh.
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getStoredCurrentUser());

  // Memoize the context value so consumers only re-render when currentUser changes.
  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      // Treat the user as logged in only when an email is present.
      isLoggedIn: Boolean(currentUser?.email),
      login: (user: CurrentUser) => {
        const normalizedUser = {
          name: user.name.trim(),
          email: user.email.trim().toLowerCase(),
        };
        // Persist to localStorage so the session survives page refreshes.
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(normalizedUser));
        setCurrentUser(normalizedUser);
      },
      logout: () => {
        // Remove stored session and clear state.
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        setCurrentUser(null);
      },
    }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook that provides auth context to any component.
// Throws if called outside of AuthProvider to catch missing provider setup early.
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
