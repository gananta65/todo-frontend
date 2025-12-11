// Cleaned version without comments and with debug logs
"use client";

import { useEffect, useState } from "react";
import { Task, Item, Seller } from "@/lib/interfaces";
import { Combobox } from "@headlessui/react";

interface EditTaskFormProps {
  task: Task;
  items: Item[];
  sellers: Seller[];
  onTaskUpdated: (
    taskId: number,
    updates: Partial<Task>
  ) => Promise<void> | void;
  onClose: () => void;
}

export default function EditTaskForm({
  task,
  items,
  sellers,
  onTaskUpdated,
  onClose,
}: EditTaskFormProps) {
  const [name, setName] = useState(task.item?.name ?? "");
  const [quantity, setQuantity] = useState<number | undefined>(task.quantity);
  const [unit, setUnit] = useState(task.unit ?? "");
  const [price, setPrice] = useState<number | undefined>(task.price);
  const [priceDisplay, setPriceDisplay] = useState(
    task.price ? formatPrice(task.price) : ""
  );

  const [selectedItem, setSelectedItem] = useState<Item | null>(
    () => items.find((i) => i.id === task.item?.id) ?? null
  );

  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(() => {
    const lastSellerId =
      task.snapshot_sellers?.[task.snapshot_sellers.length - 1];
    if (lastSellerId) return sellers.find((s) => s.id === lastSellerId) ?? null;
    if (task.sellers && task.sellers.length > 0) {
      return sellers.find((s) => s.name === task.sellers[0]) ?? null;
    }
    return null;
  });

  const [sellerName, setSellerName] = useState(
    selectedSeller?.name ?? task.sellers?.[0] ?? ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  function formatPrice(val: number | undefined) {
    return val ? "Rp" + val.toLocaleString("id-ID") : "";
  }

  const handlePriceChange = (val: string) => {
    const num = Number(val.replace(/\D/g, ""));
    setPrice(num);
    setPriceDisplay(formatPrice(num));
  };

  const handlePriceBlur = () => {
    if (!price) return;
    let finalPrice = price;
    if (price < 1000) finalPrice = price * 1000;
    setPrice(finalPrice);
    setPriceDisplay(formatPrice(finalPrice));
  };

  useEffect(() => {
    console.log("[INIT RESET] Task received: ", task);
    setName(task.item?.name ?? "");
    setQuantity(task.quantity ?? undefined);
    setUnit(task.unit ?? "");
    setPrice(task.price ?? undefined);
    setPriceDisplay(task.price ? formatPrice(task.price) : "");

    const matchedItem = items.find((i) => i.id === task.item?.id) ?? null;
    setSelectedItem(matchedItem);

    const lastSellerId =
      task.snapshot_sellers?.[task.snapshot_sellers.length - 1];

    const matchedSeller = lastSellerId
      ? sellers.find((s) => s.id === lastSellerId) ?? null
      : sellers.find((s) => s.name === task.sellers?.[0]) ?? null;

    setSelectedSeller(matchedSeller);
    setSellerName(matchedSeller?.name ?? task.sellers?.[0] ?? "");
  }, [task]);

  useEffect(() => {
    if (!selectedItem) return;

    console.log("[SELECTED ITEM CHANGE] selectedItem:", selectedItem);

    setName(selectedItem.name);

    if (selectedItem.current_unit) setUnit(selectedItem.current_unit);

    if (selectedItem.current_price) {
      const numericPrice = Number(task.price);
      setPrice(isNaN(numericPrice) ? 0 : numericPrice);
      setPriceDisplay(formatPrice(numericPrice));
    }
  }, [selectedItem]);

  const resetForm = () => {
    console.log("[RESET] Closing modal");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const finalPrice = price && price < 1000 ? price * 1000 : price;

      const payload: Partial<Task> = {
        item: selectedItem
          ? selectedItem
          : {
              id: task.item?.id ?? 0,
              name,
              current_price: finalPrice!,
              current_unit: unit,
            },
        quantity: quantity ?? 0,
        unit,
        price: finalPrice ?? 0,
        sellers: selectedSeller
          ? [selectedSeller.name]
          : sellerName.trim()
          ? [sellerName.trim()]
          : ["Belum ditentukan"],
        snapshot_sellers: selectedSeller
          ? [selectedSeller.id]
          : task.snapshot_sellers ?? [],
        completed: task.completed,
      };

      console.log("[SUBMIT] payload:", payload);

      await onTaskUpdated(task.id, payload);

      console.log("[SUBMIT] Success, closing modal");
      onClose();
    } catch (err) {
      console.error("[SUBMIT] Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed text-main inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-card rounded-lg shadow-lg w-auto max-w-md p-4 sm:p-6 mx-2 sm:mx-5 relative">
        <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Combobox
              value={selectedItem}
              onChange={(item) => {
                if (!item) return;
                setSelectedItem(item);
                setName(item.name);
              }}
            >
              <Combobox.Input
                className="w-full border px-3 py-2 rounded"
                placeholder="Nama item"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                displayValue={(item: Item) => item?.name ?? name}
              />
              <Combobox.Options className="absolute w-full bg-card border mt-1 rounded shadow z-10 max-h-32 overflow-y-auto">
                {items
                  .filter((i) =>
                    i.name.toLowerCase().includes(name.toLowerCase())
                  )
                  .map((item) => (
                    <Combobox.Option
                      key={item.id}
                      value={item}
                      className={({ active }) =>
                        `px-3 py-1 cursor-pointer ${
                          active ? "bg-gray-100" : ""
                        }`
                      }
                    >
                      {item.name}
                    </Combobox.Option>
                  ))}
              </Combobox.Options>
            </Combobox>
          </div>

          <input
            type="number"
            value={quantity ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setQuantity(val === "" ? undefined : Number(val));
            }}
            placeholder="Jumlah"
            className="w-full border px-3 py-2 rounded"
          />

          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Satuan"
            className="w-full border px-3 py-2 rounded"
          />

          <input
            type="text"
            value={priceDisplay}
            onChange={(e) => handlePriceChange(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="Harga"
            className="w-full border px-3 py-2 rounded"
          />

          <div className="relative">
            <Combobox value={selectedSeller} onChange={setSelectedSeller}>
              <Combobox.Input
                className="w-full border px-3 py-2 rounded"
                placeholder="Nama seller"
                displayValue={(seller: Seller) => seller?.name ?? sellerName}
                onChange={(e) => {
                  setSellerName(e.target.value);
                  setSelectedSeller(null);
                }}
              />
              <Combobox.Options className="absolute w-full bg-card border mt-1 rounded shadow z-10 max-h-32 overflow-y-auto">
                {sellers
                  .filter((s) =>
                    s.name.toLowerCase().includes(sellerName.toLowerCase())
                  )
                  .map((s) => (
                    <Combobox.Option
                      key={s.id}
                      value={s}
                      className={({ active }) =>
                        `px-3 py-1 cursor-pointer ${
                          active ? "bg-gray-100" : ""
                        }`
                      }
                    >
                      {s.name}
                    </Combobox.Option>
                  ))}
              </Combobox.Options>
            </Combobox>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 bg-todo-muted rounded text-main"
              onClick={resetForm}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-todo-primary text-main rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
