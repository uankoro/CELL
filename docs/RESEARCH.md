# CELL 製品リサーチの要点（2026年10月）

v3 の方針を決めるために行った調査のまとめです。類似アプリのレビュー、サブモニターの使われ方、日本の利用者の一日、App Store の事情を対象にしました。出典の URL は各項目に付けています。Reddit や日本の勉強垢の投稿は検索で拾いにくく、記事やまとめに頼った部分があります。

## 類似アプリから分かったこと

- **毎日開かれる理由は「景色・タイマー・音」の組み合わせ。** LifeAt は動く景色が最も評価されている。Flocus は「時計・集中タイマー・環境音」の3つで 100 万人以上と公表。<https://flat.social/guides/lifeat-review> <https://flocus.com>
- **「誰かがいる」感覚が続ける理由になる。** Lofi Girl の配信は、遠くの自習仲間のように働く。日本の Study with me 配信は「オンライン自習室」として見られている。<https://blog.youtube/culture-and-trends/rise-lofi-girl> <https://bloomeria.jp/blog/study-with-me-streaming-guide>
- **記録が習慣を作る。** Studyplus は週の目標と記録の可視化で続けさせている。<https://www.lifehacker.jp/2020/09/study-plus.html>
- **控えめさが価値になる。** Structured は「開いたままにしておける落ち着き」が褒められ、機能の行が増えるたびに「小さな税金」と言われている。<https://habitbox.app/blog/structured-app-review>
- **不満の多くは機能ではなく課金。** 無料体験から年額への自動移行（Endel）、解約の難しさ（Calm）、アップグレードの催促（Focus To-Do）、ささいな機能の有料化（Momentum）、無料タイマーの時間制限（Forest）。<https://uk.trustpilot.com/review/endel.io> <https://justuseapp.com/en/app/966057213/focus-to-do-focus-timer-tasks/reviews>
- **サービスは消えることがある。** lofi.co は 2024 年 5 月に終了した。データが端末に残ること（オフライン優先・書き出し）が信頼になる。<https://gridfiti.com/lofi-co-alternatives>
- **常時表示では重さが嫌われる。** LifeAt の 4K 動画は電池とファンの負担になる。Wallpaper Engine はフレームレートの上限と省電力モードで対応している。<https://steamcommunity.com/app/431960/discussions/2/1744480966986902496>
- **環境音のつなぎ目は聞こえる。** Noisli はループの切れ目への指摘があり、Rainy Mood はパターンが分からないことが評価されている。<https://www.techradar.com/reviews/rainy-mood>

## サブモニター・常時表示で求められること

- 離れていても読める時計（Fliqlo が今も定番）、いま取り組んでいること、次の予定、タイマー。縦置きや小さなサブモニターも多い。<https://my-best.com/magazine/5879>
- ほかのアプリの上に浮かぶ小さなタイマー（Flocus のピクチャ・イン・ピクチャ）。<https://flocus.com/features/focus-timer>
- 焼き付き対策（OLED メーカーは数分ごとに 1〜2px ずらす）、夜の減光、低い負荷。<https://www.asus.com/support/FAQ/1048131>
- 目の休憩（20-20-20 の法則）。専用アプリがひとつの分野になっている。<https://github.com/samarsault/LookAway>

## 日本の利用者の一日

- 資格の勉強は朝 6 時台と夜 21 時ごろが典型。1 日 10 分の記録でも続ける力になる。<https://www.crear-ac.co.jp/palette/challenge/2121>
- 図書館でも使える無音、広告なし、環境音が、上位のポモドーロアプリの売り文句になっている。<https://apps.apple.com/jp/app/id1645642989>
- 夜は iPhone のスタンバイ（充電中の横置き表示。暗い部屋では赤く表示される）がベッドサイドの時計になる。<https://support.apple.com/ja-jp/guide/iphone/iph878d77632/ios>

## v3 で反映したこと

| 調査から | CELL v3 |
| --- | --- |
| 景色が主役、機能の行は「税金」 | 静止時は部屋・時計・その下の一行だけ。操作は触れると現れ、数秒で消える |
| サブモニターに置くもの | 画面に合わせて大きくなる時計、いまやること、24時間以内の次の予定、実行中のタイマー。縦長モニターや小さな窓にも対応 |
| 浮かぶタイマー | 「小さな窓で表示」（Chrome/Edge のピクチャ・イン・ピクチャ、W キー） |
| 常時表示の負荷 | 静止時は 30fps、省電力では 20fps。画面が隠れている間は描画しない |
| 焼き付き・夜 | 時計が数分ごとに数 px 動く。23 時〜6 時は部屋を少し暗く |
| 目の休憩 | 20 分ごとの合図（設定でオン） |
| 図書館で使う | 「音で知らせない」：タイマーやリマインダーは画面の縁の光で知らせる |
| 課金への不信 | （App Store 版の方針）無料の範囲に時間制限を設けない。買い切り中心。無料体験から自動で年額に移行させない |

## App Store 版に向けて（まだ実装していないこと）

- 審査ガイドライン 4.2（Web サイトの包み直しは却下されうる）と 4.3（よくあるアプリとの差がない）への対策として、ネイティブ機能を中心に据える。<https://developer.apple.com/app-store/review/guidelines/>
- 優先度の高いネイティブ機能：
  - ライブアクティビティとダイナミックアイランドのタイマー（タイマーが終わったら消す）
  - スタンバイとウィジェット（場面ごとの時計。夜は赤く）
  - 画面ロック中も鳴り続ける音
  - 確実に鳴るローカル通知
  - ショートカットと集中モードの連携（App Intents）
- カテゴリは「仕事効率化」。日本語のキーワード候補：作業用、集中、ポモドーロ、勉強タイマー、自習室、環境音、雨音、焚き火、置き時計、スタンバイ、睡眠、習慣、lofi。
- 詳しくは `docs/APPSTORE.md` を参照してください。
