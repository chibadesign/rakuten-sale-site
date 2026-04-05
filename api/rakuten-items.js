const CACHE_TTL = 60 * 60 * 1000;
let memoryCache = null;
let memoryCacheAt = 0;

const APPLICATION_ID = process.env.RAKUTEN_APP_ID;
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID;

function detectCategory(title, genreName) {
  const text = (title + " " + (genreName || "")).toLowerCase();
  if (/(ホームベーカリー|ハンドミキサー|スタンドミキサー|フードプロセッサー|電動|オーブン)/.test(text)) return "キッチン家電";
  if (/(ケーキ型|マフィン型|タルト型|クッキー型|シリコン型|天板|焼き型|パウンド型|シフォン型)/.test(text)) return "製菓型・天板";
  if (/(絞り袋|口金|デコレーション|アイシング|チョコペン|トッピング|スプリンクル)/.test(text)) return "デコレーション用品";
  if (/(スケール|温度計|スパチュラ|ゴムベラ|泡立て|ふるい|パレット|刷毛|ターンテーブル|めん棒)/.test(text)) return "調理・製造道具";
  if (/(薄力粉|強力粉|砂糖|バター|チョコ|バニラ|ゼラチン|アーモンド|抹茶|ドライフルーツ|ナッツ|ベーキングパウダー)/.test(text)) return "製菓材料";
  if (/(クッキングシート|オーブンシート|アルミホイル|シリコンマット)/.test(text)) return "クッキングシート・消耗品";
  if (/(ラッピング|ギフトボックス|袋|リボン|梱包|包装|箱)/.test(text)) return "ラッピング・梱包";
  if (/(保存容器|タッパー|密閉|キャニスター)/.test(text)) return "保存容器";
  if (/(セット|詰め合わせ|まとめ買い)/.test(text)) return "製菓用品セット";
  return "その他製菓用品";
}

async function fetchRakutenItems(keyword) {
  const params = new URLSearchParams({
    applicationId: APPLICATION_ID,
    affiliateId: AFFILIATE_ID,
    keyword: keyword,
    genreId: "216131",
    hits: "30",
    sort: "-reviewCount",
    minPrice: "100",
    postageFlag: "1",
    format: "json",
  });

  const url = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + params.toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error("Rakuten API error: " + res.status);
  return res.json();
}

