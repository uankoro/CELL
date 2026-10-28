# ライフモード リサーチ（2026年10月）

第3モード「ライフ」（暮らしの伴走）を、月額課金に値するものにするための調査メモ。
- 調査方法: Web 検索のみ。この環境では App Store・RevenueCat・Open-Meteo などのページを直接取得できず（DNS/プロキシ制限）、検索結果の要約と二次情報に頼った部分がある。
- 価格は時期・国で変わる。**円価格が確認できなかったものは USD を記載**（App Store 日本の価格帯ではおおむね $1 ≒ 150〜160円）。リリース前に日本の App Store で再確認すること。
- 既存の方針（docs/RESEARCH.md 末尾）: 「無料の範囲に時間制限を設けない」「無料体験から自動で年額に移行させない」。本書の提案はこれと両立させる。

---

## 1. 人がお金を払っている暮らし系アプリと、その理由

| アプリ | 価格（確認できた範囲） | 無料 / 有料の境目 | 払われている理由 |
| --- | --- | --- | --- |
| Tiimo（2025 iPhone App of the Year） | 年 $42〜54、月 $10〜12（情報源で差）。試用 7〜14日 | 無料: 基本プランナー、AIチャット制限、1プロフィール。リマインダー連携は有料 | ADHD 向けの「見える一日」。賞で認知。ただし「基本的なカレンダー機能が有料」との批判 |
| Structured | 月 $6.99 / 年 $29.99 / 買い切り $99.99（2026年9月の米国価格） | 無料: タイムライン。有料: 繰り返し、通知の細かさ、同期など | 一日を縦のタイムラインで見る落ち着き。買い切り→サブスク移行で反発もあった |
| Routinery | 月 $5 / 年 $36（第三者の価格追跡） | ルーティン数・テンプレートで制限 | 朝・夜ルーティンを1ステップずつ音声とタイマーで進める |
| Habitify | 年 $35.99 / 買い切り $53.99（公式ヘルプ） | 無料は習慣数上限 | 習慣トラッカー定番、Apple Watch・ウィジェット |
| Finch | 月 $9.99 / 年 約 $40（Plus） | 無料でほぼ全機能が使える | ペット（鳥）への愛着。約4万件のレビューで平均 4.59、肯定 82% |
| How We Feel | 無料（非営利・寄付） | — | 気分記録の定番。課金競合ではないが「無料が基準」を作っている |
| Sleep Cycle | 年 $39.99、試用 1週間（古い可能性） | 有料: 詳細な睡眠分析・いびき記録 | 目覚まし（浅い眠りで起こす）が無料でも役立つ |
| TickTick | 年 約5,000円（個人メモ、要確認） | 有料: カレンダー表示、習慣数、統計 | タスク＋習慣＋ポモドーロの全部入り |
| あすけん | 月 480円 / 年 3,600円（セールで 2,900円） | 有料: 詳しい栄養分析、目標設定 | 食事記録への AI 助言。年額への誘導が強い |
| マネーフォワード ME | 月 540円 / 年 5,940円（2025年8月改定） | 無料は連携数・閲覧期間を制限 | 口座の自動連携（入力不要）が価値の核 |
| Zaim | 年 4,800円（ストア経由） | 有料: 連携・分析の拡張 | 自動取り込み、PayPay 連携 |
| ウェザーニュース | Pro 月 680円（初月無料・1回のみ） | 有料: 30時間先の雨雲レーダー、広告なし | 「正確さ・先読み」と広告なしに払う |

