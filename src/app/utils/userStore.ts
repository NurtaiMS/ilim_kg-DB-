// Central user store for ILIM.KG
// Manages coins, equipped items, purchases, notifications, settings

export interface ShopItem {
  id: string;
  type: "avatar" | "frame" | "badge";
  emoji?: string;
  color?: string;
  gradient?: string;
  name: string;
  nameKY: string;
  descriptionRU?: string;
  descriptionKY?: string;
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface Equipped {
  avatar: string;
  frame: string;   // tailwind border class or gradient key
  badge: string;   // emoji badge shown on avatar
}

export interface Notification {
  id: string;
  icon: string;
  textRU: string;
  textKY: string;
  time: string;
  read: boolean;
}

export interface UserSettings {
  language: "RU" | "KY";
  sound: boolean;
  notifications: boolean;
  animations: boolean;
  username: string;
}

// ── Subscription ───────────────────────────────────────────────────────────────

export type SubscriptionPlan = "free" | "standard" | "premium";
export type BillingCycle = "monthly" | "yearly";

export interface Subscription {
  plan: SubscriptionPlan;
  billingCycle?: BillingCycle;
  startedAt?: string;
  expiresAt?: string;
  autoRenew?: boolean;
}

export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    nameRU: "Бесплатный",
    nameKY: "Акысыз",
    price: { monthly: 0, yearly: 0 },
    color: "from-gray-400 to-gray-500",
    features: {
      RU: ["5 предметов (ограниченный доступ)", "3 урока в день", "Базовая таблица лидеров", "Магазин аватаров"],
      KY: ["5 сабак (чектелген)", "Күнүнө 3 сабак", "Негизги лидерлер тизмеси", "Аватар дүкөнү"],
    },
  },
  standard: {
    id: "standard",
    nameRU: "Стандарт",
    nameKY: "Стандарт",
    price: { monthly: 299, yearly: 2490 },
    color: "from-blue-500 to-blue-600",
    features: {
      RU: ["Все 5 предметов (полный доступ)", "Неограниченные уроки", "Родительская аналитика", "Без рекламы", "Приоритетная поддержка"],
      KY: ["Бардык 5 предмет (толук)", "Чексиз сабактар", "Ата-эне аналитикасы", "Жарнамасыз", "Артыкчылыктуу колдоо"],
    },
  },
  premium: {
    id: "premium",
    nameRU: "Премиум",
    nameKY: "Премиум",
    price: { monthly: 599, yearly: 4990 },
    color: "from-amber-500 to-orange-500",
    features: {
      RU: ["Всё из Стандарт", "Несколько детей (до 5)", "Живые сессии с учителями", "Эксклюзивные задания", "Сертификат об обучении", "VIP значок в профиле"],
      KY: ["Стандарттагынын баары", "Бир нече бала (5кө чейин)", "Мугалимдер менен жандуу сабак", "Эксклюзивдүү тапшырмалар", "Окуу сертификаты", "Профилде VIP белги"],
    },
  },
} as const;

export function getSubscription(): Subscription {
  try {
    const raw = localStorage.getItem("ilim_subscription");
    return raw ? JSON.parse(raw) : { plan: "free" };
  } catch { return { plan: "free" }; }
}

export function setSubscription(sub: Subscription): void {
  localStorage.setItem("ilim_subscription", JSON.stringify(sub));
}

export function cancelSubscription(): void {
  localStorage.setItem("ilim_subscription", JSON.stringify({ plan: "free" }));
}

// ── Purchases ─────────────────────────────────────────────────────────────────

