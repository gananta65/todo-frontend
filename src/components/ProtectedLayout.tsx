"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

interface ProtectedLayoutProps {
  children: ReactNode;
  redirectPath?: string;
}

export default function ProtectedLayout({
  children,
  redirectPath = "/login",
}: ProtectedLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
