import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Star, Zap, Coins, Trophy, BookOpen, Calculator, Globe, BookMarked, FlaskConical, TrendingUp, Award } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ProfileLayout } from "./ProfileLayout";
import { getEquipped, getSettings, calcTotalCoins } from "../utils/userStore";
import { getSubjectStats, SUBJECT_REGISTRY } from "../utils/subjectProgress";

const XP_PER_STAR   = 10;
const BASE_XP       = 1000;
const BASE_COINS    = 300;
const XP_TO_NEXT    = 1500;

function getAllStats() {
  return {
    math:    getSubjectStats(SUBJECT_REGISTRY.math.lsKey,    SUBJECT_REGISTRY.math.subtopics),
    russian: getSubjectStats(SUBJECT_REGISTRY.russian.lsKey, SUBJECT_REGISTRY.russian.subtopics),
    science: getSubjectStats(SUBJECT_REGISTRY.science.lsKey, SUBJECT_REGISTRY.science.subtopics),
    english: getSubjectStats(SUBJECT_REGISTRY.english.lsKey, SUBJECT_REGISTRY.english.subtopics),
    kyrgyz:  getSubjectStats(SUBJECT_REGISTRY.kyrgyz.lsKey,  SUBJECT_REGISTRY.kyrgyz.subtopics),
  };
}

