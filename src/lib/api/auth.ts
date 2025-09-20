// src/app/api/auth.ts
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
import { User } from "@/lib/interfaces";

// -------------------------------
// LOGIN
// -------------------------------
export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Email atau password salah");
    } else {
      throw new Error("Login gagal", { cause: res.status });
    }
  }

  const loginData = await res.json();

  const token = loginData.token;

  // 🔁 Fetch user setelah login
  const user = await getCurrentUser(token);
  if (!user) {
    throw new Error("Gagal mengambil data user setelah login");
  }

  return { token, user };
}

// -------------------------------
// LOGOUT
// -------------------------------
export async function logoutUser(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Logout gagal");
}

// -------------------------------
// GET CURRENT USER
// -------------------------------
export async function getCurrentUser(token: string) {
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (res.status !== 401) {
        console.error("❌ getCurrentUser failed", res.status);
      }
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ getCurrentUser error", err);
    return null;
  }
}
