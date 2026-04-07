// 楽天市場 商品取得API
// ランキング + キーワード検索で自動更新

const CACHE_TTL = 60 * 60 * 1000; // 1時間キャッシュ
let cache = null;
let cacheAt = 0;

// カテゴリ自動判定
function getCategory(name) {
  const t = name;
  if (/ホームベーカリー|ハンドミキサー|スタンドミキサー|フードプロセッサー|電動ミキサー|オーブン|トースター/.test(t)) return "キッチン家電";
  if (/ケーキ型|マフィン型|タルト型|クッキー型|シリコン型|天板|パウンド型|シフォン型|プリン型|エクレア型|カヌレ型|ワッフル型|マドレーヌ型|チョコレート型/.test(t)) return "製菓型・天板";
  if (/絞り袋|口金|デコレーション|アイシング|チョコペン|トッピング|スプリンクル|食用色素|食用金箔|シュガーパール/.test(t)) return "デコレーション用品";
  if (/スケール|温度計|スパチュラ|ゴムベラ|泡立て器|ふるい|パレットナイフ|刷毛|ターンテーブル|めん棒|スクレーパー|ケーキクーラー|ガスバーナー|回転台|計量カップ|計量スプーン|ボウル/.test(t)) return "調理・製造道具";
  if (/薄力粉|強力粉|砂糖|バター|チョコ|バニラ|ゼラチン|アーモンド|抹茶|ドライフルーツ|ナッツ|ベーキングパウダー|ここあ|練乳|ハチミツ|メープル|アガー|きな粉|粉糖|グラニュー糖|ドライイースト|ラム酒|ピスタチオ|ドライイチゴ|ブルーベリー|ラズベリー/.test(t)) return "製菓材料";
  if (/クッキングシート|オーブンシート|アルミホイル|シリコンマット|アルミカップ|グラシン紙|ベーキングシート/.test(t)) return "クッキングシート・消耗品";
  if (/ラッピング|ギフトボックス|ラッピング袋|リボン|梱包|包装|ケーキ箱|マフィン箱|OPP袋|セロファン/.test(t)) return "ラッピング・梱包";
  if (/保存容器|タッパー|密閉容器|キャニスター|ガラス保存/.test(t)) return "保存容器";
  if (/セット|詰め合わせ|初心者セット|製菓セット|まとめ/.test(t)) return "製菓用品セット";
  return "その他製菓用品";
}

// 楽天アイテムを共通形式に変換
function toItem(raw) {
  return {
    itemCode: raw.itemCode,
    itemName: raw.itemName,
    shopName: raw.shopName,
    itemPrice: raw.itemPrice,
    pointRate: raw.pointRate || 1,
    reviewAverage: raw.reviewAverage || 0,
    reviewCount: raw.reviewCount || 0,
    imageUrl: raw.mediumImageUrls && raw.mediumImageUrls[0]
      ? raw.mediumImageUrls[0].imageUrl.replace("?_ex=128x128", "?_ex=300x300")
      : null,
    itemUrl: raw.affiliateUrl || raw.itemUrl,
    category: getCategory(raw.itemName),
  };
}

// 楽天ランキングAPI
async function getRanking(appId, affId, genreId) {
  const q = new URLSearchParams({
    applicationId: appId,
    affiliateId: affId,
    genreId: String(genreId),
    format: "json",
    formatVersion: "2",
  });
  const r = await fetch(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20170628?" + q,
    { headers: { "Accept": "application/json" } }
  );
  if (!r.ok) throw new Error("Ranking " + genreId + " => HTTP " + r.status);
  const d = await r.json();
  return Array.isArray(d.Items) ? d.Items : [];
}

// 楽天商品検索API
async function search(appId, affId, keyword, genreId) {
  const q = new URLSearchParams({
    applicationId: appId,
    affiliateId: affId,
    keyword: keyword,
    hits: "30",
    sort: "-reviewCount",
    postageFlag: "1",
    format: "json",
    formatVersion: "2",
  });
  if (genreId) q.set("genreId", String(genreId));
  const r = await fetch(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + q,
    { headers: { "Accept": "application/json" } }
  );
  if (!r.ok) throw new Error("Search [" + keyword + "] => HTTP " + r.status);
  const d = await r.json();
  return Array.isArray(d.Items) ? d.Items : [];
}

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

