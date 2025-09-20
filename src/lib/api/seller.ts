import { Seller } from "@/lib/interfaces";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ✅ Ambil semua seller
export async function fetchSellers(token: string): Promise<Seller[]> {
  const res = await fetch(`${API_URL}/sellers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal ambil sellers");

  const json = await res.json();

  // Normalisasi hasil API agar selalu array
  if (Array.isArray(json)) {
    return json; // kalau langsung array
  }
  if (Array.isArray(json.data)) {
    return json.data; // kalau ada wrapper { data: [...] }
  }
  return []; // fallback
}

// --- Ambil latest seller global untuk item tertentu ---
export async function fetchLatestSellerForItem(
  token: string,
  itemId: number
): Promise<Seller | null> {
  try {
    const res = await fetch(
      `${API_URL}/tasks/latest-seller?item_id=${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) throw new Error("Gagal ambil latest seller");

    const data = await res.json();
    if (data.seller_name) {
      // fetch semua seller dulu untuk lookup
      const sellers = await fetchSellers(token);
      return sellers.find((s) => s.name === data.seller_name) ?? null;
    }
    return null;
  } catch (err) {
    console.error("❌ Error fetchLatestSellerForItem:", err);
    return null;
  }
}

// ✅ Buat seller baru
export async function createSeller(
  data: { name: string },
  token: string
): Promise<Seller> {
  const res = await fetch(`${API_URL}/sellers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal buat seller");

  const json = await res.json();
  return json.data ?? json; // ambil dari data kalau ada
}

// ✅ Update seller
export async function updateSeller(
  id: number,
  data: Partial<Seller>,
  token: string
): Promise<Seller> {
  const res = await fetch(`${API_URL}/sellers/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal update seller");

  const json = await res.json();
  return json.data ?? json;
}

// ✅ Hapus seller
export async function deleteSeller(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/sellers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal hapus seller");
}
