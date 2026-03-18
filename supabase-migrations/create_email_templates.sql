-- email_templates テーブル作成
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS有効化
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員OK（送信時に必要）
CREATE POLICY "email_templates_select" ON email_templates FOR SELECT USING (true);

-- 更新はservice_roleのみ（管理画面からanon keyで更新できるようにする場合は調整）
CREATE POLICY "email_templates_update" ON email_templates FOR UPDATE USING (true);

-- 初期データ挿入
INSERT INTO email_templates (template_key, display_name, subject, body) VALUES
(
  'lesson_booking',
  'レッスン案内（リピーター）',
  '【Mariko Organics】レッスン予約確認 - {{lesson_date}}',
  '{{customer_name}} 様

レッスンのご予約ありがとうございます！

━━━━━━━━━━━━━━━━━━
📅 日程: {{lesson_date}}
🕐 時間: {{lesson_time}}
📍 場所: Orange County, CA（詳細は開催確定後にご案内します）
👥 参加人数: {{participant_count}}名{{companion_names}}
💰 料金: ${{price}} × {{participant_count}}名 = ${{total_price}}
━━━━━━━━━━━━━━━━━━

【開催確定について】
レッスンは最少催行人数4名に達した時点で開催確定となります。
3日前までに開催確定のご連絡をメールでお送りします。

【キャンセルについて】
やむを得ずにお越しいただけない場合は、同月または翌月のレッスンのお振替が可能です。

ご質問がありましたら、お気軽にご連絡ください。
楽しみにお待ちしております！

Mariko Organics'
),
(
  'lesson_booking_first',
  'レッスン案内（初回）',
  '【Mariko Organics】レッスン予約確認 - {{lesson_date}}',
  '{{customer_name}} 様

はじめまして！Mariko Organicsへようこそ。
レッスンのご予約ありがとうございます！

━━━━━━━━━━━━━━━━━━
📅 日程: {{lesson_date}}
🕐 時間: {{lesson_time}}
📍 場所: Orange County, CA（詳細は開催確定後にご案内します）
👥 参加人数: {{participant_count}}名{{companion_names}}
💰 料金: ${{price}} × {{participant_count}}名 = ${{total_price}}
━━━━━━━━━━━━━━━━━━

【初めてご参加される方へ】
持ち物：エプロン、持ち帰り用容器
アレルギーがある場合は事前にお知らせください。

【開催確定について】
レッスンは最少催行人数4名に達した時点で開催確定となります。
3日前までに開催確定のご連絡をメールでお送りします。

【キャンセルについて】
やむを得ずにお越しいただけない場合は、同月または翌月のレッスンのお振替が可能です。

ご質問がありましたら、お気軽にご連絡ください。
楽しみにお待ちしております！

Mariko Organics'
),
(
  'lesson_reminder',
  'リマインダーメール',
  '【Mariko Organics】明日のレッスンのリマインダー',
  '{{customer_name}} 様

明日のレッスンのリマインダーです。

━━━━━━━━━━━━━━━━━━
📅 日程: {{lesson_date}}
🕐 時間: {{lesson_time}}
📍 場所: {{location}}
━━━━━━━━━━━━━━━━━━

お気をつけてお越しください。
お会いできるのを楽しみにしております！

Mariko Organics'
),
(
  'membership_signup',
  'メンバー申し込み案内',
  '【Mariko Organics】メンバーシップお申し込みありがとうございます',
  '{{customer_name}} 様

メンバーシップへのお申し込みありがとうございます！

お支払い方法の詳細をお送りします。
お支払い確認後、正式にメンバーとして登録されます。

【お支払い方法】
以下のいずれかでお支払いください：
・Zelle: （メールアドレスまたは電話番号）
・現金: レッスン時にお渡しください

ご質問がありましたら、お気軽にご連絡ください。

Mariko Organics'
),
(
  'product_order',
  'ショップ購入確認',
  '【Mariko Organics】物販予約確認 - {{product_name}}',
  '{{customer_name}} 様

ご予約ありがとうございます！

━━━━━━━━━━━━━━━━━━
🍵 商品: {{product_name}}
📦 数量: {{quantity}}点
💰 合計: ${{total_price}}
━━━━━━━━━━━━━━━━━━

【お支払い・受け取りについて】
お渡し時にお支払いをお願いいたします。
受け取り日時は改めてご連絡します。

ご質問がありましたら、お気軽にご連絡ください。

Mariko Organics'
),
(
  'booking_cancelled',
  '予約キャンセル通知',
  '【Mariko Organics】予約キャンセルのお知らせ',
  '{{customer_name}} 様

いつもありがとうございます。

{{lesson_date}} のレッスン予約がキャンセルされましたのでお知らせいたします。

別の日程でのご予約をお待ちしております。

ご質問がありましたら、お気軽にご連絡ください。

Mariko Organics'
);