出典:
- Tiimo: <https://daringfireball.net/2025/12/2025_app_store_award_winners> <https://tbreak.com/app-store-awards-2025-winners/> <https://lifestack.ai/blog/tiimo-pricing>
- Structured: <https://coolcuration.com/structured-app-review-uk> <https://structured.app/blog/subscription> <https://help.structured.app/en/articles/324674>
- Routinery: <https://apppricinglab.com/iap/apple/1450486923>
- Habitify: <https://intercom.help/habitify-app/en/articles/6113487-premium-pricing-plans>
- Finch: <https://appbot.co/blog/finch-app-reviews-emotional-attachment-user-retention-product-loyalty/> <https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review>
- How We Feel: <https://apps.apple.com/us/app/-/id1562706384>
- Sleep Cycle: <https://www.garagegymreviews.com/?p=208153>
- TickTick: <https://app-tatsujin.com/ticktick-pricing-guide/>
- あすけん: <https://news.allabout.co.jp/articles/o/80734/>
- マネーフォワード ME: <https://support.me.moneyforward.com/hc/ja/articles/48081250560409>
- Zaim: <https://resemom.jp/release/prtimes/20250725/152205.html>
- ウェザーニュース Pro: <https://appllio.com/news/2024-07-31-53246-weather-news-pro> <https://weathernews.jp/pro/>

**読み取れること**
- お金が払われるのは「入力が減る（自動連携）」「先が分かる（予報・レーダー）」「一日が見える（タイムライン）」「愛着（ペット・景色）」の4つ。単なる記録帳には払われにくい。
- 日本の暮らし系の相場は**月 480〜680円、年 3,600〜6,000円**。年額は月額の6〜9か月分に設定されている。
- 家事・ゴミ・服薬の分野は自治体や製薬会社の無料アプリが多く、単体で課金している強い例は見つからなかった。束ねて CELL+ に入れる方が現実的。

## 2. レビューの不満と解約の理由

- **連続記録（ストリーク）の罪悪感。** 1日休むと記録が0に戻り、恥ずかしくなって開かなくなる。消して3か月後にまた入れる、を繰り返す。記録を守るために嘘の記録をつける人もいる。<https://habitdoom.com/blog/streak-anxiety-habit-trackers> <https://unstar.app/blog/streaks-habitica-way-of-life-strides-habit-tracking-apps-ranked-2026>
- **ペットや通知が罪悪感を生む。** Finch でも、使わなくなった後の「鳥が話したがっています」通知に罪悪感を覚えたという声。<https://www.engadget.com/apps/this-self-care-virtual-pet-is-helping-me-get-my-act-together-160027169.html>
- **設定を終えた後に課金画面が出る。** 時間をかけて設定した後で壁に当たると低評価になりやすい。テンプレートが有料なのも不満。<https://unstar.app/blog/streaks-habitica-way-of-life-strides-habit-tracking-apps-ranked-2026>
- **基本機能の有料化。** Tiimo のカレンダー・リマインダー連携、Structured の買い切りからサブスクへの移行に反発。<https://tbreak.com/app-store-awards-2025-winners/> <https://structured.app/blog/subscription>
- **入力が面倒で続かない。** 家計簿の挫折理由として共通。各社は自動連携やレシート撮影で対処している。<https://www.appbank.net/2025/03/17/iphone-application/2761416.php> <https://my-best.com/magazine/2647>
- **通知が届かない。** 服薬アプリ（ジェミー先生の服用サポート、評価 1.7）は「時間になっても通知が来ない」が多数。リマインダー系は**通知の確実さが信頼の全て**。<https://apps.apple.com/jp/app/%E3%82%B8%E3%82%A7%E3%83%9F%E3%83%BC%E5%85%88%E7%94%9F%E3%81%AE%E6%9C%8D%E7%94%A8%E3%82%B5%E3%83%9D%E3%83%BC%E3%83%88/id1517291432>
- **ゴミアプリ（さんあ～る等）。** 「自治体が未対応」「アラームの時刻を設定できない」「フリーズする」。一方で、収集日の通知と捨て方の検索は評価が高い。<https://app-liv.jp/2204580/> <https://appmatch.jp/?p=3110>
- **サブスク疲れ。** 日本では利用数の平均 2.3 個、月額合計は 2,000〜3,000円未満が中心。解約理由1位は「節約」。半数以上が「解約し忘れ」で損をした経験あり。<https://www.commercepick.com/?p=70690> <https://dime.jp/genre/1753924/2/> <https://webtan.impress.co.jp/n/2026/05/27/52684>

