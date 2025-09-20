"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Seller } from "@/lib/interfaces";
import { fetchSellers, fetchLatestSellerForItem } from "@/lib/api/seller";

export function useSellers(token: string | null) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sellers dari backend
  const loadSellers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchSellers(token);
      setSellers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("❌ Error fetchSellers:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal load sellers");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  // Map ID → name untuk lookup cepat
  const sellerMap = useMemo(() => {
    const map = new Map<number, string>();
    sellers.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sellers]);

  // Function untuk fetch latest seller global per item
  const getLatestSellerForItem = useCallback(
    async (itemId: number): Promise<Seller | null> => {
      if (!token) return null;
      try {
        return await fetchLatestSellerForItem(token, itemId);
      } catch (err) {
        console.error("❌ Error getLatestSellerForItem:", err);
        return null;
      }
    },
    [token]
  );

  return {
    sellers,
    sellerMap,
    loading,
    error,
    loadSellers,
    getLatestSellerForItem, // panggil di component atau useEffect
  };
}
