import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  GraduationCap,
  Globe,
  Coins,
  Trophy,
  Crown,
  Medal,
  ShoppingBag,
  Calculator,
  BookOpen,
  Star,
  Play,
  Zap,
  Flame,
  LogOut,
  BookMarked,
  FlaskConical,
  TrendingUp,
  User,
  Settings,
  HelpCircle,
  Award,
  ChevronRight,
  Bell,
  Volume2,
  VolumeX,
  BellOff,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { clearCurrentUser } from "../utils/authStore";
import { getSettings, saveSettings } from "../utils/userStore";

const XP_TO_NEXT_LEVEL = 100;

// Конфигурация предметов
const SUBJECTS = [
  { id: "math", name: "Математика", nameKy: "Математика", icon: Calculator, color: "from-blue-500 to-blue-600", route: "/subject/math", totalTasks: 45 },
  { id: "russian", name: "Русский язык", nameKy: "Орус тили", icon: BookOpen, color: "from-green-500 to-green-700", route: "/subject/russian", totalTasks: 45 },
  { id: "science", name: "Наука", nameKy: "Илим", icon: FlaskConical, color: "from-amber-500 to-amber-700", route: "/subject/science", totalTasks: 45 },
  { id: "english", name: "Английский язык", nameKy: "Англис тили", icon: Globe, color: "from-red-500 to-red-700", route: "/subject/english", totalTasks: 45 },
  { id: "kyrgyz", name: "Кыргызский язык", nameKy: "Кыргыз тили", icon: BookMarked, color: "from-cyan-500 to-teal-700", route: "/subject/kyrgyz", totalTasks: 45 },
];

type PanelType = null | "about" | "achievements" | "notifications" | "help";