**CELL への教訓**: ストリークは使わない（「今週 5/7 日」のような柔らかい表示）。設定は最小限にし、課金の案内は設定前に一度だけ。通知は確実さを優先し、回数は少なく。解約しやすさと「いつ課金されるか」を明示する。

## 3. 日本の暮らしで満たされていない要望

要望が強い順（検索・レビューで見えた頻度と、日本特有かどうかから判断）。

1. **ゴミの日。** 「夫にやってほしい家事」の1位がゴミ出しで、約2人に1人が選んだ。男性が担う家事の上位でもある。「第2・第4水曜」「隔週」「年末年始の変更」など規則が複雑で、自治体アプリは対応自治体に限られ、通知時刻を選べないこともある。<https://digitalpr.jp/r/7524> <https://www.atpress.ne.jp/news/5979249> <https://app-liv.jp/2204580/>
2. **周期的な家事（N日ごと・月1回）。** シーツ、エアコンのフィルター、排水口、浄水器のカートリッジなど。家事分担アプリ（Yieto など）は 100 以上の家事テンプレートと担当者・通知を備えるが、共有前提で一人暮らしには重い。<https://media.moneyforward.com/articles/1132> <https://hugkum.sho.jp/193633>
3. **薬の飲み忘れ。** 専用アプリが多数（しつこいお薬アラームは完了まで20分ごとに再通知、電子お薬手帳の QR 読み取りなど）。不満は通知の未着。<https://app-liv.jp/4702871/> <https://apps.apple.com/jp/app/id1629557002>
4. **天気・傘・洗濯・服装。** 朝に見る情報の定番。ウェザーニュースは「先読み」に課金させている。洗濯指数・服装指数は天気アプリが無料で出している。<https://weathernews.jp/pro/>
5. **熱中症（夏）・花粉（春）。** 環境省は暑さ指数（WBGT）の予測と実況を CSV で配布（利用規約への同意と申し込みが必要）。花粉は国内の無料 API が見つからない（Open-Meteo の花粉は欧州のみ）。<https://www.env.go.jp/press/110940.html> <https://www.wbgt.env.go.jp/man15NH/R08_wbgt_data_service_manual.pdf> <https://docs.rs/crate/weathervane/0.5.0>
6. **支払い日・更新日。** 家賃、カード引き落とし、サブスク更新。「解約し忘れ」が半数以上という調査があり、「更新日の前に知らせる」に需要がある。<https://webtan.impress.co.jp/n/2026/05/27/52684>
7. **体調・気分・睡眠・水分。** 世界的には需要が大きいが、How We Feel（無料）や iPhone 標準の「ヘルスケア」の気分記録が強く、課金の理由にはなりにくい。CELL では「1タップで残せる」程度に留めるのがよい。

## 4. サブスク転換のベストプラクティス（数値）

- **体験期間。** 試用から有料への転換は、4日以下で約 26〜27%、17〜32日で約 42.5%（RevenueCat の 17,000 アプリ分析）。ただし Health & Fitness は 5〜9日（46.8%）が 10〜16日（40.4%）より高い。年額プランは長めの試用ほど転換が良い。<https://www.revenuecat.com/blog/growth/free-trial-length> <https://saastr.com/what-17000-subscription-apps-tell-us-about-free-trial-length-annual-plans-convert-86-better-with-30-day-trials-monthly-tops-out-at-two-weeks-and-ai-apps-hit-a-wall-at-16-days>
- **試用はほぼ初日に始まる。** 試用の開始は大半がダウンロード当日（Day 0 が 80% 超）。課金画面の最初の提示はオンボーディング中が最も効く。<https://www.revenuecat.com/state-of-subscription-apps-2025>
- **ハード課金と無料版。** ダウンロードから有料への転換（35日時点の中央値）は、ハードペイウォール 12.1%、フリーミアム 2.2%（2025年版）。2026年版はハード 10.7%。ただし1年後の継続率は 27% 対 28% でほぼ同じ。<https://www.revenuecat.com/state-of-subscription-apps-2025> <https://www.buildmvpfast.com/blog/hard-paywall-vs-free-trial-revenuecat-indie-app-2026>
- **年額の比重。** Health & Fitness では売上の約 68% が年額。年額の解約は1か月目に 35% が集中し、解約した年額ユーザーの復帰は 5% 程度。<https://www.buildmvpfast.com/blog/hard-paywall-vs-free-trial-revenuecat-indie-app-2026> <https://ppc.land/95-of-annual-app-subscribers-who-cancel-never-return-revenuecat-finds/>
- **カテゴリの強さ。** Business、Health & Fitness、Productivity は長期の課題を解く分野として成績が良い。H&F の試用→有料の中央値は 39.9%。<https://athletechnews.com/fitness-apps-monetizable-winner-take-all-or-most/>
- **日本向けの課金画面。** 長くスクロールする課金画面に、無料と有料の比較表と利用者の声を入れる形が日本でよく効いた（事例で +20% の収益）。<https://onesignal.com/blog/whats-next-for-subscription-apps-trends-and-tips-for-2025/>
- **高めの価格の方が LTV は高い**（高価格帯の中央値 $55 対 低価格帯 $8、二次情報）。<https://arpubrothers.com/blog/2025-saas-mobile-apps-trends/>

