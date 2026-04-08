// 楽天市場 商品取得API（完全修正版）

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

// 変換
function toItem(raw) {
  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName,
    itemPrice: raw.itemPrice,
    pointRate: raw.pointRate || 1,
    reviewAverage: raw.reviewAverage || 0,
    reviewCount: raw.reviewCount || 0,
    imageUrl: raw.mediumImageUrls?.[0]?.imageUrl?.replace("128x128", "300x300") || null,
    itemUrl: raw.affiliateUrl || raw.itemUrl,
    category: getCategory(raw.itemName),
  };
}

// ★ 検索API（これだけでOK）
async function search(appId, keyword) {
  const q = new URLSearchParams({
    applicationId: appId,
    keyword: keyword,
    hits: "30",
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

// モック
function getMock() {
  return [
    {
      itemCode: "mock",
      itemName: "テスト商品",
      shopName: "テスト",
      itemPrice: 1000,
      pointRate: 10,
      reviewAverage: 4.5,
      reviewCount: 100,
      imageUrl: null,
      itemUrl: "https://www.rakuten.co.jp/",
      category: "製菓材料",
    },
  ];
}

module.exports = async function handler(req, res) {
  const now = Date.now();

  if (cache && now - cacheAt < CACHE_TTL) {
    return res.json({
      items: cache,
      cachedAt: cacheAt,
      nextUpdate: cacheAt + CACHE_TTL,
      fromCache: true,
    });
  }

  // ★ここ重要
  const appId = process.env.RAKUTEN_APP_ID;

  if (!appId) {
    return res.json({
      items: getMock(),
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      isMock: true,
    });
  }

  try {
    const raw = await search(appId, "製菓道具");
    const items = raw.map(r => toItem(r));

    cache = items;
    cacheAt = now;

    return res.json({
      items,
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      fromCache: false,
    });

  } catch (e) {
    console.error("API ERROR:", e.message);

    return res.json({
      items: getMock(),
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      isMock: true,
    });
  }
};