export function StudentDashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"KY" | "RU">("RU");
  const [userData, setUserData] = useState({ name: "Ученик", avatar: "🎓", id: "" });
  const [profileOpen, setProfileOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [appSettings, setAppSettings] = useState(getSettings());
  
  // Данные из MongoDB
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [coins, setCoins] = useState(0);
  const [taskProgress, setTaskProgress] = useState<any>({});
  const [subjectsProgress, setSubjectsProgress] = useState<Record<string, { score?: number; tasksCompleted?: number }>>({});
  const [loading, setLoading] = useState(true);
  const [totalStarsAll, setTotalStarsAll] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Подсчёт всех звёзд из taskProgress
  const calculateTotalStars = (
    progress: any,
    fallbackSubjects?: Record<string, { score?: number; tasksCompleted?: number }>
  ) => {
    if (progress && Object.keys(progress).length > 0) {
      let total = 0;
      for (const subtopicId in progress) {
        const subtopic = progress[subtopicId];
        if (subtopic && typeof subtopic === 'object') {
          for (const taskId in subtopic) {
            if (subtopic[taskId]?.result === true) {
              total++;
            }
          }
        }
      }
      return total;
    }

    if (fallbackSubjects) {
      return Object.values(fallbackSubjects).reduce(
        (sum, subject) => sum + (subject?.tasksCompleted || 0),
        0
      );
    }

    return 0;
  };

  const getSubjectIdFromSubtopic = (subtopicId: string) => {
    if (!subtopicId) return null;
    if (/^(numbers_|addition_|subtraction_|addSub_|word_)/.test(subtopicId)) return 'math';
    if (/^ru_/.test(subtopicId)) return 'russian';
    if (/^ky_/.test(subtopicId)) return 'kyrgyz';
    if (/^eng_/.test(subtopicId)) return 'english';
    if (/^(phy_|geo_|bio_)/.test(subtopicId)) return 'science';
    return null;
  };

  const getSubjectTasksCompleted = (subjectId: string) => {
    const taskCount = Object.entries(taskProgress).reduce((sum, [subtopicId, tasks]) => {
      const mappedSubject = getSubjectIdFromSubtopic(subtopicId);
      if (mappedSubject !== subjectId || !tasks || typeof tasks !== 'object') return sum;
      return sum + Object.values(tasks).filter((task: any) => task?.result === true).length;
    }, 0);

    if (taskCount > 0) return taskCount;
    return subjectsProgress[subjectId]?.tasksCompleted || 0;
  };

  // Загрузка данных из MongoDB
  const loadProgress = async (studentId: string) => {
    try {
      console.log("📡 Загрузка прогресса для:", studentId);
      const res = await fetch(`http://localhost:5001/api/user/progress/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        console.log("📊 Получены данные:", data);
        setLevel(data.level || 1);
        setExperience(data.experience || 0);
        setCoins(data.coins || 0);
        setSubjectsProgress(data.subjectsProgress || {});

        const progressData = data.taskProgress && Object.keys(data.taskProgress).length > 0 ? data.taskProgress : {};
        setTaskProgress(progressData);

        const total = calculateTotalStars(progressData, data.subjectsProgress);
        setTotalStarsAll(total);
        console.log(`✅ Загружен прогресс, всего звёзд: ${total}`);
      }
    } catch (err) {
      console.error("Ошибка загрузки прогресса:", err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка таблицы лидеров
  const loadLeaderboard = async () => {
    try {
      const query = userData.id ? `?currentUserId=${encodeURIComponent(userData.id)}` : "";
      const res = await fetch(`http://localhost:5001/api/users/leaderboard${query}`);
      if (res.ok) {
        const data = await res.json();
        const withRanks = data.map((user: any, idx: number) => ({
          ...user,
          rank: idx + 1,
          isCurrentUser: user.id === userData.id
        }));
        setLeaderboard(withRanks);
      }
    } catch (err) {
      console.error("Ошибка загрузки лидеров:", err);
      setLeaderboard([
        { id: userData.id, name: userData.name, points: experience, avatar: userData.avatar, rank: 1, isCurrentUser: true }
      ]);
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("ilim_authenticated");
    if (!isAuthenticated) { 
      navigate("/signin"); 
      return; 
    }

    let userId = null;
    let userName = "Ученик";
    let userAvatar = "🎓";
    
    const currentUserRaw = localStorage.getItem("ilim_current_user");
    if (currentUserRaw) {
      try {
        const currentUser = JSON.parse(currentUserRaw);
        userId = currentUser.id || currentUser._id;
        userName = currentUser.username || currentUser.name || "Ученик";
        userAvatar = currentUser.avatar || "🎓";
      } catch (e) {}
    }
    
    if (!userId) {
      const savedUser = localStorage.getItem("ilim_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          userId = user.id || user._id;
          userName = user.username || user.name || "Ученик";
          userAvatar = user.avatar || "🎓";
        } catch (e) {}
      }
    }
    
    setUserData({ name: userName, avatar: userAvatar, id: userId || "" });
    
    if (userId) {
      loadProgress(userId);
      loadLeaderboard();
    } else {
      setLoading(false);
    }

    const s = getSettings();
    setAppSettings(s);
    setLanguage(s.language);
  }, [navigate]);

  useEffect(() => {
    if (userData.id) {
      loadLeaderboard();
    }
  }, [userData.id, experience]);

  useEffect(() => {
    if (!appSettings.notifications || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const showDesktopNotification = () => {
      if (Notification.permission === "granted") {
        new Notification("ILIM.KG", {
          body: language === "RU" ? "Напоминание: зайди в урок и заработай монеты!" : "Эскертме: сабакка кирип, тыйын таап ал!"
        });
      }
    };

    if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showDesktopNotification();
        }
      });
    } else if (Notification.permission === "granted") {
      showDesktopNotification();
    }
  }, [appSettings.notifications, language]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setActivePanel(null);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Получение звёзд для математики
  const getStarsForSubject = (subject: typeof SUBJECTS[0]) => {
    return getSubjectTasksCompleted(subject.id);
  };

  const getPercentForSubject = (subject: typeof SUBJECTS[0]) => {
    const tasksCompleted = getStarsForSubject(subject);
    return Math.round((tasksCompleted / subject.totalTasks) * 100);
  };

  const currentLevel = level;
  const xpInCurrentLevel = experience % XP_TO_NEXT_LEVEL;
  const xpPct = (xpInCurrentLevel / XP_TO_NEXT_LEVEL) * 100;

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/signin");
  };

  const updateSetting = (key: "sound" | "notifications" | "animations", value: boolean) => {
    saveSettings({ [key]: value } as any);
    setAppSettings(s => ({ ...s, [key]: value }));
  };

  const updateLanguage = (l: "KY" | "RU") => {
    setLanguage(l);
    saveSettings({ language: l });
    setAppSettings(s => ({ ...s, language: l }));
  };

  const t = {
    KY: { greeting: "Салам", dailyChallenge: "Күндүк тапшырма", mySubjects: "Менин предметтерим",
          leaderboard: "Лидерлер тизмеси", shop: "Дүкөн", play: "Башта", completed: "Аткарылды",
          progress: "Прогресс", lessons: "сабак" },
    RU: { greeting: "Привет", dailyChallenge: "Ежедневный вызов", mySubjects: "Мои предметы",
          leaderboard: "Таблица лидеров", shop: "Магазин", play: "Играть", completed: "Завершено",
          progress: "Прогресс", lessons: "уроков" },
  }[language];

  const dailyChallenges = SUBJECTS.slice(0, 3).map(sub => {
    const tasksCompleted = getStarsForSubject(sub);
    const percent = getPercentForSubject(sub);
    return {
      id: sub.id,
      title: language === "RU" ? `${sub.name}: Задания` : `${sub.nameKy}: Тапшырмалар`,
      completed: percent === 100,
      started: tasksCompleted > 0,
      tasksCompleted,
      percent,
      icon: sub.icon,
      color: sub.color,
      route: sub.route
    };
  });
  const completedChallenges = dailyChallenges.filter(c => c.started).length;

  const fireLevelClass = completedChallenges === 3
    ? `bg-orange-500 shadow-[0_0_24px_rgba(251,146,60,0.45)] ${appSettings.animations ? "animate-[pulse_0.9s_ease-in-out_infinite]" : ""}`
    : completedChallenges === 2
    ? `bg-orange-500 shadow-[0_0_20px_rgba(251,146,60,0.35)] ${appSettings.animations ? "animate-ping" : ""}`
    : completedChallenges === 1
    ? `bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.28)] ${appSettings.animations ? "animate-pulse" : ""}`
    : `bg-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.25)] ${appSettings.animations ? "animate-pulse" : ""}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка прогресса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <header className="bg-white border-b-2 border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ILIM.KG
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex bg-muted rounded-full p-1">
                {(["KY", "RU"] as const).map(l => (
                  <button key={l} onClick={() => updateLanguage(l)}
                    className={`px-4 py-2 rounded-full transition-all min-h-[44px] ${language === l ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="hidden md:flex flex-col gap-1 min-w-[200px]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3 text-secondary" />
                    {language === "RU" ? "Уровень" : "Деңгээл"} {currentLevel}
                  </span>
                  <span className="text-xs text-muted-foreground">{experience}/{XP_TO_NEXT_LEVEL} XP</span>
                </div>
                <Progress value={xpPct} className="h-3 bg-muted" />
              </div>

              <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full border-2 border-secondary/30 min-h-[44px]">
                <Coins className="w-5 h-5 text-secondary" />
                <span className="font-bold text-foreground">{coins}</span>
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => { setProfileOpen(o => !o); setActivePanel(null); }}
                  className="focus:outline-none"
                >
                  <Avatar className="w-12 h-12 border-4 border-primary cursor-pointer hover:scale-105 transition-transform">
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary">
                      {userData.avatar}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-72 bg-white rounded-2xl shadow-2xl border-2 border-border overflow-hidden z-[100]">
                    <div className="bg-gradient-to-br from-primary to-secondary p-5 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-sm border-2 border-white/30">
                          {userData.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{userData.name}</div>
                          <div className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {language === "RU" ? "Уровень" : "Деңгээл"} {currentLevel} · {experience} XP
                          </div>
                          <div className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                            <Coins className="w-3 h-3" /> {coins} {language === "RU" ? "монет" : "тыйын"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <div className="border-t border-border mt-1 pt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-all text-red-500">
                          <LogOut className="w-5 h-5 flex-shrink-0" />
                          <span className="flex-1 text-left text-sm font-medium">
                            {language === "RU" ? "Выйти из аккаунта" : "Аккаунттан чыгуу"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="mb-8">
              <h1 className="text-4xl mb-2 font-bold">{t.greeting}, {userData.name}! 👋</h1>
              <p className="text-lg text-muted-foreground">
                {language === "RU" ? "Продолжай учиться и исследуй мир знаний" : "Окууну улант жана билимдин дүйнөсүн изилде"}
              </p>
            </div>

            {totalStarsAll > 0 && (
              <div className="mb-6 bg-gradient-to-r from-primary to-secondary rounded-2xl px-6 py-4 text-white shadow-md flex items-center gap-4">
                <div className="text-3xl">🏆</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{language === "RU" ? "Общий прогресс" : "Жалпы прогресс"}</span>
                    <span className="flex items-center gap-1 text-yellow-300 font-bold">
                      <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                      {totalStarsAll} {language === "RU" ? "звёзд" : "жылдыз"}
                    </span>
                  </div>
                  <Progress value={Math.min((totalStarsAll / (45 * 5)) * 100, 100)} className="h-2 bg-white/25" />
                </div>
                <div className="text-sm opacity-80 font-semibold whitespace-nowrap">+{totalStarsAll * 10} XP</div>
              </div>
            )}

            <Card className="p-6 sm:p-8 mb-8 bg-gradient-to-br from-primary/5 via-white to-secondary/5 border-2 border-primary/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`daily-fire-shell ${fireLevelClass}`}>
                    <div className="daily-fire-core">
                      <span className="daily-fire-flame flame-main" />
                      <span className="daily-fire-flame flame-secondary" />
                      <span className="daily-fire-flame flame-top" />
                      <div className="daily-fire-icon absolute inset-0 flex items-center justify-center text-2xl">🔥</div>
                    </div>
                    {completedChallenges === 3 && (
                      <>
                        <span className="daily-fire-spark spark-1" style={{ animationDelay: "0s" }} />
                        <span className="daily-fire-spark spark-2" style={{ animationDelay: "0.2s" }} />
                        <span className="daily-fire-spark spark-3" style={{ animationDelay: "0.4s" }} />
                        <span className="daily-fire-spark spark-4" style={{ animationDelay: "0.6s" }} />
                      </>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{t.dailyChallenge}</h2>
                    <p className="text-sm text-muted-foreground">{completedChallenges}/3 {language === "RU" ? "выполнено" : "аткарылды"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{completedChallenges}/3</div>
                  <Progress value={(completedChallenges / 3) * 100} className="w-20 h-2 mt-1" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {dailyChallenges.map(ch => (
                  <Card key={ch.id} className={`p-4 border-2 transition-all ${ch.completed ? "bg-green-50 border-green-300 opacity-75" : "border-border hover:border-primary/50 hover:shadow-md cursor-pointer"}`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center mb-3`}>
                      <ch.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="mb-2 text-sm font-bold">{ch.title}</h4>
                    {ch.completed ? (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-green-600" />{t.completed}
                      </span>
                    ) : (
                      <Link to={ch.route}>
                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90 min-h-[44px]">{t.play}</Button>
                      </Link>
                    )}
                  </Card>
                ))}
              </div>
            </Card>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">{t.mySubjects}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SUBJECTS.map(sub => {
                  const stars = getStarsForSubject(sub);
                  const percent = getPercentForSubject(sub);
                  const hasStarted = stars > 0;
                  const isDone = percent === 100;
                  return (
                    <Card key={sub.id}
                      className={`p-6 border-2 hover:border-primary/50 transition-all hover:shadow-lg group cursor-pointer relative overflow-hidden ${hasStarted ? "border-primary/30 bg-primary/[0.02]" : ""}`}>
                      {hasStarted && !isDone && (
                        <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {language === "RU" ? "В процессе" : "Процессте"}
                        </div>
                      )}
                      {isDone && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Trophy className="w-3 h-3" />{language === "RU" ? "Готово" : "Бүттү"}
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                          <sub.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex items-center gap-1 mt-7">
                          <Star className={`w-4 h-4 ${hasStarted ? "fill-yellow-400 text-yellow-400" : "fill-secondary text-secondary"}`} />
                          <span className="font-bold text-foreground">
                            {stars}
                            <span className="text-muted-foreground font-normal text-sm">/{sub.totalTasks}</span>
                          </span>
                        </div>
                      </div>
                      <h3 className="mb-1 font-bold">{language === "RU" ? sub.name : sub.nameKy}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{sub.totalTasks} {t.lessons}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t.progress}</span>
                          <span className="font-bold text-primary">{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                      <Link to={sub.route}>
                        <Button className="w-full bg-primary hover:bg-primary/90 min-h-[44px]">
                          <Play className="w-4 h-4 mr-2" />
                          {hasStarted && !isDone
                            ? (language === "RU" ? "Продолжить" : "Улантуу")
                            : isDone
                            ? (language === "RU" ? "Повторить" : "Кайталоо")
                            : t.play}
                        </Button>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {totalStarsAll > 0 && (
              <Card className="p-5 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-white shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-primary">{language === "RU" ? "Мой прогресс" : "Менин прогрессим"}</h3>
                </div>
                <div className="space-y-3">
                  {SUBJECTS.map(sub => {
                    const stars = getStarsForSubject(sub);
                    if (stars === 0) return null;
                    const percent = getPercentForSubject(sub);
                    return (
                      <Link to={sub.route} key={sub.id}>
                        <div className="flex items-center gap-2 hover:bg-muted/50 rounded-xl p-2 transition-all">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sub.color} flex items-center justify-center flex-shrink-0`}>
                            <sub.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-xs font-semibold truncate">{language === "RU" ? sub.name : sub.nameKy}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">{stars}/{sub.totalTasks}</span>
                            </div>
                            <Progress value={percent} className="h-1.5" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-primary/10 rounded-xl p-2 text-center">
                    <div className="font-bold text-primary">+{totalStarsAll * 10}</div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-2 text-center">
                    <div className="font-bold text-yellow-600">+{totalStarsAll * 5}</div>
                    <div className="text-xs text-muted-foreground">{language === "RU" ? "Монет" : "Тыйын"}</div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-5 border-2 border-border shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold">{language === "RU" ? "Быстрые настройки" : "Тез жөндөөлөр"}</h3>
                </div>
                <Link to="/settings">
                  <span className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                    {language === "RU" ? "Все" : "Баары"}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </div>

              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2 font-medium">{language === "RU" ? "Язык интерфейса" : "Интерфейс тили"}</div>
                <div className="flex gap-2">
                  {(["RU", "KY"] as const).map(l => (
                    <button key={l} onClick={() => updateLanguage(l)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all min-h-[44px] ${language === l ? "border-primary bg-primary text-white shadow" : "border-border hover:border-primary/50 bg-white"}`}>
                      {l === "RU" ? "🇷🇺 Рус" : "🇰🇬 Кырг"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl mb-2">
                <div className="flex items-center gap-2">
                  {appSettings.sound ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <div className="text-sm font-medium">{language === "RU" ? "Звук" : "Үн"}</div>
                    <div className="text-xs text-muted-foreground">{language === "RU" ? "Эффекты при ответах" : "Жооп берүүдө үн"}</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("sound", !appSettings.sound)}
                  className={`w-11 h-6 rounded-full relative transition-all flex-shrink-0 ${appSettings.sound ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${appSettings.sound ? "right-1" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl mb-4">
                <div className="flex items-center gap-2">
                  {appSettings.notifications ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <div className="text-sm font-medium">{language === "RU" ? "Уведомления" : "Билдирмелер"}</div>
                    <div className="text-xs text-muted-foreground">{language === "RU" ? "Напоминания об уроках" : "Сабак эскертмелери"}</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("notifications", !appSettings.notifications)}
                  className={`w-11 h-6 rounded-full relative transition-all flex-shrink-0 ${appSettings.notifications ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${appSettings.notifications ? "right-1" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-secondary" />
                  <div>
                    <div className="text-sm font-medium">{language === "RU" ? "Анимации" : "Анимациялар"}</div>
                    <div className="text-xs text-muted-foreground">{language === "RU" ? "Эффекты интерфейса" : "Интерфейс эффекттери"}</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("animations", !appSettings.animations)}
                  className={`w-11 h-6 rounded-full relative transition-all flex-shrink-0 ${appSettings.animations ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${appSettings.animations ? "right-1" : "left-1"}`} />
                </button>
              </div>

              <Link to="/settings">
                <Button variant="outline" className="w-full min-h-[44px] border-2 hover:border-primary hover:text-primary transition-all">
                  <Settings className="w-4 h-4 mr-2" />
                  {language === "RU" ? "Открыть настройки" : "Жөндөөлөрдү ачуу"}
                </Button>
              </Link>
            </Card>

            {/* Динамическая таблица лидеров */}
            <Card className="p-6 border-2 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-secondary" />
                <h3 className="font-bold text-lg">{t.leaderboard}</h3>
              </div>
              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((user: any) => (
                    <div key={user.id}   
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${user.isCurrentUser ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30" : "hover:bg-muted/50"}`}>
                      <div className="flex-shrink-0 w-8 text-center">
                        {user.rank === 1 && <Crown className="w-6 h-6 text-yellow-500" />}
                        {user.rank === 2 && <Medal className="w-6 h-6 text-gray-400" />}
                        {user.rank === 3 && <Medal className="w-6 h-6 text-amber-600" />}
                        {user.rank > 3 && <span className="font-bold text-muted-foreground">#{user.rank}</span>}
                      </div>
                      <div className="text-2xl">{user.avatar || "🎓"}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`truncate ${user.isCurrentUser ? "font-bold" : ""}`}>{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.totalExperience || 0} {language === "RU" ? "баллов" : "упай"}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    {language === "RU" ? "Нет данных" : "Маалымат жок"}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 border-2 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/30 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-6 h-6 text-secondary" />
                <h3 className="font-bold text-lg">{t.shop}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {language === "RU" ? "Используй монеты, чтобы украсить профиль!" : "Тыйындарды колдонуп, профилиңди кооздот!"}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {["🎨", "🎭", "🎪", "🎯", "🎸", "🎮"].map((e, i) => (
                  <div key={i} className="aspect-square bg-white rounded-xl border-2 border-border hover:border-secondary transition-all cursor-pointer flex items-center justify-center text-2xl hover:scale-105">{e}</div>
                ))}
              </div>
              <Link to="/shop" className="w-full">
                <Button className="w-full bg-secondary hover:bg-secondary/90 min-h-[44px]">
                  {language === "RU" ? "Открыть магазин" : "Дүкөндү ачуу"}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}