"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import AddTodoCard from "@/components/todolist/AddTodoCard";
import TodoListSection from "@/components/todolist/TodoListSection";
import { TodoList, Task } from "@/lib/interfaces";
import { fetchTodos, deleteTodo } from "@/lib/api/todolist";

export default function UserPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [todos, setTodos] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    if (!token) return;
    const loadTodos = async () => {
      setLoading(true);
      try {
        const data = await fetchTodos(token);

        // simpan mentah, sorting dilakukan saat render
        setTodos(data);
      } catch (err) {
        console.error("❌ Gagal load todos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, [token]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("❌ Logout gagal:", err);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm("Hapus todo ini?")) return;
    try {
      await deleteTodo(id, token!);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("❌ Gagal hapus todo:", err);
    }
  };

  const handleToggleTask = async (task: Task, todoId: number) => {
    try {
      await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
        }/todo-lists/${todoId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: !task.completed }),
        }
      );

      setTodos((prev) =>
        prev.map((t) =>
          t.id === todoId
            ? {
                ...t,
                tasks: t.tasks.map((tsk) =>
                  tsk.id === task.id
                    ? { ...tsk, completed: !tsk.completed }
                    : tsk
                ),
              }
            : t
        )
      );
    } catch (err) {
      console.error("❌ Gagal update task:", err);
    }
  };

  // Sorting sesuai pilihan
  const sortedTodos = [...todos].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-main">Halo, {user?.name}</h1>
        <button
          onClick={handleLogout}
          className="bg-todo-danger text-white px-3 py-1 rounded hover:opacity-90 text-sm"
        >
          Logout
        </button>
      </div>
      <p className="text-muted mb-6">Email: {user?.email}</p>

      {/* Sort Selector */}
      <div className="flex justify-end mb-4">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="border rounded px-2 py-1 text-sm text-main bg-card"
        >
          <option value="newest">Terbaru dulu</option>
          <option value="oldest">Terlama dulu</option>
        </select>
      </div>

      {/* Section List */}
      {showAdd && (
        <div className="mb-4">
          <AddTodoCard
            onCreated={(todo) => {
              if (todo) setTodos((prev) => [todo, ...prev]);
              setShowAdd(false);
            }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      <TodoListSection
        todos={sortedTodos}
        loading={loading}
        onDelete={handleDeleteTodo}
        onToggleTask={handleToggleTask}
      />

      {/* Floating Add Button */}
      <button
        onClick={() => {
          console.log("DEBUG: Tombol + ditekan");
          setShowAdd(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full btn-primary flex items-center justify-center shadow-lg hover:opacity-90 transition"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
