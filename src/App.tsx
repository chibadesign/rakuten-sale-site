import React, { useState } from "react";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { useSaleData, useFilteredItems } from "./hooks/useSaleData";
import { FilterState, Category } from "./types";

const DEFAULT: FilterState = { category: "すべて", maxPrice: null, sortBy: "review" };

const CATS: Category[] = [
  "すべて","キッチン家電","製菓型・天板","デコレーション用品",
  "調理・製造道具","製菓材料","クッキングシート・消耗品",
  "ラッピング・梱包","保存容器","製菓用品セット","その他製菓用品",
];

const PRICES = [
  { label: "上限なし", value: null },
  { label: "¥500以下", value: 500 },
  { label: "¥1,000以下", value: 1000 },
  { label: "¥3,000以下", value: 3000 },
  { label: "¥5,000以下", value: 5000 },
  { label: "¥10,000以下", value: 10000 },
];

const SORTS = [
  { label: "レビューが高い順", value: "review" },
  { label: "価格が安い順", value: "price_asc" },
  { label: "価格が高い順", value: "price_desc" },
  { label: "ポイントが高い順", value: "points" },
];

const Skeleton = () => (
  <div className="bg-white rounded-2xl shadow overflow-hidden animate-pulse">
    <div className="bg-red-50 aspect-square" />
    <div className="p-3 flex flex-col gap-2">
      <div className="h-3 bg-red-50 rounded w-1/3" />
      <div className="h-3 bg-red-50 rounded w-full" />
      <div className="h-3 bg-red-50 rounded w-3/4" />
      <div className="h-8 bg-red-50 rounded-full mt-2" />
    </div>
  </div>
);

export default function App() {
  const { data, loading, error, refetch } = useSaleData();
  const [filter, setFilter] = useState<FilterState>(DEFAULT);
  const set = (p: Partial<FilterState>) => setFilter(f => ({ ...f, ...p }));

  const all = data?.items ?? [];
  const filtered = useFilteredItems(all, filter);
  const maxPoints = all.length > 0 ? Math.max(...all.map(i => i.pointRate)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cachedAt={data?.cachedAt ?? null} isMock={data?.isMock} onRefresh={refetch} loading={loading} />

      {/* Hero */}
      <div className="bg-[#BF0000] text-white py-8 px-4 text-center">
        <p className="text-xs tracking-widest text-red-200 mb-1">楽天市場 · 毎時自動更新</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          製菓道具セール <span className="text-yellow-300">ポイント最大{maxPoints > 0 ? maxPoints : "10"}倍</span>
        </h1>
        <p className="text-sm text-white/80 mb-5">楽天ランキング上位の製菓道具・材料をリアルタイム表示</p>
        <div className="flex flex-wrap justify-center gap-3">
          <div className="bg-white/15 border border-white/30 rounded-xl px-4 py-2">
            <p className="text-xs text-white/70">最大ポイント倍率</p>
            <p className="text-lg font-bold text-yellow-300">{maxPoints > 0 ? maxPoints : "10"}倍還元</p>
          </div>
          <div className="bg-white/15 border border-white/30 rounded-xl px-4 py-2">
            <p className="text-xs text-white/70">取扱商品数</p>
            <p className="text-lg font-bold">{all.length}件</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {/* フィルターバー */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          {/* カテゴリ */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATS.map(cat => (
              <button key={cat} onClick={() => set({ category: cat })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  filter.category === cat
                    ? "bg-[#BF0000] text-white border-[#BF0000]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#BF0000] hover:text-[#BF0000]"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          {/* 価格・並び替え */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">価格：</span>
              <select value={filter.maxPrice ?? ""}
                onChange={e => set({ maxPrice: e.target.value === "" ? null : Number(e.target.value) })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#BF0000]">
                {PRICES.map(o => <option key={o.label} value={o.value ?? ""}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">並び替え：</span>
              <select value={filter.sortBy}
                onChange={e => set({ sortBy: e.target.value as FilterState["sortBy"] })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#BF0000]">
                {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500"><span className="font-bold text-gray-800">{filtered.length}</span>件</span>
              <button onClick={() => setFilter(DEFAULT)} className="text-xs text-gray-400 hover:text-[#BF0000]">リセット</button>
            </div>
          </div>
        </div>

        {/* 商品グリッド */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-gray-700 mb-1">該当する商品が見つかりません</p>
            <p className="text-sm text-gray-400 mb-4">条件を変更してみてください</p>
            <button onClick={() => setFilter(DEFAULT)} className="bg-[#BF0000] text-white px-5 py-2 rounded-full text-sm">リセット</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((item, i) => <ProductCard key={item.itemCode} item={item} rank={i + 1} />)}
          </div>
        )}

        {/* ポイント活用ガイド */}
        <section className="mt-10 bg-white rounded-2xl shadow p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">💡 楽天ポイントを最大限に活用する方法</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: "🛒", title: "お買い物マラソン期間を狙う", desc: "複数ショップ購入でポイント倍率アップ。製菓道具はまとめ買いがお得。" },
              { icon: "💳", title: "楽天カードで決済", desc: "楽天カードで決済するとポイント2倍。楽天プレミアムカードならさらにお得。" },
              { icon: "📅", title: "5・10・15日に購入", desc: "楽天カード利用で毎月5・10・15日はポイント5倍。計画的に購入しよう。" },
              { icon: "⭐", title: "SPUを活用する", desc: "楽天サービスを使うほどポイント倍率アップ。楽天モバイル等を活用しよう。" },
              { icon: "📦", title: "送料無料の商品を選ぶ", desc: "3,980円以上で送料無料のショップが多い。まとめ買いで送料を節約。" },
              { icon: "🔔", title: "お気に入り登録でセール通知", desc: "気になる商品をお気に入り登録してセール・値下げ通知を受け取ろう。" },
            ].map(tip => (
              <div key={tip.title} className="flex gap-3 p-3 bg-red-50 rounded-xl">
                <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-0.5">{tip.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 mt-10 py-6 px-4 bg-white text-center">
        <p className="text-xs text-gray-400">当サイトは楽天アフィリエイトプログラムに参加しています。価格・ポイント倍率は変動する場合があります。購入前に必ず楽天市場でご確認ください。</p>
      </footer>
    </div>
  );
}
