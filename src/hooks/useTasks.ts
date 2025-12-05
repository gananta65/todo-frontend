// hooks/useTasks.ts
import { useState, useEffect, useCallback } from "react";
import { Task, UpdateTaskPayload } from "@/lib/interfaces";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
} from "@/lib/api/task";

interface AddTaskData {
  name: string;
  quantity?: number;
  current_unit?: string;
  current_price?: number;
  sellers?: string[];
  snapshot_sellers?: number[];
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
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal load tasks");
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
          sellers: taskData.sellers ?? [],
        };
        const newTask = await createTask(todoId, payload, token);
        setTasks((prev) => [
          newTask,
          ...prev.filter((t) => t.id !== newTask.id),
        ]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal buat task");
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
        const updatedTask = await updateTask(todoId, taskId, updates, token);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal update task");
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
        setError(err instanceof Error ? err.message : "Gagal hapus task");
      }
    },
    [todoId, token]
  );

  // Single task
  const completeTask = useCallback(
    (taskId: number) => editTask(taskId, { completed: true }),
    [editTask]
  );
  const undoTask = useCallback(
    (taskId: number) => editTask(taskId, { completed: false }),
    [editTask]
  );

  // All tasks (loop)
  const completeAllTasks = useCallback(async () => {
    const incomplete = tasks.filter((t) => !t.completed);
    if (incomplete.length)
      await bulkUpdateTasks(
        todoId,
        incomplete.map((t) => t.id),
        true,
        token!
      );
    await loadTasks();
  }, [tasks, todoId, token, loadTasks]);

  const undoAllTasks = useCallback(async () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length)
      await bulkUpdateTasks(
        todoId,
        completedTasks.map((t) => t.id),
        false,
        token!
      );
    await loadTasks();
  }, [tasks, todoId, token, loadTasks]);

  const bulkUpdate = useCallback(
    async (taskIds: number[], completed: boolean) => {
      if (!token || taskIds.length === 0) return;
      await bulkUpdateTasks(todoId, taskIds, completed, token);
      setTasks((prev) =>
        prev.map((t) => (taskIds.includes(t.id) ? { ...t, completed } : t))
      );
    },
    [todoId, token]
  );

  return {
    tasks,
    loading,
    error,
    loadTasks,
    addTask,
    editTask,
    removeTask,
    completeTask,
    undoTask,
    completeAllTasks,
    undoAllTasks,
    bulkUpdate,
  };
}
