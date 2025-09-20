"use client";

import TodoItem from "./TodoItem";
import { TodoList, Task } from "@/lib/interfaces";

interface Props {
  todos: TodoList[];
  loading: boolean;
  onDelete: (id: number) => void;
  onToggleTask: (task: Task, todoId: number) => void;
}

export default function TodoListSection({ todos, loading, onDelete }: Props) {
  if (loading) return <p className="text-muted">Loading...</p>;
  if (todos.length === 0) return <p className="text-muted">Belum ada todo.</p>;

  return (
    <ul className="space-y-4">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={() => onDelete(todo.id)}
        />
      ))}
    </ul>
  );
}