export function getPurchasedItems(): string[] {
  try {
    const raw = localStorage.getItem("ilim_purchases");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function purchaseItem(itemId: string): void {
  const items = getPurchasedItems();
  if (!items.includes(itemId)) {
    items.push(itemId);
    localStorage.setItem("ilim_purchases", JSON.stringify(items));
  }
}

export function isItemPurchased(itemId: string): boolean {
  return getPurchasedItems().includes(itemId);
}

// ── Equipped ──────────────────────────────────────────────────────────────────

export const DEFAULT_EQUIPPED: Equipped = {
  avatar: "🎓",
  frame: "border-primary",
  badge: "",
};

export function getEquipped(): Equipped {
  try {
    const raw = localStorage.getItem("ilim_equipped");
    return raw ? { ...DEFAULT_EQUIPPED, ...JSON.parse(raw) } : DEFAULT_EQUIPPED;
  } catch { return DEFAULT_EQUIPPED; }
}

export function setEquipped(patch: Partial<Equipped>): void {
  const current = getEquipped();
  localStorage.setItem("ilim_equipped", JSON.stringify({ ...current, ...patch }));
}

// ── Coins ─────────────────────────────────────────────────────────────────────
// Coins = base + earned from stars - spent in shop

const BASE_COINS = 300;
const COINS_PER_STAR = 5;

export function getSpentCoins(): number {
  try {
    const raw = localStorage.getItem("ilim_spent_coins");
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

export function spendCoins(amount: number): void {
  const spent = getSpentCoins();
  localStorage.setItem("ilim_spent_coins", String(spent + amount));
}

export function calcTotalCoins(earnedStars: number): number {
  return BASE_COINS + earnedStars * COINS_PER_STAR - getSpentCoins();
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem("ilim_settings");
    const saved = raw ? JSON.parse(raw) : {};
    const user = localStorage.getItem("ilim_user");
    const username = user ? JSON.parse(user).username || "Ученик" : "Ученик";
    return { language: "RU", sound: true, notifications: true, animations: true, username, ...saved };
  } catch { return { language: "RU", sound: true, notifications: true, animations: true, username: "Ученик" }; }
}

export function saveSettings(patch: Partial<UserSettings>): void {
  const current = getSettings();
  const next = { ...current, ...patch };
  localStorage.setItem("ilim_settings", JSON.stringify(next));
  // sync username to ilim_user
  if (patch.username) {
    const raw = localStorage.getItem("ilim_user");
    const user = raw ? JSON.parse(raw) : {};
    localStorage.setItem("ilim_user", JSON.stringify({ ...user, username: patch.username }));
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: "n1", icon: "🎉", textRU: "Добро пожаловать в ILIM.KG! Начни своё первое задание.", textKY: "ILIM.KG га кош келдиңиз! Биринчи тапшырмаңды баштачы.", time: "Сегодня", read: false },
  { id: "n2", icon: "⭐", textRU: "Новый урок доступен: Математика — Числа до 20", textKY: "Жаңы сабак: Математика — 20 чейин сандар", time: "Вчера", read: false },
  { id: "n3", icon: "🏆", textRU: "Ты вошёл в таблицу лидеров! Продолжай в том же духе.", textKY: "Лидерлер тизмесине кирдиң! Ушундай жалгаштыра бер.", time: "2д назад", read: true },
  { id: "n4", icon: "💡", textRU: "Совет: Выполняй ежедневные задания для двойных монет!", textKY: "Кеңеш: Күндүк тапшырмаларды аткар — кош тыйын!",  time: "3д назад", read: true },
  { id: "n5", icon: "🔥", textRU: "Серия 3 дня подряд! Ты на правильном пути.", textKY: "3 күн катары! Туура жолдосуң.", time: "4д назад", read: true },
];

export function getNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem("ilim_notifications");
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATIONS;
  } catch { return DEFAULT_NOTIFICATIONS; }
}

export function markNotificationRead(id: string): void {
  const notifs = getNotifications();
  const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem("ilim_notifications", JSON.stringify(updated));
}

export function markAllRead(): void {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem("ilim_notifications", JSON.stringify(notifs));
}

// ── Shop items ────────────────────────────────────────────────────────────────

export const SHOP_ITEMS: ShopItem[] = [
  // Avatars
  { id: "av_lion",    type: "avatar", emoji: "🦁", name: "Лев",        nameKY: "Арстан",    descriptionRU: "Смелый лидер класса, который не боится новых вызовов.", descriptionKY: "Сырга жаңы чакырыктардан коркпогон жетекчи.", price: 50,  rarity: "common"    },
  { id: "av_tiger",   type: "avatar", emoji: "🐯", name: "Тигр",       nameKY: "Жолборс",   descriptionRU: "Дикая энергия на каждый урок.", descriptionKY: "Ар бир сабакка жапайы энергия.", price: 50,  rarity: "common"    },
  { id: "av_fox",     type: "avatar", emoji: "🦊", name: "Лиса",       nameKY: "Түлкү",     descriptionRU: "Хитрый стиль для тех, кто любит решать задачи.", descriptionKY: "Тапшырмаларды чечкенди жактыргандар үчүн тунгуюктуу стиль.", price: 75,  rarity: "common"    },
  { id: "av_panda",   type: "avatar", emoji: "🐼", name: "Панда",      nameKY: "Панда",     descriptionRU: "Спокойный талисман для уверенных побед.", descriptionKY: "Ишенимдүү жеңиштер үчүн тынч тилекчи.", price: 75,  rarity: "common"    },
  { id: "av_dragon",  type: "avatar", emoji: "🐉", name: "Дракон",     nameKY: "Ажыдаар",  descriptionRU: "Огненный дух, который вдохновляет на большее.", descriptionKY: "Көңүлүңдү жараткан оттуу рух.", price: 150, rarity: "rare"      },
  { id: "av_unicorn", type: "avatar", emoji: "🦄", name: "Единорог",   nameKY: "Жылкы",     descriptionRU: "Волшебная аура для тех, кто мечтает о суперросте.", descriptionKY: "Супер өсүүнү кыялдангандар үчүн сыйкырдуу атмосфера.", price: 150, rarity: "rare"      },
  { id: "av_eagle",   type: "avatar", emoji: "🦅", name: "Орёл",       nameKY: "Бүркүт",   descriptionRU: "Взлетай над задачами и смотри дальше.", descriptionKY: "Тапшырмаларды жеңип, алыска көз сал.", price: 200, rarity: "rare"      },
  { id: "av_robot",   type: "avatar", emoji: "🤖", name: "Робот",      nameKY: "Робот",     descriptionRU: "Стиль будущего для сильных и умных.", descriptionKY: "Күчтүү жана акылдуу үчүн келечектин стили.", price: 250, rarity: "epic"      },
  { id: "av_alien",   type: "avatar", emoji: "👾", name: "Пришелец",   nameKY: "Бөтөн жан", descriptionRU: "Галактический образ для уникальных учеников.", descriptionKY: "Уникалдуу окуучулар үчүн галактикалык көрүнүш.", price: 300, rarity: "epic"      },
  { id: "av_crown",   type: "avatar", emoji: "👑", name: "Корона",     nameKY: "Тажы",      descriptionRU: "Королевский аватар для истинных чемпионов.", descriptionKY: "Чыныгы чемпиондор үчүн падышалык аватар.", price: 500, rarity: "legendary" },

  // Frames
  { id: "fr_gold",    type: "frame", color: "border-yellow-400",  gradient: "from-yellow-400 to-amber-500",  name: "Золотая рамка",    nameKY: "Алтын алкак",   descriptionRU: "Праздничная рамка для ярких профилей.", descriptionKY: "Жарык профилдер үчүн майрамдык алкак.", price: 100, rarity: "common"    },
  { id: "fr_green",   type: "frame", color: "border-green-500",   gradient: "from-green-400 to-emerald-600", name: "Зелёная рамка",    nameKY: "Жашыл алкак",  descriptionRU: "Рамка свежести и роста.", descriptionKY: "Жашылдык жана өсүш рамкасы.", price: 100, rarity: "common"    },
  { id: "fr_red",     type: "frame", color: "border-red-500",     gradient: "from-red-400 to-rose-600",      name: "Красная рамка",    nameKY: "Кызыл алкак",  descriptionRU: "Сильная рамка для уверенных игроков.", descriptionKY: "Ишенимдүү оюнчулар үчүн күчтүү алкак.", price: 100, rarity: "common"    },
  { id: "fr_purple",  type: "frame", color: "border-purple-500",  gradient: "from-purple-400 to-violet-600", name: "Фиолетовая рамка", nameKY: "Кок-күрөң",    descriptionRU: "Мягкая и волшебная рамка для творцов.", descriptionKY: "Жаратман адамдар үчүн жагымдуу рамка.", price: 150, rarity: "rare"      },
  { id: "fr_cyan",    type: "frame", color: "border-cyan-400",    gradient: "from-cyan-400 to-teal-500",     name: "Голубая рамка",    nameKY: "Асман алкак",  descriptionRU: "Стильное сияние для уверенного персонажа.", descriptionKY: "Ишенимдүү персонаж үчүн стилдүү жылмаюу.", price: 150, rarity: "rare"      },
  { id: "fr_rainbow", type: "frame", color: "border-pink-400",    gradient: "from-pink-400 via-yellow-400 to-cyan-400", name: "Радужная рамка", nameKY: "Жаа алкак", descriptionRU: "Эксклюзив для тех, кто любит удивлять.", descriptionKY: "Таасир калтырууну жакшы көргөндөр үчүн эксклюзив.", price: 400, rarity: "epic" },

  // Badges
  { id: "bg_star",    type: "badge", emoji: "⭐", name: "Звезда",      nameKY: "Жылдыз",    descriptionRU: "Яркий знак достижения для лучшего профиля.", descriptionKY: "Эң мыкты профиль үчүн жаркыраган белгиче.", price: 80,  rarity: "common"    },
  { id: "bg_fire",    type: "badge", emoji: "🔥", name: "Огонь",       nameKY: "От",        descriptionRU: "Добавь горячую энергетику своему аватару.", descriptionKY: "Жылуу энергияны аватарыңа кош.", price: 80,  rarity: "common"    },
  { id: "bg_bolt",    type: "badge", emoji: "⚡", name: "Молния",      nameKY: "Чагылган",  descriptionRU: "Знак скорости и смелости.", descriptionKY: "Ыкчамдык жана эрдик белгиси.", price: 100, rarity: "rare"      },
  { id: "bg_gem",     type: "badge", emoji: "💎", name: "Бриллиант",   nameKY: "Бриллиант", descriptionRU: "Элегантный знак уверенного ученика.", descriptionKY: "Ишенимдүү окуучу үчүн элеганттуу белги.", price: 200, rarity: "rare"      },
  { id: "bg_rocket",  type: "badge", emoji: "🚀", name: "Ракета",      nameKY: "Ракета",    descriptionRU: "Для тех, кто стремится к новым высотам.", descriptionKY: "Жаңы бийиктиктерге умтулгандар үчүн.", price: 250, rarity: "epic"      },
  { id: "bg_king",    type: "badge", emoji: "👑", name: "Царь",        nameKY: "Падыша",    descriptionRU: "Королевский знак статуса чемпиона.", descriptionKY: "Чемпиондун падышалык белгиси.", price: 500, rarity: "legendary" },
];

// ── Achievements ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  icon: string;
  nameRU: string;
  nameKY: string;
  descRU: string;
  descKY: string;
  category: "learning" | "stars" | "subjects" | "social";
  reward: number; // coins
  check: (data: AchievementData) => boolean;
  threshold?: number;
}