// モックデータ（API失敗時の保険）
function getMock() {
  return [
    { itemCode: "mock001", itemName: "貝印 シリコン マフィン型 6個取 製菓用", shopName: "貝印公式", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 1243, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock002", itemName: "タニタ デジタルクッキングスケール 0.1g単位", shopName: "タニタ公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.7, reviewCount: 5832, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "調理・製造道具" },
    { itemCode: "mock003", itemName: "富澤商店 製菓用薄力粉 バイオレット 1kg", shopName: "富澤商店", itemPrice: 398, pointRate: 10, reviewAverage: 4.6, reviewCount: 4312, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓材料" },
    { itemCode: "mock004", itemName: "東洋アルミ クッキングシート 50枚 両面加工", shopName: "東洋アルミ公式", itemPrice: 398, pointRate: 10, reviewAverage: 4.7, reviewCount: 6721, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "クッキングシート・消耗品" },
    { itemCode: "mock005", itemName: "WAHEI FREIZ ハンドミキサー 300W", shopName: "調理器具専門店", itemPrice: 2980, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "キッチン家電" },
    { itemCode: "mock006", itemName: "Wilton 絞り袋 口金 デコレーションセット 45点", shopName: "製菓道具店", itemPrice: 1560, pointRate: 10, reviewAverage: 4.4, reviewCount: 654, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "デコレーション用品" },
    { itemCode: "mock007", itemName: "HEIKO ラッピング袋 リボン付き 50枚", shopName: "HEIKO公式", itemPrice: 580, pointRate: 10, reviewAverage: 4.3, reviewCount: 543, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "ラッピング・梱包" },
    { itemCode: "mock008", itemName: "iwaki 耐熱ガラス保存容器 4点セット", shopName: "iwaki公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.6, reviewCount: 4123, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "保存容器" },
    { itemCode: "mock009", itemName: "貝印 タルト型 底取れ 21cm", shopName: "貝印公式", itemPrice: 890, pointRate: 10, reviewAverage: 4.6, reviewCount: 2105, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓型・天板" },
    { itemCode: "mock010", itemName: "cotta 製菓用品 初心者セット 8点", shopName: "cotta楽天市場店", itemPrice: 2480, pointRate: 10, reviewAverage: 4.5, reviewCount: 1543, imageUrl: null, itemUrl: "https://www.rakuten.co.jp/", category: "製菓用品セット" },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();

  // キャッシュが有効ならそのまま返す
  if (cache && now - cacheAt < CACHE_TTL) {
    return res.json({ items: cache, cachedAt: cacheAt, nextUpdate: cacheAt + CACHE_TTL, fromCache: true });
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const affId = process.env.RAKUTEN_AFFILIATE_ID;

  // 環境変数がなければモックを返す
  if (!appId || !affId) {
    console.log("No API keys found, returning mock data");
    return res.json({ items: getMock(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true });
  }

  const items = [];
  const seen = new Set();

  function add(rawList) {
    for (const raw of rawList) {
      if (raw && raw.itemCode && !seen.has(raw.itemCode)) {
        seen.add(raw.itemCode);
        items.push(toItem(raw));
      }
    }
  }

  // ランキング取得（製菓材料ジャンル: 216131）
  try {
    const r = await getRanking(appId, affId, 216131);
    add(r);
    console.log("Ranking 216131: " + r.length + " items");
  } catch (e) { console.error("Ranking 216131 error:", e.message); }
  await sleep(500);

  // ランキング取得（キッチン用品ジャンル: 100227）
  try {
    const r = await getRanking(appId, affId, 100227);
    add(r);
    console.log("Ranking 100227: " + r.length + " items");
  } catch (e) { console.error("Ranking 100227 error:", e.message); }
  await sleep(500);

  // キーワード検索
  const searches = [
    { kw: "製菓型 シリコン", genre: 216131 },
    { kw: "ハンドミキサー 製菓", genre: null },
    { kw: "薄力粉 製菓用", genre: 216131 },
    { kw: "デコレーション 絞り袋 口金", genre: null },
    { kw: "クッキングシート オーブン用", genre: null },
    { kw: "お菓子 ラッピング袋", genre: null },
    { kw: "製菓道具 初心者セット", genre: null },
    { kw: "チョコレート 製菓用", genre: 216131 },
  ];

  for (const s of searches) {
    try {
      const r = await search(appId, affId, s.kw, s.genre);
      add(r);
      console.log("Search [" + s.kw + "]: " + r.length + " items");
    } catch (e) { console.error("Search [" + s.kw + "] error:", e.message); }
    await sleep(500);
  }

  console.log("Total unique items:", items.length);

  // 取得できなかったらモックを返す
  if (items.length === 0) {
    console.log("No items from API, returning mock");
    return res.json({ items: getMock(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true });
  }

  cache = items;
  cacheAt = now;

  return res.json({ items: items, cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false });
};
