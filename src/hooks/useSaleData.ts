import { useState, useEffect, useCallback } from "react";
import { SaleData, RakutenItem, FilterState } from "../types";

const LOCAL_CACHE_KEY = "rakuten_sale_cache";
const LOCAL_CACHE_TTL = 60 * 60 * 1000;

export function useSaleData() {
  const [data, setData] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      try {
        const raw = localStorage.getItem(LOCAL_CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Date.now() - cached.savedAt < LOCAL_CACHE_TTL) {
            setData(cached.data);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rakuten-items");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json: SaleData = await res.json();
      setData(json);
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ data: json, savedAt: Date.now() }));
    } catch (err: any) {
      setError(err.message || "データの取得に失敗しました");
      try {
        const raw = localStorage.getItem(LOCAL_CACHE_KEY);
        if (raw) setData(JSON.parse(raw).data);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), LOCAL_CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
}

export function useFilteredItems(items: RakutenItem[], filter: FilterState): RakutenItem[] {
  return items
    .filter(item => {
      if (filter.category !== "すべて" && item.category !== filter.category) return false;
      if (item.pointRate < filter.minPoints) return false;
      if (filter.maxPrice !== null && item.itemPrice > filter.maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (filter.sortBy === "price_asc") return a.itemPrice - b.itemPrice;
      if (filter.sortBy === "price_desc") return b.itemPrice - a.itemPrice;
      if (filter.sortBy === "review") return b.reviewAverage - a.reviewAverage;
      if (filter.sortBy === "points") return b.pointRate - a.pointRate;
      return 0;
    });
}
