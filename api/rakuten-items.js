const CACHE_TTL = 60 * 60 * 1000;
let memoryCache = null;
let memoryCacheAt = 0;

function detectCategory(title) {
  const t = title.toLowerCase();
  if (/(ホームベーカリー|ハンドミキサー|スタンドミキサー|フードプロセッサー|電動ミキサー|オーブン)/.test(t)) return "キッチン家電";
  if (/(ケーキ型|マフィン型|タルト型|クッキー型|シリコン型|天板|焼き型|パウンド型|シフォン型|プリン型|エクレア型|カヌレ型|ワッフル型|マドレーヌ型)/.test(t)) return "製菓型・天板";
  if (/(絞り袋|口金|デコレーション|アイシング|チョコペン|トッピング|スプリンクル|食用色素|食用金箔|シュガーパール|モンブラン口金)/.test(t)) return "デコレーション用品";
  if (/(スケール|温度計|スパチュラ|ゴムベラ|泡立て器|ふるい|パレットナイフ|刷毛|ターンテーブル|めん棒|スクレーパー|ケーキクーラー|ガスバーナー|回転台|計量カップ|計量スプーン)/.test(t)) return "調理・製造道具";
  if (/(薄力粉|強力粉|砂糖|バター|チョコ|バニラ|ゼラチン|アーモンド|抹茶|ドライフルーツ|ナッツ|ベーキングパウダー|ここあ|ここアパウダー|練乳|ハチミツ|メープルシロップ|アガー|きな粉|粉糖|グラニュー糖|ドライイースト|ラム酒|ピスタチオ)/.test(t)) return "製菓材料";
  if (/(クッキングシート|オーブンシート|アルミホイル|シリコンマット|アルミカップ|グラシン紙)/.test(t)) return "クッキングシート・消耗品";
  if (/(ラッピング|ギフトボックス|ラッピング袋|リボン|梱包|包装|ケーキ箱)/.test(t)) return "ラッピング・梱包";
  if (/(保存容器|タッパー|密閉容器|キャニスター)/.test(t)) return "保存容器";
  if (/(セット|詰め合わせ|初心者セット|製菓セット)/.test(t)) return "製菓用品セット";
  return "その他製菓用品";
}

function formatItem(item, affiliateId) {
  const url = item.affiliateUrl || item.itemUrl;
  return {
    itemCode: item.itemCode,
    itemName: item.itemName,
    shopName: item.shopName,
    itemPrice: item.itemPrice,
    pointRate: item.pointRate || 1,
    reviewAverage: item.reviewAverage || 0,
    reviewCount: item.reviewCount || 0,
    imageUrl: item.mediumImageUrls && item.mediumImageUrls[0]
      ? item.mediumImageUrls[0].imageUrl.replace("?_ex=128x128", "?_ex=300x300")
      : null,
    itemUrl: url,
    category: detectCategory(item.itemName),
    discountRate: null,
    originalPrice: null,
  };
}

async function fetchRanking(appId, affiliateId, genreId) {
  const params = new URLSearchParams({
    applicationId: appId,
    affiliateId: affiliateId,
    genreId: genreId,
    format: "json",
    formatVersion: "2",
  });
  const res = await fetch(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20170628?" + params.toString(),
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) throw new Error("Ranking " + genreId + " failed: " + res.status);
  return res.json();
}

async function fetchSearch(appId, affiliateId, keyword, genreId) {
  const params = new URLSearchParams({
    applicationId: appId,
    affiliateId: affiliateId,
    keyword: keyword,
    hits: "30",
    sort: "-reviewCount",
    format: "json",
    formatVersion: "2",
  });
  if (genreId) params.set("genreId", genreId);
  const res = await fetch(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + params.toString(),
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) throw new Error("Search failed: " + res.status);
  return res.json();
}

