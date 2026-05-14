import { Link, useNavigate } from "react-router";
import { GraduationCap, ArrowLeft, Coins, Zap } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { getEquipped } from "../utils/userStore";

interface ProfileLayoutProps {
  children: React.ReactNode;
  title: string;
  titleKY?: string;
  language: "RU" | "KY";
  totalXP: number;
  xpToNext: number;
  level: number;
  totalCoins: number;
  backTo?: string;
}

export function ProfileLayout({
  children, title, titleKY, language, totalXP, xpToNext, level, totalCoins, backTo = "/dashboard"
}: ProfileLayoutProps) {
  const navigate = useNavigate();
  const equipped = getEquipped();
  const xpPct = Math.min((totalXP / xpToNext) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <header className="bg-white border-b-2 border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 rounded-xl hover:bg-muted/60"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">
                  {language === "RU" ? "Назад" : "Артка"}
                </span>
              </button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:inline">
                  ILIM.KG
                </span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="font-bold text-lg">
                {language === "KY" && titleKY ? titleKY : title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col gap-1 min-w-[160px]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-secondary" />
                    {language === "RU" ? "Уровень" : "Деңгээл"} {level}
                  </span>
                  <span className="text-xs text-muted-foreground">{totalXP}/{xpToNext} XP</span>
                </div>
                <Progress value={xpPct} className="h-2 bg-muted" />
              </div>
              <div className="flex items-center gap-1.5 bg-secondary/10 px-3 py-2 rounded-full border-2 border-secondary/30 min-h-[44px]">
                <Coins className="w-4 h-4 text-secondary" />
                <span className="font-bold text-sm">{totalCoins}</span>
              </div>
              <Link to="/dashboard">
                <Avatar className={`w-11 h-11 border-4 ${equipped.frame} cursor-pointer hover:scale-105 transition-transform`}>
                  <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-secondary">
                    {equipped.avatar}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
