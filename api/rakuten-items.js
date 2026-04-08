// 楽天市場 商品取得API（究極安定版）
const CACHE_TTL = 60 * 60 * 1000;
let cache = null;
let cacheAt = 0;

module.exports = async function handler(req, res) {
  // CORS設定（すべてのアクセスを許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const appId = process.env.RAKUTEN_APP_ID;
  const affId = process.env.RAKUTEN_AFFILIATE_ID;

  // 1. 環境変数のチェック
  if (!appId) return res.status(200).json({ items: [], error: "APP_IDが設定されていません" });

  const keywords = ["製菓道具", "ケーキ型", "チョコ"];
  let allItems = [];

  try {
    for (const kw of keywords) {
      const q = new URLSearchParams({
        applicationId: appId,
        affiliateId: affId || "",
        keyword: kw,
        hits: "20",
        format: "json",
        formatVersion: "2",
      });
      const apiRes = await fetch("https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + q);
      const json = await apiRes.json();
      if (json.Items) {
        json.Items.forEach(r => {
          const raw = r.Item;
          const image = raw.mediumImageUrls?.[0]?.imageUrl || raw.smallImageUrls?.[0]?.imageUrl || "";
          allItems.push({
            itemCode: raw.itemCode,
            itemName: raw.itemName,
            itemPrice: raw.itemPrice,
            imageUrl: image ? `${image.split('?')[0]}?_ex=300x300` : "",
            itemUrl: raw.affiliateUrl || raw.itemUrl,
            reviewCount: raw.reviewCount || 0,
          });
        });
      }
    }
    // 重複を消して100件返す
    const unique = Array.from(new Map(allItems.map(i => [i.itemCode, i])).values());
    return res.status(200).json({ items: unique.slice(0, 100) });
  } catch (err) {
    return res.status(500).json({ items: [], error: err.message });
  }
};