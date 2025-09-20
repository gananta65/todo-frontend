import { Item } from "@/lib/interfaces";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Ambil semua item yang pernah dibuat user + search global
 * Jika query kosong, akan ambil semua item user
 */
export async function fetchUserItems(
  token: string,
  query: string = ""
): Promise<Item[]> {
  try {
    const url = query
      ? `${API_URL}/items/search?query=${encodeURIComponent(query)}`
      : `${API_URL}/items/search`; // backend akan return semua item user

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(`⚠️ fetchUserItems: non-OK response ${res.status} ${txt}`);
      return [];
    }

    const json = await res.json();
    return Array.isArray(json) ? json : json?.data ?? [];
  } catch (err) {
    console.error("❌ Error fetchUserItems:", err);
    return [];
  }
}

/**
 * Update item
 */
export async function updateItem(
  id: number,
  data: Partial<Item>,
  token: string
): Promise<Item> {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Gagal update item");
    throw new Error(err);
  }

  const json = await res.json();
  return (json?.data ?? json) as Item;
}

/**
 * Search global items (autocomplete)
 */
export async function searchItems(
  query: string,
  token: string
): Promise<Item[]> {
  return fetchUserItems(token, query); // panggil sama fungsi global
}
