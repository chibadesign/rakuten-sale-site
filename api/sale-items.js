// 楽天市場 商品取得API（完全版）
const CACHE_TTL = 60 * 60 * 1000;
let cache = null;
let cacheAt = 0;

function toItem(rawItem) {
  const raw = rawItem;
  const image = raw.mediumImageUrls?.[0]?.imageUrl || raw.smallImageUrls?.[0]?.imageUrl || "";
  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName,
    itemPrice: raw.itemPrice,
    imageUrl: image ? `${image.split('?')[0]}?_ex=300x300` : "",
    itemUrl: raw.affiliateUrl || raw.itemUrl,
    reviewCount: raw.reviewCount || 0,
  };
}

module.exports = async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const affId = process.env.RAKUTEN_AFFILIATE_ID;

  if (!appId || !affId) {
    return res.status(500).json({ items: [], error: "Environment variables missing" });
  }

  // キャッシュ
  const now = Date.now();
  if (cache && (now - cacheAt < CACHE_TTL)) {
    return res.status(200).json({ items: cache, fromCache: true });
  }

  const keywords = ["製菓道具", "ケーキ型", "お菓子作り"];
  let allItems = [];

  try {
    for (const kw of keywords) {
      const q = new URLSearchParams({
        applicationId: appId,
        affiliateId: affId,
        keyword: kw,
        hits: "20",
        format: "json",
        formatVersion: "2",
      });

      const apiRes = await fetch("https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + q);
      const json = await apiRes.json();

      if (json.Items) {
        json.Items.forEach(r => {
          allItems.push(toItem(r.Item));
        });
      }
    }

    // 重複削除とレビュー数順ソート
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.itemCode, item])).values());
    uniqueItems.sort((a, b) => b.reviewCount - a.reviewCount);

    cache = uniqueItems.slice(0, 100);
    cacheAt = now;

    return res.status(200).json({ items: cache });

  } catch (err) {
    return res.status(500).json({ items: [], error: err.message });
  }
};