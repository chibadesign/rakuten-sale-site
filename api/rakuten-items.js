// 楽天市場 商品取得API（100商品最適化版）

const CACHE_TTL = 60 * 60 * 1000;
let cache = null;
let cacheAt = 0;

// カテゴリ判定
function getCategory(name) {
  const t = name;
  if (/ホームベーカリー|ミキサー|オーブン/.test(t)) return "キッチン家電";
  if (/ケーキ型|マフィン型|タルト型|シリコン型/.test(t)) return "製菓型・天板";
  if (/絞り袋|口金|デコレーション/.test(t)) return "デコレーション用品";
  if (/スケール|泡立て器|ボウル/.test(t)) return "調理・製造道具";
  if (/薄力粉|砂糖|チョコ/.test(t)) return "製菓材料";
  return "その他製菓用品";
}

// データ整形
function toItem(raw) {
  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName,
    itemPrice: raw.itemPrice,
    pointRate: raw.pointRate || 1,
    reviewAverage: raw.reviewAverage || 0,
    reviewCount: raw.reviewCount || 0,
    imageUrl:
  raw.mediumImageUrls?.[0]?.imageUrl ||
  raw.smallImageUrls?.[0]?.imageUrl ||
  raw.largeImageUrl ||
  null,
    itemUrl: raw.affiliateUrl
  ? raw.affiliateUrl
  : raw.itemUrl + (raw.itemUrl.includes("?") ? "&" : "?") + "scid=af_pc_etc&sc2id=" + process.env.RAKUTEN_AFFILIATE_ID,
    category: getCategory(raw.itemName),
  };
}

// 検索API
async function search(appId, keyword) {
  const q = new URLSearchParams({
    applicationId: appId,
    keyword: keyword,
    hits: "30",
    sort: "-reviewCount",
    format: "json",
    formatVersion: "2",
  });

  const res = await fetch(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + q
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  const json = await res.json();
  return json.Items || [];
}

module.exports = async function handler(req, res) {
  const now = Date.now();

  // キャッシュ
  if (cache && now - cacheAt < CACHE_TTL) {
    return res.json({
      items: cache,
      cachedAt: cacheAt,
      nextUpdate: cacheAt + CACHE_TTL,
      fromCache: true,
    });
  }

  const appId = process.env.RAKUTEN_APP_ID;

  if (!appId) {
    return res.json({
      items: [],
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      isMock: true,
    });
  }

  // ★ここが強化ポイント
  const keywords = [
    "製菓道具",
    "スイーツ",
    "お菓子作り",
    "ケーキ型",
    "チョコレート",
    "クッキングシート"
  ];

  const seen = new Set();
  let allItems = [];

  for (const kw of keywords) {
    try {
      const raw = await search(appId, kw);

      raw.forEach(r => {
        if (r.itemCode && !seen.has(r.itemCode)) {
          seen.add(r.itemCode);
          allItems.push(toItem(r));
        }
      });

    } catch (e) {
      console.error("Search error:", kw, e.message);
    }
  }

  // ★売れる並び順（超重要）
  allItems.sort((a, b) => {
    // レビュー数重視（信頼）
    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }
    // 次に評価
    return b.reviewAverage - a.reviewAverage;
  });

  // ★100件に制限（UX最適）
  const items = allItems.slice(0, 100);

  cache = items;
  cacheAt = now;

  return res.json({
    items,
    cachedAt: now,
    nextUpdate: now + CACHE_TTL,
    fromCache: false,
  });
};