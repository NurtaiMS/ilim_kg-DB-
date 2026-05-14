import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Lock, CheckCircle2, Coins } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { ProfileLayout } from "./ProfileLayout";
import {
  getSettings, calcTotalCoins, ACHIEVEMENTS, AchievementData,
  getPurchasedItems,
} from "../utils/userStore";
import { getSubjectStats, SUBJECT_REGISTRY } from "../utils/subjectProgress";

const BASE_XP   = 1000;
const XP_PER_STAR = 10;
const XP_TO_NEXT  = 1500;

function buildAchievementData(): AchievementData {
  const math    = getSubjectStats(SUBJECT_REGISTRY.math.lsKey,    SUBJECT_REGISTRY.math.subtopics);
  const russian = getSubjectStats(SUBJECT_REGISTRY.russian.lsKey, SUBJECT_REGISTRY.russian.subtopics);
  const science = getSubjectStats(SUBJECT_REGISTRY.science.lsKey, SUBJECT_REGISTRY.science.subtopics);
  const english = getSubjectStats(SUBJECT_REGISTRY.english.lsKey, SUBJECT_REGISTRY.english.subtopics);
  const kyrgyz  = getSubjectStats(SUBJECT_REGISTRY.kyrgyz.lsKey,  SUBJECT_REGISTRY.kyrgyz.subtopics);
  const all = [math, russian, science, english, kyrgyz];
  return {
    totalStars:      all.reduce((a, s) => a + s.stars, 0),
    subjectsDone:    all.filter(s => s.percent === 100).length,
    subjectsStarted: all.filter(s => s.stars > 0).length,
    mathStars:    math.stars,
    englishStars: english.stars,
    kyrgyzStars:  kyrgyz.stars,
    purchaseCount: getPurchasedItems().length,
  };
}

const CATEGORY_LABELS: Record<string, { ru: string; ky: string; color: string }> = {
  learning:  { ru: "Обучение",    ky: "Окуу",        color: "bg-blue-100 text-blue-700 border-blue-200" },
  stars:     { ru: "Звёзды",      ky: "Жылдыздар",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  subjects:  { ru: "Предметы",    ky: "Предметтер",  color: "bg-green-100 text-green-700 border-green-200" },
  social:    { ru: "Магазин",     ky: "Дүкөн",       color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const RARITY_COLORS: Record<string, string> = {
  learning: "from-blue-400 to-blue-600",
  stars:    "from-yellow-400 to-amber-500",
  subjects: "from-green-400 to-emerald-600",
  social:   "from-purple-400 to-violet-600",
};

export function ProfileAchievementsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AchievementData>(buildAchievementData());
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const settings = getSettings();
  const lang = settings.language;
  const totalStars = data.totalStars;
  const earnedXP   = totalStars * XP_PER_STAR;
  const totalXP    = BASE_XP + earnedXP;
  const level      = 7 + Math.floor(earnedXP / 300);
  const totalCoins = calcTotalCoins(totalStars);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("ilim_authenticated");
    if (!isAuthenticated) { navigate("/signin"); return; }
    setData(buildAchievementData());
  }, [navigate]);

  const categories = ["all", "learning", "stars", "subjects", "social"];
  const filtered = ACHIEVEMENTS.filter(a => activeCategory === "all" || a.category === activeCategory);
  const unlocked = ACHIEVEMENTS.filter(a => a.check(data)).length;
  const totalRewards = ACHIEVEMENTS.filter(a => a.check(data)).reduce((s, a) => s + a.reward, 0);

  return (
    <ProfileLayout
      title="Достижения"
      titleKY="Жетишкендиктер"
      language={lang}
      totalXP={totalXP}
      xpToNext={XP_TO_NEXT}
      level={level}
      totalCoins={totalCoins}
    >
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-2 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <div className="font-bold text-2xl text-yellow-700">{unlocked}</div>
          <div className="text-xs text-yellow-600">{lang === "RU" ? "Получено" : "Алынды"}</div>
        </Card>
        <Card className="p-4 border-2 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 text-center">
          <div className="text-3xl mb-1">🔒</div>
          <div className="font-bold text-2xl text-gray-600">{ACHIEVEMENTS.length - unlocked}</div>
          <div className="text-xs text-gray-500">{lang === "RU" ? "Осталось" : "Калды"}</div>
        </Card>
        <Card className="p-4 border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center">
          <div className="text-3xl mb-1">📊</div>
          <div className="font-bold text-2xl text-green-700">{Math.round((unlocked / ACHIEVEMENTS.length) * 100)}%</div>
          <div className="text-xs text-green-600">{lang === "RU" ? "Прогресс" : "Прогресс"}</div>
        </Card>
        <Card className="p-4 border-2 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-center">
          <div className="text-3xl mb-1">🪙</div>
          <div className="font-bold text-2xl text-orange-700">{totalRewards}</div>
          <div className="text-xs text-orange-600">{lang === "RU" ? "Монет получено" : "Тыйын алынды"}</div>
        </Card>
      </div>

      {/* Progress bar */}
      <Card className="p-5 border-2 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">{lang === "RU" ? "Общий прогресс достижений" : "Жетишкендиктердин жалпы прогресси"}</span>
          <span className="font-bold text-primary">{unlocked}/{ACHIEVEMENTS.length}</span>
        </div>
        <Progress value={(unlocked / ACHIEVEMENTS.length) * 100} className="h-4" />
      </Card>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all min-h-[44px] ${
              activeCategory === cat
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-white border-border hover:border-primary/50"
            }`}
          >
            {cat === "all"
              ? (lang === "RU" ? "Все" : "Баары")
              : (lang === "RU" ? CATEGORY_LABELS[cat].ru : CATEGORY_LABELS[cat].ky)}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(ach => {
          const done = ach.check(data);
          return (
            <Card key={ach.id}
              className={`p-5 border-2 transition-all relative overflow-hidden ${
                done
                  ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-md"
                  : "border-border bg-muted/20 opacity-70"
              }`}
            >
              {done && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              )}
              {!done && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${RARITY_COLORS[ach.category]} flex items-center justify-center text-3xl mb-3 shadow ${!done ? "grayscale opacity-60" : ""}`}>
                {ach.icon}
              </div>

              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border mb-2 ${CATEGORY_LABELS[ach.category].color}`}>
                {lang === "RU" ? CATEGORY_LABELS[ach.category].ru : CATEGORY_LABELS[ach.category].ky}
              </div>

              <h3 className="font-bold mb-1">{lang === "RU" ? ach.nameRU : ach.nameKY}</h3>
              <p className="text-sm text-muted-foreground mb-3">{lang === "RU" ? ach.descRU : ach.descKY}</p>

              <div className={`flex items-center gap-1.5 text-sm font-semibold ${done ? "text-amber-600" : "text-muted-foreground"}`}>
                <Coins className="w-4 h-4" />
                +{ach.reward} {lang === "RU" ? "монет" : "тыйын"}
              </div>
            </Card>
          );
        })}
      </div>
    </ProfileLayout>
  );
}
