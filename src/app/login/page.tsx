"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/user");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message || "Login gagal");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-page">
      <form
        onSubmit={handleSubmit}
        className="bg-card p-6 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-4 text-primary">Login</h1>

        {error && <p className="text-todo-danger mb-2">{error}</p>}

        <div className="mb-4">
          <label className="block text-main mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-muted rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
          />
        </div>

        <div className="mb-4">
          <label className="block text-main mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-muted rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2 rounded hover:opacity-90 transition"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
}
