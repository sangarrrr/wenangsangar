import { useEffect, useState } from "react";
import { getBarang, type Barang } from "@/lib/storage";

/**
 * Subscribe to the global "sembako-update" event (which is fired by the
 * storage layer whenever the Supabase Realtime channel for the `products`
 * table receives an INSERT / UPDATE / DELETE). Returns the latest products
 * snapshot plus a transient `justUpdated` flag (true for ~2s after an event).
 */
export function useRealtimeProducts() {
  const [items, setItems] = useState<Barang[]>(() => getBarang());
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "barang" || detail === "hydrate" || detail === "all") {
        setItems(getBarang());
        if (detail === "barang") {
          setJustUpdated(true);
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => setJustUpdated(false), 2000);
        }
      }
    };
    window.addEventListener("sembako-update", handler);
    return () => {
      window.removeEventListener("sembako-update", handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { items, justUpdated };
}