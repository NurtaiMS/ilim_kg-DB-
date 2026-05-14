import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BadgeCheck, Coins, ShoppingBag, Sparkles, ArrowRight, Crown, Flame, Star, ChevronLeft, Award } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { SHOP_ITEMS, ShopItem } from "../utils/userStore";
import { fetchStudentProgress, purchaseShopItem, equipShopItem } from "../utils/serverApi";

const categoryMap = {
  all: "Все",
  avatar: "Аватары",
  frame: "Рамки",
  badge: "Значки",
} as const;

const rarityStyles = {
  common: "bg-slate-100 text-slate-800",
  rare: "bg-cyan-100 text-cyan-800",
  epic: "bg-violet-100 text-violet-800",
  legendary: "bg-amber-100 text-amber-800",
} as const;

function getItemLabel(item: ShopItem) {
  if (item.emoji) return `${item.emoji} ${item.name}`;
  return item.name;
}

export function ShopPage() {
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquippedState] = useState<{ avatar: string; frame: string; badge: string }>({ avatar: '🎓', frame: 'border-primary', badge: '' });
  const [studentId, setStudentId] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | ShopItem["type"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopMessage, setShopMessage] = useState('');
  const categoryLabels = useMemo(
    () => ({ all: "Все категории", avatar: "Аватары", frame: "Рамки", badge: "Значки" } as const),
    [],
  );

  const featured = useMemo(() => SHOP_ITEMS.filter((item) => item.rarity === "legendary" || item.rarity === "epic"), []);

  const isEquipped = (item: ShopItem) => {
    if (item.type === "avatar") return equipped.avatar === item.emoji;
    if (item.type === "frame") return equipped.frame === item.color;
    if (item.type === "badge") return equipped.badge === item.emoji;
    return false;
  };

  const handleEquip = async (item: ShopItem) => {
    if (!owned.includes(item.id)) return;
    if (!studentId) return;

    const nextEquip: Record<string, string> = {};
    if (item.type === "avatar" && item.emoji) nextEquip.avatar = item.emoji;
    if (item.type === "frame" && item.color) nextEquip.frame = item.color;
    if (item.type === "badge" && item.emoji) nextEquip.badge = item.emoji;

    try {
      const result = await equipShopItem(studentId, item.id, item.type, Object.values(nextEquip)[0]);
      setEquippedState(result.equippedItems);
      setShopMessage('Экипировка сохранена в MongoDB');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    const currentUserRaw = localStorage.getItem("ilim_current_user") || localStorage.getItem("ilim_user");
    if (!currentUserRaw) {
      setLoading(false);
      return;
    }

    let currentUser;
    try {
      currentUser = JSON.parse(currentUserRaw);
    } catch {
      setLoading(false);
      return;
    }

    const studentIdValue = currentUser.id || currentUser._id;
    if (!studentIdValue) {
      setLoading(false);
      return;
    }

    setStudentId(studentIdValue);

    fetchStudentProgress(studentIdValue)
      .then((data) => {
        setCoins(data.coins ?? 0);
        setOwned(Array.isArray(data.inventory) ? data.inventory : []);
        setEquippedState(data.equippedItems ?? { avatar: '🎓', frame: 'border-primary', badge: '' });
      })
      .catch((err) => {
        setError((err as Error).message);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleItems = useMemo(
    () => category === "all" ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.type === category),
    [category],
  );

  const handlePurchase = async (item: ShopItem) => {
    if (owned.includes(item.id)) return;
    if (coins < item.price) return;
    if (!studentId) return;

    try {
      const result = await purchaseShopItem(studentId, item.id, item.type, item.type === 'frame' ? item.color || '' : item.emoji || '', item.price);
      setOwned(Array.isArray(result.inventory) ? result.inventory : []);
      setCoins(result.coins ?? 0);
      setEquippedState(result.equippedItems ?? equipped);
      setShopMessage('Покупка сохранена в MongoDB');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_35%),radial-gradient(circle_at_right,_rgba(234,88,12,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc,_#ffffff)]">
      <nav className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ILIM Бутік</p>
              <p className="text-lg font-semibold text-foreground">Игровой магазин</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-slate-700 bg-white shadow-sm hover:border-primary hover:text-primary">
              <ChevronLeft className="w-4 h-4" /> Назад
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-secondary shadow-sm bg-white/80">
              <Coins className="w-4 h-4" /> {coins} монет
            </span>
          </div>
        </div>
      </nav>

      {shopMessage && (
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 shadow-sm">
            {shopMessage}
          </div>
        </div>
      )}
      {error && (
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-900 shadow-sm">
            Ошибка: {error}
          </div>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/15 to-primary/10 px-4 py-2 text-sm font-semibold text-secondary shadow-sm">
              <Sparkles className="w-5 h-5" /> Твой бутик наград
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Магазин с наградами, где каждая монета превращается в стиль и статус.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Используй монеты, чтобы украсить профиль! 🎨 🎭 🎪 🎯 🎸 🎮 Учись, собирай звёзды и трать заработанные монеты на крутые аватары, рамки или значки. Это не просто магазин — это игровая витрина, которая мотивирует к лучшим результатам.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
                Смотреть коллекцию
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Link to="/dashboard" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                Вернуться в личный кабинет
              </Link>
            </div>
          </div>

          <div className="space-y-5 rounded-[2rem] border border-border/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/80 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Баланс</p>
                <p className="mt-2 text-4xl font-semibold text-slate-950">{coins}</p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-4 text-white shadow-lg">
                <Star className="w-6 h-6" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-100 p-4">
                <p className="text-sm text-muted-foreground">Совет</p>
                <p className="mt-2 text-sm text-slate-900">Собери 5 аватаров, чтобы открыть секретную рамку</p>
              </div>
              <div className="rounded-3xl bg-slate-100 p-4">
                <p className="text-sm text-muted-foreground">РОДИТЕЛЯМ</p>
                <p className="mt-2 text-sm text-slate-900">Покупки теперь сохраняются в MongoDB, а не в браузере.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Выберите категорию</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Коллекция наград</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key as "all" | ShopItem["type"])}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${category === key ? "border-primary bg-primary text-white" : "border-border bg-white text-slate-700 hover:border-primary/80 hover:text-slate-950"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => {
            const ownedItem = owned.includes(item.id);
            const canBuy = !ownedItem && coins >= item.price;
            const glowing = item.rarity === "epic" || item.rarity === "legendary";
            return (
              <Card key={item.id} className={`overflow-hidden border-0 shadow-xl ${glowing ? "ring-1 ring-amber-200/80" : ""}`}>
                <div className={`p-6 ${item.gradient ? `bg-gradient-to-br ${item.gradient} text-white` : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-[1.75rem] border-2 text-4xl ${item.color ?? "border-slate-200 bg-white text-slate-900"}`}>
                        {item.emoji ?? "✨"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">{item.type === "avatar" ? "Аватар" : item.type === "frame" ? "Рамка" : "Значок"}</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">{item.name}</h3>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rarityStyles[item.rarity]}`}>{item.rarity}</span>
                  </div>
                </div>
                <div className="space-y-4 p-6 bg-white">
                  <p className="min-h-[3rem] text-sm text-slate-600">{item.descriptionRU ?? "Уникальный предмет для персонализации профиля."}</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-slate-950">{item.price}💰</div>
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{ownedItem ? "Приобретено" : "Цена"}</div>
                    </div>
                    <Button
                      onClick={() => (ownedItem ? handleEquip(item) : handlePurchase(item))}
                      disabled={!ownedItem && !canBuy}
                      className="min-h-[44px] rounded-full px-5"
                      variant={ownedItem ? (isEquipped(item) ? "secondary" : "default") : canBuy ? "default" : "outline"}
                    >
                      {ownedItem ? (isEquipped(item) ? "Надето" : "Надеть") : canBuy ? "Купить" : "Недостаточно"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-2xl shadow-slate-900/40">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Эксклюзив</p>
              <h2 className="text-4xl font-bold">Лучшие трофеи для самых активных</h2>
              <p className="max-w-xl text-slate-300">Зарабатывай больше, чем просто звёзды: покупай редкие аватары, рамки и значки, которые сразу выделяют твой профиль.</p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-amber-300 text-slate-950 hover:bg-amber-200">Купить легенду</Button>
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 underline underline-offset-4 hover:text-white">
                  Вернуться к прогрессу <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/15">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-4xl">{item.emoji ?? "✨"}</div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rarityStyles[item.rarity]}`}>{item.rarity}</span>
                  </div>
                  <p className="mt-4 text-lg font-semibold">{item.name}</p>
                  <p className="mt-2 text-sm text-slate-300 min-h-[2rem]">{item.descriptionRU ?? "Эксклюзивный предмет для вашего профиля."}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-white">{item.price}💰</span>
                    <BadgeCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
