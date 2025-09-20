"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-page transition-colors">
      <h1 className="text-4xl font-bold text-primary mb-6 text-center">
        Selamat Datang di Todo List
      </h1>

      <p className="text-main text-lg mb-8 text-center">
        Kelola todo harianmu dengan mudah dan cepat
      </p>

      <button
        onClick={() => router.push("/login")}
        className="btn-primary py-3 px-8 rounded-lg text-card font-semibold transition-colors hover:bg-primary-hover"
      >
        Login
      </button>
    </div>
  );
}
