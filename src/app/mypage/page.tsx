import { TabBar } from "@/components/tab-bar";

export default function MyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-[84px]">
      <header className="flex items-center px-6 h-14">
        <span className="text-xl font-bold text-primary tracking-tight">
          マイページ
        </span>
      </header>
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        準備中...
      </div>
      <TabBar />
    </div>
  );
}
