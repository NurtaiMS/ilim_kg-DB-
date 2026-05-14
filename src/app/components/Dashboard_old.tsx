import { Link } from "react-router";
import { 
  BookOpen, 
  Trophy, 
  Medal, 
  Crown,
  GraduationCap,
  Calculator,
  Globe,
  Beaker,
  Languages,
  Music,
  Palette,
  Heart,
  LogOut
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

export function Dashboard() {
  const subjects = [
    { id: 1, name: "Математика", icon: Calculator, color: "from-blue-500 to-blue-600", progress: 75, lessons: 24 },
    { id: 2, name: "Кыргызский язык", icon: Languages, color: "from-green-500 to-green-600", progress: 60, lessons: 18 },
    { id: 3, name: "Русский язык", icon: BookOpen, color: "from-red-500 to-red-600", progress: 80, lessons: 20 },
    { id: 4, name: "География", icon: Globe, color: "from-teal-500 to-teal-600", progress: 45, lessons: 15 },
    { id: 5, name: "Химия", icon: Beaker, color: "from-purple-500 to-purple-600", progress: 55, lessons: 16 },
    { id: 6, name: "Физика", icon: Beaker, color: "from-indigo-500 to-indigo-600", progress: 70, lessons: 22 },
    { id: 7, name: "История", icon: BookOpen, color: "from-amber-500 to-amber-600", progress: 65, lessons: 19 },
    { id: 8, name: "Музыка", icon: Music, color: "from-pink-500 to-pink-600", progress: 90, lessons: 12 },
  ];

  const leaderboard = [
    { id: 1, name: "Айжан К.", points: 2850, avatar: "🎓", rank: 1 },
    { id: 2, name: "Бекзат М.", points: 2720, avatar: "📚", rank: 2 },
    { id: 3, name: "Нурай С.", points: 2680, avatar: "✨", rank: 3 },
    { id: 4, name: "Вы", points: 2540, avatar: "🌟", rank: 4, isCurrentUser: true },
    { id: 5, name: "Эмир Т.", points: 2480, avatar: "🚀", rank: 5 },
    { id: 6, name: "Алина П.", points: 2350, avatar: "💫", rank: 6 },
    { id: 7, name: "Тимур О.", points: 2220, avatar: "⭐", rank: 7 },
  ];

  const achievements = [
    { id: 1, name: "Первый урок", icon: "🎯", earned: true },
    { id: 2, name: "10 уроков", icon: "🏆", earned: true },
    { id: 3, name: "Неделя подряд", icon: "🔥", earned: true },
    { id: 4, name: "50 уроков", icon: "⭐", earned: false },
  ];

  const totalProgress = Math.round(subjects.reduce((acc, subj) => acc + subj.progress, 0) / subjects.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ILIM.KG
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-accent px-4 py-2 rounded-full">
                <Trophy className="w-5 h-5 text-secondary" />
                <span className="font-bold text-accent-foreground">2,540 баллов</span>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl mb-2">Привет, ученик! 👋</h1>
          <p className="text-muted-foreground">Продолжай учиться и достигай новых целей</p>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="mb-1">Общий прогресс</h3>
              <p className="text-sm text-muted-foreground">
                Ты изучил {subjects.reduce((acc, s) => acc + s.lessons, 0)} уроков
              </p>
            </div>
            <div className="text-4xl font-bold text-primary">{totalProgress}%</div>
          </div>
          <Progress value={totalProgress} className="h-3" />
        </Card>

        {/* Achievements */}
        <div className="mb-8">
          <h2 className="mb-4">Достижения</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`p-4 text-center ${
                  achievement.earned
                    ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30"
                    : "bg-muted/50 opacity-60"
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="text-sm">{achievement.name}</div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subjects Grid */}
          <div className="lg:col-span-2">
            <h2 className="mb-4">Мои предметы</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <subject.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{subject.lessons} уроков</div>
                    </div>
                  </div>
                  <h3 className="mb-3">{subject.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-bold text-primary">{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-secondary" />
              Таблица лидеров
            </h2>
            <Card className="p-4 sm:p-6">
              <div className="space-y-3">
                {leaderboard.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      user.isCurrentUser
                        ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      {user.rank === 1 && <Crown className="w-6 h-6 text-yellow-500" />}
                      {user.rank === 2 && <Medal className="w-6 h-6 text-gray-400" />}
                      {user.rank === 3 && <Medal className="w-6 h-6 text-amber-600" />}
                      {user.rank > 3 && (
                        <span className="font-bold text-muted-foreground">{user.rank}</span>
                      )}
                    </div>
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`truncate ${user.isCurrentUser ? "font-bold" : ""}`}>
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.points} баллов</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-secondary/10 to-primary/10">
              <h3 className="mb-4 text-center">Твоя статистика</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Уроков пройдено</span>
                  <span className="font-bold text-lg text-primary">146</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Дней подряд</span>
                  <span className="font-bold text-lg text-secondary">7 🔥</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Средний балл</span>
                  <span className="font-bold text-lg text-primary">4.6 ⭐</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
