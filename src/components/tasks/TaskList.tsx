"use client";

import React, { useState } from "react";
import { Task, Seller, Item } from "@/lib/interfaces";
import EditTaskForm from "./EditTaskForm";
import { Trash2 } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  allSellers: Seller[];
  items: Item[];
  getLatestSellerForItem?: (itemId: number) => Promise<Seller | null>;
  onTaskUpdated?: (
    taskId: number,
    updates: Partial<Task>
  ) => Promise<void> | void;
  onTaskDeleted?: (taskId: number) => Promise<void> | void;
}

export default function TaskList({
  tasks,
  allSellers,
  items,
  getLatestSellerForItem,
  onTaskUpdated,
  onTaskDeleted,
}: TaskListProps) {
  const [tasksState, setTasksState] = useState<Task[]>(tasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (!tasksState || tasksState.length === 0) return <p>No tasks yet.</p>;

  const toggleTask = (taskId: number, completed: boolean) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
    );
  };

  const startEdit = (task: Task) => setEditingTask(task);

  const saveEdit = async (taskId: number, updates: Partial<Task>) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    if (onTaskUpdated) await onTaskUpdated(taskId, updates);
    setEditingTask(null);
  };

  const cancelEdit = () => setEditingTask(null);

  const getSellerName = (task: Task) => {
    if (task.snapshot_sellers?.length && allSellers?.length) {
      const latestId = task.snapshot_sellers[task.snapshot_sellers.length - 1];
      const matchedSeller = allSellers.find((s) => s.id == latestId);
      return matchedSeller?.name ?? `ID:${latestId}`;
    }
    return "Belum ditentukan";
  };

  const toggleSellerTasks = (seller: string, completed: boolean) => {
    setTasksState((prev) =>
      prev.map((t) => (getSellerName(t) === seller ? { ...t, completed } : t))
    );
  };

  const parseNumber = (value: string | number) => {
    if (typeof value === "number") return value;
    return Number(value.toString().replace(/[^0-9.]/g, "")) || 0;
  };

  const isTaskIncomplete = (task: Task) => {
    const priceNum = parseNumber(task.price);
    const quantityNum = parseNumber(task.quantity);

    return (
      priceNum === 0 ||
      quantityNum === 0 ||
      !task.unit ||
      getSellerName(task) === "Belum ditentukan"
    );
  };

  const groupedTasks = tasksState.reduce(
    (acc: Record<string, Task[]>, task) => {
      const sellerName = getSellerName(task);
      if (!acc[sellerName]) acc[sellerName] = [];
      acc[sellerName].push(task);
      return acc;
    },
    {}
  );

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const grandTotal = Object.values(groupedTasks).reduce((sum, sellerTasks) => {
    const sellerSubtotal = sellerTasks.reduce(
      (acc, task) => acc + task.price * task.quantity,
      0
    );
    return sum + sellerSubtotal;
  }, 0);

  const sortedSellerEntries = Object.entries(groupedTasks).sort(([a], [b]) => {
    if (a === "Belum ditentukan") return 1;
    if (b === "Belum ditentukan") return -1;
    return a.localeCompare(b, "id");
  });

  return (
    <div className="task-list space-y-10">
      {sortedSellerEntries.map(([seller, sellerTasks]) => {
        const sellerSubtotal = sellerTasks.reduce(
          (acc, task) => acc + task.price * task.quantity,
          0
        );
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

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full border bg-card text-main text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-center w-8"></th>
                    <th className="px-2 py-2 text-center w-20">Action</th>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerTasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`border-t transition ${
                        task.completed ? "text-muted line-through" : "text-main"
                      } ${isTaskIncomplete(task) ? "bg-todo-danger" : ""}`}
                    >
                      <>
                        {/* Delete */}
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Yakin ingin menghapus task ini?")) {
                                onTaskDeleted?.(task.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-lg font-bold"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>

                        {/* Complete */}
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id, !task.completed);
                            }}
                            className={`px-2 py-1 rounded text-xs text-white transition ${
                              task.completed
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-green-500 hover:bg-green-600"
                            }`}
                          >
                            {task.completed ? "Undo" : "Complete"}
                          </button>
                        </td>

                        {/* Item */}
                        <td
                          className="px-4 py-2 font-medium cursor-pointer"
                          onClick={() => startEdit(task)}
                        >
                          {task.item?.name || "Belum ditentukan"}
                        </td>

                        {/* Quantity */}
                        <td
                          className="px-4 py-2 text-right cursor-pointer"
                          onClick={() => startEdit(task)}
                        >
                          {task.quantity} {task.unit || "-"}
                        </td>

                        {/* Price */}
                        <td
                          className="px-4 py-2 text-right cursor-pointer"
                          onClick={() => startEdit(task)}
                        >
                          {formatRupiah(task.price)}
                        </td>

                        {/* Subtotal */}
                        <td
                          className="px-4 py-2 text-right cursor-pointer"
                          onClick={() => startEdit(task)}
                        >
                          {formatRupiah(task.price * task.quantity)}
                        </td>
                      </>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td colSpan={5} className="px-4 py-2 text-right border-t">
                      Subtotal {seller}
                    </td>
                    <td className="px-4 py-2 text-right border-t">
                      {formatRupiah(sellerSubtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Card */}
            <div className="md:hidden space-y-3">
              {sellerTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => startEdit(task)}
                  className={`p-3 rounded border transition cursor-pointer relative ${
                    task.completed ? "text-muted line-through" : "text-main"
                  } ${isTaskIncomplete(task) ? "bg-todo-danger" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {task.item?.name || "Belum ditentukan"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id, !task.completed);
                        }}
                        className={`px-2 py-1 rounded text-xs text-white ${
                          task.completed ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        {task.completed ? "Undo" : "Complete"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Yakin ingin menghapus task ini?")) {
                            onTaskDeleted?.(task.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted mt-1">
                    {task.quantity} {task.unit || "-"} •{" "}
                    {formatRupiah(task.price)} •{" "}
                    {formatRupiah(task.price * task.quantity)}
                  </div>
                </div>
              ))}

              <div className="text-right font-semibold mt-2 text-main">
                Subtotal {seller}: {formatRupiah(sellerSubtotal)}
              </div>
            </div>
          </div>
        );
      })}

      <div className="text-right font-bold text-lg text-main border-t pt-4 mb-40">
        Total Belanja: {formatRupiah(grandTotal)}
      </div>

      {editingTask && (
        <EditTaskForm
          task={editingTask}
          items={items}
          sellers={allSellers}
          getLatestSellerForItem={getLatestSellerForItem}
          onClose={cancelEdit}
          onTaskUpdated={saveEdit}
        />
      )}
    </div>
  );
}
