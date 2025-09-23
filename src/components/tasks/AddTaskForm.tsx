"use client";

import { useEffect, useState } from "react";
import { Task, Item, Seller } from "@/lib/interfaces";
import { Combobox } from "@headlessui/react";

interface AddTaskFormProps {
  token: string;
  todoListId: number;
  tasks: Task[];
  items: Item[];
  sellers: Seller[];
  getLatestSellerForItem?: (itemId: number) => Promise<Seller | null>;
  onTaskAdded: (task: Task) => Promise<void>; // pastikan async
}

export default function AddTaskForm({
  items,
  sellers,
  getLatestSellerForItem,
  onTaskAdded,
}: AddTaskFormProps) {
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | undefined>();
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState<number | undefined>();
  const [priceDisplay, setPriceDisplay] = useState("");

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerName, setSellerName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false); // untuk label "mengambil data item"

  const formatPrice = (val: number | undefined) =>
    val ? "Rp" + val.toLocaleString("id-ID") : "";

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

  const resetForm = () => {
    setName("");
    setQuantity(undefined);
    setUnit("");
    setPrice(undefined);
    setPriceDisplay("");
    setSelectedItem(null);
    setSelectedSeller(null);
    setSellerName("");
    setShowModal(false);
  };

  /** --- Prefill seller saat item dipilih --- */
  useEffect(() => {
    if (!selectedItem || !getLatestSellerForItem) return;

    setLoading(true);

    const prefillFields = async () => {
      try {
        const latestSeller = await getLatestSellerForItem(selectedItem.id);
        setSelectedSeller(latestSeller);

        // Hanya set name kalau user belum mengetik manual
        if (!name || name === selectedItem.name) {
          setName(selectedItem.name);
        }
        // Prefill harga dan unit kalau ada di item
        if (selectedItem.current_unit) setUnit(selectedItem.current_unit);
        if (selectedItem.current_price) {
          const numericPrice = Number(selectedItem.current_price);
          setPrice(isNaN(numericPrice) ? 0 : numericPrice);
          setPriceDisplay(formatPrice(numericPrice));
        }

        setSellerName(latestSeller?.name ?? "");
      } finally {
        setLoading(false);
      }
    };

    prefillFields();
  }, [selectedItem, getLatestSellerForItem, name]);

  /** --- Hanya bagian ini diubah --- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const finalPrice = price && price < 1000 ? price * 1000 : price;
    const payload: Partial<Task> = {
      item: selectedItem
        ? selectedItem
        : { id: 0, name, current_price: finalPrice!, current_unit: unit },
      quantity: quantity ?? 0,
      unit,
      price: finalPrice ?? 0,
      sellers: selectedSeller
        ? [selectedSeller.name]
        : sellerName.trim()
        ? [sellerName.trim()]
        : ["Belum ditentukan"],
      snapshot_sellers: selectedSeller ? [selectedSeller.id] : [],
      completed: false,
    };

    try {
      console.log("Mengirim payload:", payload);
      await onTaskAdded(payload as Task); // pastikan async
      // resetForm setelah task berhasil ditambahkan, feedback "Menyimpan..." terlihat dulu
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="fixed bottom-6 right-6 bg-todo-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        onClick={() => setShowModal(true)}
      >
        +
      </button>

      {showModal && (
        <div className="fixed text-main inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-card rounded-lg shadow-lg w-auto max-w-md p-4 sm:p-6 mx-2 sm:mx-5 relative">
            <h2 className="text-lg font-semibold mb-4">Tambah Task</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Item Combobox */}
              <div className="relative">
                <Combobox value={selectedItem} onChange={setSelectedItem}>
                  <Combobox.Input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Nama item"
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      setSelectedItem(null);

                      if (
                        !items.some(
                          (i) => i.name.toLowerCase() === val.toLowerCase()
                        )
                      ) {
                        setQuantity(undefined);
                        setUnit("");
                        setPrice(undefined);
                        setPriceDisplay("");
                        setSelectedSeller(null);
                        setSellerName("");
                      }
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
                              active ? "bg-todo-muted" : ""
                            }`
                          }
                        >
                          {item.name}
                        </Combobox.Option>
                      ))}
                  </Combobox.Options>
                </Combobox>

                {name && !selectedItem && (
                  <p className="text-sm text-gray-500 mt-1">
                    Item baru akan disimpan ke database
                  </p>
                )}
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
                    displayValue={(seller: Seller) =>
                      seller?.name ?? sellerName
                    }
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
                  className="px-4 py-2 bg-todo-muted text-main rounded"
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
      )}
    </>
  );
}
