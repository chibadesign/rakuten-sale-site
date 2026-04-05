import React, { useState } from "react";
import { RakutenItem } from "../types";

interface Props { item: RakutenItem; rank?: number; }

const categoryColors: Record<string, string> = {
  "調理・製造道具": "bg-amber-100 text-amber-800",
  "キッチン家電": "bg-blue-100 text-blue-800",
  "製菓型・天板": "bg-pink-100 text-pink-800",
  "デコレーション用品": "bg-purple-100 text-purple-800",
  "製菓材料": "bg-green-100 text-green-800",
  "クッキングシート・消耗品": "bg-yellow-100 text-yellow-800",
  "ラッピング・梱包": "bg-rose-100 text-rose-800",
  "保存容器": "bg-cyan-100 text-cyan-800",
  "製菓用品セット": "bg-orange-100 text-orange-800",
  "その他製菓用品": "bg-gray-100 text-gray-700",
};

const rankEmoji = (r: number) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : null;

export const ProductCard: React.FC<Props> = ({ item, rank }) => {
  const [imgError, setImgError] = useState(false);
  const fmt = (p: number) => `¥${p.toLocaleString("ja-JP")}`;
  const chip = categoryColors[item.category] || categoryColors["その他製菓用品"];
  const emoji = rank ? rankEmoji(rank) : null;
  const pointAmount = Math.floor(item.itemPrice * (item.pointRate / 100));

  return (
    <article className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow duration-200 flex flex-col overflow-hidden group relative">
      {emoji && (
        <div className="absolute top-2 left-2 z-10 text-xl leading-none">{emoji}</div>
      )}
      {!emoji && rank && rank <= 10 && (
        <div className="absolute top-2 left-2 z-10 bg-gray-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {rank}
        </div>
      )}

      <div className="relative bg-[#FFF0F0] aspect-square overflow-hidden">
        {item.imageUrl && !imgError ? (
          <img src={item.imageUrl} alt={item.itemName}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🧁</div>
        )}
        {item.discountRate && item.discountRate > 0 && (
          <div className="absolute top-2 right-2 bg-[#BF0000] text-white text-xs font-bold rounded-full px-2.5 py-1 shadow">
            -{item.discountRate}%
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${chip}`}>
          {item.category}
        </span>
        <h3 className="text-xs font-medium text-gray-800 line-clamp-3 leading-snug">{item.itemName}</h3>
        <p className="text-xs text-gray-400">{item.shopName}</p>
        <div className="flex-1" />

        <div className="mt-1">
          <p className="text-xl font-bold text-[#BF0000]">{fmt(item.itemPrice)}</p>
          {item.originalPrice && (
            <p className="text-xs text-gray-400 line-through">{fmt(item.originalPrice)}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs bg-[#BF0000] text-white px-1.5 py-0.5 rounded font-bold">
              {item.pointRate}倍
            </span>
            <span className="text-xs text-[#BF0000] font-bold">
              {pointAmount.toLocaleString("ja-JP")}ポイント
            </span>
          </div>
        </div>

        {item.reviewAverage > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex text-yellow-400 text-xs">
              {[1,2,3,4,5].map(s => (
                <span key={s}>{s <= Math.round(item.reviewAverage) ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-xs text-gray-500">{item.reviewAverage.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({item.reviewCount.toLocaleString()}件)</span>
          </div>
        )}

        <a href={item.itemUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 block w-full text-center bg-[#BF0000] hover:bg-[#990000] text-white font-bold py-2.5 rounded-full text-sm transition-all duration-150 shadow">
          楽天で見る
        </a>
      </div>
    </article>
  );
};
