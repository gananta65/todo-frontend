"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { createTodo } from "@/lib/api/todolist";
import { TodoList } from "@/lib/interfaces";
import { useAuth } from "@/components/AuthContext";

interface Props {
  onCreated: (todo: TodoList) => void;
  onCancel: () => void;
}

export default function AddTodoCard({ onCreated, onCancel }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (!token) return;

    setLoading(true);
    try {
      const newTodo = await createTodo({ name }, token);
      onCreated(newTodo); // 👉 hanya kirim balik todo hasil API
      setName("");
    } catch (err) {
      console.error("❌ Gagal buat todo list:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card p-3 rounded shadow flex items-center justify-between animate-fade-in">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama todo list..."
        className="flex-1 mr-3 px-2 py-1 rounded border border-todo-muted bg-transparent text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-todo-primary"
      />
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-2 rounded-full bg-todo-success text-white hover:opacity-90 disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={onCancel} // 👉 cancel cukup close, tidak panggil API
          className="p-2 rounded-full bg-todo-danger text-white hover:opacity-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
