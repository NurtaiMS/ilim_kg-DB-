import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ProfileLayout } from "./ProfileLayout";
import {
  getSettings, calcTotalCoins,
  getNotifications, markNotificationRead, markAllRead,
  type Notification,
} from "../utils/userStore";
import { getSubjectStats, SUBJECT_REGISTRY } from "../utils/subjectProgress";

const BASE_XP    = 1000;
const XP_PER_STAR = 10;
const XP_TO_NEXT  = 1500;

function calcStats() {
  const all = Object.values(SUBJECT_REGISTRY).map(r => getSubjectStats(r.lsKey, r.subtopics));
  const totalStars = all.reduce((a, s) => a + s.stars, 0);
  const earnedXP   = totalStars * XP_PER_STAR;
  return { totalStars, earnedXP, totalXP: BASE_XP + earnedXP, level: 7 + Math.floor(earnedXP / 300) };
}

export function ProfileNotificationsPage() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const settings = getSettings();
  const lang = settings.language;

  const { totalStars, totalXP, level } = calcStats();
  const totalCoins = calcTotalCoins(totalStars);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("ilim_authenticated");
    if (!isAuthenticated) { navigate("/signin"); return; }
    setNotifs(getNotifications());
  }, [navigate]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const handleRead = (id: string) => {
    markNotificationRead(id);
    setNotifs(getNotifications());
  };

  const handleReadAll = () => {
    markAllRead();
    setNotifs(getNotifications());
  };

  const timeLabel = (t: string) =>
    lang === "KY"
      ? t.replace("Сегодня", "Бүгүн").replace("Вчера", "Кечээ").replace("назад", "мурун")
      : t;

  return (
    <ProfileLayout
      title="Уведомления"
      titleKY="Билдирмелер"
      language={lang}
      totalXP={totalXP}
      xpToNext={XP_TO_NEXT}
      level={level}
      totalCoins={totalCoins}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold">
                {lang === "RU" ? "Все уведомления" : "Бардык билдирмелер"}
              </h2>
              {unreadCount > 0 && (
                <span className="text-sm text-primary font-semibold">
                  {unreadCount} {lang === "RU" ? "непрочитанных" : "окулбаган"}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleReadAll}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <CheckCheck className="w-4 h-4" />
              {lang === "RU" ? "Прочитать все" : "Баарын окуу"}
            </Button>
          )}
        </div>

        {notifs.length === 0 ? (
          <Card className="p-12 border-2 text-center">
            <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">
              {lang === "RU" ? "Уведомлений нет" : "Билдирмелер жок"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => (
              <Card
                key={n.id}
                onClick={() => !n.read && handleRead(n.id)}
                className={`p-5 border-2 transition-all cursor-pointer hover:shadow-md ${
                  !n.read
                    ? "border-primary/30 bg-primary/[0.03] hover:border-primary/50"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    !n.read ? "bg-primary/10" : "bg-muted/50"
                  }`}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>
                      {lang === "RU" ? n.textRU : n.textKY}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">{timeLabel(n.time)}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          {lang === "RU"
            ? "Нажми на уведомление, чтобы пометить как прочитанное"
            : "Окулган деп белгилөө үчүн билдирмени басыңыз"}
        </p>
      </div>
    </ProfileLayout>
  );
}
