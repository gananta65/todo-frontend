"use client";

import { useEffect, useState } from "react";
import { Task, Item, Seller } from "@/lib/interfaces";
import { Combobox } from "@headlessui/react";

interface EditTaskFormProps {
  task: Task;
  items: Item[];
  sellers: Seller[];
  getLatestSellerForItem?: (itemId: number) => Promise<Seller | null>;
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
  getLatestSellerForItem,
  onTaskUpdated,
  onClose,
}: EditTaskFormProps) {
  // --- fields (prefilled from task) ---
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
  const [loading, setLoading] = useState(false);

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

  // keep in sync if parent task changes
  useEffect(() => {
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
  }, [task, items, sellers]);

  /**
   * IMPORTANT UX CHANGE (vs AddTaskForm):
   * - When user types in "Nama item" we DO NOT reset quantity/unit/price/seller.
   * - When user selects an item from dropdown (selectedItem changes),
   *   we ALWAYS prefill item fields (name, unit, price) and fetch latest seller.
   * - Quantity is intentionally preserved (not overwritten on selection).
   */
  useEffect(() => {
    if (!selectedItem) return;
    // show fetching UI (both for item-prefill and seller fetch)
    setLoading(true);

    const prefillFields = async () => {
      try {
        // update name (since user explicitly selected an existing item)
        setName(selectedItem.name);

        // prefill unit/price from selected item if available
        if (selectedItem.current_unit) setUnit(selectedItem.current_unit);
        if (selectedItem.current_price) {
          const numericPrice = Number(selectedItem.current_price);
          setPrice(isNaN(numericPrice) ? 0 : numericPrice);
          setPriceDisplay(formatPrice(numericPrice));
        }

        // fetch latest seller for item if helper exists
        if (getLatestSellerForItem) {
          const latestSeller = await getLatestSellerForItem(selectedItem.id);
          setSelectedSeller(latestSeller);
          setSellerName(latestSeller?.name ?? "");
        } else {
          // fallback: try to find seller by name from local sellers list (best-effort)
          const found = sellers.find(
            (s) => s.name === (task.sellers?.[0] ?? "")
          );
          if (found) {
            setSelectedSeller(found);
            setSellerName(found.name);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    prefillFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  // Reset restores original task values and closes modal
  const resetForm = () => {
    setName(task.item?.name ?? "");
    setQuantity(task.quantity ?? undefined);
    setUnit(task.unit ?? "");
    setPrice(task.price ?? undefined);
    setPriceDisplay(task.price ? formatPrice(task.price) : "");
    setSelectedItem(items.find((i) => i.id === task.item?.id) ?? null);
    const lastSellerId =
      task.snapshot_sellers?.[task.snapshot_sellers.length - 1];
    setSelectedSeller(
      lastSellerId ? sellers.find((s) => s.id === lastSellerId) ?? null : null
    );
    setSellerName(task.sellers?.[0] ?? "");
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

      console.log("Payload from EditTaskForm :", payload);

      // kirim ke backend
      await onTaskUpdated(task.id, payload);

      // opsional: tutup modal setelah berhasil
      onClose();
    } catch (err) {
      console.error("Gagal submit edit task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Item Combobox */}
          <div className="relative">
            <Combobox
              value={selectedItem}
              onChange={(item) => {
                if (!item) return;
                // User pilih dari dropdown → update selectedItem & name
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
                  // Jangan setSelectedItem(null) di sini
                  // biarkan selectedItem tetap sampai user pilih dropdown
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

              {loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Mengambil data item...
                </p>
              )}
            </Combobox>

            {name && !selectedItem && (
              <p className="text-sm text-gray-500 mt-1">
                Item belum dipilih (mengetik manual).
              </p>
            )}
            {/* show loading when prefill/fetch running */}
            {loading && (
              <p className="text-sm text-gray-500 mt-1">
                Mengambil data item...
              </p>
            )}
          </div>

          {/* Quantity */}
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

          {/* Unit */}
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Satuan"
            className="w-full border px-3 py-2 rounded"
          />

          {/* Price */}
          <input
            type="text"
            value={priceDisplay}
            onChange={(e) => handlePriceChange(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="Harga"
            className="w-full border px-3 py-2 rounded"
          />

          {/* Seller Combobox */}
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

              {sellerName && !selectedSeller && (
                <p className="text-sm text-gray-500 mt-1">
                  Seller baru akan disimpan ke database
                </p>
              )}

              {loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Mengambil data seller...
                </p>
              )}
            </Combobox>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={resetForm}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-todo-primary text-white rounded"
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
