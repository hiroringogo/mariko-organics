import Link from "next/link";
import Users from "lucide-react/dist/esm/icons/users";

interface LessonCardProps {
  id: string;
  month: string;
  day: string;
  title: string;
  time: string;
  seatsRemaining: number;
  totalSeats: number;
  colorVariant?: "primary" | "terracotta";
}

export function LessonCard({
  id,
  month,
  day,
  title,
  time,
  seatsRemaining,
  totalSeats,
  colorVariant = "primary",
}: LessonCardProps) {
  const bgColor = colorVariant === "primary" ? "bg-primary" : "bg-terracotta";
  const currentBookings = totalSeats - seatsRemaining;

  return (
    <Link href={`/lessons/${id}`}>
      <div className="flex items-center gap-4 bg-card rounded-[16px] p-4 shadow-sm">
        <div
          className={`${bgColor} flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0`}
        >
          <span className="text-[11px] font-semibold text-primary-foreground">
            {month}
          </span>
          <span className="text-[22px] font-bold leading-none text-primary-foreground tracking-tight">
            {day}
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[15px] font-semibold text-foreground">
            {title}
          </span>
          <span className="text-[13px] text-muted-foreground">{time}</span>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">
              現在{currentBookings}名 / あと{seatsRemaining}名で開催
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
