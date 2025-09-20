"use client";

import { useRouter } from "next/navigation";
import { TodoList } from "@/lib/interfaces";

interface Props {
  todo: TodoList;
  onDelete: () => void;
}

export default function TodoItem({ todo, onDelete }: Props) {
  const router = useRouter();

  function formatShortDate(input?: string | null): string {
    if (!input) return "-";
    const normalized = input.includes("T") ? input : input.replace(" ", "T");
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return "-";
  }

  return (
    <li
      onClick={() => router.push(`/user/todo/${todo.id}`)}
      className="relative bg-card p-3 rounded shadow cursor-pointer hover:bg-todo-muted/10 transition"
    >
      {/* Garis vertikal kiri */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-todo-primary rounded-l" />

      <div className="ml-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-main">{todo.name}</h3>
          <span className="text-xs text-muted">
            {formatShortDate(todo.created_at)}
          </span>
        </div>

        {/* Tombol delete — stopPropagation biar tidak trigger klik box */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-muted hover:opacity-80 text-sm mt-2"
        >
          Hapus Todo List
        </button>
      </div>
    </li>
  );
}
