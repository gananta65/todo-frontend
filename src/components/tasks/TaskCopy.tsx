"use client";

import React, { useState } from "react";
import { Task, Seller } from "@/lib/interfaces";
import { Copy } from "lucide-react";

interface CopyButtonProps {
  tasks: Task[];
  allSellers: Seller[];
}

export default function CopyButton({ tasks, allSellers }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  // Gunakan logika sama seperti TaskList untuk menentukan seller
  const getSellerName = (task: Task) => {
    if (task.snapshot_sellers?.length && allSellers?.length) {
      const latestId = task.snapshot_sellers[task.snapshot_sellers.length - 1];
      const matchedSeller = allSellers.find((s) => s.id == latestId);
      return matchedSeller?.name ?? `ID:${latestId}`;
    }
    return "Belum ditentukan";
  };

  // Format task per seller untuk clipboard
  const formatTasksForClipboard = (tasks: Task[]) => {
    if (!tasks || tasks.length === 0) return "";

    const sellerMap: Record<string, Task[]> = {};

    tasks.forEach((task) => {
      const sellerName = getSellerName(task);
      if (!sellerMap[sellerName]) sellerMap[sellerName] = [];
      sellerMap[sellerName].push(task);
    });

    const sortedSellers = Object.keys(sellerMap).sort((a, b) => {
      if (a === "Belum ditentukan") return 1;
      if (b === "Belum ditentukan") return -1;
      return a.localeCompare(b, "id");
    });

    const lines: string[] = [];

    sortedSellers.forEach((seller) => {
      lines.push(`*${seller}*`);
      sellerMap[seller].forEach((task, i) => {
        const subtotal = task.quantity * task.price;
        lines.push(
          `${i + 1}. ${task.item.name} | ${task.quantity} ${
            task.unit
          } | ${task.price.toLocaleString(
            "id-ID"
          )} | subtotal: ${subtotal.toLocaleString("id-ID")}`
        );
      });
      const sellerSubtotal = sellerMap[seller].reduce(
        (sum, t) => sum + t.quantity * t.price,
        0
      );
      lines.push(
        `Subtotal ${seller}: ${sellerSubtotal.toLocaleString("id-ID")}`
      );
      lines.push(""); // spasi antar seller
    });

    const grandTotal = tasks.reduce((sum, t) => sum + t.quantity * t.price, 0);
    lines.push(`Grand Total: ${grandTotal.toLocaleString("id-ID")}`);

    return lines.join("\n");
  };

  const handleCopy = async () => {
    const textToCopy = formatTasksForClipboard(tasks);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 rounded-lg shadow text-main bg-primary hover:bg-primary-hover transition font-medium text-sm sm:text-base"
    >
      <Copy className="w-4 h-4" />
      {copied ? "Tersalin!" : "Salin Daftar Belanja Ini"}
    </button>
  );
}