**CELL への当てはめ**
- 既存方針（自動で年額に移行させない）を守るなら、**「試用なしのフリーミアム＋買い切りも用意」**か、**「7日試用＋終了前日に通知、自動更新しない選択肢」**。ハード課金はしない（チル/カジュアルが無料で価値を出しているため）。
- 価格案: **CELL+ 月 380〜480円 / 年 2,800〜3,600円 / 買い切り 6,800〜9,800円**。あすけん（480円 / 3,600円）と同じ水準で、サブスク疲れの日本では「月 500円未満」が心理的な線。
- 課金画面はオンボーディング中に一度だけ（スキップ可）、その後は有料機能に触れたときのみ。比較表を中心に。

## 5. 提案: ライフモードの中核機能

前提: 1ファイル、オフライン優先、バックエンドなし、localStorage。通知は PWA では iOS 16.4 以降でホーム画面に追加した場合のみ Web Push が使えるが、**サーバーがないと時刻指定の通知は送れない**。確実な通知は Capacitor 版の Local Notifications に任せ、PWA では「開いている間の画面表示」と「次に開いたときのまとめ」で補う。

価値と手間で並べたもの（◎高 ○中 △低）。

| # | 機能 | 価値 | 手間 | 無料 / CELL+ |
| --- | --- | --- | --- | --- |
| 1 | **今日のボード**: 今日のゴミ・家事・薬・支払いを1画面に。横向きの部屋の中に「今日やること」として常時表示。済んだらタップ | ◎ | ○ | 無料（入口） |
| 2 | **ゴミの日カレンダー**: 曜日、第n週、隔週、年末年始の例外、前夜と当日朝の通知。品目アイコン | ◎ | ○（繰り返し規則の実装） | 無料で1品目、CELL+ で無制限と例外日 |
| 3 | **周期の家事**: 「N日ごと」「毎月○日」「前回から数える」。テンプレート30件（フィルター・シーツ・排水口など）。遅れても責めず「そろそろ」と表示 | ◎ | △ | 無料で5件、CELL+ で無制限とテンプレート全部 |
| 4 | **朝の天気カード**: 傘、服装、洗濯、熱中症（夏）。前日夜に「明日は傘」と表示 | ◎ | ○（API と規約次第） | 今日の天気は無料。CELL+ で時間ごとの雨、洗濯・服装・暑さの目安、前夜の知らせ |
| 5 | **支払い・更新日**: 家賃、引き落とし、サブスク更新の○日前に知らせる。月の合計を表示 | ○ | △ | CELL+ |
| 6 | **薬とセルフケア**: 朝・昼・夜・寝る前の4枠、飲んだらタップ。水分は1タップで1杯 | ○ | △ | 薬1件は無料、複数と記録の振り返りは CELL+ |
| 7 | **ひとこと体調**: 天気の横に5段階の顔を1タップ。週の振り返り（気圧・天気との並び） | △〜○ | △ | 記録は無料、振り返りは CELL+ |
| 8 | **PC サブモニター表示**: 今日のボードと天気を大きく常時表示（既存のサブモニター機能に追加） | ○ | △ | 無料 |

