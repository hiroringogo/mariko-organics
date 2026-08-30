# Mariko Organics — Gluten-Free Workshop Booking App

*[English](#english) / [日本語](#japanese)*

<a id="english"></a>
## English

A booking and lesson-management app built for a small gluten-free cooking school, designed and built end-to-end (product design + implementation) by me, with AI as a coding partner.

**Live demo:** [mariko-organics-iota.vercel.app](https://mariko-organics-iota.vercel.app) — seeded with dummy data, not real customer data.

### What it does

- **Students** browse upcoming lessons, book a seat, see live seat availability, and cancel a booking (with a confirmation step and automatic cancellation email).
- **Admin (the teacher)** manages lessons from a dashboard: monthly metrics (lesson count, confirmed bookings, capacity utilization), a date-grouped, collapsible lesson list, two-tier publishing (member-early-access vs. general public), a low-enrollment warning when a lesson is under its minimum headcount, and CSV export of bookings/students for backup.
- Bilingual UI (Japanese / English) for students.

### Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** — Postgres, Auth, Row Level Security
- **Resend** — transactional email (booking confirmation, cancellation, admin notifications)
- **Vercel** — hosting, plus a daily cron hitting `/api/keep-alive` to keep the Supabase free-tier project from pausing

### A real problem I hit and how I fixed it

Cancellations were visually going through in the UI, but the seat count wasn't decrementing and the admin dashboard wasn't updating. I traced it to Row Level Security silently blocking the update from the client. I fixed it by adding a dedicated `PATCH /api/bookings` route that uses the Supabase service-role key server-side to perform the cancellation, instead of trying to push the write through client-side RLS. That separated "what a student is allowed to do from the browser" from "what the cancellation flow actually needs to do," which is the more correct place to draw that line anyway.

### Design decisions worth mentioning

- **Two-tier publishing instead of one toggle.** Lessons can be visible to members-only before they're announced publicly. Turning on general publishing auto-enables member visibility too, so the teacher can't accidentally create a state where the public sees a lesson but members don't.
- **Dropped the calendar view in the admin dashboard** in favor of a date-grouped list with accordions — higher information density for someone scanning "what's coming up and who's in it" daily, which is what the actual usage pattern turned out to be.
- **Minimum-headcount warning card** surfaces lessons that haven't hit their break-even enrollment, directly in the dashboard, instead of the teacher having to calculate it herself.

### Status

Built and shipped for real use (~100 active users, ~20 students on file); currently paused while the business side (LLC formation) catches up. This deploy uses seeded/dummy data for demo purposes.

---

<a id="japanese"></a>
## 日本語

グルテンフリー料理教室向けに、デザインから実装まで一人で(AIをコーディングパートナーとして)手がけた予約・レッスン管理アプリです。

**ライブデモ:** [mariko-organics-iota.vercel.app](https://mariko-organics-iota.vercel.app) ※ダミーデータで運用しており、実際の生徒さんの情報は含まれていません。

### 機能

- **生徒側**: レッスン一覧の閲覧、予約、残席数のリアルタイム確認、予約キャンセル(確認ステップ付き、キャンセル完了メールを自動送信)
- **管理者(講師)側**: ダッシュボードでレッスンを管理。月次メトリクス(レッスン数、確定予約数、稼働率)、日付ごとにグループ化したアコーディオン形式のレッスン一覧、2段階公開設定(会員先行公開/一般公開)、最少催行人数に届いていないレッスンへの警告表示、予約・生徒データのCSVエクスポート(バックアップ用)
- 生徒向けUIは日本語/英語のバイリンガル対応

### 技術構成

- **Next.js 16**(App Router)+ TypeScript
- **Supabase** — Postgres、Auth、Row Level Security
- **Resend** — トランザクションメール(予約確認、キャンセル、管理者通知)
- **Vercel** — ホスティング。Supabase無料プランの自動休止を防ぐため、`/api/keep-alive` を毎日叩くCronも設定

### 実際に直面した問題とその解決

キャンセル操作をすると画面上は反映されるのに、残席数が戻らず管理画面も更新されないという不具合がありました。調査の結果、Row Level Securityがクライアント側からの更新を静かにブロックしていたことが原因と判明。クライアント経由でRLSを突破しようとするのではなく、Supabaseのservice_roleキーをサーバー側で使う専用の `PATCH /api/bookings` エンドポイントを新設して解決しました。これにより「生徒がブラウザから直接できること」と「キャンセル処理が実際に必要とする権限」を切り分けることができ、本来あるべき責務分担になりました。

### 特に触れておきたい設計判断

- **トグル1つではなく2段階公開にした理由**: レッスンは一般公開前に会員だけに先行公開できます。一般公開をONにすると会員公開も自動でONになる仕組みにし、講師が誤って「一般には見えるのに会員には見えない」という矛盾した状態を作れないようにしました。
- **管理画面のカレンダー表示をやめ、日付グループ化したリスト+アコーディオンに変更**: 実際の利用パターンが「今後の予定と参加者を毎日ざっと確認する」ことだったため、情報密度を優先しました。
- **最少催行人数の警告カード**: 採算ラインに届いていないレッスンをダッシュボード上で直接可視化し、講師が自分で計算する手間をなくしました。

### 現状

実際に稼働していた実績あり(アクティブユーザー約100名、登録生徒約20名)。現在はビジネス面(LLC設立)の都合で一時停止中。このデプロイはデモ用にダミーデータを投入したものです。
