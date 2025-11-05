"use client";

import React, { useState } from "react";
import { Task, Seller } from "@/lib/interfaces";
import { Copy } from "lucide-react";

type CopyFormat = "full" | "sellerOnly" | "itemAndPrice";

interface CopyButtonProps {
  tasks: Task[];
  allSellers: Seller[];
  created_at?: string;
}

export default function CopyButton({
  tasks,
  allSellers,
  created_at,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<CopyFormat>("sellerOnly");

  // Konversi harga ke satuan (1000 -> 1, 4500 -> 4.5)
  const formatInThousands = (value: number) => {
    const num = value / 1000;
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  // Dapatkan nama seller dari snapshot_sellers
  const getSellerName = (task: Task) => {
    if (task.snapshot_sellers?.length && allSellers?.length) {
      const latestId = task.snapshot_sellers[task.snapshot_sellers.length - 1];
      const matchedSeller = allSellers.find((s) => s.id === latestId);
      return matchedSeller?.name ?? `ID:${latestId}`;
    }
    return "Belum ditentukan";
  };

  const formatTasksForClipboard = (tasks: Task[], type: CopyFormat): string => {
    if (!tasks || tasks.length === 0) return "";

    const sellerMap: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const sellerName = getSellerName(task);
      if (!sellerMap[sellerName]) sellerMap[sellerName] = [];
      sellerMap[sellerName].push(task);
    });

    // Flat array semua item untuk itemAndPrice
    const allItems: Task[] =
      type === "itemAndPrice"
        ? [...tasks].sort((a, b) =>
            a.item.name.localeCompare(b.item.name, "id", {
              sensitivity: "base",
            })
          )
        : [];

    const lines: string[] = [];

    // Tanggal
    if (created_at) {
      const formattedDate = new Date(created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      lines.push(formattedDate, "");
    }

    if (type === "itemAndPrice") {
      allItems.forEach((task) => {
        lines.push(`${task.item.name} ${formatInThousands(task.price)}`);
      });
      return lines.join("\n");
    }

    // full & sellerOnly
    const sortedSellers = Object.keys(sellerMap);
    const excludedSellers = ["Belum ditentukan", "Mobil"];
    sortedSellers.forEach((seller) => {
      if (type === "sellerOnly") {
        if (excludedSellers.includes(seller)) return;
        lines.push(`${seller}`);
      }

      if (type === "full") {
        lines.push(`*${seller}*`);
        sellerMap[seller].forEach((task) => {
          const subtotal = task.quantity * task.price;
          lines.push(
            `${task.item.name} ${task.quantity} ${
              task.unit
            } ${formatInThousands(task.price)} subtotal: ${formatInThousands(
              subtotal
            )}`
          );
        });
        const sellerSubtotal = sellerMap[seller].reduce(
          (sum, t) => sum + t.quantity * t.price,
          0
        );
        lines.push(`Subtotal ${seller}: ${formatInThousands(sellerSubtotal)}`);
      }
    });

    if (type === "full") {
      const grandTotal = tasks.reduce(
        (sum, t) => sum + t.quantity * t.price,
        0
      );
      lines.push(`Grand Total: ${formatInThousands(grandTotal)}`);
    }

    return lines.join("\n");
  };

  const handleCopy = async () => {
    const textToCopy = formatTasksForClipboard(tasks, format);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as CopyFormat)}
        className="px-2 py-1 border rounded-lg text-sm text-main bg-card"
      >
        <option value="sellerOnly">Salin Nama Dagang</option>
        <option value="itemAndPrice">Salin Barang + Harga Satuan</option>
      </select>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-lg shadow text-main bg-primary hover:bg-primary-hover transition font-medium text-sm sm:text-base"
      >
        <Copy className="w-4 h-4" />
        {copied ? "Tersalin!" : "Salin"}
      </button>
    </div>
  );
}
