module.exports = async function handler(req, res) {
  // 環境変数の読み込みチェック
  const appId = process.env.RAKUTEN_APP_ID;
  const affId = process.env.RAKUTEN_AFFILIATE_ID;

  // 1. 楽天APIにテストリクエストを送信
  const query = new URLSearchParams({
    applicationId: appId || "",
    affiliateId: affId || "",
    keyword: "お菓子", // 最もヒットしやすいワードでテスト
    hits: "1",
    format: "json",
    formatVersion: "2",
  });

  try {
    const apiRes = await fetch("https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?" + query);
    const data = await apiRes.json();

    // ブラウザに診断結果を表示
    return res.status(200).json({
      status: apiRes.status,
      // 楽天からの生のメッセージ（ここが重要！）
      rakutenMessage: data, 
      envCheck: {
        hasAppId: !!appId,
        hasAffId: !!affId,
        appIdPrefix: appId ? appId.substring(0, 5) + "..." : "MISSING"
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};