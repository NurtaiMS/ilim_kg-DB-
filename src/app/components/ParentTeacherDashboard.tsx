import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Settings,
  CreditCard,
  LogOut,
  Star,
  Flame,
  Bell,
  BellOff,
  Globe,
  User,
  Volume2,
  VolumeX,
  Check,
  Crown,
  Shield,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  getCurrentUser,
  clearCurrentUser,
  getStudentsByIds,
  type Student,
} from "../utils/authStore";
import { getSubjectStats, SUBJECT_REGISTRY } from "../utils/subjectProgress";

// ── Custom Charts — replaces recharts to avoid its internal duplicate-key bug ──

interface WeeklyPoint { day: string; completed: number; time: number; }
interface SubjectPoint { subject: string; score: number; }

function CustomLineChart({ data, lang }: { data: WeeklyPoint[]; lang: "RU" | "KY" }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxCompleted = Math.max(...data.map(d => d.completed), 1);
  const maxTime = Math.max(...data.map(d => d.time), 1);
  const H = 180, padT = 12, padB = 28, padL = 28, padR = 8;

  // Normalise to 0–1 range
  const cx = (i: number, total: number, w: number) => padL + (total === 1 ? w / 2 : (i / (total - 1)) * w);
  const cy = (val: number, maxVal: number, h: number) => padT + (h - padT - padB) - (val / maxVal) * (h - padT - padB);

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ paddingBottom: `${(H / 480) * 100}%` }}>
        <svg
          viewBox={`0 0 480 ${H}`}
          className="absolute inset-0 w-full h-full"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line
              key={`gl-${i}`}
              x1={padL} y1={padT + t * (H - padT - padB)}
              x2={480 - padR} y2={padT + t * (H - padT - padB)}
              stroke="#e2e8f0" strokeWidth="1"
            />
          ))}

          {/* X labels */}
          {data.map((d, i) => (
            <text key={`xl-${i}`} x={cx(i, data.length, 480 - padL - padR)} y={H - 6}
              textAnchor="middle" fontSize="10" fill="#64748b">{d.day}</text>
          ))}

          {/* Completed line */}
          <polyline
            fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={data.map((d, i) => `${cx(i, data.length, 480 - padL - padR)},${cy(d.completed, maxCompleted, H)}`).join(" ")}
          />
          {/* Time line */}
          <polyline
            fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={data.map((d, i) => `${cx(i, data.length, 480 - padL - padR)},${cy(d.time, maxTime, H)}`).join(" ")}
          />

          {/* Dots & hover zones */}
          {data.map((d, i) => {
            const x = cx(i, data.length, 480 - padL - padR);
            const yC = cy(d.completed, maxCompleted, H);
            const yT = cy(d.time, maxTime, H);
            const isHov = hoveredIdx === i;
            return (
              <g key={`dg-${i}`} onMouseEnter={() => setHoveredIdx(i)}>
                <rect x={x - 14} y={padT} width={28} height={H - padT - padB} fill="transparent" />
                {isHov && <line x1={x} y1={padT} x2={x} y2={H - padB} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />}
                <circle cx={x} cy={yC} r={isHov ? 5 : 4} fill="white" stroke="#2563eb" strokeWidth="2" />
                <circle cx={x} cy={yT} r={isHov ? 5 : 4} fill="white" stroke="#f59e0b" strokeWidth="2" />
                {isHov && (
                  <g>
                    <rect x={Math.min(x - 40, 480 - padR - 84)} y={padT + 2} width={82} height={50} rx={6}
                      fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
                    <text x={Math.min(x - 40, 480 - padR - 84) + 8} y={padT + 16} fontSize="10" fontWeight="600" fill="#475569">{d.day}</text>
                    <circle cx={Math.min(x - 40, 480 - padR - 84) + 10} cy={padT + 27} r={3} fill="#2563eb" />
                    <text x={Math.min(x - 40, 480 - padR - 84) + 18} y={padT + 31} fontSize="10" fill="#2563eb">{d.completed} {lang === "RU" ? "ур." : "сабак"}</text>
                    <circle cx={Math.min(x - 40, 480 - padR - 84) + 10} cy={padT + 41} r={3} fill="#f59e0b" />
                    <text x={Math.min(x - 40, 480 - padR - 84) + 18} y={padT + 45} fontSize="10" fill="#f59e0b">{d.time} {lang === "RU" ? "мин." : "мүн."}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex gap-4 justify-end pr-2 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-[#2563eb] rounded-full" />
          <span className="text-xs text-muted-foreground">{lang === "RU" ? "Уроков" : "Сабак"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-[#f59e0b] rounded-full" />
          <span className="text-xs text-muted-foreground">{lang === "RU" ? "Минут" : "Мүнөт"}</span>
        </div>
      </div>
    </div>
  );
}

function CustomBarChart({ data, lang }: { data: SubjectPoint[]; lang: "RU" | "KY" }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-44">
        {data.map((d, i) => {
          const isHov = hoveredIdx === i;
          const barH = Math.max(d.score, 2);
          return (
            <div
              key={`cbar-${i}`}
              className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHov && (
                <div className="text-xs font-bold text-[#2563eb] mb-0.5">{d.score}%</div>
              )}
              <div
                className="w-full rounded-t-lg transition-all duration-150"
                style={{
                  height: `${barH}%`,
                  background: isHov
                    ? "linear-gradient(to top, #1d4ed8, #3b82f6)"
                    : "linear-gradient(to top, #2563eb, #93c5fd)",
                  opacity: hoveredIdx !== null && !isHov ? 0.45 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (
          <div key={`clabel-${i}`} className="flex-1 text-center">
            <span className="text-[10px] text-muted-foreground leading-tight block truncate px-0.5">{d.subject}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#2563eb]" />
          <span className="text-xs text-muted-foreground">{lang === "RU" ? "Прогресс %" : "Прогресс %"}</span>
        </div>
      </div>
    </div>
  );
}

const XP_PER_STAR    = 10;
const COINS_PER_STAR = 5;

// ── Parent/Teacher subscription plans ─────────────────────────────────────────
type PTPlan  = "free" | "premium";
type Billing = "monthly" | "yearly";

const PT_PLANS = {
  free: {
    nameRU: "Бесплатный", nameKY: "Акысыз",
    price: { monthly: 0, yearly: 0 },
    color: "from-gray-400 to-gray-500",
    featuresRU: ["1 ученик", "Базовая аналитика", "3 предмета"],
    featuresKY: ["1 окуучу", "Негизги аналитика", "3 сабак"],
  },
  premium: {
    nameRU: "Премиум", nameKY: "Премиум",
    price: { monthly: 500, yearly: 4200 },
    color: "from-amber-500 to-orange-500",
    featuresRU: ["До 30 учеников", "Полная аналитика", "Все предметы", "Еженедельные отчёты", "Email-уведомления", "Приоритетная поддержка"],
    featuresKY: ["30 окуучуга чейин", "Толук аналитика", "Бардык сабактар", "Жумалык отчёттор", "Email-билдирмелер", "Артыкчылыктуу колдоо"],
  },
} as const;

interface PTSubscription {
  plan: PTPlan;
  billing?: Billing;
  expiresAt?: string;
}

function getPTSubscription(): PTSubscription {
  try {
    const raw = localStorage.getItem("ilim_pt_subscription");
    return raw ? JSON.parse(raw) : { plan: "free" };
  } catch { return { plan: "free" }; }
}

function savePTSubscription(sub: PTSubscription) {
  localStorage.setItem("ilim_pt_subscription", JSON.stringify(sub));
}

function cancelPTSubscription() {
  localStorage.setItem("ilim_pt_subscription", JSON.stringify({ plan: "free" }));
}

// ── PT Settings ───────────────────────────────────────────────────────────────
interface PTSettings { language: "RU" | "KY"; sound: boolean; notifications: boolean; }

function getPTSettings(): PTSettings {
  try {
    const raw = localStorage.getItem("ilim_pt_settings");
    return { language: "RU", sound: true, notifications: true, ...(raw ? JSON.parse(raw) : {}) };
  } catch { return { language: "RU", sound: true, notifications: true }; }
}

function savePTSettings(patch: Partial<PTSettings>) {
  const cur = getPTSettings();
  localStorage.setItem("ilim_pt_settings", JSON.stringify({ ...cur, ...patch }));
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
interface PaymentModalProps {
  plan: PTPlan;
  billing: Billing;
  lang: "RU" | "KY";
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ plan, billing, lang, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep]       = useState<"form" | "processing" | "success">("form");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry]   = useState("");
  const [cvv, setCvv]         = useState("");
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const planInfo = PT_PLANS[plan as keyof typeof PT_PLANS] || PT_PLANS.premium;
  const price    = planInfo.price[billing];
  const label    = lang === "RU" ? planInfo.nameRU : planInfo.nameKY;

  const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp  = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  const validate = () => {
    const e: Record<string, string> = {};
    if (cardNum.replace(/\s/g, "").length < 16) e.cardNum  = lang === "RU" ? "Введите 16 цифр карты"    : "16 орундуу карта номери";
    if (!cardName.trim())                        e.cardName = lang === "RU" ? "Введите имя держателя"    : "Карта ээсинин аты";
    if (expiry.length < 5)                       e.expiry   = lang === "RU" ? "Введите срок (MM/YY)"     : "Мөөнөт (MM/YY)";
    if (cvv.length < 3)                          e.cvv      = lang === "RU" ? "3 цифры CVV"              : "3 орундуу CVV";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      const exp = new Date();
      if (billing === "monthly") exp.setMonth(exp.getMonth() + 1);
      else exp.setFullYear(exp.getFullYear() + 1);
      savePTSubscription({ plan, billing, expiresAt: exp.toISOString() });
      setTimeout(onSuccess, 1800);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === "form" ? onClose : undefined} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Modal header */}
        <div className={`bg-gradient-to-r ${planInfo.color} p-6 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              <span className="font-bold text-lg">{lang === "RU" ? "Оплата подписки" : "Жазылуу төлөмү"}</span>
            </div>
            {step === "form" && (
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-xl">{label}</div>
                <div className="text-sm text-white/80">
                  {lang === "RU"
                    ? (billing === "monthly" ? "Ежемесячная подписка" : "Годовая подписка")
                    : (billing === "monthly" ? "Ай сайын жазылуу"    : "Жылдык жазылуу")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{price} с</div>
                <div className="text-xs text-white/70">
                  {billing === "monthly" ? (lang === "RU" ? "/месяц" : "/ай") : (lang === "RU" ? "/год" : "/жыл")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === "form" && (
            <>
              <div className="flex items-center gap-2 mb-5 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <Lock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  {lang === "RU" ? "Безопасная оплата. Данные карты защищены шифрованием." : "Коопсуз төлөм. Карта маалыматтары шифрлөө менен корголгон."}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{lang === "RU" ? "Номер карты" : "Карта номери"}</label>
                  <div className="relative">
                    <input value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${errors.cardNum ? "border-red-400 bg-red-50" : "border-border focus:border-primary"}`} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <span className="text-blue-600 font-bold text-xs">VISA</span>
                      <span className="text-orange-500 font-bold text-xs">MC</span>
                    </div>
                  </div>
                  {errors.cardNum && <p className="text-xs text-red-500 mt-1">{errors.cardNum}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{lang === "RU" ? "Имя держателя" : "Карта ээсинин аты"}</label>
                  <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="IVAN IVANOV" maxLength={30}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${errors.cardName ? "border-red-400 bg-red-50" : "border-border focus:border-primary"}`} />
                  {errors.cardName && <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">{lang === "RU" ? "Срок действия" : "Колдонуу мөөнөтү"}</label>
                    <input value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${errors.expiry ? "border-red-400 bg-red-50" : "border-border focus:border-primary"}`} />
                    {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">CVV</label>
                    <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="•••" maxLength={3} type="password"
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${errors.cvv ? "border-red-400 bg-red-50" : "border-border focus:border-primary"}`} />
                    {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
              <Button onClick={handlePay}
                className={`w-full mt-6 min-h-[52px] bg-gradient-to-r ${planInfo.color} hover:opacity-90 text-white shadow-lg`}>
                <CreditCard className="w-4 h-4 mr-2" />
                {lang === "RU" ? `Оплатить ${price} с` : `${price} с төлөө`}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                {lang === "RU" ? "Демо-режим: реальные платежи не обрабатываются" : "Демо режим: чыныгы төлөмдөр иштетилбейт"}
              </p>
            </>
          )}

          {step === "processing" && (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="font-semibold text-lg">{lang === "RU" ? "Обрабатываем платёж..." : "Төлөм иштетилүүдө..."}</div>
              <p className="text-sm text-muted-foreground">{lang === "RU" ? "Пожалуйста, подождите" : "Күтүп туруңуз"}</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="font-bold text-xl text-green-600">{lang === "RU" ? "Оплата прошла!" : "Төлөм ийгиликтүү!"}</div>
              <p className="text-sm text-muted-foreground text-center">
                {lang === "RU" ? `Подписка «${label}» успешно активирована 🎉` : `«${label}» жазылуусу ийгиликтүү иштетилди 🎉`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toggle component ──────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)}
    className={`w-12 h-7 rounded-full relative transition-all flex-shrink-0 ${value ? "bg-primary" : "bg-muted-foreground/30"}`}>
    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow ${value ? "right-1" : "left-1"}`} />
  </button>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export function ParentTeacherDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]         = useState("overview");
  const [students, setStudents]           = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentUser, setCurrentUser]     = useState<ReturnType<typeof getCurrentUser>>(null);

  // Settings state
  const [ptSettings, setPtSettings]       = useState(getPTSettings());
  const [ptSub, setPtSub]                 = useState(getPTSubscription());
  const [selectedBilling, setSelectedBilling] = useState<Billing>("monthly");
  const [payModal, setPayModal]           = useState<{ plan: PTPlan; billing: Billing } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [nameSaved, setNameSaved]         = useState(false);
  const [nameInput, setNameInput]         = useState("");

  const lang = ptSettings.language;

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { navigate("/signin"); return; }
    if (user.role !== "parent" && user.role !== "teacher") { navigate("/dashboard"); return; }
    setCurrentUser(user);
    setNameInput(user.username || "");

    if (user.studentIds && user.studentIds.length > 0) {
      const linked = getStudentsByIds(user.studentIds);
      setStudents(linked);
      if (linked.length > 0) setSelectedStudent(linked[0]);
    }
  }, [navigate]);

  const handleLogout = () => { clearCurrentUser(); navigate("/signin"); };

  const updateSetting = (key: keyof typeof ptSettings, value: any) => {
    savePTSettings({ [key]: value } as any);
    setPtSettings(s => ({ ...s, [key]: value }));
  };

  const handlePaySuccess = () => { setPtSub(getPTSubscription()); setPayModal(null); };

  const handleCancelSub = () => { cancelPTSubscription(); setPtSub(getPTSubscription()); setShowCancelConfirm(false); };

  const handleSaveName = () => {
    // Update localStorage with new name
    const raw = localStorage.getItem("ilim_current_user");
    if (raw) {
      const u = JSON.parse(raw);
      localStorage.setItem("ilim_current_user", JSON.stringify({ ...u, username: nameInput.trim() || u.username }));
    }
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  };

  // Get stats for selected student
  const getStudentStats = (studentId: string) => {
    const prefix = `ilim_student_${studentId}_`;
    const tryGet = (lsKey: string, subtopics: any) => {
      const sk = `${prefix}${lsKey.replace("ilim_", "")}`;
      const s = getSubjectStats(sk, subtopics);
      return s.stars === 0 ? getSubjectStats(lsKey, subtopics) : s;
    };
    const math    = tryGet(SUBJECT_REGISTRY.math.lsKey,    SUBJECT_REGISTRY.math.subtopics);
    const russian = tryGet(SUBJECT_REGISTRY.russian.lsKey, SUBJECT_REGISTRY.russian.subtopics);
    const science = tryGet(SUBJECT_REGISTRY.science.lsKey, SUBJECT_REGISTRY.science.subtopics);
    const english = tryGet(SUBJECT_REGISTRY.english.lsKey, SUBJECT_REGISTRY.english.subtopics);
    const kyrgyz  = tryGet(SUBJECT_REGISTRY.kyrgyz.lsKey,  SUBJECT_REGISTRY.kyrgyz.subtopics);
    const totalStars = math.stars + russian.stars + science.stars + english.stars + kyrgyz.stars;
    return { totalStars, totalXP: totalStars * XP_PER_STAR, totalCoins: totalStars * COINS_PER_STAR,
      subjects: { math, russian, science, english, kyrgyz } };
  };

  const ss = selectedStudent ? getStudentStats(selectedStudent.id) : null;

  const subjectData = useMemo(() => ss ? [
    { id: "math",    subject: "Математика",    score: ss.subjects.math.percent,    stars: ss.subjects.math.stars },
    { id: "russian", subject: "Русский",        score: ss.subjects.russian.percent, stars: ss.subjects.russian.stars },
    { id: "science", subject: "Наука",          score: ss.subjects.science.percent, stars: ss.subjects.science.stars },
    { id: "english", subject: "Английский",     score: ss.subjects.english.percent, stars: ss.subjects.english.stars },
    { id: "kyrgyz",  subject: "Кыргызский",     score: ss.subjects.kyrgyz.percent,  stars: ss.subjects.kyrgyz.stars },
  ] : [], [ss]);

  const weeklyData = useMemo(() => [
    { day: "Пн", completed: 4, time: 45 },
    { day: "Вт", completed: 6, time: 62 },
    { day: "Ср", completed: 5, time: 54 },
    { day: "Чт", completed: 7, time: 71 },
    { day: "Пт", completed: 8, time: 85 },
    { day: "Сб", completed: 3, time: 32 },
    { day: "Вс", completed: 2, time: 28 },
  ], []);

  const roleLabel = currentUser?.role === "teacher"
    ? (lang === "RU" ? "Учитель" : "Мугалим")
    : (lang === "RU" ? "Родитель" : "Ата-эне");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-2 border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ILIM.KG
                </span>
                <p className="text-xs text-muted-foreground">
                  {lang === "RU" ? "Панель аналитики" : "Аналитика панели"}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {/* Language quick toggle */}
              <div className="hidden sm:flex bg-muted rounded-full p-1">
                {(["RU", "KY"] as const).map(l => (
                  <button key={l} onClick={() => updateSetting("language", l)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all min-h-[36px] ${lang === l ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Logout */}
              <Button variant="outline" size="lg" className="min-h-[48px]" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-2" />
                {lang === "RU" ? "Выйти" : "Чыгуу"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title + role badge */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {lang === "RU" ? "Аналитика и управление" : "Аналитика жана башкаруу"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {lang === "RU" ? "Отслеживайте прогресс учащихся" : "Окуучулардын прогрессин байкаңыз"}
            </p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3 bg-primary/5 border-2 border-primary/20 rounded-2xl px-4 py-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-xl">
                {currentUser.avatar || "👤"}
              </div>
              <div>
                <div className="font-bold">{currentUser.username}</div>
                <div className="text-xs text-muted-foreground">{roleLabel}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs — only Обзор + Настройки */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-14">
            <TabsTrigger value="overview" className="text-base">
              {lang === "RU" ? "Обзор" : "Жалпы"}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-base">
              {lang === "RU" ? "Настройки" : "Жөндөөлөр"}
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Student Selector */}
            {students.length > 0 && (
              <Card className="p-6 border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {lang === "RU" ? "Выберите ученика" : "Окуучуну тандаңыз"}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <button key={student.id} onClick={() => setSelectedStudent(student)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedStudent?.id === student.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-white"
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{student.avatar}</div>
                        <div>
                          <div className="font-bold">{student.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.grade} {lang === "RU" ? "класс" : "класс"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {!selectedStudent ? (
              <Card className="p-12 border-2 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">
                  {lang === "RU" ? "Нет зарегистрированных учеников" : "Катталган окуучулар жок"}
                </h3>
                <p className="text-muted-foreground">
                  {lang === "RU"
                    ? "Добавьте учеников при регистрации, чтобы отслеживать их прогресс"
                    : "Прогрессти байкоо үчүн каттоо учурунда окуучуларды кошуңуз"}
                </p>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6 border-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{lang === "RU" ? "Всего звёзд" : "Жалпы жылдыздар"}</p>
                        <h3 className="text-3xl font-bold">{ss?.totalStars || 0}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{lang === "RU" ? `из ${45 * 5} возможных` : `${45 * 5} ичинен`}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 border-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{lang === "RU" ? "Опыт (XP)" : "Тажрыйба (XP)"}</p>
                        <h3 className="text-3xl font-bold">{ss?.totalXP || 0}</h3>
                        <p className="text-sm text-muted-foreground mt-2">+{XP_PER_STAR} {lang === "RU" ? "за звезду" : "жылдыз үчүн"}</p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <Flame className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 border-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{lang === "RU" ? "Монеты" : "Тыйындар"}</p>
                        <h3 className="text-3xl font-bold">{ss?.totalCoins || 0}</h3>
                        <p className="text-sm text-muted-foreground mt-2">+{COINS_PER_STAR} {lang === "RU" ? "за звезду" : "жылдыз үчүн"}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 border-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{lang === "RU" ? "Средний прогресс" : "Орточо прогресс"}</p>
                        <h3 className="text-3xl font-bold">
                          {ss ? Math.round((ss.subjects.math.percent + ss.subjects.russian.percent + ss.subjects.science.percent + ss.subjects.english.percent + ss.subjects.kyrgyz.percent) / 5) : 0}%
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">{lang === "RU" ? "по всем предметам" : "бардык предметтер"}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="p-6 border-2">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-lg">{lang === "RU" ? "Активность за неделю" : "Жума ичиндеги активдүүлүк"}</h3>
                        <p className="text-sm text-muted-foreground">{lang === "RU" ? "Уроки и время обучения" : "Сабактар жана окуу убактысы"}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <CustomLineChart data={weeklyData} lang={lang} />
                  </Card>

                  <Card className="p-6 border-2">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-lg">{lang === "RU" ? "Успеваемость по предметам" : "Предметтер боюнча үлгүрүм"}</h3>
                        <p className="text-sm text-muted-foreground">{lang === "RU" ? "Прогресс в процентах" : "Пайыздык прогресс"}</p>
                      </div>
                    </div>
                    <CustomBarChart data={subjectData} lang={lang} />
                  </Card>
                </div>

                {/* Subject detail list */}
                <Card className="p-6 border-2">
                  <h3 className="font-bold text-lg mb-6">{lang === "RU" ? "Прогресс по предметам" : "Предметтер боюнча прогресс"}</h3>
                  <div className="space-y-4">
                    {[
                      { id: "math",    name: lang === "RU" ? "Математика"      : "Математика",    stats: ss?.subjects.math,    color: "from-blue-500 to-blue-600" },
                      { id: "russian", name: lang === "RU" ? "Русский язык"    : "Орус тили",     stats: ss?.subjects.russian, color: "from-green-500 to-green-600" },
                      { id: "science", name: lang === "RU" ? "Наука"           : "Илим",          stats: ss?.subjects.science, color: "from-amber-500 to-amber-600" },
                      { id: "english", name: lang === "RU" ? "Английский язык" : "Англис тили",   stats: ss?.subjects.english, color: "from-red-500 to-red-600" },
                      { id: "kyrgyz",  name: lang === "RU" ? "Кыргызский язык" : "Кыргыз тили",  stats: ss?.subjects.kyrgyz,  color: "from-cyan-500 to-cyan-600" },
                    ].map(sub => (
                      <div key={sub.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sub.color} flex items-center justify-center`}>
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-sm">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{sub.stats?.stars || 0} / {sub.stats?.totalTasks || 45}</span>
                            <span className="font-bold text-primary">{sub.stats?.percent || 0}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`bg-gradient-to-r ${sub.color} h-2 rounded-full transition-all`}
                            style={{ width: `${sub.stats?.percent || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── Settings Tab ────────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="max-w-2xl mx-auto space-y-6">

              {/* 1. Profile */}
              <Card className="p-6 border-2 shadow-md">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === "RU" ? "Профиль" : "Профиль"}</h3>
                </div>
                <div className="flex items-center gap-4 mb-5 p-4 bg-muted/30 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl flex-shrink-0">
                    {currentUser?.avatar || "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg truncate">{currentUser?.username}</div>
                    <div className="text-sm text-muted-foreground">{currentUser?.email}</div>
                    <div className="text-xs mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full inline-block font-semibold">
                      {roleLabel}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{lang === "RU" ? "Отображаемое имя" : "Көрсөтүлгөн аты"}</label>
                  <div className="flex gap-2">
                    <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={30}
                      placeholder={lang === "RU" ? "Введите имя..." : "Атыңызды жазыңыз..."}
                      className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border focus:border-primary outline-none text-sm transition-colors" />
                    <Button onClick={handleSaveName}
                      className={`min-h-[44px] px-4 transition-all ${nameSaved ? "bg-green-500 hover:bg-green-600" : ""}`}>
                      {nameSaved ? <Check className="w-4 h-4" /> : (lang === "RU" ? "Сохранить" : "Сактоо")}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 2. Language */}
              <Card className="p-6 border-2 shadow-md">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === "RU" ? "Язык интерфейса" : "Интерфейс тили"}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["RU", "KY"] as const).map(l => (
                    <button key={l} onClick={() => updateSetting("language", l)}
                      className={`py-4 rounded-2xl border-2 font-semibold transition-all ${
                        ptSettings.language === l ? "border-primary bg-primary text-white shadow-md" : "border-border hover:border-primary/50 bg-white"
                      }`}>
                      <div className="text-2xl mb-1">{l === "RU" ? "🇷🇺" : "🇰🇬"}</div>
                      {l === "RU" ? "Русский" : "Кыргызча"}
                    </button>
                  ))}
                </div>
              </Card>

              {/* 3. Notifications & Sound */}
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
                      {ptSettings.sound ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <div className="font-medium text-sm">{lang === "RU" ? "Звуковые эффекты" : "Үн эффекттери"}</div>
                        <div className="text-xs text-muted-foreground">{lang === "RU" ? "Сигналы в интерфейсе" : "Интерфейстеги үндөр"}</div>
                      </div>
                    </div>
                    <Toggle value={ptSettings.sound} onChange={v => updateSetting("sound", v)} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      {ptSettings.notifications ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <div className="font-medium text-sm">{lang === "RU" ? "Уведомления" : "Билдирмелер"}</div>
                        <div className="text-xs text-muted-foreground">{lang === "RU" ? "Отчёты об успехах учеников" : "Окуучулардын жетишкендиктери"}</div>
                      </div>
                    </div>
                    <Toggle value={ptSettings.notifications} onChange={v => updateSetting("notifications", v)} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">{lang === "RU" ? "Email-отчёты" : "Email-отчёттор"}</div>
                        <div className="text-xs text-muted-foreground">{lang === "RU" ? "Еженедельная статистика на почту" : "Жумалык статистика почтага"}</div>
                      </div>
                    </div>
                    <Toggle value={true} onChange={() => {}} />
                  </div>
                </div>
              </Card>

              {/* 4. Subscription */}
              <Card className="p-6 border-2 shadow-md" id="pt-subscription">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === "RU" ? "Подписка" : "Жазылуу"}</h3>
                </div>

                {/* Active plan banner */}
                {ptSub.plan !== "free" && (
                  <div className="mb-5 p-4 rounded-2xl border-2 bg-amber-50 border-amber-300">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👑</span>
                        <div>
                          <div className="font-bold text-amber-700">
                            {lang === "RU" ? "Активный план:" : "Активдүү план:"}&nbsp;
                            {lang === "RU" ? PT_PLANS[ptSub.plan].nameRU : PT_PLANS[ptSub.plan].nameKY}
                          </div>
                          {ptSub.expiresAt && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {lang === "RU" ? "Действует до:" : "Мөөнөтү:"} {formatDate(ptSub.expiresAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setShowCancelConfirm(true)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                        <X className="w-3 h-3" />
                        {lang === "RU" ? "Отменить" : "Жокко чыгаруу"}
                      </button>
                    </div>
                    {showCancelConfirm && (
                      <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                        <div className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {lang === "RU" ? "Отменить подписку?" : "Жазылуудан баш тартасызбы?"}
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-red-500 hover:bg-red-600 min-h-[40px] text-sm" onClick={handleCancelSub}>
                            {lang === "RU" ? "Да, отменить" : "Ооба"}
                          </Button>
                          <Button variant="outline" className="flex-1 min-h-[40px] text-sm" onClick={() => setShowCancelConfirm(false)}>
                            {lang === "RU" ? "Назад" : "Артка"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {ptSub.plan === "free" && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {lang === "RU"
                      ? "Выберите план для расширенного мониторинга и управления"
                      : "Кеңейтилген мониторинг жана башкаруу үчүн план тандаңыз"}
                  </p>
                )}

                {/* Billing cycle toggle */}
                <div className="flex bg-muted rounded-2xl p-1 mb-5">
                  {(["monthly", "yearly"] as Billing[]).map(b => (
                    <button key={b} onClick={() => setSelectedBilling(b)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedBilling === b ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {b === "monthly" ? (lang === "RU" ? "Ежемесячно" : "Ай сайын") : (lang === "RU" ? "Ежегодно" : "Жыл сайын")}
                      {b === "yearly" && (
                        <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">-30%</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Plan cards */}
                <div className="space-y-3">
                  {(["free", "premium"] as PTPlan[]).map(planId => {
                    const p = PT_PLANS[planId];
                    const price = p.price[selectedBilling];
                    const isCurrent = ptSub.plan === planId;
                    const isPremium = planId === "premium";
                    const features = lang === "RU" ? p.featuresRU : p.featuresKY;

                    return (
                      <div key={planId} className={`rounded-2xl border-2 overflow-hidden transition-all ${
                        isCurrent ? "border-primary shadow-md" : isPremium ? "border-amber-300 hover:border-amber-400" : "border-border"
                      }`}>
                        <div className={`bg-gradient-to-r ${p.color} p-4 text-white flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            {isPremium ? <Crown className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                            <span className="font-bold text-lg">{lang === "RU" ? p.nameRU : p.nameKY}</span>
                            {isCurrent && (
                              <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full font-semibold">
                                {lang === "RU" ? "Текущий" : "Учурдагы"}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            {price === 0
                              ? <span className="font-bold text-xl">{lang === "RU" ? "Бесплатно" : "Акысыз"}</span>
                              : <><span className="font-bold text-2xl">{price} с</span><span className="text-xs text-white/70 ml-1">{selectedBilling === "monthly" ? (lang === "RU" ? "/мес" : "/ай") : (lang === "RU" ? "/год" : "/жыл")}</span></>}
                          </div>
                        </div>
                        <div className="p-4 bg-white">
                          <ul className="space-y-1.5 mb-4">
                            {features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPremium ? "text-amber-500" : "text-gray-400"}`} />
                                <span className={planId === "free" ? "text-muted-foreground" : ""}>{f}</span>
                              </li>
                            ))}
                          </ul>
                          {planId !== "free" && (
                            <Button
                              onClick={() => !isCurrent && setPayModal({ plan: planId, billing: selectedBilling })}
                              disabled={isCurrent}
                              className={`w-full min-h-[44px] ${
                                isCurrent ? "bg-muted text-muted-foreground cursor-default"
                                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white"
                              }`}>
                              {isCurrent
                                ? <><CheckCircle2 className="w-4 h-4 mr-2" />{lang === "RU" ? "Активен" : "Активдүү"}</>
                                : <><CreditCard className="w-4 h-4 mr-2" />{lang === "RU" ? "Подключить" : "Туташтыруу"}</>}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  {lang === "RU" ? "💡 Демо-режим: реальные платежи не обрабатываются" : "💡 Демо режим: чыныгы төлөмдөр иштетилбейт"}
                </p>
              </Card>

              {/* 5. Account */}
              <Card className="p-6 border-2 border-red-200 shadow-md">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-red-600">{lang === "RU" ? "Аккаунт" : "Аккаунт"}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">{lang === "RU" ? "Email" : "Email"}</div>
                      <div className="text-xs text-muted-foreground">{currentUser?.email || "—"}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">{lang === "RU" ? "Роль" : "Ролу"}</div>
                      <div className="text-xs text-muted-foreground">{roleLabel}</div>
                    </div>
                    <div className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">{currentUser?.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-200 text-red-500 font-medium hover:bg-red-50 transition-all min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    {lang === "RU" ? "Выйти из аккаунта" : "Аккаунттан чыгуу"}
                  </button>
                </div>
              </Card>

              {/* App info */}
              <div className="text-center py-2 text-xs text-muted-foreground space-y-1">
                <div>ILIM.KG v1.0</div>
                <div>{lang === "RU" ? "Образовательная платформа для детей 6–11 лет" : "6–11 жаштагы балдар үчүн билим берүү платформасы"}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <PaymentModal
          plan={payModal.plan}
          billing={payModal.billing}
          lang={lang}
          onClose={() => setPayModal(null)}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}