function getMockItems() {
  return [
    { itemCode: "R001", itemName: "貝印 KAI シリコン マフィン型 6個取 製菓用", shopName: "貝印公式ショップ", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 1243, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/r001/", category: "製菓型・天板", discountRate: 35, originalPrice: 1500 },
    { itemCode: "R002", itemName: "WAHEI FREIZ ハンドミキサー 300W 5段階速度", shopName: "調理器具専門店", itemPrice: 2980, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cooking/r002/", category: "キッチン家電", discountRate: 34, originalPrice: 4500 },
    { itemCode: "R003", itemName: "貝印 タルト型 底取 21cm フッ素加工", shopName: "貝印公式ショップ", itemPrice: 890, pointRate: 10, reviewAverage: 4.6, reviewCount: 2105, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/r003/", category: "製菓型・天板", discountRate: 32, originalPrice: 1300 },
    { itemCode: "R004", itemName: "Wilton 絞り袋 口金 デコレーションセット 45点", shopName: "お菓子材料店", itemPrice: 1560, pointRate: 10, reviewAverage: 4.4, reviewCount: 654, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/sweets/r004/", category: "デコレーション用品", discountRate: 29, originalPrice: 2200 },
    { itemCode: "R005", itemName: "タニタ デジタルクッキングスケール 1kg 0.1g単位", shopName: "タニタ公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.7, reviewCount: 5832, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tanita/r005/", category: "調理・製造道具", discountRate: 22, originalPrice: 3200 },
    { itemCode: "R006", itemName: "富澤商店 製菓用薄力粉 バイオレット 1kg", shopName: "富澤商店", itemPrice: 398, pointRate: 10, reviewAverage: 4.6, reviewCount: 4312, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/r006/", category: "製菓材料", discountRate: 28, originalPrice: 550 },
    { itemCode: "R007", itemName: "パナソニック ホームベーカリー SD-MDX4 天然酵母対応", shopName: "Panasonic公式", itemPrice: 18800, pointRate: 10, reviewAverage: 4.4, reviewCount: 1987, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/panasonic/r007/", category: "キッチン家電", discountRate: 25, originalPrice: 25000 },
    { itemCode: "R008", itemName: "クオカ 製菓用クーベルチュールチョコレート 500g", shopName: "cotta楽天市場店", itemPrice: 1280, pointRate: 10, reviewAverage: 4.5, reviewCount: 789, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cotta/r008/", category: "製菓材料", discountRate: 29, originalPrice: 1800 },
    { itemCode: "R009", itemName: "東洋アルミ クッキングシート 30cm×50枚 両面加工", shopName: "東洋アルミ公式", itemPrice: 398, pointRate: 10, reviewAverage: 4.7, reviewCount: 6721, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/toyo-aluminium/r009/", category: "クッキングシート・消耗品", discountRate: 31, originalPrice: 580 },
    { itemCode: "R010", itemName: "HEIKO ラッピング袋 リボン付き 50枚セット お菓子用", shopName: "HEIKO楽天市場店", itemPrice: 580, pointRate: 10, reviewAverage: 4.3, reviewCount: 543, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/heiko/r010/", category: "ラッピング・梱包", discountRate: 29, originalPrice: 820 },
    { itemCode: "R011", itemName: "OXO グッドグリップス シリコンスパチュラ 3本セット", shopName: "OXO公式楽天店", itemPrice: 1800, pointRate: 10, reviewAverage: 4.7, reviewCount: 3421, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/oxo/r011/", category: "調理・製造道具", discountRate: 28, originalPrice: 2500 },
    { itemCode: "R012", itemName: "iwaki 耐熱ガラス保存容器 4点セット 電子レンジ対応", shopName: "iwaki公式", itemPrice: 2480, pointRate: 10, reviewAverage: 4.6, reviewCount: 4123, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/iwaki/r012/", category: "保存容器", discountRate: 29, originalPrice: 3500 },
    { itemCode: "R013", itemName: "富澤商店 粉糖 500g コーンスターチ不使用 アイシング用", shopName: "富澤商店", itemPrice: 380, pointRate: 10, reviewAverage: 4.5, reviewCount: 2341, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/r013/", category: "製菓材料", discountRate: 27, originalPrice: 520 },
    { itemCode: "R014", itemName: "貝印 シフォンケーキ型 17cm アルミ製 DL-6195", shopName: "貝印公式ショップ", itemPrice: 1080, pointRate: 10, reviewAverage: 4.6, reviewCount: 1876, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/r014/", category: "製菓型・天板", discountRate: 33, originalPrice: 1600 },
    { itemCode: "R015", itemName: "共立食品 食用色素 6色セット 製菓用", shopName: "共立食品公式", itemPrice: 880, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kyoritsu/r015/", category: "デコレーション用品", discountRate: 31, originalPrice: 1280 },
    { itemCode: "R016", itemName: "cotta シリコンマット 40×30cm 目盛り付き", shopName: "cotta楽天市場店", itemPrice: 980, pointRate: 10, reviewAverage: 4.5, reviewCount: 743, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cotta/r016/", category: "クッキングシート・消耗品", discountRate: 30, originalPrice: 1400 },
    { itemCode: "R017", itemName: "貝印 クッキー型 12種セット ステンレス DL-6260", shopName: "貝印公式ショップ", itemPrice: 780, pointRate: 10, reviewAverage: 4.4, reviewCount: 987, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/r017/", category: "製菓型・天板", discountRate: 35, originalPrice: 1200 },
    { itemCode: "R018", itemName: "富澤商店 アーモンドプードル 200g 皮なし マカロン用", shopName: "富澤商店", itemPrice: 480, pointRate: 10, reviewAverage: 4.6, reviewCount: 1567, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/r018/", category: "製菓材料", discountRate: 29, originalPrice: 680 },
    { itemCode: "R019", itemName: "TESCOMA ケーキ回転台 ターンテーブル 31cm", shopName: "調理器具専門店", itemPrice: 3200, pointRate: 10, reviewAverage: 4.4, reviewCount: 532, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cooking/r019/", category: "調理・製造道具", discountRate: 29, originalPrice: 4500 },
    { itemCode: "R020", itemName: "貝印 製菓用品 初心者セット 8点 DL-6100", shopName: "貝印公式ショップ", itemPrice: 2480, pointRate: 10, reviewAverage: 4.5, reviewCount: 1543, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/r020/", category: "製菓用品セット", discountRate: 29, originalPrice: 3500 },
    { itemCode: "R021", itemName: "日清製粉 強力粉 カメリヤ 1kg パン作り用", shopName: "食材専門店", itemPrice: 298, pointRate: 10, reviewAverage: 4.7, reviewCount: 8921, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/food/r021/", category: "製菓材料", discountRate: 29, originalPrice: 420 },
    { itemCode: "R022", itemName: "赤サフ ドライイースト 125g プロ仕様", shopName: "製パン材料専門店", itemPrice: 580, pointRate: 10, reviewAverage: 4.8, reviewCount: 5432, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/bread/r022/", category: "製菓材料", discountRate: 29, originalPrice: 820 },
    { itemCode: "R023", itemName: "Wilton ケーキスタンド 回転台 30cm デコレーション用", shopName: "製菓道具専門店", itemPrice: 3200, pointRate: 10, reviewAverage: 4.6, reviewCount: 987, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/sweets/r023/", category: "調理・製造道具", discountRate: 29, originalPrice: 4500 },
    { itemCode: "R024", itemName: "貝印 パレットナイフ L字型 20cm ステンレス", shopName: "貝印公式ショップ", itemPrice: 580, pointRate: 10, reviewAverage: 4.5, reviewCount: 1243, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/kaihouse/r024/", category: "調理・製造道具", discountRate: 32, originalPrice: 850 },
    { itemCode: "R025", itemName: "富澤商店 グラニュー糖 1kg 製菓用 溶けやすい", shopName: "富澤商店", itemPrice: 298, pointRate: 10, reviewAverage: 4.7, reviewCount: 5432, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/r025/", category: "製菓材料", discountRate: 29, originalPrice: 420 },
    { itemCode: "R026", itemName: "HEIKO ギフトボックス マカロン用 10枚セット", shopName: "HEIKO楽天市場店", itemPrice: 480, pointRate: 10, reviewAverage: 4.2, reviewCount: 345, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/heiko/r026/", category: "ラッピング・梱包", discountRate: 29, originalPrice: 680 },
    { itemCode: "R027", itemName: "cotta 使い捨て絞り袋 100枚入り 衛生的", shopName: "cotta楽天市場店", itemPrice: 680, pointRate: 10, reviewAverage: 4.4, reviewCount: 543, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/cotta/r027/", category: "デコレーション用品", discountRate: 31, originalPrice: 980 },
    { itemCode: "R028", itemName: "富澤商店 純ココアパウダー 100g 製菓専用", shopName: "富澤商店", itemPrice: 380, pointRate: 10, reviewAverage: 4.7, reviewCount: 4321, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/tomizawa/r028/", category: "製菓材料", discountRate: 31, originalPrice: 550 },
    { itemCode: "R029", itemName: "パール金属 ケーキクーラー 30×25cm ステンレス", shopName: "パール金属公式", itemPrice: 680, pointRate: 10, reviewAverage: 4.3, reviewCount: 876, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/pearl/r029/", category: "調理・製造道具", discountRate: 31, originalPrice: 980 },
    { itemCode: "R030", itemName: "山崎実業 製菓用 キッチンエプロン シンプル 調節可能", shopName: "山崎実業公式", itemPrice: 1480, pointRate: 10, reviewAverage: 4.2, reviewCount: 2341, imageUrl: null, itemUrl: "https://item.rakuten.co.jp/yamazaki/r030/", category: "その他製菓用品", discountRate: 33, originalPrice: 2200 },
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

  if (!APPLICATION_ID || !AFFILIATE_ID) {
    return res.json({ items: getMockItems(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true });
  }

  const keywords = [
    "製菓型 シリコン",
    "ハンドミキサー 製菓",
    "製菓道具 セット",
    "薄力粉 製菓用",
    "クッキングシート 製菓",
    "チョコレート 製菓用",
    "タルト型 製菓",
    "デコレーション 製菓",
  ];

  const allItems = [];
  const seen = new Set();

  for (const keyword of keywords) {
    try {
      const data = await fetchRakutenItems(keyword);
      const items = (data.Items || []).map(function(i) {
        const item = i.Item;
        return {
          itemCode: item.itemCode,
          itemName: item.itemName,
          shopName: item.shopName,
          itemPrice: item.itemPrice,
          pointRate: item.pointRate || 1,
          reviewAverage: item.reviewAverage || 0,
          reviewCount: item.reviewCount || 0,
          imageUrl: item.mediumImageUrls && item.mediumImageUrls[0] ? item.mediumImageUrls[0].imageUrl : null,
          itemUrl: item.affiliateUrl || item.itemUrl,
          category: detectCategory(item.itemName, ""),
          discountRate: null,
          originalPrice: null,
        };
      });

      for (const item of items) {
        if (!seen.has(item.itemCode)) {
          seen.add(item.itemCode);
          allItems.push(item);
        }
      }
      await new Promise(function(r) { setTimeout(r, 500); });
    } catch (e) {
      console.error("Rakuten API error:", e.message);
    }
  }

  memoryCache = allItems;
  memoryCacheAt = now;
  return res.json({ items: allItems, cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false });
};
