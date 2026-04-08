// 楽天市場 商品取得API（完全安定版）

const CACHE_TTL = 60 * 60 * 1000;
let cache = null;
let cacheAt = 0;

// カテゴリ判定
function getCategory(name) {
  const t = name || "";
  if (/ホームベーカリー|ミキサー|オーブン/.test(t)) return "キッチン家電";
  if (/ケーキ型|マフィン型|タルト型|シリコン型/.test(t)) return "製菓型・天板";
  if (/絞り袋|口金|デコレーション/.test(t)) return "デコレーション用品";
  if (/スケール|泡立て器|ボウル/.test(t)) return "調理・製造道具";
  if (/薄力粉|砂糖|チョコ/.test(t)) return "製菓材料";
  return "その他製菓用品";
}

// データ整形（v2対応）
function toItem(wrapper) {
  const raw = wrapper.Item;

  const image =
    raw.mediumImageUrls?.[0]?.imageUrl ||
    raw.smallImageUrls?.[0]?.imageUrl ||
    "";

  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName,
    itemPrice: raw.itemPrice,
    pointRate: raw.pointRate || 1,
    reviewAverage: raw.reviewAverage || 0,
    reviewCount: raw.reviewCount || 0,

    imageUrl: image.replace("128x128", "300x300"),

    itemUrl: raw.affiliateUrl
      ? raw.affiliateUrl
      : raw.itemUrl +
        (raw.itemUrl.includes("?") ? "&" : "?") +
        "scid=af_pc_etc&sc2id=" +
        process.env.RAKUTEN_AFFILIATE_ID,

    category: getCategory(raw.itemName),
  };
}

// 検索API（ページング対応）
async function search(appId, keyword) {
  let results = [];

  for (let page = 1; page <= 3; page++) {
    const q = new URLSearchParams({
      applicationId: appId,
      keyword: keyword,
      hits: "30",
      page: String(page),
      sort: "-reviewCount",
      format: "json",
      formatVersion: "2",
    });

    const res = await fetch(
      "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + q
    );

    if (!res.ok) {
      console.error("API ERROR:", await res.text());
      continue;
    }

    const json = await res.json();

    if (json.Items) {
      results = results.concat(json.Items);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return results;
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
    console.error("NO APP ID");
    return res.json({
      items: [],
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      isMock: true,
    });
  }

  const keywords = [
    "製菓道具",
    "お菓子作り",
    "ケーキ型",
    "チョコレート",
    "クッキングシート",
    "スイーツ"
  ];

  const seen = new Set();
  let allItems = [];

  for (const kw of keywords) {
    try {
      const raw = await search(appId, kw);

      raw.forEach(r => {
        const item = r.Item;

        if (item?.itemCode && !seen.has(item.itemCode)) {
          seen.add(item.itemCode);
          allItems.push(toItem(r));
        }
      });

    } catch (e) {
      console.error("Search error:", kw, e.message);
    }
  }

  if (allItems.length === 0) {
    console.error("NO ITEMS");
    return res.json({
      items: [],
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      isEmpty: true,
    });
  }

  // 並び替え
  allItems.sort((a, b) => {
    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }
    return b.reviewAverage - a.reviewAverage;
  });

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