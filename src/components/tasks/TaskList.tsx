"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Task, Seller, Item } from "@/lib/interfaces";
import EditTaskForm from "./EditTaskForm";
import { Search } from "lucide-react";
import { getSellerName as helperGetSellerName } from "@/lib/helper/task";

interface TaskListProps {
  tasks: Task[];
  allSellers: Seller[];
  items: Item[];
  onTaskUpdated?: (
    taskId: number,
    updates: Partial<Task>
  ) => void | Promise<void>;
  onTaskDeleted?: (taskId: number) => void | Promise<void>;
  onBulkComplete?: (seller: string, completed: boolean) => void | Promise<void>;
}

export default function TaskList({
  tasks,
  allSellers,
  items,
  onTaskUpdated,
  onBulkComplete,
}: TaskListProps) {
  const [tasksState, setTasksState] = useState<Task[]>(tasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Sync tasksState saat props.tasks berubah
  useEffect(() => {
    setTasksState(tasks);
  }, [tasks]);

  const getSellerName = useCallback(
    (task: Task) => helperGetSellerName(task, allSellers),
    [allSellers]
  );

  const toggleTask = async (taskId: number, completed: boolean) => {
    // Optimistic update
    setTasksState((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
    );

    if (editingTask?.id === taskId) {
      setEditingTask((prev) => (prev ? { ...prev, completed } : null));
    }

    if (onTaskUpdated) await onTaskUpdated(taskId, { completed });
  };

  const toggleSellerTasks = async (seller: string, completed: boolean) => {
    setTasksState((prev) =>
      prev.map((t) => (getSellerName(t) === seller ? { ...t, completed } : t))
    );

    if (editingTask && getSellerName(editingTask) === seller) {
      setEditingTask((prev) => (prev ? { ...prev, completed } : null));
    }

    if (onBulkComplete) await onBulkComplete(seller, completed);
  };

  const saveEdit = async (taskId: number, updates: Partial<Task>) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    if (editingTask?.id === taskId) {
      setEditingTask((prev) => (prev ? { ...prev, ...updates } : null));
    }

    if (onTaskUpdated) await onTaskUpdated(taskId, updates);
    setEditingTask(null);
  };

  const cancelEdit = () => setEditingTask(null);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    tasksState.forEach((task) => {
      const seller = getSellerName(task);
      if (!groups[seller]) groups[seller] = [];
      groups[seller].push(task);
    });

    if (!searchTerm.trim()) return groups;

    const term = searchTerm.toLowerCase();
    const filtered: Record<string, Task[]> = {};
    Object.entries(groups).forEach(([seller, sellerTasks]) => {
      const matches = sellerTasks.filter((t) => {
        const itemName = t.item?.name?.toLowerCase() ?? "";
        const unit = t.unit?.toLowerCase() ?? "";
        const price = t.price.toString();
        return (
          seller.toLowerCase().includes(term) ||
          itemName.includes(term) ||
          unit.includes(term) ||
          price.includes(term)
        );
      });
      if (matches.length) filtered[seller] = matches;
    });

    return filtered;
  }, [tasksState, searchTerm, getSellerName]);

  if (!tasksState.length) return <p>No tasks yet.</p>;

  const sortedSellerEntries = Object.entries(groupedTasks).sort(([a], [b]) => {
    if (a === "Belum ditentukan") return 1;
    if (b === "Belum ditentukan") return -1;
    return a.localeCompare(b, "id");
  });

  return (
    <div className="task-list space-y-10">
      {/* Search bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur p-2">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari task, seller, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded pl-8 pr-3 py-2 text-sm focus:ring focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {sortedSellerEntries.length === 0 ? (
        <p className="text-muted italic">Tidak ada hasil pencarian.</p>
      ) : (
        sortedSellerEntries.map(([seller, sellerTasks]) => {
          const allCompleted = sellerTasks.every((t) => t.completed);

          return (
            <div key={seller} className="seller-group">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-main border-b pb-1">
                  {seller}
                </h3>
                <button
                  onClick={() => toggleSellerTasks(seller, !allCompleted)}
                  className="text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  {allCompleted ? "Uncomplete All" : "Complete All"}
                </button>
              </div>

              {sellerTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between mb-1"
                >
                  <span>{task.item?.name}</span>
                  <button
                    onClick={() => toggleTask(task.id, !task.completed)}
                    className={`px-2 py-1 rounded text-xs text-white transition ${
                      task.completed
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {task.completed ? "Undo" : "Complete"}
                  </button>
                </div>
              ))}
            </div>
          );
        })
      )}

      {editingTask && (
        <EditTaskForm
          task={tasksState.find((t) => t.id === editingTask.id) ?? editingTask}
          items={items}
          sellers={allSellers}
          onClose={cancelEdit}
          onTaskUpdated={saveEdit}
        />
      )}
    </div>
  );
}
