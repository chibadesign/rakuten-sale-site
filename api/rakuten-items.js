// 楽天市場 製菓道具 商品取得API v4
// 2026年新ドメイン対応: openapi.rakuten.co.jp

const CACHE_TTL = 60 * 60 * 1000;
let _cache = null;
let _cacheAt = 0;

const SITE_URL = "https://rakuten-sale-site.vercel.app";

function getCategory(name) {
  if (/ホームベーカリー|ハンドミキサー|スタンドミキサー|フードプロセッサー|電動ミキサー|オーブン/.test(name)) return "キッチン家電";
  if (/ケーキ型|マフィン型|タルト型|クッキー型|シリコン型|天板|パウンド型|シフォン型|プリン型|エクレア型|カヌレ型|ワッフル型|マドレーヌ型|チョコレート型/.test(name)) return "製菓型・天板";
  if (/絞り袋|口金|デコレーション|アイシング|チョコペン|トッピング|スプリンクル|食用色素|食用金箔|シュガーパール/.test(name)) return "デコレーション用品";
  if (/スケール|温度計|スパチュラ|ゴムベラ|泡立て器|ふるい|パレットナイフ|刷毛|ターンテーブル|めん棒|スクレーパー|ケーキクーラー|ガスバーナー|回転台|計量/.test(name)) return "調理・製造道具";
  if (/薄力粉|強力粉|砂糖|バター|チョコ|バニラ|ゼラチン|アーモンド|抹茶|ドライフルーツ|ナッツ|ベーキングパウダー|練乳|ハチミツ|メープル|アガー|きな粉|粉糖|グラニュー糖|ドライイースト|ラム酒|ピスタチオ/.test(name)) return "製菓材料";
  if (/クッキングシート|オーブンシート|アルミホイル|シリコンマット|アルミカップ|グラシン紙/.test(name)) return "クッキングシート・消耗品";
  if (/ラッピング|ギフトボックス|ラッピング袋|リボン|梱包|包装|ケーキ箱|OPP袋/.test(name)) return "ラッピング・梱包";
  if (/保存容器|タッパー|密閉容器|キャニスター/.test(name)) return "保存容器";
  if (/セット|詰め合わせ|初心者セット|製菓セット/.test(name)) return "製菓用品セット";
  return "その他製菓用品";
}

function makeAffUrl(itemUrl, affId) {
  if (!itemUrl) return "";
  return "https://hb.afl.rakuten.co.jp/ichiba/default/?pc=" + encodeURIComponent(itemUrl) + "&m=" + affId;
}

function formatItem(raw, affId) {
  const img = raw.mediumImageUrls && raw.mediumImageUrls[0]
    ? raw.mediumImageUrls[0].imageUrl.split("?")[0] + "?_ex=300x300"
    : null;
  const baseUrl = raw.itemUrl || "";
  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName || "",
    itemPrice: raw.itemPrice || 0,
    pointRate: raw.pointRate || 1,
    reviewAverage: raw.reviewAverage || 0,
    reviewCount: raw.reviewCount || 0,
    imageUrl: img,
    itemUrl: makeAffUrl(baseUrl, affId) || baseUrl,
    category: getCategory(raw.itemName || ""),
  };
}

// 新APIエンドポイント
const BASE_URL = "https://openapi.rakuten.co.jp/ichibams/api";

function makeHeaders() {
  return {
    "Origin": SITE_URL,
    "Referer": SITE_URL + "/",
    "User-Agent": "Mozilla/5.0 (compatible; BakingSaleBot/1.0)",
    "Accept": "application/json",
  };
}

async function searchItems(appId, accessKey, affId, keyword, genreId) {
  const params = {
    applicationId: appId,
    accessKey: accessKey,
    affiliateId: affId,
    keyword: keyword,
    hits: "30",
    sort: "-reviewCount",
    format: "json",
    formatVersion: "2",
    imageFlag: "1",
    availability: "1",
  };
  if (genreId) params.genreId = String(genreId);
  const url = BASE_URL + "/IchibaItem/Search/20220601?" + new URLSearchParams(params);
  const res = await fetch(url, { headers: makeHeaders() });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Search[" + keyword + "] HTTP " + res.status + ": " + txt.slice(0, 150));
  }
  const data = await res.json();
  if (data.error) throw new Error("Search[" + keyword + "] error: " + data.error_description);
  return Array.isArray(data.Items) ? data.Items : [];
}

