// 楽天市場 製菓道具 手動登録版
// アフィリエイトリンク使用・APIなしで安定動作

const CACHE_TTL = 60 * 60 * 1000;
let _cache = null;
let _cacheAt = 0;

// 手動登録商品データ（楽天アフィリエイトリンク使用）
function getItems() {
  return [
    {
      itemCode: "majimaya-787357",
      itemName: "シリコン加工 ミニマフィン型 12個付 カップケーキ型 空焼き不要",
      shopName: "まじまや",
      itemPrice: 980,
      pointRate: 1,
      reviewAverage: 4.3,
      reviewCount: 120,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/majimaya/cabinet/img/muffin/787357.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afddf6.837d8dba.52afddf7.fd42d9e5/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmajimaya%2F787357%2F&link_type=text",
      category: "製菓型・天板",
    },
    {
      itemCode: "majimaya-712931",
      itemName: "タイガークラウン 角タルト型 底取 長方形 波ギザ 24.7cm",
      shopName: "まじまや",
      itemPrice: 1200,
      pointRate: 1,
      reviewAverage: 4.4,
      reviewCount: 89,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/majimaya/cabinet/img/tart/712931.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afddf6.837d8dba.52afddf7.fd42d9e5/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmajimaya%2F712931%2F&link_type=text",
      category: "製菓型・天板",
    },
    {
      itemCode: "roomy-ide17feb21e01",
      itemName: "BRUNO マルチスティックブレンダー2 ハンドミキサー フードプロセッサー BOE140",
      shopName: "roomy",
      itemPrice: 8800,
      pointRate: 10,
      reviewAverage: 4.5,
      reviewCount: 2341,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/roomy/cabinet/ide17/ide17feb21e01.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/43f4e155.17daed2a.43f4e158.b39bf7b8/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Froomy%2Fide17feb21e01%2F&link_type=text",
      category: "キッチン家電",
    },
    {
      itemCode: "asai-tool-yk-1301",
      itemName: "タニタ デジタルクッキングスケール KD-177 2kg 1g単位 製菓用",
      shopName: "浅井商店",
      itemPrice: 2980,
      pointRate: 1,
      reviewAverage: 4.7,
      reviewCount: 5832,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/asai-tool/cabinet/yk/yk-1301.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afe48d.df4bda74.52afe48e.eed7a2fa/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fasai-tool%2Fyk-1301%2F&link_type=text",
      category: "調理・製造道具",
    },
    {
      itemCode: "asai-tool-yk-0663",
      itemName: "ベーキングシート ロール 300×900mm テフロン 繰り返し使える クッキングシート 日本製",
      shopName: "浅井商店",
      itemPrice: 780,
      pointRate: 1,
      reviewAverage: 4.5,
      reviewCount: 1243,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/asai-tool/cabinet/yk/yk-0663.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afe48d.df4bda74.52afe48e.eed7a2fa/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fasai-tool%2Fyk-0663%2F&link_type=text",
      category: "クッキングシート・消耗品",
    },
    {
      itemCode: "pastreet-1115420",
      itemName: "ラッピング袋 無地 50枚入 マチあり マフィンカップ対応 小分け袋 焼菓子袋 日本製",
      shopName: "パストリーゼ",
      itemPrice: 580,
      pointRate: 1,
      reviewAverage: 4.3,
      reviewCount: 432,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/pastreet/cabinet/img/1115420.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afe8a6.a042a6bd.52afe8a7.f3246d65/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fpastreet%2F1115420%2F&link_type=text",
      category: "ラッピング・梱包",
    },
    {
      itemCode: "owari-hakuriki-1",
      itemName: "薄力粉 1kg 尾張製粉 お菓子や料理に最適な薄力小麦粉",
      shopName: "尾張製粉",
      itemPrice: 398,
      pointRate: 2,
      reviewAverage: 4.6,
      reviewCount: 3421,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/owari/cabinet/hakuriki/hakuriki-1.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afee07.643128fd.52afee08.bb3e6ec1/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fowari%2Fhakuriki-1%2F&link_type=text",
      category: "製菓材料",
    },
    {
      itemCode: "kashizairyo-choco-18321",
      itemName: "ベリーズ 製菓用チョコ チップチョコ 46% 1.5kg ガーナ産 ピュアチョコ 業務用",
      shopName: "菓子材料専門店",
      itemPrice: 2480,
      pointRate: 1,
      reviewAverage: 4.5,
      reviewCount: 876,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/kashizairyo/cabinet/choco/choco-18321.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afefbe.0e7c9ae5.52afefbf.8722aad4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fkashizairyo%2Fchoco-18321%2F&link_type=text",
      category: "製菓材料",
    },
    {
      itemCode: "asai-tool-yk-0044",
      itemName: "シフォンケーキ型 17cm 日本製 アルミ製 つなぎ目なし お菓子型",
      shopName: "浅井商店",
      itemPrice: 1280,
      pointRate: 1,
      reviewAverage: 4.6,
      reviewCount: 1876,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/asai-tool/cabinet/yk/yk-0044.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afe48d.df4bda74.52afe48e.eed7a2fa/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fasai-tool%2Fyk-0044%2F&link_type=text",
      category: "製菓型・天板",
    },
    {
      itemCode: "majimaya-732392",
      itemName: "使い捨て 絞り袋 スロウバッグ 350×230×340mm 20枚 タイガークラウン",
      shopName: "まじまや",
      itemPrice: 680,
      pointRate: 1,
      reviewAverage: 4.3,
      reviewCount: 543,
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/majimaya/cabinet/img/bag/732392.jpg?_ex=300x300",
      itemUrl: "https://hb.afl.rakuten.co.jp/ichiba/52afddf6.837d8dba.52afddf7.fd42d9e5/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmajimaya%2F732392%2F&link_type=text",
      category: "デコレーション用品",
    },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=86400");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();
  const items = getItems();

  return res.status(200).json({
    items: items,
    cachedAt: now,
    nextUpdate: now + CACHE_TTL,
    fromCache: false,
    total: items.length,
  });
};
