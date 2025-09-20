"use client";

import { useState } from "react";

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium text-main" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-2 border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-page text-main transition-colors"
        />
      </div>
      <div className="flex flex-col">
        <label
          className="mb-1 text-sm font-medium text-main"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="px-4 py-2 border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-page text-main transition-colors"
        />
      </div>
      <button
        type="submit"
        className="mt-4 py-2 px-4 btn-primary rounded font-semibold transition-colors"
      >
        Login
      </button>
    </form>
  );
}
