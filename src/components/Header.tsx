import React from "react";

interface Props {
  cachedAt: number | null;
  isMock?: boolean;
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<Props> = ({ cachedAt, isMock, onRefresh, loading }) => {
  const fmt = (ts: number) => new Date(ts).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  return (
    <header className="bg-[#BF0000] text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛒</span>
          <span className="font-bold text-base">製菓道具セール</span>
          <span className="text-xs bg-yellow-300 text-[#BF0000] px-2 py-0.5 rounded font-bold">楽天</span>
          {isMock && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">デモ</span>}
        </div>
        <div className="flex items-center gap-3">
          {cachedAt && <span className="hidden sm:block text-xs text-white/70">取得: {fmt(cachedAt)}</span>}
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50">
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            更新
          </button>
        </div>
      </div>
    </header>
  );
};
