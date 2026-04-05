import React from "react";
import { FilterState, Category } from "../types";

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const CATEGORIES: Category[] = [
  "すべて","調理・製造道具","キッチン家電","製菓型・天板",
  "デコレーション用品","製菓材料","クッキングシート・消耗品",
  "ラッピング・梱包","保存容器","製菓用品セット","その他製菓用品",
];

const POINT_OPTIONS = [
  { label: "すべて", value: 0 },
  { label: "2倍以上", value: 2 },
  { label: "5倍以上", value: 5 },
  { label: "10倍以上", value: 10 },
];

const PRICE_OPTIONS = [
  { label: "上限なし", value: null },
  { label: "¥500以下", value: 500 },
  { label: "¥1,000以下", value: 1000 },
  { label: "¥3,000以下", value: 3000 },
  { label: "¥5,000以下", value: 5000 },
  { label: "¥10,000以下", value: 10000 },
];

const SORT_OPTIONS = [
  { label: "価格が安い順", value: "price_asc" },
  { label: "価格が高い順", value: "price_desc" },
  { label: "レビューが高い順", value: "review" },
  { label: "ポイントが高い順", value: "points" },
];

export const FilterBar: React.FC<Props> = ({ filter, onChange, totalCount, filteredCount }) => {
  const set = (p: Partial<FilterState>) => onChange({ ...filter, ...p });

  return (
    <aside className="bg-white rounded-2xl shadow p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">絞り込み</span>
        <span className="text-xs text-gray-500 bg-red-50 px-2 py-1 rounded-full">{filteredCount}/{totalCount}件</span>
      </div>

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">カテゴリ</p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => set({ category: cat })}
              className={`text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                filter.category === cat ? "bg-red-50 text-[#BF0000] font-semibold" : "text-gray-700 hover:bg-red-50"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-red-100" />

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ポイント倍率</p>
        <div className="flex flex-wrap gap-2">
          {POINT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => set({ minPoints: opt.value })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filter.minPoints === opt.value
                  ? "bg-[#BF0000] text-white border-[#BF0000]"
                  : "border-red-200 text-gray-600 hover:bg-red-50"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-red-100" />

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">価格</p>
        <select value={filter.maxPrice ?? ""}
          onChange={e => set({ maxPrice: e.target.value === "" ? null : Number(e.target.value) })}
          className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BF0000]">
          {PRICE_OPTIONS.map(opt => <option key={opt.label} value={opt.value ?? ""}>{opt.label}</option>)}
        </select>
      </section>

      <hr className="border-red-100" />

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">並び替え</p>
        <select value={filter.sortBy}
          onChange={e => set({ sortBy: e.target.value as FilterState["sortBy"] })}
          className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BF0000]">
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </section>

      <button onClick={() => onChange({ category: "すべて", minPoints: 0, maxPrice: null, sortBy: "price_asc" })}
        className="w-full text-xs text-[#BF0000] border border-[#BF0000] rounded-full py-2 hover:bg-red-50 transition-colors">
        リセット
      </button>
    </aside>
  );
};
