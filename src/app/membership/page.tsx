import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import Users from "lucide-react/dist/esm/icons/users";
import Star from "lucide-react/dist/esm/icons/star";

const benefits = [
  {
    icon: CalendarCheck,
    title: "先行予約・日程リクエスト",
    description: "一般公開前にレッスンの予約が可能",
  },
  {
    icon: Star,
    title: "メンバー限定クラス",
    description: "特別なテーマのプライベートレッスン",
  },
  {
    icon: ShoppingBag,
    title: "物販の先行予約・限定販売",
    description: "米粉やオリジナル商品の優先購入",
  },
  {
    icon: BookOpen,
    title: "過去レシピのオンライン閲覧",
    description: "これまでのレッスンレシピをいつでも確認",
  },
  {
    icon: Users,
    title: "メンバー以外の方も代表予約",
    description: "お友達の分もまとめて予約OK",
  },
];

export default function MembershipPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav Bar */}
      <header className="flex items-center gap-3 px-6 h-14">
        <Link href="/">
          <ChevronLeft size={24} className="text-foreground" />
        </Link>
        <span className="text-lg font-semibold tracking-tight">
          メンバーシップ
        </span>
      </header>

      <div className="flex flex-col gap-6 p-6">
        {/* Title Section */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Mariko Organics
            <br />
            メンバーシップ
          </h1>
          <p className="text-sm text-muted-foreground">
            年会費 $40 で特典いっぱい
          </p>
        </div>

        {/* Benefits */}
        <div className="flex flex-col gap-3">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-card rounded-[16px] p-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C8F0D8] flex items-center justify-center shrink-0">
                <benefit.icon size={20} className="text-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{benefit.title}</span>
                <span className="text-xs text-muted-foreground">
                  {benefit.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 pt-2">
          <button className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold">
            メンバーシップに申し込む
          </button>
          <p className="text-xs text-muted-foreground text-center">
            年会費 $40（税込）
          </p>
        </div>
      </div>
    </div>
  );
}
