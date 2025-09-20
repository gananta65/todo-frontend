// /api/todolist.ts
import { TodoList } from "@/lib/interfaces";

export const API_URL =
  `${process.env.NEXT_PUBLIC_API_URL}/todo-lists` ||
  "http://localhost:8000/api/v1/todo-lists";

export async function fetchTodos(token: string): Promise<TodoList[]> {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Gagal fetch todo list");

  const json = await res.json();
  // Ambil langsung array data, fallback ke [] jika tidak ada
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchTodo(id: number, token: string): Promise<TodoList> {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal fetch todo");

  const json = await res.json();
  return json.data ?? ({} as TodoList);
}

export async function createTodo(
  data: Partial<TodoList>,
  token: string
): Promise<TodoList> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal membuat todo");

  const json = await res.json();
  return json.data;
}

export async function updateTodo(
  id: number,
  data: Partial<TodoList>,
  token: string
): Promise<TodoList> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal update todo");

  const json = await res.json();
  return json.data;
}

export async function deleteTodo(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal hapus todo");
}