async function getRanking(appId, accessKey, affId, genreId) {
  const params = {
    applicationId: appId,
    accessKey: accessKey,
    affiliateId: affId,
    genreId: String(genreId),
    format: "json",
    formatVersion: "2",
    imageFlag: "1",
  };
  const url = BASE_URL + "/IchibaItem/Ranking/20170628?" + new URLSearchParams(params);
  const res = await fetch(url, { headers: makeHeaders() });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Ranking[" + genreId + "] HTTP " + res.status + ": " + txt.slice(0, 150));
  }
  const data = await res.json();
  if (data.error) throw new Error("Ranking[" + genreId + "] error: " + data.error_description);
  return Array.isArray(data.Items) ? data.Items : [];
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function getMockItems() {
  return [
    { itemCode: "mock-001", itemName: "貝印 KAI シリコン マフィン型 6個取 食洗機対応", shopName: "貝印公式ショップ", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 1243, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-002", itemName: "WAHEI FREIZ ハンドミキサー 300W 5段階速度", shopName: "調理器具専門店", itemPrice: 2980, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "キッチン家電" },
    { itemCode: "mock-003", itemName: "タニタ デジタルクッキングスケール 1kg 0.1g単位", shopName: "タニタ公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.7, reviewCount: 5832, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "調理・製造道具" },
    { itemCode: "mock-004", itemName: "富澤商店 製菓用薄力粉 バイオレット 1kg", shopName: "富澤商店", itemPrice: 398, pointRate: 10, reviewAverage: 4.6, reviewCount: 4312, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-005", itemName: "東洋アルミ クッキングシート 30cm×50枚", shopName: "東洋アルミ公式", itemPrice: 398, pointRate: 10, reviewAverage: 4.7, reviewCount: 6721, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "クッキングシート・消耗品" },
    { itemCode: "mock-006", itemName: "貝印 タルト型 底取れ 21cm フッ素加工", shopName: "貝印公式ショップ", itemPrice: 890, pointRate: 10, reviewAverage: 4.6, reviewCount: 2105, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-007", itemName: "OXO グッドグリップス シリコンスパチュラ 3本セット", shopName: "OXO公式楽天店", itemPrice: 1800, pointRate: 10, reviewAverage: 4.7, reviewCount: 3421, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "調理・製造道具" },
    { itemCode: "mock-008", itemName: "Wilton 絞り袋 口金 デコレーションセット 45点", shopName: "製菓道具専門店", itemPrice: 1560, pointRate: 10, reviewAverage: 4.4, reviewCount: 654, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "デコレーション用品" },
    { itemCode: "mock-009", itemName: "HEIKO ラッピング袋 リボン付き 50枚セット", shopName: "HEIKO楽天市場店", itemPrice: 580, pointRate: 10, reviewAverage: 4.3, reviewCount: 543, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "ラッピング・梱包" },
    { itemCode: "mock-010", itemName: "iwaki 耐熱ガラス保存容器 4点セット", shopName: "iwaki公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.6, reviewCount: 4123, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "保存容器" },
    { itemCode: "mock-011", itemName: "富澤商店 粉糖 500g コーンスターチ不使用", shopName: "富澤商店", itemPrice: 380, pointRate: 10, reviewAverage: 4.5, reviewCount: 2341, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-012", itemName: "貝印 シフォンケーキ型 17cm アルミ製", shopName: "貝印公式ショップ", itemPrice: 1080, pointRate: 10, reviewAverage: 4.6, reviewCount: 1876, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-013", itemName: "日清製粉 強力粉 カメリヤ 1kg", shopName: "食材専門店", itemPrice: 298, pointRate: 10, reviewAverage: 4.7, reviewCount: 8921, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-014", itemName: "cotta シリコンマット 40×30cm 目盛り付き", shopName: "cotta楽天市場店", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 743, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "クッキングシート・消耗品" },
    { itemCode: "mock-015", itemName: "貝印 クッキー型 12種セット ステンレス製", shopName: "貝印公式ショップ", itemPrice: 780, pointRate: 10, reviewAverage: 4.4, reviewCount: 987, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-016", itemName: "富澤商店 アーモンドプードル 200g マカロン用", shopName: "富澤商店", itemPrice: 480, pointRate: 10, reviewAverage: 4.6, reviewCount: 1567, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-017", itemName: "TESCOMA ターンテーブル 31cm スムーズ回転", shopName: "調理器具専門店", itemPrice: 3200, pointRate: 10, reviewAverage: 4.4, reviewCount: 532, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "調理・製造道具" },
    { itemCode: "mock-018", itemName: "パナソニック ホームベーカリー SD-MDX4", shopName: "Panasonic公式", itemPrice: 18800, pointRate: 10, reviewAverage: 4.4, reviewCount: 1987, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "キッチン家電" },
    { itemCode: "mock-019", itemName: "共立食品 食用色素 6色セット", shopName: "共立食品公式", itemPrice: 880, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "デコレーション用品" },
    { itemCode: "mock-020", itemName: "貝印 製菓用品 初心者セット 8点", shopName: "貝印公式ショップ", itemPrice: 2480, pointRate: 10, reviewAverage: 4.5, reviewCount: 1543, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓用品セット" },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=3600");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();
  if (_cache && (now - _cacheAt) < CACHE_TTL) {
    return res.status(200).json({ items: _cache, cachedAt: _cacheAt, nextUpdate: _cacheAt + CACHE_TTL, fromCache: true, total: _cache.length });
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const affId = process.env.RAKUTEN_AFFILIATE_ID || "237f988f.e7462562.237f9890.afa75716";

  if (!appId || !accessKey) {
    console.log("[rakuten-items] Missing credentials - returning mock");
    return res.status(200).json({ items: getMockItems(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true, total: getMockItems().length });
  }

  console.log("[rakuten-items] Starting fetch with new API domain...");
  const items = [];
  const seen = new Set();

  function addItems(rawList) {
    let n = 0;
    for (const raw of rawList) {
      const item = raw.Item || raw;
      if (item && item.itemCode && !seen.has(item.itemCode)) {
        seen.add(item.itemCode);
        items.push(formatItem(item, affId));
        n++;
      }
    }
    return n;
  }

  const tasks = [
    { type: "ranking", genreId: 216131 },
    { type: "ranking", genreId: 100227 },
    { type: "search", kw: "製菓型 シリコン お菓子", genre: 216131 },
    { type: "search", kw: "ハンドミキサー 製菓 お菓子作り", genre: null },
    { type: "search", kw: "製菓材料 お菓子 人気", genre: 216131 },
    { type: "search", kw: "デコレーション 絞り袋 口金 ケーキ", genre: null },
    { type: "search", kw: "クッキングシート オーブンシート", genre: null },
    { type: "search", kw: "ラッピング お菓子 ギフト袋", genre: null },
    { type: "search", kw: "製菓道具 初心者 セット", genre: null },
    { type: "search", kw: "チョコレート 製菓用 クーベルチュール", genre: 216131 },
    { type: "search", kw: "薄力粉 強力粉 製菓", genre: 216131 },
    { type: "search", kw: "タルト型 ケーキ型 製菓", genre: null },
  ];

  const errors = [];
  for (const task of tasks) {
    try {
      let rawList;
      if (task.type === "ranking") {
        rawList = await getRanking(appId, accessKey, affId, task.genreId);
      } else {
        rawList = await searchItems(appId, accessKey, affId, task.kw, task.genre);
      }
      const n = addItems(rawList);
      console.log("[" + (task.genreId || task.kw) + "] +" + n + " (total: " + items.length + ")");
    } catch (e) {
      errors.push(e.message);
      console.error("[error] " + e.message);
    }
    await sleep(700);
  }

  console.log("[done] total: " + items.length + " errors: " + errors.length);

  if (items.length === 0) {
    return res.status(200).json({ items: getMockItems(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true, apiErrors: errors, total: getMockItems().length });
  }

  _cache = items;
  _cacheAt = now;
  return res.status(200).json({ items: items, cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, total: items.length });
};
