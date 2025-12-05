import { Task, Seller } from "@/lib/interfaces";

/**
 * Ambil nama seller terakhir dari snapshot_sellers.
 */
export const getSellerName = (task: Task, allSellers: Seller[]): string => {
  if (task.snapshot_sellers?.length && allSellers?.length) {
    const latestId = task.snapshot_sellers[task.snapshot_sellers.length - 1];
    const matchedSeller = allSellers.find((s) => s.id === latestId);
    return matchedSeller?.name ?? `ID:${latestId}`;
  }
  return "Belum ditentukan";
};
