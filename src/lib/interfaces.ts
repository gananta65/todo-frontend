export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PriceHistory {
  id: number;
  price: number;
  unit: string;
  changed_at: string;
}

export interface Seller {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  name: string;
  current_price: number;
  current_unit: string;
}

export interface Task {
  id: number;
  item: Item;
  quantity: number;
  unit: string;
  price: number;
  completed: boolean;
  sellers: string[];
  snapshot_sellers: number[];

  // Tambahkan timestamp opsional
  created_at?: string;
  updated_at?: string;
}

export interface TodoList {
  id: number;
  name: string;
  tasks: Task[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload untuk update Task.
 * Catatan:
 * - Backend butuh seller IDs, jadi field `sellers` = number[]
 * - Unit dan price diambil dari task
 */
export interface UpdateTaskPayload {
  name?: string;
  completed?: boolean;
  quantity?: number;
  unit?: string;
  price?: number;
  sellers?: (string | { name: string })[];
}
