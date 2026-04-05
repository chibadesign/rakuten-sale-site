import React, { useState } from "react";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { ProductCard } from "./components/ProductCard";
import { SkeletonGrid, MobileFilterDrawer } from "./components/UI";
import { useSaleData, useFilteredItems } from "./hooks/useSaleData";
import { FilterState } from "./types";

const DEFAULT_FILTER: FilterState = {
  category: "すべて",
  minPoints: 0,
  maxPrice: null,
  sortBy: "price_asc",
};

export default function App() {
  const { data, loading, error, refetch } = useSaleData();
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allItems = data?.items ?? [];
  const filteredItems = useFilteredItems(allItems, filter);
  const maxPoints = allItems.length > 0 ? Math.max(...allItems.map(i => i.pointRate)) : 0;
  const hasActiveFilter = filter.category !== "すべて" || filter.minPoints > 0 || filter.maxPrice !== null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header
        cachedAt={data?.cachedAt ?? null}
        nextUpdate={data?.nextUpdate ?? null}
        isMock={data?.isMock}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Hero */}
      <div className="bg-[#BF0000] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-red-200 uppercase mb-2">
            楽天市場 · 毎時自動更新
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight mb-3">
            製菓道具セール <span className="text-yellow-300">ポイント最大{maxPoints}倍</span>
          </h1>
          <p className="text-sm text-white/80 max-w-xl mx-auto mb-6">
            楽天市場のお菓子作り道具・製菓材料をリアルタイム比較。<br className="hidden sm:block" />
            ポイント還元でお得にまとめ買いできます！
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="inline-flex items-center gap-3 bg-white/15 border border-white/30 rounded-2xl px-5 py-3">
              <span className="text-2xl">🎁</span>
              <div className="text-left">
                <p className="text-xs text-white/70">最大ポイント倍率</p>
                <p className="text-xl font-bold text-yellow-300">{maxPoints}倍還元</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-3 bg-white/15 border border-white/30 rounded-2xl px-5 py-3">
              <span className="text-2xl">📦</span>
              <div className="text-left">
                <p className="text-xs text-white/70">取扱商品数</p>
                <p className="text-xl font-bold">{allItems.length}件</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && !loading && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* 導入文 */}
        <section className="mb-6 bg-white rounded-2xl shadow p-5 border-l-4 border-[#BF0000]">
          <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🛒</span> 楽天市場でお得に製菓道具を揃えよう
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong className="text-[#BF0000]">ポイント還元率が高い楽天市場</strong>は、製菓道具のまとめ買いに最適です。
            SPU（スーパーポイントアッププログラム）を活用すれば最大10倍以上のポイントが貯まります。
            お気に入りの道具を見つけたら<strong>早めにチェック</strong>してください。
          </p>
        </section>

        <div className="flex gap-6">
          {/* PC サイドバー */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-4">
              <FilterBar filter={filter} onChange={setFilter} totalCount={allItems.length} filteredCount={filteredItems.length} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-[#BF0000] text-white text-xs px-2 py-0.5 rounded-full">楽天</span>
                製菓道具 {filteredItems.length}件
              </h2>
              <div className="lg:hidden flex items-center gap-2">
                <button onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-1.5 border border-red-300 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  絞り込み
                  {hasActiveFilter && <span className="bg-[#BF0000] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
                </button>
              </div>
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-red-100">
                <span className="text-5xl mb-4">🔍</span>
                <h2 className="text-base font-bold text-gray-700 mb-2">該当する商品が見つかりません</h2>
                <p className="text-sm text-gray-400 mb-4">条件を変更してみてください</p>
                <button onClick={() => setFilter(DEFAULT_FILTER)}
                  className="bg-[#BF0000] text-white px-5 py-2 rounded-full text-sm font-medium">
                  リセット
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map((item, index) => (
                  <ProductCard key={item.itemCode} item={item} rank={index + 1} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ポイント活用ガイド */}
        <section className="mt-12 bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💡</span> 楽天ポイントを最大限に活用する方法
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🛒", title: "お買い物マラソン期間を狙う", desc: "複数ショップでの購入でポイント倍率がアップ。製菓道具はまとめ買いがお得。" },
              { icon: "💳", title: "楽天カードで決済する", desc: "楽天カードで決済すると基本ポイントが2倍。楽天プレミアムカードならさらにお得。" },
              { icon: "📅", title: "5・10・15日に購入する", desc: "楽天カード利用で毎月5日・10日・15日はポイント5倍。計画的に購入しよう。" },
              { icon: "⭐", title: "SPUを活用する", desc: "楽天のサービスを使うほどポイント倍率がアップ。楽天モバイル等を活用しよう。" },
              { icon: "🔔", title: "お気に入り登録でセール通知", desc: "気になる商品をお気に入り登録してセール・値下げ通知を受け取ろう。" },
              { icon: "📦", title: "送料無料の商品を選ぶ", desc: "3,980円以上で送料無料のショップが多い。まとめ買いで送料を節約しよう。" },
            ].map(tip => (
              <div key={tip.title} className="flex gap-3 p-3 bg-red-50 rounded-xl">
                <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-1">{tip.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 mt-12 py-6 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            当サイトは楽天アフィリエイトプログラムに参加しています。価格・ポイント倍率は変動する場合があります。購入前に必ず楽天市場でご確認ください。
          </p>
        </div>
      </footer>

      <MobileFilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filter={filter}
        onChange={setFilter}
        totalCount={allItems.length}
        filteredCount={filteredItems.length}
      />
    </div>
  );
}
