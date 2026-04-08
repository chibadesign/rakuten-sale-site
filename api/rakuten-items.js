// 楽天市場 製菓道具 商品取得API
// ランキング + キーワード検索で自動更新

const CACHE_TTL = 60 * 60 * 1000;
let _cache = null;
let _cacheAt = 0;

// カテゴリ判定
function getCategory(name) {
  if (/ホームベーカリー|ハンドミキサー|スタンドミキサー|フードプロセッサー|電動ミキサー|オーブン/.test(name)) return "キッチン家電";
  if (/ケーキ型|マフィン型|タルト型|クッキー型|シリコン型|天板|パウンド型|シフォン型|プリン型|エクレア型|カヌレ型|ワッフル型|マドレーヌ型|チョコレート型/.test(name)) return "製菓型・天板";
  if (/絞り袋|口金|デコレーション|アイシング|チョコペン|トッピング|スプリンクル|食用色素|食用金箔|シュガーパール/.test(name)) return "デコレーション用品";
  if (/スケール|温度計|スパチュラ|ゴムベラ|泡立て器|ふるい|パレットナイフ|刷毛|ターンテーブル|めん棒|スクレーパー|ケーキクーラー|ガスバーナー|回転台|計量/.test(name)) return "調理・製造道具";
  if (/薄力粉|強力粉|砂糖|バター|チョコ|バニラ|ゼラチン|アーモンド|抹茶|ドライフルーツ|ナッツ|ベーキングパウダー|ここあ|練乳|ハチミツ|メープル|アガー|きな粉|粉糖|グラニュー糖|ドライイースト|ラム酒|ピスタチオ/.test(name)) return "製菓材料";
  if (/クッキングシート|オーブンシート|アルミホイル|シリコンマット|アルミカップ|グラシン紙/.test(name)) return "クッキングシート・消耗品";
  if (/ラッピング|ギフトボックス|ラッピング袋|リボン|梱包|包装|ケーキ箱|OPP袋/.test(name)) return "ラッピング・梱包";
  if (/保存容器|タッパー|密閉容器|キャニスター/.test(name)) return "保存容器";
  if (/セット|詰め合わせ|初心者セット|製菓セット/.test(name)) return "製菓用品セット";
  return "その他製菓用品";
}

// 楽天アイテムを整形
function formatItem(raw, affId) {
  const img = raw.mediumImageUrls && raw.mediumImageUrls[0]
    ? raw.mediumImageUrls[0].imageUrl.split("?")[0] + "?_ex=300x300"
    : null;
  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName || "",
    itemPrice: raw.itemPrice || 0,
    pointRate: raw.pointRate || 1,
    reviewAverage: raw.reviewAverage || 0,
    reviewCount: raw.reviewCount || 0,
    imageUrl: img,
    itemUrl: raw.affiliateUrl || raw.itemUrl || "",
    category: getCategory(raw.itemName || ""),
  };
}

// 楽天商品検索
async function searchItems(appId, affId, keyword, genreId) {
  const params = {
    applicationId: appId,
    affiliateId: affId,
    keyword: keyword,
    hits: "30",
    sort: "-reviewCount",
    format: "json",
    formatVersion: "2",
  };
  if (genreId) params.genreId = String(genreId);
  const url = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + new URLSearchParams(params);
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Search[" + keyword + "] HTTP " + res.status + ": " + txt.slice(0, 100));
  }
  const data = await res.json();
  if (data.error) throw new Error("Search[" + keyword + "] API error: " + data.error_description);
  return Array.isArray(data.Items) ? data.Items : [];
}