function getMockItems() {
  return [
    { itemCode: "M001", itemName: "貝印 KAI シリコン マフィン型 6個取 製菓用 食洗機対応", shopName: "貝印公式ショップ", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 1243, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/m001/", category: "製菓型・天板", discountRate: 35, originalPrice: 1500 },
    { itemCode: "M002", itemName: "WAHEI FREIZ ハンドミキサー 300W 5段階速度調節", shopName: "調理器具専門店", itemPrice: 2980, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cooking/m002/", category: "キッチン家電", discountRate: 34, originalPrice: 4500 },
    { itemCode: "M003", itemName: "貝印 タルト型 底取れ 21cm フッ素加工", shopName: "貝印公式ショップ", itemPrice: 890, pointRate: 10, reviewAverage: 4.6, reviewCount: 2105, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/m003/", category: "製菓型・天板", discountRate: 32, originalPrice: 1300 },
    { itemCode: "M004", itemName: "タニタ デジタルクッキングスケール KD-321 1kg 0.1g単位", shopName: "タニタ公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.7, reviewCount: 5832, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tanita/m005/", category: "調理・製造道具", discountRate: 22, originalPrice: 3200 },
    { itemCode: "M005", itemName: "富澤商店 製菓用薄力粉 バイオレット 1kg", shopName: "富澤商店", itemPrice: 398, pointRate: 10, reviewAverage: 4.6, reviewCount: 4312, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/m006/", category: "製菓材料", discountRate: 28, originalPrice: 550 },
    { itemCode: "M006", itemName: "パナソニック ホームベーカリー SD-MDX4 天然酵母対応", shopName: "Panasonic公式", itemPrice: 18800, pointRate: 10, reviewAverage: 4.4, reviewCount: 1987, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/panasonic/m007/", category: "キッチン家電", discountRate: 25, originalPrice: 25000 },
    { itemCode: "M007", itemName: "東洋アルミ クッキングシート 30cm×50枚 両面シリコン加工", shopName: "東洋アルミ公式", itemPrice: 398, pointRate: 10, reviewAverage: 4.7, reviewCount: 6721, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/toyo-aluminium/m008/", category: "クッキングシート・消耗品", discountRate: 31, originalPrice: 580 },
    { itemCode: "M008", itemName: "OXO グッドグリップス シリコンスパチュラ 3本セット", shopName: "OXO公式楽天店", itemPrice: 1800, pointRate: 10, reviewAverage: 4.7, reviewCount: 3421, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/oxo/m009/", category: "調理・製造道具", discountRate: 28, originalPrice: 2500 },
    { itemCode: "M009", itemName: "HEIKO ラッピング袋 リボン付き 50枚セット ギフト用", shopName: "HEIKO楽天市場店", itemPrice: 580, pointRate: 10, reviewAverage: 4.3, reviewCount: 543, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/heiko/m010/", category: "ラッピング・梱包", discountRate: 29, originalPrice: 820 },
    { itemCode: "M010", itemName: "富澤商店 粉糖 500g コーンスターチ不使用 アイシング用", shopName: "富澤商店", itemPrice: 380, pointRate: 10, reviewAverage: 4.5, reviewCount: 2341, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/m011/", category: "製菓材料", discountRate: 27, originalPrice: 520 },
    { itemCode: "M011", itemName: "iwaki 耐熱ガラス保存容器 4点セット 電子レンジ対応", shopName: "iwaki公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.6, reviewCount: 4123, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/iwaki/m012/", category: "保存容器", discountRate: 29, originalPrice: 3500 },
    { itemCode: "M012", itemName: "貝印 シフォンケーキ型 17cm アルミ製", shopName: "貝印公式ショップ", itemPrice: 1080, pointRate: 10, reviewAverage: 4.6, reviewCount: 1876, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/m013/", category: "製菓型・天板", discountRate: 33, originalPrice: 1600 },
    { itemCode: "M013", itemName: "日清製粉 強力粉 カメリヤ 1kg パン作り用", shopName: "食材専門店", itemPrice: 298, pointRate: 10, reviewAverage: 4.7, reviewCount: 8921, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/food/m014/", category: "製菓材料", discountRate: 29, originalPrice: 420 },
    { itemCode: "M014", itemName: "cotta シリコンマット 40×30cm 目盛り付き", shopName: "cotta楽天市場店", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 743, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cotta/m015/", category: "クッキングシート・消耗品", discountRate: 30, originalPrice: 1400 },
    { itemCode: "M015", itemName: "貝印 クッキー型 12種セット ステンレス製", shopName: "貝印公式ショップ", itemPrice: 780, pointRate: 10, reviewAverage: 4.4, reviewCount: 987, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/m016/", category: "製菓型・天板", discountRate: 35, originalPrice: 1200 },
    { itemCode: "M016", itemName: "富澤商店 アーモンドプードル 200g マカロン用", shopName: "富澤商店", itemPrice: 480, pointRate: 10, reviewAverage: 4.6, reviewCount: 1567, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/m017/", category: "製菓材料", discountRate: 29, originalPrice: 680 },
    { itemCode: "M017", itemName: "Wilton 絞り袋 口金 デコレーションセット 45点", shopName: "お菓子材料店", itemPrice: 1560, pointRate: 10, reviewAverage: 4.4, reviewCount: 654, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/sweets/m004/", category: "デコレーション用品", discountRate: 29, originalPrice: 2200 },
    { itemCode: "M018", itemName: "TESCOMA ケーキ回転台 31cm スムーズ回転", shopName: "調理器具専門店", itemPrice: 3200, pointRate: 10, reviewAverage: 4.4, reviewCount: 532, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cooking/m018/", category: "調理・製造道具", discountRate: 29, originalPrice: 4500 },
    { itemCode: "M019", itemName: "貝印 製菓用品 初心者セット 8点 お菓子作り入門", shopName: "貝印公式ショップ", itemPrice: 2480, pointRate: 10, reviewAverage: 4.5, reviewCount: 1543, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/m019/", category: "製菓用品セット", discountRate: 29, originalPrice: 3500 },
    { itemCode: "M020", itemName: "共立食品 食用色素 6色セット 製菓アイシング用", shopName: "共立食品公式", itemPrice: 880, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kyoritsu/m020/", category: "デコレーション用品", discountRate: 31, originalPrice: 1280 },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();

  if (memoryCache && now - memoryCacheAt < CACHE_TTL) {
    return res.json({ items: memoryCache, cachedAt: memoryCacheAt, nextUpdate: memoryCacheAt + CACHE_TTL, fromCache: true });
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  if (!appId || !affiliateId) {
    return res.json({ items: getMockItems(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true });
  }

  const allItems = [];
  const seen = new Set();

  function addItems(rawItems) {
    for (const item of rawItems) {
      if (!seen.has(item.itemCode)) {
        seen.add(item.itemCode);
        allItems.push(formatItem(item, affiliateId));
      }
    }
  }

  const tasks = [
    { type: "ranking", genreId: "216131", label: "製菓材料ランキング" },
    { type: "ranking", genreId: "100227", label: "キッチン用品ランキング" },
    { type: "search", keyword: "製菓型 シリコン お菓子", genreId: "216131", label: "製菓型検索" },
    { type: "search", keyword: "ハンドミキサー 製菓 お菓子作り", genreId: null, label: "ハンドミキサー検索" },
    { type: "search", keyword: "製菓材料 お菓子作り 人気", genreId: "216131", label: "製菓材料検索" },
    { type: "search", keyword: "絞り袋 口金 デコレーション 製菓", genreId: null, label: "デコレーション検索" },
    { type: "search", keyword: "クッキングシート 製菓 オーブン", genreId: null, label: "クッキングシート検索" },
    { type: "search", keyword: "ラッピング お菓子 ギフト袋", genreId: null, label: "ラッピング検索" },
    { type: "search", keyword: "製菓道具 セット 初心者", genreId: null, label: "セット検索" },
  ];

  for (const task of tasks) {
    try {
      let data;
      if (task.type === "ranking") {
        data = await fetchRanking(appId, affiliateId, task.genreId);
        if (data && data.Items) addItems(data.Items);
      } else {
        data = await fetchSearch(appId, affiliateId, task.keyword, task.genreId);
        if (data && data.Items) addItems(data.Items);
      }
      await new Promise(function(r) { setTimeout(r, 600); });
    } catch (e) {
      console.error(task.label + " error:", e.message);
    }
  }

  if (allItems.length === 0) {
    return res.json({ items: getMockItems(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true });
  }

  memoryCache = allItems;
  memoryCacheAt = now;

  return res.json({ items: allItems, cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false });
};
