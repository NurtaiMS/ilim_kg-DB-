import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Settings, Volume2, VolumeX, Bell, BellOff, Globe, User, Shield, Trash2, Check,
  Star, Zap, RefreshCcw
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ProfileLayout } from "./ProfileLayout";
import {
  SHOP_ITEMS, getSettings, saveSettings, DEFAULT_EQUIPPED,
} from "../utils/userStore";
import { resetAllStudentProgress } from "../utils/authStore";
import { fetchStudentProgress, equipShopItem } from "../utils/serverApi";

const XP_TO_NEXT = 100;

// ── Main Component ─────────────────────────────────────────────────────────────
export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings]           = useState(getSettings());
  const [equipped, setEquippedState]      = useState(DEFAULT_EQUIPPED);
  const [saved, setSaved]                 = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [usernameInput, setUsernameInput] = useState(getSettings().username);
  const [profile, setProfile]             = useState<any>(null);

  const lang = settings.language;
  const totalXP = profile?.experience ?? 0;
  const level = profile?.level ?? 1;
  const totalCoins = profile?.coins ?? 0;

  const ownedAvatars = [
    DEFAULT_EQUIPPED.avatar,
    ...SHOP_ITEMS.filter(item => item.type === "avatar" && profile?.inventory?.includes(item.id) && item.emoji).map(item => item.emoji!),
  ];
  const hasLockedAvatars = profile ? SHOP_ITEMS.some(item => item.type === "avatar" && !profile.inventory?.includes(item.id)) : false;

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("ilim_authenticated");
    if (!isAuthenticated) { navigate("/signin"); return; }

    const currentUserRaw = localStorage.getItem("ilim_current_user") || localStorage.getItem("ilim_user");
    if (!currentUserRaw) return;

    try {
      const currentUser = JSON.parse(currentUserRaw);
      const studentId = currentUser.id || currentUser._id;
      if (!studentId) return;

      fetchStudentProgress(studentId)
        .then(data => {
          setProfile(data);
          setEquippedState(data.equippedItems ?? DEFAULT_EQUIPPED);
        })
        .catch(err => console.error("Ошибка загрузки профиля:", err));
    } catch (err) {
      console.error("Ошибка разбора текущего пользователя:", err);
    }
  }, [navigate]);

  const update = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings({ [key]: value } as any);
  };

  const handleSaveUsername = () => {
    update("username", usernameInput.trim() || "Ученик");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleQuickAvatar = async (emoji: string) => {
    const currentUserRaw = localStorage.getItem("ilim_current_user") || localStorage.getItem("ilim_user");
    if (!currentUserRaw) return;

    try {
      const currentUser = JSON.parse(currentUserRaw);
      const studentId = currentUser.id || currentUser._id;
      if (!studentId) return;

      const avatarItem = SHOP_ITEMS.find(item => item.type === 'avatar' && item.emoji === emoji);
      const itemId = avatarItem?.id ?? null;
      const result = await equipShopItem(studentId, itemId, 'avatar', emoji);
      setEquippedState(result.equippedItems);
      setProfile((prev: any) => ({ ...prev, equippedItems: result.equippedItems }));
    } catch (err) {
      console.error('Ошибка экипировки аватара:', err);
    }
  };

  const handleReset = () => {
    resetAllStudentProgress();
    setEquippedState(DEFAULT_EQUIPPED);
    setShowResetConfirm(false);
    navigate("/dashboard");
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-7 rounded-full relative transition-all flex-shrink-0 ${value ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow ${value ? "right-1" : "left-1"}`} />
    </button>
  );

  return (
    <>
      <ProfileLayout
        title="Настройки"
        titleKY="Жөндөөлөр"
        language={lang}
        totalXP={totalXP}
        xpToNext={XP_TO_NEXT}
        level={level}
        totalCoins={totalCoins}
      >
        <div className="max-w-2xl mx-auto space-y-6">

          {/* ── 1. Profile ─────────────────────────────────────────────── */}
          <Card className="p-6 border-2 shadow-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">{lang === "RU" ? "Профиль" : "Профиль"}</h3>
            </div>

            <div className="flex items-center gap-5 mb-5">
              <Avatar className={`w-16 h-16 border-4 ${equipped.frame} flex-shrink-0`}>
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary">
                  {equipped.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">{lang === "RU" ? "Быстрый выбор аватара:" : "Тез аватар тандоо:"}</p>
                <div className="flex flex-wrap gap-2">
                  {ownedAvatars.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleQuickAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl border-2 text-xl flex items-center justify-center transition-all hover:scale-110 ${
                        equipped.avatar === emoji ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {hasLockedAvatars && (
                  <p className="mt-3 text-xs text-muted-foreground">Новые аватары открываются в магазине после покупки.</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {lang === "RU" ? "Имя пользователя" : "Колдонуучу аты"}
              </label>
              <div className="flex gap-2">
                <input
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  maxLength={20}
                  placeholder={lang === "RU" ? "Введите имя..." : "Атыңызды жазыңыз..."}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border focus:border-primary outline-none text-sm transition-colors"
                />
                <Button
                  onClick={handleSaveUsername}
                  className={`min-h-[44px] px-4 transition-all ${saved ? "bg-green-500 hover:bg-green-600" : ""}`}
                >
                  {saved ? <Check className="w-4 h-4" /> : (lang === "RU" ? "Сохранить" : "Сактоо")}
                </Button>
              </div>
            </div>
          </Card>

          {/* ── 2. Language ────────────────────────────────────────────── */}
          <Card className="p-6 border-2 shadow-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">{lang === "RU" ? "Язык интерфейса" : "Интерфейс тили"}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["RU", "KY"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => update("language", l)}
                  className={`py-4 rounded-2xl border-2 font-semibold transition-all ${
                    settings.language === l
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-border hover:border-primary/50 bg-white"
                  }`}
                >
                  <div className="text-2xl mb-1">{l === "RU" ? "🇷🇺" : "🇰🇬"}</div>
                  {l === "RU" ? "Русский" : "Кыргызча"}
                </button>
              ))}
            </div>
          </Card>

          {/* ── 3. Sound & Notifications ───────────────────────────────── */}
          <Card className="p-6 border-2 shadow-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">{lang === "RU" ? "Приложение" : "Колдонмо"}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  {settings.sound ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <div className="font-medium text-sm">{lang === "RU" ? "Звуковые эффекты" : "Үн эффекттери"}</div>
                    <div className="text-xs text-muted-foreground">{lang === "RU" ? "Звуки при правильных ответах" : "Туура жооп берүүдө үн"}</div>
                  </div>
                </div>
                <Toggle value={settings.sound} onChange={v => update("sound", v)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  {settings.notifications ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <div className="font-medium text-sm">{lang === "RU" ? "Push-уведомления" : "Push-билдирмелер"}</div>
                    <div className="text-xs text-muted-foreground">{lang === "RU" ? "Напоминания и новости платформы" : "Эскертмелер жана жаңылыктар"}</div>
                  </div>
                </div>
                <Toggle value={settings.notifications} onChange={v => update("notifications", v)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-secondary" />
                  <div>
                    <div className="font-medium text-sm">{lang === "RU" ? "Анимации" : "Анимациялар"}</div>
                    <div className="text-xs text-muted-foreground">{lang === "RU" ? "Эффекты при наградах и переходах" : "Сыйлыктар жана өтүштөр анимациясы"}</div>
                  </div>
                </div>
                <Toggle value={settings.animations} onChange={v => update("animations", v)} />
              </div>
            </div>
          </Card>

          {/* ── 6. Progress Reset (Danger Zone) ────────────────────────── */}
          <Card className="p-6 border-2 border-red-200 shadow-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg text-red-600">{lang === "RU" ? "Опасная зона" : "Коркунучтуу аймак"}</h3>
            </div>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full p-4 rounded-xl border-2 border-red-200 text-red-500 font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                {lang === "RU" ? "Сбросить весь прогресс" : "Бардык прогресссти баштапкы калыбына келтирүү"}
              </button>
            ) : (
              <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <p className="text-sm font-semibold text-red-700 mb-3">
                  {lang === "RU"
                    ? "⚠️ Это действие нельзя отменить! Весь прогресс, звёзды, покупки — будут удалены."
                    : "⚠️ Бул аракетти жокко чыгаруу мүмкүн эмес! Бардык прогресс, жылдыздар, сатып алуулар — өчүрүлөт."}
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-red-500 hover:bg-red-600 min-h-[44px]" onClick={handleReset}>
                    {lang === "RU" ? "Да, сбросить" : "Ооба, баштапкы кал."}
                  </Button>
                  <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setShowResetConfirm(false)}>
                    {lang === "RU" ? "Отмена" : "Жокко чыгаруу"}
                  </Button>
                </div>
              </div>
            )}

            {/* Export/Restore stub */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-border text-sm text-muted-foreground hover:bg-muted/40 transition-all">
                <RefreshCcw className="w-4 h-4" />
                {lang === "RU" ? "Экспорт данных" : "Маалыматты экспорт"}
              </button>
              <button className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-border text-sm text-muted-foreground hover:bg-muted/40 transition-all">
                <Shield className="w-4 h-4" />
                {lang === "RU" ? "Восстановить" : "Калыбына келтирүү"}
              </button>
            </div>
          </Card>

          {/* App info */}
          <div className="text-center py-2 text-xs text-muted-foreground space-y-1">
            <div>ILIM.KG v1.0</div>
            <div>{lang === "RU" ? "Образовательная платформа для детей 6–11 лет" : "6–11 жаштагы балдар үчүн билим берүү платформасы"}</div>
          </div>
        </div>
      </ProfileLayout>
    </>
  );
}