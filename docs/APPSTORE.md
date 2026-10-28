# App Store 版への道筋

CELL は今のコードを土台に、iOS アプリとして配信できるよう準備しています。このリポジトリにあるのは「Web 側の準備」までです。iOS のビルド・署名・提出には Mac と Xcode が必要です。

## いま入っているもの

| 項目 | 状態 |
| --- | --- |
| `capacitor.config.json` | ネイティブの殻（Capacitor）の設定。`appId` は自分のものに変えてください（例：`com.あなたの名前.cell`） |
| `npm run build:www` | アプリに入れるファイルだけを `www/` にまとめる。テストや開発用のファイルはアプリに入れない |
| ネイティブ連携の層（`index.html` 内の `Native`） | iOS アプリとして動いているときだけ働き、ブラウザでは何もしない。次の3つに対応 |
| └ ローカル通知 | タイマーの終了とリマインダーを iOS の通知として予約する。画面ロック中や他のアプリを使っている間も鳴る。PWA ではできなかった部分 |
| └ 触覚 | 完了・削除などで本物の振動。ブラウザでは操作音で代用している |
| └ 画面を消さない | Keep Awake プラグインで FOCUS・タイマー中のスリープを防ぐ |

## Mac での手順（初回）

```sh
npm ci
npm i @capacitor/core @capacitor/ios @capacitor/local-notifications @capacitor/haptics @capacitor-community/keep-awake
npm i -D @capacitor/cli
npm run build:www
npx cap add ios
npx cap sync ios
npx cap open ios        # Xcode が開く
```

Xcode での設定：

1. **Signing & Capabilities**：自分の Apple Developer チームを選ぶ。Bundle Identifier を `capacitor.config.json` の `appId` と同じにする
2. **Background Modes** → **Audio, AirPlay, and Picture in Picture** をオン（画面ロック中も音を流すため）
3. **Deployment Info**：iPhone は Landscape Left / Right のみ。iPad はすべての向き
4. **Info.plist**：`UIRequiresFullScreen` は付けない（iPad の Split View を許可するため）
5. 実機を選んで実行 → 動作確認 → **Product → Archive** → TestFlight へアップロード

以降は Web 側を直したら `npm run build:www && npx cap sync ios` で反映します。

## 審査で落ちないために（ガイドライン 4.2・4.3）

Web サイトを包んだだけのアプリは「最低限の機能」として却下されることがあります。CELL では次のネイティブ機能を中心に据える計画です。

| 段階 | ネイティブ機能 | 理由 |
| --- | --- | --- |
| 第1段階（入っている） | ローカル通知、触覚、画面を消さない | PWA でいちばん困っていた「ロック中に鳴らない」を解消 |
| 第1段階（Xcode 設定） | 画面ロック中の再生 | 睡眠・作業用 BGM の要。Background Modes と AVAudioSession の playback |
| 第2段階 | ライブアクティビティとダイナミックアイランドのタイマー | 競合の多くが対応済み。タイマーが終わったら必ず消す |
| 第2段階 | スタンバイとウィジェット（場面ごとの時計。夜は赤く） | 横置きの CELL といちばん相性がよく、特集される機会にもなる |
| 第3段階 | ショートカット・集中モードとの連携（App Intents） | 例：集中モード「勉強」で喫茶の部屋と25分のタイマーを始める |
| 第3段階 | iCloud 同期 | 機種変更や iPad との行き来で、引っ越しの手間をなくす |

注意：WKWebView の Web Audio は、アプリがバックグラウンドに入ると止まる場合があります。ロック中の再生を確実にするには、第2段階で音の再生をネイティブ（AVAudioEngine）に移すことを検討してください。

## 提出前のチェックリスト

- [ ] プライバシーポリシーの URL（GitHub Pages に1ページ置けば足ります）
- [ ] App のプライバシー：「データの収集なし」（CELL は端末の外にデータを送りません）
- [ ] 年齢区分：4+。キッズカテゴリには登録しない（制約が厳しいため）
- [ ] カテゴリ：仕事効率化（サブ：ライフスタイル）
- [ ] スクリーンショット：iPhone 6.9 インチの横向き、iPad 13 インチ。部屋ごとに1枚、文字は少なく
- [ ] キーワード候補：作業用,集中,ポモドーロ,勉強タイマー,自習室,環境音,雨音,焚き火,置き時計,スタンバイ,睡眠,lofi
- [ ] 曲・環境音の権利：CELL の音楽と環境音はアプリの中で合成しているため、外部の音源の権利は関係しない（音源ファイルを追加する場合は商用利用の許諾を確認）
- [ ] TestFlight で最低1週間、実機での確認（README の「iPhone 実機で確認してほしいこと」）

## 価格の考え方

調査（`docs/RESEARCH.md`）では、利用者の不満の多くが課金のやり方に集まっていました。

- 無料の範囲に時間制限を設けない。タイマー・タスク・基本の部屋はずっと無料
- 「CELL+」は買い切りを中心にする（追加の部屋、季節の部屋、ウィジェットの種類）
- サブスクを用意する場合も低価格の年額にとどめ、無料体験から自動で年額に移行させない