export function ProfileAboutPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(getAllStats());
  const [equipped, setEquippedState] = useState(getEquipped());
  const settings = getSettings();
  const lang = settings.language;

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("ilim_authenticated");
    if (!isAuthenticated) { navigate("/signin"); return; }
    setStats(getAllStats());
    setEquippedState(getEquipped());
  }, [navigate]);

  const totalStars = Object.values(stats).reduce((a, s) => a + s.stars, 0);
  const earnedXP   = totalStars * XP_PER_STAR;
  const totalXP    = BASE_XP + earnedXP;
  const level      = 7 + Math.floor(earnedXP / 300);
  const xpInLevel  = earnedXP % 300;
  const xpPct      = Math.min((totalXP / XP_TO_NEXT) * 100, 100);
  const totalCoins = calcTotalCoins(totalStars);
  const subjectsDone = Object.values(stats).filter(s => s.percent === 100).length;
  const subjectsStarted = Object.values(stats).filter(s => s.stars > 0).length;

  const subjects = [
    { name: lang === "RU" ? "Математика"      : "Математика",   icon: Calculator,   color: "from-blue-500 to-blue-600",   route: "/subject/math",    key: "math" as const },
    { name: lang === "RU" ? "Русский язык"    : "Орус тили",    icon: BookOpen,     color: "from-green-500 to-green-700", route: "/subject/russian", key: "russian" as const },
    { name: lang === "RU" ? "Наука"           : "Илим",         icon: FlaskConical, color: "from-amber-500 to-amber-700", route: "/subject/science", key: "science" as const },
    { name: lang === "RU" ? "Английский"      : "Англис тили",  icon: Globe,        color: "from-red-500 to-red-700",     route: "/subject/english", key: "english" as const },
    { name: lang === "RU" ? "Кыргызский"      : "Кыргыз тили",  icon: BookMarked,   color: "from-cyan-500 to-teal-700",   route: "/subject/kyrgyz",  key: "kyrgyz" as const },
  ];

  const statCards = [
    { icon: "⭐", value: totalStars,      label: lang === "RU" ? "Звёзд собрано"   : "Жылдыздар",  color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
    { icon: "⚡", value: totalXP,         label: lang === "RU" ? "Всего XP"        : "Жалпы XP",    color: "bg-blue-50 border-blue-200 text-blue-700" },
    { icon: "🪙", value: totalCoins,      label: lang === "RU" ? "Монет"           : "Тыйын",       color: "bg-orange-50 border-orange-200 text-orange-700" },
    { icon: "📚", value: subjectsDone,    label: lang === "RU" ? "Предметов пройдено" : "Предметтер", color: "bg-green-50 border-green-200 text-green-700" },
  ];

  return (
    <ProfileLayout
      title="Об аккаунте"
      titleKY="Аккаунт жөнүндө"
      language={lang}
      totalXP={totalXP}
      xpToNext={XP_TO_NEXT}
      level={level}
      totalCoins={totalCoins}
    >
      <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        {/* Left: Profile card */}
        <div className="space-y-5">
          {/* Avatar card */}
          <Card className="p-6 border-2 text-center shadow-lg">
            <div className="relative inline-block mb-4">
              <Avatar className={`w-28 h-28 border-4 ${equipped.frame} mx-auto`}>
                <AvatarFallback className="text-5xl bg-gradient-to-br from-primary to-secondary">
                  {equipped.avatar}
                </AvatarFallback>
              </Avatar>
              {equipped.badge && (
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-full border-2 border-border flex items-center justify-center text-xl shadow-sm">
                  {equipped.badge}
                </div>
              )}
            </div>
            <h2 className="font-bold text-xl mb-1">{settings.username}</h2>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <Zap className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-muted-foreground">
                {lang === "RU" ? "Уровень" : "Деңгээл"} {level}
              </span>
            </div>
            <div className="mb-2 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{lang === "RU" ? "Прогресс уровня" : "Деңгээл прогресси"}</span>
                <span>{xpInLevel}/300 XP</span>
              </div>
              <Progress value={(xpInLevel / 300) * 100} className="h-3" />
            </div>
            <Link to="/shop">
              <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-secondary/20 to-secondary/10 text-secondary border border-secondary/30 text-sm font-semibold hover:from-secondary/30 transition-all">
                {lang === "RU" ? "✨ Настроить профиль" : "✨ Профилди өзгөртүү"}
              </button>
            </Link>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((s, i) => (
              <Card key={i} className={`p-4 border-2 ${s.color} text-center`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-bold text-lg">{s.value}</div>
                <div className="text-xs opacity-80">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* XP Progress detailed */}
          <Card className="p-6 border-2 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">{lang === "RU" ? "Прогресс XP и уровня" : "XP жана деңгээл прогресси"}</h3>
            </div>
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-5 mb-5">
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-black text-primary">{level}</span>
                <span className="text-muted-foreground mb-1">{lang === "RU" ? "уровень" : "деңгээл"}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{lang === "RU" ? "До следующего уровня" : "Кийинки деңгээлге"}</span>
                <span className="font-bold text-primary">{300 - xpInLevel} XP</span>
              </div>
              <Progress value={(xpInLevel / 300) * 100} className="h-4" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{xpInLevel} XP</span>
                <span>300 XP</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <div className="font-bold text-primary text-lg">{BASE_XP + earnedXP}</div>
                <div className="text-xs text-muted-foreground">{lang === "RU" ? "Всего XP" : "Жалпы XP"}</div>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <div className="font-bold text-secondary text-lg">+{earnedXP}</div>
                <div className="text-xs text-muted-foreground">{lang === "RU" ? "Заработано" : "Топтолгон"}</div>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <div className="font-bold text-green-600 text-lg">{totalStars * 25}</div>
                <div className="text-xs text-muted-foreground">{lang === "RU" ? "XP со звёзд" : "Жылдыздан XP"}</div>
              </div>
            </div>
          </Card>

          {/* Subjects progress */}
          <Card className="p-6 border-2 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-lg">{lang === "RU" ? "Прогресс по предметам" : "Предметтер боюнча прогресс"}</h3>
              <span className="ml-auto text-sm text-muted-foreground">{subjectsDone}/5 {lang === "RU" ? "завершено" : "бүтүрүлдү"}</span>
            </div>
            <div className="space-y-4">
              {subjects.map(sub => {
                const s = stats[sub.key];
                return (
                  <Link to={sub.route} key={sub.key}>
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/40 transition-all group">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sub.color} flex items-center justify-center flex-shrink-0 shadow`}>
                        <sub.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{sub.name}</span>
                          <span className="text-sm font-bold text-primary">{s.percent}%</span>
                        </div>
                        <Progress value={s.percent} className="h-2.5" />
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{s.stars}/{s.totalTasks}</span>
                        </div>
                      </div>
                      {s.percent === 100 && (
                        <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Overall progress */}
          <Card className="p-6 border-2 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <h3 className="font-bold">{lang === "RU" ? "Общий прогресс платформы" : "Платформанын жалпы прогресси"}</h3>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{totalStars} / {45 * 5} {lang === "RU" ? "звёзд" : "жылдыз"}</span>
              <span className="font-bold text-primary">{Math.round((totalStars / (45 * 5)) * 100)}%</span>
            </div>
            <Progress value={Math.min((totalStars / (45 * 5)) * 100, 100)} className="h-5 rounded-full" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="font-bold text-primary">{subjectsStarted}</div>
                <div className="text-xs text-muted-foreground">{lang === "RU" ? "Начато" : "Башталган"}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">{subjectsDone}</div>
                <div className="text-xs text-muted-foreground">{lang === "RU" ? "Завершено" : "Бүтүрүлгөн"}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-muted-foreground">{5 - subjectsStarted}</div>
                <div className="text-xs text-muted-foreground">{lang === "RU" ? "Не начато" : "Башталган эмес"}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ProfileLayout>
  );
}
