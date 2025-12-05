"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import TaskList from "@/components/tasks/TaskList";
import AddTaskForm from "@/components/tasks/AddTaskForm";
import CopyButton from "@/components/tasks/TaskCopy";
import { useTasks } from "@/hooks/useTasks";
import { useSellers } from "@/hooks/useSellers";
import { fetchUserItems } from "@/lib/api/item";
import { Item, Task } from "@/lib/interfaces";
import { fetchTodo } from "@/lib/api/todolist";
import { getSellerName } from "@/lib/helper/task";

export default function TodoDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [todoList, setTodoList] = useState<{
    name: string;
    created_at?: string;
  } | null>(null);

  const { tasks, loading, addTask, editTask, removeTask, bulkUpdate } =
    useTasks(Number(id), token);

  const {
    sellers: allSellers,
    loading: loadingSellers,
    getLatestSellerForItem,
  } = useSellers(token);

  // Redirect jika tidak ada token
  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  // Fetch items untuk combobox
  useEffect(() => {
    if (!token) return;
    fetchUserItems(token).then(setItems).catch(console.error);
  }, [token]);

  // Fetch detail todolist
  useEffect(() => {
    if (!token || !id) return;
    fetchTodo(Number(id), token)
      .then((data) =>
        setTodoList({ name: data.name, created_at: data.created_at })
      )
      .catch(console.error);
  }, [id, token]);

  if (!token) return null;
  if (loading || loadingSellers) return <p className="p-4">Loading...</p>;

  const handleTaskAdded = async (task: Task) => {
    if (!allSellers) return;

    const snapshot_sellers = (task.sellers ?? [])
      .map(
        (name) =>
          allSellers.find(
            (sel) => sel.name.toLowerCase().trim() === name.toLowerCase().trim()
          )?.id
      )
      .filter(Boolean) as number[];

    await addTask({
      name: task.item.name,
      quantity: task.quantity,
      current_unit: task.unit,
      current_price: task.price,
      sellers: task.sellers,
      snapshot_sellers,
    });
  };

  const handleBulkCompletePerSeller = async (
    sellerName: string,
    completed: boolean
  ) => {
    if (!allSellers) return;
    const sellerTasks = tasks.filter(
      (t) => getSellerName(t, allSellers) === sellerName
    );
    const ids = sellerTasks.map((t) => t.id);
    if (ids.length === 0) return;

    await bulkUpdate(ids, completed);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="min-h-[150px] mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-main hover:underline"
        >
          ← Kembali
        </button>

        <h1 className="text-2xl font-bold text-main mb-1">
          TodoList : {todoList?.name || "Memuat..."}
        </h1>
        <p className="text-sm text-muted mb-5">
          {todoList?.created_at
            ? new Date(todoList.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Tanggal tidak tersedia"}
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <CopyButton
          tasks={tasks}
          allSellers={allSellers}
          created_at={todoList?.created_at}
        />
      </div>

      <TaskList
        tasks={tasks}
        items={items}
        allSellers={allSellers}
        onTaskUpdated={editTask}
        onTaskDeleted={removeTask}
        onBulkComplete={handleBulkCompletePerSeller} // per seller
      />

      <AddTaskForm
        todoListId={Number(id)}
        token={token}
        tasks={tasks}
        items={items ?? []}
        sellers={allSellers ?? []}
        getLatestSellerForItem={getLatestSellerForItem}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
}
