"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, UpdateTaskPayload } from "@/lib/interfaces";
import { fetchTasks, createTask, updateTask, deleteTask } from "@/lib/api/task";

interface AddTaskData {
  name: string;
  quantity?: number;
  current_unit?: string;
  current_price?: number;
  sellers?: string[]; // frontend display
  snapshot_sellers?: number[]; // backend
}

export function useTasks(todoId: number, token: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks(todoId, token);

      setTasks(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("❌ Gagal load tasks:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal load tasks");
      }
    } finally {
      setLoading(false);
    }
  }, [todoId, token]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(
    async (taskData: AddTaskData) => {
      if (!token) return;

      try {
        const payload = {
          name: taskData.name,
          quantity: taskData.quantity,
          unit: taskData.current_unit,
          price: taskData.current_price,
          sellers: taskData.sellers ?? [], // string[]
        };

        const newTask = await createTask(todoId, payload, token);

        // Update state
        setTasks((prev) => {
          const exists = prev.find((t) => t.id === newTask.id);
          if (exists) {
            console.warn(
              "Task sudah ada di state, tidak menambahkan duplikat:",
              newTask
            );
            return prev;
          }
          return [newTask, ...prev];
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal buat task");
        }
      }
    },
    [todoId, token]
  );

  const editTask = useCallback(
    async (
      taskId: number,
      updates: Partial<UpdateTaskPayload> & { completed?: boolean }
    ) => {
      if (!token) return;

      try {
        const payload = {
          name: updates.name, // kalau mau ganti item name
          quantity: updates.quantity,
          unit: updates.unit,
          price: updates.price,
          sellers: updates.sellers ?? [], // string[]
          completed: updates.completed,
        };

        const updatedTask = await updateTask(todoId, taskId, payload, token);

        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal update task");
        }
      }
    },
    [todoId, token]
  );

  const removeTask = useCallback(
    async (taskId: number) => {
      if (!token) return;
      try {
        await deleteTask(todoId, taskId, token);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal hapus task");
        }
      }
    },
    [todoId, token]
  );

  return { tasks, loading, error, loadTasks, addTask, editTask, removeTask };
}