**CELL+ に入れるもの**（入力を減らす・先を知らせる・見える化、に限る）
- 件数の上限解除（ゴミ品目、家事、薬、支払い）、家事テンプレート、天気の詳細と前夜の知らせ、振り返り、ライフ用の部屋とテーマ、データの書き出しと端末間の移行（QR などで）。
- **入れないもの**: 通知そのもの、今日のボード、記録すること。ここを有料にすると「基本機能の有料化」の不満に直結する。
- 罪悪感を生まない設計: ストリークなし、未完了は翌日に静かに持ち越し、通知は1日に最大3回まで（ユーザーが変更可能）。

### 使える無料 API（キー不要）と注意点

- **Open-Meteo**: 日本の座標の予報、UV、降水確率が取れ、CORS 対応とされる。ただし**無料版は非商用のみ**（1日 1万回未満）。CELL+ のような有料アプリでは**商用プラン（有料）が必要**。データは CC BY 4.0（表示が必要）。花粉は欧州のみ。<https://open-meteo.com/en/terms> <https://open-meteo.com/en/pricing> <https://openmeteo.substack.com/p/api-subscriptions-for-commercial>
- **気象庁 bosai JSON**（例 `https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json`、府県単位）: 非公式だが、気象庁サイトの利用規約（出典の明記で商用利用可）に沿う形で使われている。**CORS ヘッダーの有無は確認できなかった**（この環境から接続できず）。仕様は予告なく変わる。<https://news.mynavi.jp/article/zeropython-75/> <https://scrapbox.io/takker/%E6%B0%97%E8%B1%A1%E5%BA%81%E3%81%AE%E5%A4%A9%E6%B0%97%E4%BA%88%E5%A0%B1API>
- **MET Norway（api.met.no）**: 全世界、無料、NLOD/CC BY 4.0。ただし User-Agent での識別が必須で、ブラウザからの直接呼び出しは推奨されない（プロキシ推奨）。<https://docs.api.met.no/doc/TermsOfService> <https://docs.api.met.no/doc/WebClients.html>
- **環境省 WBGT（暑さ指数）**: CSV を配布。申し込みと規約への同意が必要。商用の可否は規約本文で要確認。<https://www.wbgt.env.go.jp/man15NH/R08_wbgt_data_service_manual.pdf>
- **Apple WeatherKit**: Apple Developer Program に月 50万回まで含まれる（商用可、Apple Weather の表示が必要）。Capacitor 版ではネイティブから呼べる。REST 版は JWT 署名が要るため、サーバーなしの PWA には不向き（Apple 公式の記載に基づく一般知識、本調査では再確認していない）。
- **祝日**: `holidays-jp.github.io` の JSON（内閣府 CSV が元）が使われているが、CORS は未確認。祝日は年1回の更新なので、**アプリ内に数年分を埋め込む**のが確実。

**推奨構成**
- PWA（無料・オフライン）: 天気は「開いたときに取得し、localStorage に保存」。取得元は気象庁 JSON（CORS が通れば）を第一候補に、通らなければ天気カードを Capacitor 版限定にする。
- App Store 版（CELL+）: Capacitor の CapacitorHttp はネイティブで通信するため CORS の制約を受けない。WeatherKit か Open-Meteo の商用プランを使う。通知は Local Notifications でゴミ・家事・薬・支払いを確実に知らせる。
- ゴミ・家事・支払いの繰り返しの計算は全て端末内で行える（API 不要）。ここが「オフラインでも確実」という CELL の強みになる。

### 次に確かめること
- 日本の App Store で Tiimo・Structured・Habitify・Routinery の円価格を確認する。
- 実機のブラウザから気象庁 JSON と holidays-jp の `Access-Control-Allow-Origin` を確認する。
- Open-Meteo 商用プランの料金と、WeatherKit の表示要件を確認する。
- 既存方針「無料体験から自動で年額に移行させない」を、CELL+ でも維持するかを決める。
