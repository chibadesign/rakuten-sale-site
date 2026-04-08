import { useState, useEffect, useCallback } from "react";
import { SaleData, RakutenItem, FilterState } from "../types";

export function useSaleData() {
  const [data, setData] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rakuten-items" + (force ? "?t=" + Date.now() : ""));
      if (!res.ok) throw new Error("HTTP " + res.status);

      const json: SaleData = await res.json();
      setData(json);

    } catch (err: any) {
      setError("データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch: () => fetch_(true) };
}

export function useFilteredItems(items: RakutenItem[], filter: FilterState): RakutenItem[] {
  return items
    .filter(item => {
      if (filter.category !== "すべて" && item.category !== filter.category) return false;
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