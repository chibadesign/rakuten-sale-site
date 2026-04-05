import React from "react";

interface Props {
  cachedAt: number | null;
  nextUpdate: number | null;
  isMock?: boolean;
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<Props> = ({ cachedAt, nextUpdate, isMock, onRefresh, loading }) => {
  const fmt = (ts: number) => new Date(ts).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  return (
    <header className="bg-[#BF0000] text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold text-white">製菓道具</span>
                <span className="text-base font-bold text-yellow-300">セール</span>
                <span className="text-xs bg-yellow-300 text-[#BF0000] px-1.5 py-0.5 rounded font-bold ml-1">楽天</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs text-white/70">
              {cachedAt && <span>取得: {fmt(cachedAt)}</span>}
              {nextUpdate && <span>次回: {fmt(nextUpdate)}</span>}
            </div>
            {isMock && (
              <span className="hidden sm:inline text-xs bg-yellow-300 text-[#BF0000] px-2 py-1 rounded-full font-bold">
                デモ
              </span>
            )}
            <button onClick={onRefresh} disabled={loading}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              更新
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