// 楽天ランキング
async function getRanking(appId, affId, genreId) {
  const params = {
    applicationId: appId,
    affiliateId: affId,
    genreId: String(genreId),
    format: "json",
    formatVersion: "2",
  };
  const url = "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20170628?" + new URLSearchParams(params);
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Ranking[" + genreId + "] HTTP " + res.status + ": " + txt.slice(0, 100));
  }
  const data = await res.json();
  if (data.error) throw new Error("Ranking[" + genreId + "] API error: " + data.error_description);
  return Array.isArray(data.Items) ? data.Items : [];
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// モックデータ（API未設定 or 失敗時に使用）
function getMockItems() {
  return [
    { itemCode: "mock-001", itemName: "貝印 KAI シリコン マフィン型 6個取 食洗機対応 製菓用", shopName: "貝印公式ショップ", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 1243, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-002", itemName: "WAHEI FREIZ ハンドミキサー 300W 5段階速度 製菓用", shopName: "調理器具専門店", itemPrice: 2980, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "キッチン家電" },
    { itemCode: "mock-003", itemName: "タニタ デジタルクッキングスケール 1kg 0.1g単位", shopName: "タニタ公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.7, reviewCount: 5832, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "調理・製造道具" },
    { itemCode: "mock-004", itemName: "富澤商店 製菓用薄力粉 バイオレット 1kg お菓子作り", shopName: "富澤商店", itemPrice: 398, pointRate: 10, reviewAverage: 4.6, reviewCount: 4312, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-005", itemName: "東洋アルミ クッキングシート 30cm×50枚 両面シリコン加工", shopName: "東洋アルミ公式", itemPrice: 398, pointRate: 10, reviewAverage: 4.7, reviewCount: 6721, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "クッキングシート・消耗品" },
    { itemCode: "mock-006", itemName: "貝印 タルト型 底取れ 21cm フッ素加工 製菓用", shopName: "貝印公式ショップ", itemPrice: 890, pointRate: 10, reviewAverage: 4.6, reviewCount: 2105, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-007", itemName: "OXO グッドグリップス シリコンスパチュラ 3本セット 耐熱", shopName: "OXO公式楽天店", itemPrice: 1800, pointRate: 10, reviewAverage: 4.7, reviewCount: 3421, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "調理・製造道具" },
    { itemCode: "mock-008", itemName: "Wilton 絞り袋 口金 デコレーションセット 45点", shopName: "製菓道具専門店", itemPrice: 1560, pointRate: 10, reviewAverage: 4.4, reviewCount: 654, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "デコレーション用品" },
    { itemCode: "mock-009", itemName: "HEIKO ラッピング袋 リボン付き 50枚セット ギフト用", shopName: "HEIKO楽天市場店", itemPrice: 580, pointRate: 10, reviewAverage: 4.3, reviewCount: 543, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "ラッピング・梱包" },
    { itemCode: "mock-010", itemName: "iwaki 耐熱ガラス保存容器 4点セット 電子レンジ対応", shopName: "iwaki公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.6, reviewCount: 4123, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "保存容器" },
    { itemCode: "mock-011", itemName: "富澤商店 粉糖 500g コーンスターチ不使用 アイシング用", shopName: "富澤商店", itemPrice: 380, pointRate: 10, reviewAverage: 4.5, reviewCount: 2341, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-012", itemName: "貝印 シフォンケーキ型 17cm アルミ製 熱伝導抜群", shopName: "貝印公式ショップ", itemPrice: 1080, pointRate: 10, reviewAverage: 4.6, reviewCount: 1876, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-013", itemName: "日清製粉 強力粉 カメリヤ 1kg パン作り用", shopName: "食材専門店", itemPrice: 298, pointRate: 10, reviewAverage: 4.7, reviewCount: 8921, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-014", itemName: "cotta シリコンマット 40×30cm 目盛り付き 繰り返し使える", shopName: "cotta楽天市場店", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 743, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "クッキングシート・消耗品" },
    { itemCode: "mock-015", itemName: "貝印 クッキー型 12種セット ステンレス製 製菓用", shopName: "貝印公式ショップ", itemPrice: 780, pointRate: 10, reviewAverage: 4.4, reviewCount: 987, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock-016", itemName: "富澤商店 アーモンドプードル 200g 皮なし マカロン用", shopName: "富澤商店", itemPrice: 480, pointRate: 10, reviewAverage: 4.6, reviewCount: 1567, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock-017", itemName: "TESCOMA ケーキ回転台 ターンテーブル 31cm スムーズ回転", shopName: "調理器具専門店", itemPrice: 3200, pointRate: 10, reviewAverage: 4.4, reviewCount: 532, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "調理・製造道具" },
    { itemCode: "mock-018", itemName: "パナソニック ホームベーカリー SD-MDX4 天然酵母対応", shopName: "Panasonic公式", itemPrice: 18800, pointRate: 10, reviewAverage: 4.4, reviewCount: 1987, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "キッチン家電" },
    { itemCode: "mock-019", itemName: "共立食品 食用色素 6色セット 製菓・アイシング用", shopName: "共立食品公式", itemPrice: 880, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "デコレーション用品" },
    { itemCode: "mock-020", itemName: "貝印 製菓用品 初心者セット 8点 お菓子作り入門", shopName: "貝印公式ショップ", itemPrice: 2480, pointRate: 10, reviewAverage: 4.5, reviewCount: 1543, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓用品セット" },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=3600");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();

  // キャッシュが有効ならそのまま返す
  if (_cache && (now - _cacheAt) < CACHE_TTL) {
    return res.status(200).json({
      items: _cache,
      cachedAt: _cacheAt,
      nextUpdate: _cacheAt + CACHE_TTL,
      fromCache: true,
      total: _cache.length,
    });
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const affId = process.env.RAKUTEN_AFFILIATE_ID;

  // APIキーがなければモックを返す
  if (!appId || !affId) {
    console.log("[rakuten-items] No API keys - returning mock data");
    return res.status(200).json({
      items: getMockItems(),
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      fromCache: false,
      isMock: true,
      total: getMockItems().length,
    });
  }

  console.log("[rakuten-items] Fetching from Rakuten API...");
  const items = [];
  const seen = new Set();
  const errors = [];

  function addItems(rawList) {
    let added = 0;
    for (const raw of rawList) {
      const item = raw.Item || raw; // ランキングと検索でフォーマットが異なる
      if (item && item.itemCode && !seen.has(item.itemCode)) {
        seen.add(item.itemCode);
        items.push(formatItem(item, affId));
        added++;
      }
    }
    return added;
  }

  // ① ランキング取得（製菓材料ジャンル: 216131）
  try {
    const r = await getRanking(appId, affId, 216131);
    const n = addItems(r);
    console.log("[ranking 216131] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[ranking 216131]", e.message);
  }
  await sleep(600);

  // ② ランキング取得（キッチン用品ジャンル: 100227）
  try {
    const r = await getRanking(appId, affId, 100227);
    const n = addItems(r);
    console.log("[ranking 100227] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[ranking 100227]", e.message);
  }
  await sleep(600);

  // ③ キーワード検索（製菓型）
  try {
    const r = await searchItems(appId, affId, "製菓型 お菓子 シリコン", 216131);
    const n = addItems(r);
    console.log("[search 製菓型] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[search 製菓型]", e.message);
  }
  await sleep(600);

  // ④ キーワード検索（ハンドミキサー）
  try {
    const r = await searchItems(appId, affId, "ハンドミキサー 製菓 お菓子作り", null);
    const n = addItems(r);
    console.log("[search ハンドミキサー] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[search ハンドミキサー]", e.message);
  }
  await sleep(600);

  // ⑤ キーワード検索（製菓材料）
  try {
    const r = await searchItems(appId, affId, "製菓材料 お菓子作り 人気", 216131);
    const n = addItems(r);
    console.log("[search 製菓材料] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[search 製菓材料]", e.message);
  }
  await sleep(600);

  // ⑥ キーワード検索（デコレーション）
  try {
    const r = await searchItems(appId, affId, "絞り袋 口金 デコレーション ケーキ", null);
    const n = addItems(r);
    console.log("[search デコレーション] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[search デコレーション]", e.message);
  }
  await sleep(600);

  // ⑦ キーワード検索（クッキングシート）
  try {
    const r = await searchItems(appId, affId, "クッキングシート オーブンシート 製菓", null);
    const n = addItems(r);
    console.log("[search クッキングシート] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[search クッキングシート]", e.message);
  }
  await sleep(600);

  // ⑧ キーワード検索（ラッピング）
  try {
    const r = await searchItems(appId, affId, "ラッピング お菓子 ギフト袋 製菓", null);
    const n = addItems(r);
    console.log("[search ラッピング] added:", n);
  } catch (e) {
    errors.push(e.message);
    console.error("[search ラッピング]", e.message);
  }

  console.log("[rakuten-items] Total unique items:", items.length, "Errors:", errors.length);

  // 1件も取得できなかった場合はモックを返す
  if (items.length === 0) {
    console.log("[rakuten-items] No items fetched, returning mock. Errors:", errors);
    return res.status(200).json({
      items: getMockItems(),
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      fromCache: false,
      isMock: true,
      apiErrors: errors,
      total: getMockItems().length,
    });
  }

  // キャッシュに保存
  _cache = items;
  _cacheAt = now;

  return res.status(200).json({
    items: items,
    cachedAt: now,
    nextUpdate: now + CACHE_TTL,
    fromCache: false,
    total: items.length,
  });
};
