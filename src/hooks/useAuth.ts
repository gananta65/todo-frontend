// src/hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { loginUser, logoutUser, getCurrentUser } from "@/lib/api/auth";
import { User } from "@/lib/interfaces";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // load user saat pertama kali hook dipakai
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      getCurrentUser(savedToken)
        .then((u) => setUser(u))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const data = await loginUser(email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      return data.user;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat login");
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      if (token) await logoutUser(token);
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat logout");
      }
      throw err;
    }
  }, [token]);

  return { user, token, loading, error, login, logout };
}
