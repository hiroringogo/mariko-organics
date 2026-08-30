# Mariko Organics — Gluten-Free Workshop Booking App

*[English](#english) / [日本語](#japanese)*

<a id="english"></a>
## English

I'm a student at this gluten-free, organic cooking school, and I designed and built its booking app end-to-end (product design + implementation), with AI as a coding partner ("vibe coding").

**Live demo:** [mariko-organics-hiroringogo-8891s-projects.vercel.app](https://mariko-organics-hiroringogo-8891s-projects.vercel.app) — seeded with dummy data, not real customer data. (Note: transactional email sending is disabled for this demo — booking/cancellation flows work, but no email is actually sent.)

### Why this exists

Booking used to be split across three disconnected tools: the teacher messaged students directly over LINE (Japan's WhatsApp), actual sign-ups went through SignUpGenius, and lesson details were sent separately as PDFs. Students complained that SignUpGenius was ad-heavy, didn't support Japanese input, and felt dated — and some disliked that their name was visible to other students booked into the same lesson. As a student experiencing this firsthand, I proposed consolidating everything into one modern app, then designed and built it.

### What it does

- **Students** browse upcoming lessons, book a seat, see live seat availability, and cancel a booking (with a confirmation step and automatic cancellation email). First-time guests are asked who referred them (classes are invite-only, held at the teacher's home) and receive an email with the address; returning guests get a shorter version.
- **Admin (the teacher)** manages lessons from a dashboard: monthly metrics (lesson count, confirmed bookings, capacity utilization), a date-grouped, collapsible lesson list, two-tier publishing (member-early-access vs. general public), a low-enrollment warning when a lesson is under its minimum headcount, and CSV export of bookings/students for backup.
- Bilingual UI (Japanese / English) for students.

### Stack

- **Next.js 16** (React, App Router) + TypeScript
- **Supabase** — Postgres, Auth, Row Level Security
- **Resend** — transactional email (booking confirmation, cancellation, admin notifications)
- **Vercel** — hosting, plus a daily cron hitting `/api/keep-alive` to keep the Supabase free-tier project from pausing

### A real problem I hit and how I fixed it

Cancellations were visually going through in the UI, but the seat count wasn't decrementing and the admin dashboard wasn't updating. I traced it to Row Level Security silently blocking the update from the client. I fixed it by adding a dedicated `PATCH /api/bookings` route that uses the Supabase service-role key server-side to perform the cancellation, instead of trying to push the write through client-side RLS. That separated "what a student is allowed to do from the browser" from "what the cancellation flow actually needs to do," which is the more correct place to draw that line anyway. It also happened to be the exact failure mode the teacher had told me, early on, she worried about most — a booking silently not going through.

### Design decisions worth mentioning

- **Two-tier publishing instead of one toggle.** This maps to a real product requirement: a $40/year membership perk that includes early access to bookings. Turning on general publishing auto-enables member visibility too, so the teacher can't accidentally create a state where the public sees a lesson but members don't.
- **Dropped the calendar view in the admin dashboard** in favor of a date-grouped list with accordions — higher information density for someone scanning "what's coming up and who's in it" daily, which is what the actual usage pattern turned out to be.
- **Minimum-headcount warning card** surfaces lessons that haven't hit their break-even enrollment (lessons run at the teacher's home, capped at 6 seats, minimum 4 to hold class), directly in the dashboard, instead of the teacher having to calculate it herself. Deliberately not automated end-to-end: a lesson going ahead is confirmed via the automatic booking email, but if it doesn't reach minimum headcount, the teacher reaches out to students personally rather than the system sending an automated cancellation notice.
- **Referral tracking for first-time guests**, since classes are invite-only for security reasons (they're held at the teacher's home).
- **Differentiated confirmation emails** — first-timers get the home address included; returning guests get a shorter email without it.

### Status

Built and shipped for real use (~100 active users, ~20 students on file); currently feature-complete and ready to go, waiting to relaunch publicly. This deploy uses seeded/dummy data for demo purposes.

---

<a id="japanese"></a>
## 日本語

自分自身がこのグルテンフリー料理教室の生徒で、予約アプリのデザインから実装までを一人で(AIをコーディングパートナーとして、いわゆる「バイブコーディング」で)手がけました。

**ライブデモ:** [mariko-organics-hiroringogo-8891s-projects.vercel.app](https://mariko-organics-hiroringogo-8891s-projects.vercel.app) ※ダミーデータで運用しており、実際の生徒さんの情報は含まれていません。(注: このデモではメール送信機能を無効化しています。予約・キャンセル操作自体は動作しますが、実際にメールは送信されません)

### 作った理由

以前の予約運用は、LINEで先生が生徒に直接連絡しつつ、実際の予約受付は米国のSignUpGeniusを使い、レッスンの詳細はPDFで別送するという、3つのツールに分断された状態でした。SignUpGeniusは広告が多く日本語入力にも対応しておらず「使いにくい」という声が生徒の間で多く、参加者の氏名が他の生徒にも見えてしまう仕様を嫌がる生徒もいました。生徒としてこの状況を実際に体験する中で、一つのモダンなアプリに一元化することを自分から先生に提案し、デザイン・実装を担当しました。

### 機能

- **生徒側**: レッスン一覧の閲覧、予約、残席数のリアルタイム確認、予約キャンセル(確認ステップ付き、キャンセル完了メールを自動送信)。教室はご自宅開催のクローズドな会のため、初参加者には紹介者の入力を求め、住所を含めたメールを送信。リピーターには省略した内容のメールを送信。
- **管理者(講師)側**: ダッシュボードでレッスンを管理。月次メトリクス(レッスン数、確定予約数、稼働率)、日付ごとにグループ化したアコーディオン形式のレッスン一覧、2段階公開設定(会員先行公開/一般公開)、最少催行人数に届いていないレッスンへの警告表示、予約・生徒データのCSVエクスポート(バックアップ用)
- 生徒向けUIは日本語/英語のバイリンガル対応

### 技術構成

- **Next.js 16**(React、App Router)+ TypeScript
- **Supabase** — Postgres、Auth、Row Level Security
- **Resend** — トランザクションメール(予約確認、キャンセル、管理者通知)
- **Vercel** — ホスティング。Supabase無料プランの自動休止を防ぐため、`/api/keep-alive` を毎日叩くCronも設定

### 実際に直面した問題とその解決

キャンセル操作をすると画面上は反映されるのに、残席数が戻らず管理画面も更新されないという不具合がありました。調査の結果、Row Level Securityがクライアント側からの更新を静かにブロックしていたことが原因と判明。クライアント経由でRLSを突破しようとするのではなく、Supabaseのservice_roleキーをサーバー側で使う専用の `PATCH /api/bookings` エンドポイントを新設して解決しました。これにより「生徒がブラウザから直接できること」と「キャンセル処理が実際に必要とする権限」を切り分けることができ、本来あるべき責務分担になりました。皮肉にも、これは要件ヒアリングの段階で先生が最も懸念していた「予約したのに実は取れていない」という事態そのものでした。

### 特に触れておきたい設計判断

- **トグル1つではなく2段階公開にした理由**: 年会費$40のメンバーシップ特典(先行予約)という実際の要件を反映しています。一般公開をONにすると会員公開も自動でONになる仕組みにし、講師が誤って「一般には見えるのに会員には見えない」という矛盾した状態を作れないようにしました。
- **管理画面のカレンダー表示をやめ、日付グループ化したリスト+アコーディオンに変更**: 実際の利用パターンが「今後の予定と参加者を毎日ざっと確認する」ことだったため、情報密度を優先しました。
- **最少催行人数の警告カード**: レッスンは先生のご自宅開催で定員6名・最少4名という制約があるため、採算ラインに届いていないレッスンをダッシュボード上で直接可視化し、講師が自分で計算する手間をなくしました。あえて全自動にはしていません。開催が決まる場合は予約確認メール自体がその合図を兼ねますが、最少催行人数に届かず開催しない場合は、システムが自動でキャンセル通知を送るのではなく、講師が対象の生徒に個別に連絡する運用にしています。
- **初参加者の紹介者記録**: ご自宅開催のクローズドな教室のため、セキュリティ上の理由から初参加者には紹介者名の入力を必須にしました。
- **初参加/リピーターで確認メールの内容を出し分け**: 初参加者には住所を含めたメールを、リピーターには省略した内容を送るようにしました。

### 現状

実際に稼働していた実績あり(アクティブユーザー約100名、登録生徒約20名)。現在は準備完了・公開待ちの状態です。このデプロイはデモ用にダミーデータを投入したものです。
