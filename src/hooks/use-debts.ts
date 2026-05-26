import { useEffect, useState, useCallback } from "react";

export type Recurrence = "none" | "weekly" | "monthly";

export interface Debt {
  id: string;
  name: string;
  contact: string;
  amount: number;
  dueDate: string; // ISO date
  recurrence: Recurrence;
  status: "active" | "paid";
  paidAt?: string; // ISO date when paid
  createdAt: string;
}

const STORAGE_KEY = "owed.debts.v1";

function load(): Debt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Debt[]) : [];
  } catch {
    return [];
  }
}

function save(debts: Debt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
}

function addPeriod(date: string, recurrence: Recurrence): string {
  const d = new Date(date);
  if (recurrence === "weekly") d.setDate(d.getDate() + 7);
  else if (recurrence === "monthly") d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDebts(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) save(debts);
  }, [debts, loaded]);

  const addDebt = useCallback((d: Omit<Debt, "id" | "status" | "createdAt">) => {
    setDebts((prev) => [
      ...prev,
      {
        ...d,
        id: crypto.randomUUID(),
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const markPaid = useCallback((id: string) => {
    setDebts((prev) => {
      const target = prev.find((d) => d.id === id);
      if (!target) return prev;
      const updated = prev.map((d) =>
        d.id === id ? { ...d, status: "paid" as const, paidAt: new Date().toISOString() } : d,
      );
      if (target.recurrence !== "none") {
        updated.push({
          ...target,
          id: crypto.randomUUID(),
          dueDate: addPeriod(target.dueDate, target.recurrence),
          status: "active",
          paidAt: undefined,
          createdAt: new Date().toISOString(),
        });
      }
      return updated;
    });
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return { debts, addDebt, markPaid, removeDebt };
}