export interface AchievementData {
  totalStars: number;
  subjectsDone: number;
  subjectsStarted: number;
  mathStars: number;
  englishStars: number;
  kyrgyzStars: number;
  purchaseCount: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "ach_first",    icon: "🌟", nameRU: "Первые шаги",       nameKY: "Биринчи кадамдар",  descRU: "Реши первую задачу",           descKY: "Биринчи тапшырманы чеч",         category: "learning",  reward: 10,  check: d => d.totalStars >= 1   },
  { id: "ach_10",       icon: "🔥", nameRU: "На разогреве",      nameKY: "Жылынуу",           descRU: "Набери 10 звёзд",              descKY: "10 жылдыз топто",                category: "stars",     reward: 20,  check: d => d.totalStars >= 10  },
  { id: "ach_25",       icon: "💡", nameRU: "Любознательный",    nameKY: "Кызыгуучу",         descRU: "Набери 25 звёзд",              descKY: "25 жылдыз топто",                category: "stars",     reward: 30,  check: d => d.totalStars >= 25  },
  { id: "ach_50",       icon: "💎", nameRU: "Знаток",            nameKY: "Билермен",          descRU: "Набери 50 звёзд",              descKY: "50 жылдыз топто",                category: "stars",     reward: 50,  check: d => d.totalStars >= 50  },
  { id: "ach_100",      icon: "🏆", nameRU: "Чемпион",           nameKY: "Чемпион",           descRU: "Набери 100 звёзд",             descKY: "100 жылдыз топто",               category: "stars",     reward: 100, check: d => d.totalStars >= 100 },
  { id: "ach_225",      icon: "👑", nameRU: "Легенда",           nameKY: "Легенда",           descRU: "Набери в��е 225 звёзд",         descKY: "Бардык 225 жылдызды топто",      category: "stars",     reward: 300, check: d => d.totalStars >= 225 },
  { id: "ach_math",     icon: "🔢", nameRU: "Математик",         nameKY: "Математик",         descRU: "Заверши математику",           descKY: "Математиканы бүтүр",             category: "subjects",  reward: 75,  check: d => d.mathStars >= 45   },
  { id: "ach_eng",      icon: "🇬🇧", nameRU: "Полиглот",         nameKY: "Полиглот",          descRU: "Набери 15 звёзд по английскому", descKY: "Англисчеден 15 жылдыз ал",    category: "subjects",  reward: 50,  check: d => d.englishStars >= 15 },
  { id: "ach_ky",       icon: "🏔️", nameRU: "Патриот",          nameKY: "Патриот",           descRU: "Набери 15 звёзд по кыргызскому", descKY: "Кыргызчадан 15 жылдыз ал",    category: "subjects",  reward: 50,  check: d => d.kyrgyzStars >= 15  },
  { id: "ach_3subj",    icon: "📚", nameRU: "Многогранный",      nameKY: "Көп жактуу",        descRU: "Начни 3 предмета",             descKY: "3 предмет баштоо",               category: "subjects",  reward: 40,  check: d => d.subjectsStarted >= 3 },
  { id: "ach_all_subj", icon: "🎓", nameRU: "Мастер",            nameKY: "Устат",             descRU: "Заверши все 5 предметов",      descKY: "Бардык 5 предметти бүтүр",       category: "subjects",  reward: 500, check: d => d.subjectsDone >= 5  },
  { id: "ach_shop1",    icon: "🛍️", nameRU: "Шопоголик",        nameKY: "Сатып алуучу",      descRU: "Купи первый предмет в магазине", descKY: "Дүкөндөн биринчи буюмду сатып ал", category: "social", reward: 25, check: d => d.purchaseCount >= 1 },
  { id: "ach_shop5",    icon: "🎨", nameRU: "Стилист",           nameKY: "Стилист",           descRU: "Купи 5 предметов в магазине",  descKY: "Дүкөндөн 5 буюм сатып ал",      category: "social",    reward: 75,  check: d => d.purchaseCount >= 5  },
];