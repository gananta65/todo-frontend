import { Task, UpdateTaskPayload } from "@/lib/interfaces";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface TaskPayload {
  name: string;
  quantity?: number;
  unit?: string; // frontend: unit
  price?: number; // frontend: price
  sellers?: string[]; // Kirim array nama seller ke backend
}

/**
 * Ambil semua task untuk satu todoList
 */
export async function fetchTasks(
  todoId: number,
  token: string
): Promise<Task[]> {
  const res = await fetch(`${API_URL}/todo-lists/${todoId}/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error("Gagal ambil tasks");

  const json = await res.json();
  return json.data as Task[];
}

/**
 * Buat task baru
 */
export async function createTask(
  todoId: number,
  data: TaskPayload,
  token: string
): Promise<Task> {
  const res = await fetch(`${API_URL}/todo-lists/${todoId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Gagal buat task" }));
    throw new Error(err.message || "Gagal buat task");
  }

  const json = await res.json();
  return json.data as Task;
}

/**
 * Update task
 */
export async function updateTask(
  todoId: number,
  taskId: number,
  data: Partial<UpdateTaskPayload & { completed?: boolean }>,
  token: string
): Promise<Task> {
  const res = await fetch(`${API_URL}/todo-lists/${todoId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Gagal update task" }));
    throw new Error(err.message || "Gagal update task");
  }

  const json = await res.json();
  return json.data as Task;
}

export async function bulkUpdateTasks(
  todoId: number,
  taskIds: number[],
  completed: boolean,
  token: string
) {
  const res = await fetch(
    `${API_URL}/todo-lists/${todoId}/tasks/bulk-complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ ids: taskIds, completed }),
    }
  );

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Gagal bulk update task" }));
    throw new Error(err.message || "Gagal bulk update task");
  }

  const json = await res.json();
  return json.tasks as Task[];
}

// lib/api/task.ts
export async function deleteTask(
  todoId: number,
  taskId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/todo-lists/${todoId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Gagal menghapus task");
  }

  return true;
}
