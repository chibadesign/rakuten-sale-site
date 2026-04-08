import { useState, useEffect, useCallback } from "react";
import { SaleData, RakutenItem, FilterState } from "../types";

const res = await fetch("/api/rakuten-items");

export function useSaleData() {
  const [data, setData] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?applicationId=${APP_ID}&keyword=スイーツ&hits=30&format=json`
      );

      if (!res.ok) throw new Error("HTTP " + res.status);

      const json = await res.json();

      // 楽天APIのデータを整形
      const items: RakutenItem[] = json.Items.map((i: any) => {
        const item = i.Item;
        return {
          itemName: item.itemName,
          itemPrice: item.itemPrice,
          itemUrl: item.itemUrl,
          affiliateUrl: item.affiliateUrl,
          mediumImageUrls: item.mediumImageUrls,
          reviewAverage: Number(item.reviewAverage) || 0,
          pointRate: item.pointRate || 0,
          category: "スイーツ", // 仮（必要ならロジック追加）
        };
      });

      const formatted: SaleData = {
  items,
  cachedAt: Date.now(),
  nextUpdate: Date.now() + 1000 * 60 * 30, // 30分後
  fromCache: false,
};

      setData(formatted);

    } catch (err) {
      setError("データの取得に失敗しました。しばらく後に再試行してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
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