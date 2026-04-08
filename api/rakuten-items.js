// 楽天市場 商品取得API（エラー特定デバッグ版）

const CACHE_TTL = 60 * 60 * 1000;
let cache = null;
let cacheAt = 0;

function getCategory(name) {
  const t = name || "";
  if (/ミキサー|オーブン/.test(t)) return "キッチン家電";
  if (/ケーキ型|マフィン型|タルト型/.test(t)) return "製菓型・天板";
  if (/絞り袋|口金/.test(t)) return "デコレーション用品";
  if (/スケール|泡立て器|ボウル/.test(t)) return "調理道具";
  if (/薄力粉|砂糖|チョコ/.test(t)) return "製菓材料";
  return "その他";
}

function toItem(wrapper) {
  const raw = wrapper.Item;
  const image = raw.mediumImageUrls?.[0]?.imageUrl || raw.smallImageUrls?.[0]?.imageUrl || "";
  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName,
    itemPrice: raw.itemPrice,
    pointRate: raw.pointRate || 1,
    reviewAverage: raw.reviewAverage || 0,
    reviewCount: raw.reviewCount || 0,
    imageUrl: image ? `${image.split('?')[0]}?_ex=300x300` : "",
    itemUrl: raw.affiliateUrl || raw.itemUrl,
    category: getCategory(raw.itemName),
  };
}

module.exports = async function handler(req, res) {
  const now = Date.now();
  
  // URLに ?update=1 をつけるとキャッシュを無視して最新を取得
  const forceUpdate = req.query.update === "1";
  if (!forceUpdate && cache && now - cacheAt < CACHE_TTL) {
    return res.json({ items: cache, fromCache: true });
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const affId = process.env.RAKUTEN_AFFILIATE_ID;

  // エラー特定用変数
  let debugInfo = {
    envCheck: {
      hasAppId: !!appId,
      hasAffId: !!affId,
    },
    apiResponses: []
  };

  if (!appId || !affId) {
    return res.json({
      items: [],
      error: "ENVIRONMENT_VARIABLE_MISSING",
      debug: debugInfo
    });
  }

  const keywords = ["製菓道具", "ケーキ型", "チョコレート"];
  const seen = new Set();
  let allItems = [];

  try {
    for (const kw of keywords) {
      const q = new URLSearchParams({
        applicationId: appId,
        affiliateId: affId,
        keyword: kw,
        hits: "15",
        format: "json",
        formatVersion: "2",
      });

      const apiRes = await fetch("https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + q);
      const json = await apiRes.json();

      // 各APIリクエストの結果をデバッグ用に保存
      debugInfo.apiResponses.push({
        keyword: kw,
        status: apiRes.status,
        error: json.error || null,
        error_description: json.error_description || null,
        count: json.Items ? json.Items.length : 0
      });

      if (json.Items) {
        json.Items.forEach(r => {
          if (r.Item?.itemCode && !seen.has(r.Item.itemCode)) {
            seen.add(r.Item.itemCode);
            allItems.push(toItem(r));
          }
        });
      }
    }

    if (allItems.length === 0) {
      return res.json({
        items: [],
        error: "NO_DATA_FROM_RAKUTEN",
        debug: debugInfo
      });
    }

    allItems.sort((a, b) => b.reviewCount - a.reviewCount);
    const items = allItems.slice(0, 100);

    cache = items;
    cacheAt = now;

    return res.json({ items, fromCache: false });

  } catch (err) {
    return res.json({
      items: [],
      error: "SERVER_CRASH",
      message: err.message,
      debug: debugInfo
    });
  }
};