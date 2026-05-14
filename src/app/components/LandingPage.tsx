import { Link } from "react-router";
import { GraduationCap, BookOpen, Trophy, Users, Star, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function LandingPage() {
  const features = [
    {
      icon: BookOpen,
      title: "Интерактивные уроки",
      description: "Учитесь с увлекательными заданиями и видео"
    },
    {
      icon: Trophy,
      title: "Соревнования",
      description: "Состязайтесь с друзьями в таблице лидеров"
    },
    {
      icon: Users,
      title: "Онлайн поддержка",
      description: "Учителя всегда готовы помочь"
    },
    {
      icon: Star,
      title: "Достижения",
      description: "Получайте награды за прогресс"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="bg-white border-b-2 border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ILIM.KG
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/signin">
                <Button variant="outline" className="min-h-[44px]">
                  Вход
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-primary hover:bg-primary/90 min-h-[44px]">
                  Регистрация
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-accent-foreground" />
              <span className="text-sm text-accent-foreground">
                Образовательная платформа нового поколения
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Учись с удовольствием на{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ILIM.KG
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Современная игровая платформа для школьников Кыргызстана. 
              Изучай предметы интерактивно, соревнуйся с друзьями и достигай новых высот!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 min-h-[52px] px-8">
                  Посмотреть магазин
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary/10 min-h-[52px] px-8">
                  Начать обучение
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-48 h-48 sm:w-64 sm:h-64 text-primary/30" />
            </div>
            <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground rounded-2xl p-4 shadow-lg animate-bounce">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <div>
                  <div className="text-2xl font-bold">1,500+</div>
                  <div className="text-xs">Учеников</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Для кого ILIM.KG?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Наша платформа объединяет детей, родителей и учителей
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-8 text-center border-2 hover:border-primary/50 transition-all hover:shadow-xl">
            <div className="text-6xl mb-4">👦</div>
            <h3 className="text-xl font-bold mb-3">Ученики</h3>
            <p className="text-muted-foreground mb-4">
              Дети 6-11 лет учатся через игру, зарабаты награды и соревнуются с друзьями
            </p>
            <div className="text-sm text-primary font-semibold">
              Вход через аккаунт родителя
            </div>
          </Card>

          <Card className="p-8 text-center border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-bold mb-3">Родители</h3>
            <p className="text-muted-foreground mb-4">
              Регистрируйте детей, отслеживайте их прогресс и помогайте в обучении
            </p>
            <div className="text-sm text-primary font-semibold">
              Доступна регистрация
            </div>
          </Card>

          <Card className="p-8 text-center border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold mb-3">Учителя</h3>
            <p className="text-muted-foreground mb-4">
              Управляйте классами, назначайте задания и отслеживайте успеваемость учеников
            </p>
            <div className="text-sm text-primary font-semibold">
              Доступна регистрация
            </div>
          </Card>
        </div>
      </section>

      {/* Shop Promo Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Новое</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-950">Магазин внутриигровых наград</h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              В магазине можно тратить монеты на крутые аватары, рамки и значки. Это мотивация для детей учиться чаще и получать звезды.
            </p>
            <Link to="/shop">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Открыть магазин
              </Button>
            </Link>
          </div>
          <div className="rounded-[2rem] border border-border bg-gradient-to-br from-white via-slate-100 to-white p-8 shadow-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] opacity-90">Редкость</p>
                    <p className="mt-3 text-2xl font-bold">Эпик + легендарная</p>
                  </div>
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Твой стиль</p>
                <div className="mt-4 flex flex-wrap gap-2 text-3xl">
                  <span>🦄</span>
                  <span>👑</span>
                  <span>⚡</span>
                  <span>🚀</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Почему выбирают ILIM.KG?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Наша платформа создана специально для детей 6-11 лет с учетом современных методов обучения
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-xl transition-all border-2 hover:border-primary/50 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="mb-2 font-bold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Готов начать учиться?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Присоединяйся к тысячам учеников, которые уже улучшают свои знания каждый день
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 min-h-[52px] px-8">
              Зарегистрироваться сейчас
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>© 2026 ILIM.KG. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
