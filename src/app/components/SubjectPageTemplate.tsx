import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  GraduationCap, ArrowLeft, Star, CheckCircle2, XCircle, ChevronRight,
  Trophy, Lock, Sparkles, RefreshCw, BookOpen, Lightbulb, ChevronLeft,
} from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { getSettings } from "../utils/userStore";

// ─── Task Types ───────────────────────────────────────────────────────────────

export interface ChoiceTask {
  id: number; type?: "choice";
  question: string; emoji: string; hint: string;
  options: string[]; correct: string;
}
export interface MultiTask {
  id: number; type: "multi";
  question: string; emoji: string; hint: string;
  options: string[]; correct: string[];
}
export interface InputTask {
  id: number; type: "input";
  question: string; emoji: string; hint: string;
  correct: string; placeholder?: string;
}
export interface MatchTask {
  id: number; type: "match";
  question: string; emoji: string; hint: string;
  pairs: { left: string; right: string }[];
}
export interface SequenceTask {
  id: number; type: "sequence";
  question: string; emoji: string; hint: string;
  correctOrder: string[];
}
export interface DragDropTask {
  id: number; type: "dragdrop";
  question: string; emoji: string; hint: string;
  items: { label: string; zone: string }[];
  zones: string[];
}

export type Task = ChoiceTask | MultiTask | InputTask | MatchTask | SequenceTask | DragDropTask;

// ─── SubTopic / Topic / Config ────────────────────────────────────────────────

export interface SubTopic {
  id: string; title: string; titleKY: string; emoji: string;
  explanation: string; explanationKY: string;
  tasks: Task[];
}
export interface SubjectTopic {
  id: string; title: string; titleKY: string; emoji: string;
  color: string; lightColor: string; bgColor: string; borderColor: string;
  subtopics: SubTopic[];
}
export interface SubjectConfig {
  lsKey: string; name: string; nameKY: string; emoji: string;
  Icon: ComponentType<{ className?: string }>;
  headerGradient: string;
  topics: SubjectTopic[];
}

// ─── Progress state ───────────────────────────────────────────────────────────

interface TaskState { result: boolean | null; completed: boolean; showHint: boolean; }
type AllProgress = Record<string, Record<number, TaskState>>;

// ─── Helper colors for match task ─────────────────────────────────────────────

const PAIR_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700", ring: "ring-blue-400" },
  { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-700", ring: "ring-emerald-400" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700", ring: "ring-purple-400" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", ring: "ring-orange-400" },
];

// ─── Task Renderers ───────────────────────────────────────────────────────────

// ── 1. Choice ────────────────────────────────────────────────────────────────
function ChoiceRenderer({ task, onSubmit, isAnswered, savedResult }: {
  task: ChoiceTask; onSubmit: (correct: boolean) => void;
  isAnswered: boolean; savedResult: boolean | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = isAnswered;
  const result = savedResult;

  const handleClick = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    onSubmit(opt === task.correct);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {task.options.map(opt => {
        const isSel = selected === opt || (answered && !selected && false);
        const isCorrect = opt === task.correct;
        let cls = "relative flex items-center justify-center p-4 rounded-2xl border-2 min-h-[64px] font-bold text-base transition-all cursor-pointer text-center ";
        if (answered) {
          if (isCorrect) cls += "bg-green-100 border-green-500 text-green-700 scale-[1.02]";
          else if (isSel) cls += "bg-red-100 border-red-400 text-red-600";
          else cls += "bg-white border-gray-200 text-gray-400";
        } else {
          cls += "bg-white border-gray-200 hover:border-primary hover:bg-blue-50 hover:text-primary hover:scale-105 active:scale-95";
        }
        return (
          <button key={opt} onClick={() => handleClick(opt)} disabled={answered} className={cls}>
            {answered && isCorrect && <CheckCircle2 className="w-4 h-4 absolute top-2 right-2 text-green-500" />}
            {answered && isSel && !isCorrect && <XCircle className="w-4 h-4 absolute top-2 right-2 text-red-400" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── 2. Multi-choice ──────────────────────────────────────────────────────────
function MultiRenderer({ task, onSubmit, isAnswered, savedResult }: {
  task: MultiTask; onSubmit: (correct: boolean) => void;
  isAnswered: boolean; savedResult: boolean | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (opt: string) => {
    if (isAnswered) return;
    setSelected(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n; });
  };
  const check = () => {
    const correct = task.correct.every(c => selected.has(c)) && selected.size === task.correct.length;
    onSubmit(correct);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Выбери все правильные ответы:</p>
      <div className="grid grid-cols-2 gap-3">
        {task.options.map(opt => {
          const isCorrectOpt = task.correct.includes(opt);
          const isSel = selected.has(opt);
          let cls = "relative flex items-center gap-2 p-4 rounded-2xl border-2 min-h-[56px] font-semibold text-sm transition-all cursor-pointer ";
          if (isAnswered) {
            if (isCorrectOpt) cls += "bg-green-100 border-green-500 text-green-700";
            else if (isSel) cls += "bg-red-100 border-red-400 text-red-600";
            else cls += "bg-white border-gray-200 text-gray-400";
          } else {
            cls += isSel ? "bg-primary/10 border-primary text-primary" : "bg-white border-gray-200 hover:border-primary/50 hover:bg-blue-50";
          }
          return (
            <button key={opt} onClick={() => toggle(opt)} disabled={isAnswered} className={cls}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSel && !isAnswered ? "bg-primary border-primary" : "border-gray-300"} ${isAnswered && isCorrectOpt ? "bg-green-500 border-green-500" : ""}`}>
                {(isSel || (isAnswered && isCorrectOpt)) && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              {opt}
            </button>
          );
        })}
      </div>
      {!isAnswered && (
        <Button onClick={check} disabled={selected.size === 0} className="mt-2 min-h-[48px] bg-primary">
          ✅ Проверить
        </Button>
      )}
    </div>
  );
}

// ── 3. Input ─────────────────────────────────────────────────────────────────
function InputRenderer({ task, onSubmit, isAnswered, savedResult }: {
  task: InputTask; onSubmit: (correct: boolean) => void;
  isAnswered: boolean; savedResult: boolean | null;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!isAnswered) inputRef.current?.focus(); }, [isAnswered]);

  const check = () => {
    if (!value.trim()) return;
    const correct = value.trim().toLowerCase() === task.correct.trim().toLowerCase();
    onSubmit(correct);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Введи ответ с клавиатуры:</p>
      <div className="flex gap-3">
        <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !isAnswered && check()}
          disabled={isAnswered}
          placeholder={task.placeholder || "Введи ответ..."}
          className={`flex-1 min-h-[56px] px-5 rounded-2xl border-2 text-lg font-bold text-center outline-none transition-all ${
            isAnswered
              ? savedResult === true ? "border-green-500 bg-green-50 text-green-700" : "border-red-400 bg-red-50 text-red-600"
              : "border-gray-300 focus:border-primary bg-white"
          }`}
        />
        {!isAnswered && (
          <Button onClick={check} disabled={!value.trim()} className="min-h-[56px] px-6 bg-primary rounded-2xl">✅</Button>
        )}
      </div>
      {isAnswered && savedResult === false && (
        <p className="text-sm text-muted-foreground">
          Правильный ответ: <strong className="text-green-700">{task.correct}</strong>
        </p>
      )}
    </div>
  );
}

// ── 4. Match ─────────────────────────────────────────────────────────────────
function MatchRenderer({ task, onSubmit, isAnswered }: {
  task: MatchTask; onSubmit: (correct: boolean) => void;
  isAnswered: boolean;
}) {
  const [shuffledIndices] = useState<number[]>(() =>
    task.pairs.map((_, i) => i).sort(() => Math.random() - 0.5)
  );
  const [matches, setMatches] = useState<Record<string, number>>({});
  const [selLeft, setSelLeft] = useState<string | null>(null);

  const getLeftColor = (leftText: string) => {
    if (matches[leftText] === undefined) return null;
    const idx = task.pairs.findIndex(p => p.left === leftText);
    return PAIR_COLORS[idx % PAIR_COLORS.length];
  };

  const getRightColor = (rightPairIdx: number) => {
    const left = Object.entries(matches).find(([, ri]) => ri === rightPairIdx)?.[0];
    if (!left) return null;
    const leftIdx = task.pairs.findIndex(p => p.left === left);
    return PAIR_COLORS[leftIdx % PAIR_COLORS.length];
  };

  const handleLeft = (left: string) => {
    if (isAnswered) return;
    setSelLeft(prev => (prev === left ? null : left));
  };

  const handleRight = (rightPairIdx: number) => {
    if (isAnswered || !selLeft) return;
    const newMatches: Record<string, number> = {};
    for (const [k, v] of Object.entries(matches)) {
      if (k !== selLeft && v !== rightPairIdx) newMatches[k] = v;
    }
    newMatches[selLeft] = rightPairIdx;
    setMatches(newMatches);
    setSelLeft(null);

    if (Object.keys(newMatches).length === task.pairs.length) {
      const correct = task.pairs.every(p => {
        const matchedIdx = newMatches[p.left];
        return matchedIdx !== undefined && task.pairs[matchedIdx].right === p.right;
      });
      setTimeout(() => onSubmit(correct), 300);
    }
  };

  const allMatched = Object.keys(matches).length === task.pairs.length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {selLeft
          ? `Выбрано: «${selLeft}» → выбери пару справа`
          : "Нажми на элемент слева, потом на пару справа:"}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {task.pairs.map((pair, pairIdx) => {
            const c = getLeftColor(pair.left);
            const matched = c !== null;
            const sel = selLeft === pair.left;
            return (
              <button key={pair.left} onClick={() => handleLeft(pair.left)} disabled={isAnswered}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border-2 font-bold text-sm text-center transition-all ${
                  isAnswered
                    ? matched ? `${c!.bg} ${c!.border} ${c!.text}` : "bg-white border-gray-200 text-gray-400"
                    : matched
                    ? `${PAIR_COLORS[pairIdx % PAIR_COLORS.length].bg} ${PAIR_COLORS[pairIdx % PAIR_COLORS.length].border} ${PAIR_COLORS[pairIdx % PAIR_COLORS.length].text}`
                    : sel
                    ? "bg-primary/15 border-primary text-primary ring-2 ring-primary/30 scale-105"
                    : "bg-white border-gray-300 hover:border-primary/50 hover:bg-blue-50"
                }`}>
                {pair.left}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {shuffledIndices.map((pairIdx) => {
            const c = getRightColor(pairIdx);
            const matched = c !== null;
            const clickable = !isAnswered && !!selLeft;
            return (
              <button key={pairIdx} onClick={() => handleRight(pairIdx)}
                disabled={isAnswered || (!selLeft && !matched)}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border-2 font-bold text-sm text-center transition-all ${
                  isAnswered
                    ? matched ? `${c!.bg} ${c!.border} ${c!.text}` : "bg-white border-gray-200 text-gray-400"
                    : matched
                    ? `${c!.bg} ${c!.border} ${c!.text}`
                    : clickable
                    ? "bg-white border-gray-300 hover:border-primary/50 hover:bg-blue-50 cursor-pointer hover:scale-105"
                    : "bg-white border-gray-200 text-gray-500"
                }`}>
                {task.pairs[pairIdx].right}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 5. Sequence ───────────────────────────────────────────────────────────────
function SequenceRenderer({ task, onSubmit, isAnswered, savedResult }: {
  task: SequenceTask; onSubmit: (correct: boolean) => void;
  isAnswered: boolean; savedResult: boolean | null;
}) {
  const [shuffled] = useState(() => [...task.correctOrder].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState<string[]>([]);

  const remaining = shuffled.filter(i => !selected.includes(i));

  const pick = (item: string) => {
    if (isAnswered) return;
    setSelected([...selected, item]);
  };
  const removeLast = () => {
    if (isAnswered || selected.length === 0) return;
    setSelected(selected.slice(0, -1));
  };
  const check = () => {
    const correct = selected.every((item, i) => item === task.correctOrder[i]);
    onSubmit(correct);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Нажимай на элементы в правильном порядке:</p>
      <div className="min-h-[60px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-3 flex flex-wrap gap-2 items-center">
        {selected.length === 0 && <span className="text-gray-400 text-sm mx-auto">Здесь появятся выбранные элементы…</span>}
        {selected.map((item, i) => {
          const isCorrectPos = isAnswered && item === task.correctOrder[i];
          const isWrongPos = isAnswered && item !== task.correctOrder[i];
          return (
            <span key={`${item}-${i}`}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 ${
                isAnswered
                  ? isCorrectPos ? "bg-green-100 border-2 border-green-400 text-green-700"
                    : "bg-red-100 border-2 border-red-400 text-red-600"
                  : "bg-primary/15 border-2 border-primary/40 text-primary"
              }`}>
              <span className="text-xs opacity-60">{i + 1}.</span> {item}
              {isAnswered && (isCorrectPos ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />)}
            </span>
          );
        })}
      </div>
      {!isAnswered && (
        <div className="flex flex-wrap gap-2">
          {remaining.map(item => (
            <button key={item} onClick={() => pick(item)}
              className="px-5 py-3 rounded-2xl border-2 border-gray-300 bg-white font-bold text-base hover:border-primary hover:bg-blue-50 hover:text-primary transition-all hover:scale-105 active:scale-95">
              {item}
            </button>
          ))}
        </div>
      )}
      {!isAnswered && (
        <div className="flex gap-3">
          {selected.length > 0 && (
            <Button variant="outline" onClick={removeLast} className="min-h-[48px] rounded-2xl">
              ↩ Убрать последний
            </Button>
          )}
          {selected.length === task.correctOrder.length && (
            <Button onClick={check} className="flex-1 min-h-[48px] bg-primary rounded-2xl">
              ✅ Проверить порядок
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 6. DragDrop ───────────────────────────────────────────────────────────────
function DragDropRenderer({ task, onSubmit, isAnswered }: {
  task: DragDropTask; onSubmit: (correct: boolean) => void;
  isAnswered: boolean;
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);

  const unplaced = task.items.filter(i => !placed[i.label]);
  const allPlaced = unplaced.length === 0;

  const placeItem = (itemLabel: string, zoneName: string) => {
    setPlaced(p => ({ ...p, [itemLabel]: zoneName }));
    setSelected(null);
  };
  const removeItem = (itemLabel: string) => {
    if (isAnswered) return;
    setPlaced(p => { const n = { ...p }; delete n[itemLabel]; return n; });
  };

  const check = () => {
    const correct = task.items.every(i => placed[i.label] === i.zone);
    onSubmit(correct);
  };

  const handleItemClick = (label: string) => {
    if (isAnswered) return;
    setSelected(selected === label ? null : label);
  };
  const handleZoneClick = (zoneName: string) => {
    if (isAnswered || !selected) return;
    placeItem(selected, zoneName);
  };

  const handleDragStart = (label: string) => { draggingRef.current = label; };
  const handleDrop = (zoneName: string, e: React.DragEvent) => {
    e.preventDefault();
    if (draggingRef.current) { placeItem(draggingRef.current, zoneName); }
    setDragOver(null);
    draggingRef.current = null;
  };

  const getItemResult = (label: string) => {
    if (!isAnswered) return null;
    const item = task.items.find(i => i.label === label);
    return item ? placed[label] === item.zone : null;
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {selected ? `Выбрано: «${selected}» → нажми на категорию` : "Нажми на элемент, потом на категорию. Или перетащи."}
      </p>
      {unplaced.length > 0 && (
        <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
          {unplaced.map(item => (
            <button key={item.label} draggable
              onDragStart={() => handleDragStart(item.label)}
              onClick={() => handleItemClick(item.label)}
              className={`px-5 py-3 rounded-xl border-2 font-bold text-base transition-all active:scale-95 ${
                selected === item.label
                  ? "bg-primary text-white border-primary scale-105"
                  : "bg-white border-gray-300 hover:border-primary hover:bg-blue-50 hover:text-primary hover:scale-105"
              }`}>
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {task.zones.map(zone => {
          const itemsHere = task.items.filter(i => placed[i.label] === zone);
          const isOver = dragOver === zone;
          return (
            <div key={zone}
              onDragOver={e => { e.preventDefault(); setDragOver(zone); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(zone, e)}
              onClick={() => handleZoneClick(zone)}
              className={`min-h-[100px] rounded-2xl border-2 p-3 transition-all ${
                selected ? "cursor-pointer" : ""
              } ${
                isOver ? "border-primary bg-primary/10 scale-[1.02]" :
                selected ? "border-primary/50 bg-primary/5 hover:bg-primary/10" :
                "border-gray-300 bg-gray-50"
              }`}>
              <p className="text-xs font-bold text-center text-muted-foreground mb-2 uppercase tracking-wide">{zone}</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {itemsHere.map(item => {
                  const r = getItemResult(item.label);
                  return (
                    <span key={item.label} onClick={e => { e.stopPropagation(); removeItem(item.label); }}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                        isAnswered
                          ? r === true ? "bg-green-100 border-green-400 text-green-700"
                            : "bg-red-100 border-red-400 text-red-600"
                          : "bg-white border-gray-300 hover:border-red-300 cursor-pointer"
                      }`}>
                      {item.label}
                      {isAnswered && (r === true ? " ✓" : " ✗")}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {!isAnswered && allPlaced && (
        <Button onClick={check} className="min-h-[48px] bg-primary rounded-2xl">✅ Проверить</Button>
      )}
    </div>
  );
}

// ─── Task Dispatcher ──────────────────────────────────────────────────────────

function TaskRenderer({ task, onSubmit, isAnswered, savedResult }: {
  task: Task; onSubmit: (correct: boolean) => void;
  isAnswered: boolean; savedResult: boolean | null;
}) {
  const type = (task as any).type || "choice";
  if (type === "choice")   return <ChoiceRenderer   task={task as ChoiceTask}   onSubmit={onSubmit} isAnswered={isAnswered} savedResult={savedResult} />;
  if (type === "multi")    return <MultiRenderer    task={task as MultiTask}    onSubmit={onSubmit} isAnswered={isAnswered} savedResult={savedResult} />;
  if (type === "input")    return <InputRenderer    task={task as InputTask}    onSubmit={onSubmit} isAnswered={isAnswered} savedResult={savedResult} />;
  if (type === "match")    return <MatchRenderer    task={task as MatchTask}    onSubmit={onSubmit} isAnswered={isAnswered} />;
  if (type === "sequence") return <SequenceRenderer task={task as SequenceTask} onSubmit={onSubmit} isAnswered={isAnswered} savedResult={savedResult} />;
  if (type === "dragdrop") return <DragDropRenderer task={task as DragDropTask} onSubmit={onSubmit} isAnswered={isAnswered} />;
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

type View = "topics" | "subtopics" | "tasks";

interface SubjectPageTemplateProps {
  config: SubjectConfig;
  externalProgress?: AllProgress;
  onUpdateProgress?: (subtopicId: string, taskId: number, result: boolean) => void;
}

export function SubjectPageTemplate({ config, externalProgress, onUpdateProgress }: SubjectPageTemplateProps) {
  const navigate = useNavigate();
  const { name, nameKY, emoji, Icon, headerGradient, topics } = config;
  const [language, setLanguage] = useState<"KY" | "RU">("RU");
  const [view, setView] = useState<View>("topics");
  const [activeTopic, setActiveTopic] = useState<SubjectTopic | null>(null);
  const [activeSubtopic, setActiveSubtopic] = useState<SubTopic | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AllProgress>(externalProgress || {});
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [celebrateTask, setCelebrateTask] = useState(false);

  const playTone = (frequency: number, duration = 0.14, volume = 0.12) => {
    const audioContext = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    if (!audioContext) return;
    const ctx = new audioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), duration * 1000 + 50);
  };

  const playAnswerSound = (type: "correct" | "wrong") => {
    const settings = getSettings();
    if (!settings.sound) return;
    const soundPath = type === "correct" ? "/sounds/correct.mp3" : "/sounds/wrong.mp3";
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch(err => console.warn("Audio play failed:", err));
  };

  // Получаем ID ученика и загружаем прогресс
  useEffect(() => {
    const loadProgress = async () => {
      const rawUser = localStorage.getItem("ilim_current_user");
      if (!rawUser) {
        navigate("/signin");
        return;
      }

      let userId = null;
      try {
        const user = JSON.parse(rawUser);
        userId = user.id || user._id;
        if (userId && user.role === "student") {
          setStudentId(userId);
          
          // Загружаем прогресс из MongoDB
          const res = await fetch(`http://localhost:5001/api/user/progress/${userId}`);
          if (res.ok) {
            const data = await res.json();
            const taskProgress = data.taskProgress || {};
            setProgress(taskProgress);
            console.log(`📚 Загружен прогресс для ${name}:`, taskProgress);
          }
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Ошибка загрузки прогресса:", err);
      }
    };

    loadProgress();
  }, [navigate, name]);

  // Используем внешний прогресс если передан
  useEffect(() => {
    if (externalProgress) {
      setProgress(externalProgress);
    }
  }, [externalProgress]);

  const getState = (subId: string, taskId: number): TaskState =>
    progress[subId]?.[taskId] ?? { result: null, completed: false, showHint: false };

  const subStars = (subId: string, tasks: Task[]) => tasks.filter(t => getState(subId, t.id).result === true).length;
  const subPct   = (subId: string, tasks: Task[]) => Math.round((subStars(subId, tasks) / tasks.length) * 100);
  const topicStars = (t: SubjectTopic) => t.subtopics.reduce((a, s) => a + subStars(s.id, s.tasks), 0);
  const topicMax   = (t: SubjectTopic) => t.subtopics.reduce((a, s) => a + s.tasks.length, 0);
  const topicPct   = (t: SubjectTopic) => { const m = topicMax(t); return m ? Math.round((topicStars(t) / m) * 100) : 0; };
  const totalStars = topics.reduce((a, t) => a + topicStars(t), 0);
  const totalTasks = topics.reduce((a, t) => a + topicMax(t), 0);

  const scroll = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const openTopic = (t: SubjectTopic) => { setActiveTopic(t); setView("subtopics"); scroll(); };
  const openSubtopic = (s: SubTopic) => {
    setActiveSubtopic(s);
    setView("tasks");
    const firstIncomplete = s.tasks.findIndex(t => !progress[s.id]?.[t.id]?.completed);
    setCurrentTaskIdx(firstIncomplete === -1 ? 0 : firstIncomplete);
    setShowHint(false);
    scroll();
  };
  const goTopics    = () => { setActiveTopic(null); setActiveSubtopic(null); setView("topics"); scroll(); };
  const goSubtopics = () => { setActiveSubtopic(null); setView("subtopics"); scroll(); };

  const saveProgressToServer = async (newProgress: AllProgress, subtopicId: string, taskId: number, isCorrect: boolean) => {
    if (!studentId) return;

    try {
      await fetch("http://localhost:5001/api/user/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskProgress: newProgress
        })
      });
      console.log(`✅ Прогресс сохранён: ${subtopicId} → задание ${taskId}, результат: ${isCorrect}`);
    } catch (err) {
      console.error("Ошибка сохранения прогресса:", err);
    }
  };

  const handleTaskSubmit = async (isCorrect: boolean) => {
    if (!activeSubtopic) return;
    const task = activeSubtopic.tasks[currentTaskIdx];
    const newProgress: AllProgress = {
      ...progress,
      [activeSubtopic.id]: {
        ...progress[activeSubtopic.id],
        [task.id]: { result: isCorrect, completed: isCorrect, showHint: false },
      },
    };
    setProgress(newProgress);
    await saveProgressToServer(newProgress, activeSubtopic.id, task.id, isCorrect);
    
    if (onUpdateProgress) {
      onUpdateProgress(activeSubtopic.id, task.id, isCorrect);
    }
    
    // 🔥 НАЧИСЛЕНИЕ ОПЫТА И МОНЕТ 🔥
    if (isCorrect && studentId) {
      try {
        // Начисляем монеты
        const coinsRes = await fetch('http://localhost:5001/api/user/add-coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, coins: 5 })
        });
        const coinsData = await coinsRes.json();
        console.log('💰 Монеты:', coinsData);
        
        // Начисляем опыт
        const expRes = await fetch('http://localhost:5001/api/user/add-experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, exp: 10 })
        });
        const expData = await expRes.json();
        console.log(`⭐ Опыт: +10, новый уровень: ${expData.newLevel}`);
      } catch (err) {
        console.error('Ошибка начисления опыта/монет:', err);
      }
    }
    
    const settings = getSettings();
    playAnswerSound(isCorrect ? "correct" : "wrong");
    if (isCorrect && settings.animations) {
      setCelebrateTask(true);
      setTimeout(() => setCelebrateTask(false), 900);
    }
  };

  const handleReset = async () => {
    if (!activeSubtopic) return;
    const task = activeSubtopic.tasks[currentTaskIdx];
    const newProgress: AllProgress = {
      ...progress,
      [activeSubtopic.id]: {
        ...progress[activeSubtopic.id],
        [task.id]: { result: null, completed: false, showHint: false },
      },
    };
    setProgress(newProgress);
    await saveProgressToServer(newProgress, activeSubtopic.id, task.id, false);
  };

  const handleNext = () => {
    if (!activeSubtopic) return;
    setShowHint(false);
    if (currentTaskIdx < activeSubtopic.tasks.length - 1) setCurrentTaskIdx(i => i + 1);
  };

  const curTask    = activeSubtopic ? activeSubtopic.tasks[currentTaskIdx] : null;
  const curState   = curTask && activeSubtopic ? getState(activeSubtopic.id, curTask.id) : null;
  const isAnswered = curState?.result !== null;
  const isCorrect  = curState?.result === true;
  const isWrong    = curState?.result === false;
  const isLastTask = activeSubtopic ? currentTaskIdx === activeSubtopic.tasks.length - 1 : false;
  const allTasksDone = activeSubtopic ? activeSubtopic.tasks.every(t => getState(activeSubtopic.id, t.id).result === true) : false;

  const subjectTitle = language === "RU" ? name : nameKY;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      {celebrateTask && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="bg-yellow-400 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <span className="font-bold text-lg">+1 звезда!</span>
          </div>
        </div>
      )}

      <header className="bg-white border-b-2 border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              {view === "topics" && (
                <Link to="/dashboard"><Button variant="ghost" className="gap-2 min-h-[44px] rounded-xl"><ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">{language === "RU" ? "Назад" : "Артка"}</span></Button></Link>
              )}
              {view === "subtopics" && (
                <button onClick={goTopics} className="flex items-center gap-2 text-muted-foreground hover:text-foreground min-h-[44px] px-3 rounded-xl hover:bg-muted transition-all">
                  <ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">{language === "RU" ? "Темы" : "Темалар"}</span>
                </button>
              )}
              {view === "tasks" && (
                <button onClick={goSubtopics} className="flex items-center gap-2 text-muted-foreground hover:text-foreground min-h-[44px] px-3 rounded-xl hover:bg-muted transition-all">
                  <ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">{language === "RU" ? "Назад" : "Артка"}</span>
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${headerGradient} rounded-2xl flex items-center justify-center shadow`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-foreground leading-tight">
                    {subjectTitle}
                    {view === "subtopics" && activeTopic && <span className="text-muted-foreground font-normal"> / {language === "RU" ? activeTopic.title : activeTopic.titleKY}</span>}
                    {view === "tasks" && activeSubtopic && <span className="text-muted-foreground font-normal text-base"> / {language === "RU" ? activeSubtopic.title : activeSubtopic.titleKY}</span>}
                  </h1>
                  <p className="text-xs text-muted-foreground">{language === "RU" ? `1 класс • ${topics.length} темы` : `1-класс • ${topics.length} тема`}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex bg-muted rounded-full p-1">
                {(["KY", "RU"] as const).map(l => (
                  <button key={l} onClick={() => setLanguage(l)}
                    className={`px-4 py-2 rounded-full transition-all min-h-[44px] text-sm font-medium ${language === l ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-300 px-3 py-2 rounded-full min-h-[44px]">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm">{totalStars}/{totalTasks}</span>
              </div>
              <Link to="/dashboard"><div className={`w-10 h-10 bg-gradient-to-br ${headerGradient} rounded-xl flex items-center justify-center shadow`}><GraduationCap className="w-5 h-5 text-white" /></div></Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className={`mb-8 bg-gradient-to-r ${headerGradient} rounded-3xl p-6 text-white shadow-xl`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-0.5">{subjectTitle} {emoji}</h2>
              <p className="opacity-80 text-sm">{language === "RU" ? `${totalStars} из ${totalTasks} заданий выполнено` : `${totalTasks} тапшырманын ${totalStars} аткарылды`}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center"><div className="text-3xl font-bold">{totalStars}</div><div className="text-xs opacity-75 flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{language === "RU" ? "Звёзды" : "Жылдыздар"}</div></div>
              <div className="text-center"><div className="text-3xl font-bold">{Math.round((totalStars / totalTasks) * 100)}%</div><div className="text-xs opacity-75">Прогресс</div></div>
            </div>
          </div>
          <Progress value={(totalStars / totalTasks) * 100} className="h-2 mt-4 bg-white/20" />
        </div>

        {view === "topics" && (
          <>
            <h2 className="text-2xl font-bold mb-6">{language === "RU" ? "Выбери тему" : "Тема тандагын"}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {topics.map((topic, idx) => {
                const ts = topicStars(topic), tm = topicMax(topic), tp = topicPct(topic);
                const unlocked = idx === 0 || topicPct(topics[idx - 1]) >= 30;
                return (
                  <Card key={topic.id} onClick={() => unlocked && openTopic(topic)}
                    className={`p-6 border-2 transition-all group relative overflow-hidden ${unlocked ? "cursor-pointer hover:shadow-2xl hover:-translate-y-1" : "opacity-55 cursor-not-allowed"} ${tp === 100 ? "border-yellow-400" : topic.borderColor}`}>
                    <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${topic.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    {!unlocked && <div className="absolute top-3 right-3 bg-gray-400 rounded-full p-1.5"><Lock className="w-4 h-4 text-white" /></div>}
                    {tp === 100 && <div className="absolute top-3 right-3 bg-yellow-400 rounded-full p-1.5"><Trophy className="w-4 h-4 text-white" /></div>}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>{topic.emoji}</div>
                    <h3 className="font-bold text-lg mb-1">{language === "RU" ? topic.title : topic.titleKY}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{topic.subtopics.length} {language === "RU" ? "подтемы •" : "подтема •"} {tm} {language === "RU" ? "заданий" : "тапшырма"}</p>
                    <div className="flex flex-col gap-1.5 mb-4">
                      {topic.subtopics.map(s => <div key={s.id} className="flex items-center gap-2"><span className="text-base">{s.emoji}</span><div className="flex-1"><Progress value={subPct(s.id, s.tasks)} className="h-1.5" /></div><span className="text-xs text-muted-foreground w-8 text-right">{subPct(s.id, s.tasks)}%</span></div>)}
                    </div>
                    <div className="flex items-center gap-1 mb-4">{Array.from({length: Math.min(tm, 15)}).map((_,i) => <Star key={i} className={`w-3 h-3 ${i < ts ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />)}<span className="text-xs text-muted-foreground ml-1">{ts}/{tm}</span></div>
                    <Button className={`w-full min-h-[44px] bg-gradient-to-r ${topic.color} text-white hover:opacity-90 gap-2`} disabled={!unlocked}>
                      {tp === 100 ? (language === "RU" ? "Повторить" : "Кайталоо") : (language === "RU" ? "Открыть" : "Ачуу")}<ChevronRight className="w-4 h-4" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {view === "subtopics" && activeTopic && (
          <>
            <div className={`rounded-3xl bg-gradient-to-r ${activeTopic.color} p-6 sm:p-8 text-white mb-8 shadow-xl`}>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-5xl">{activeTopic.emoji}</div>
                <div>
                  <h2 className="text-2xl font-bold">{language === "RU" ? activeTopic.title : activeTopic.titleKY}</h2>
                  <p className="opacity-80 text-sm">{activeTopic.subtopics.length} {language === "RU" ? "подтемы" : "подтема"}</p>
                </div>
              </div>
              <Progress value={topicPct(activeTopic)} className="h-2 bg-white/25" />
              <div className="flex justify-between text-sm opacity-75 mt-1"><span>{topicStars(activeTopic)}/{topicMax(activeTopic)} {language === "RU" ? "звёзд" : "жылдыз"}</span><span>{topicPct(activeTopic)}%</span></div>
            </div>
            <h2 className="text-2xl font-bold mb-6">{language === "RU" ? "Выбери подтему" : "Подтема тандагын"}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {activeTopic.subtopics.map((sub, idx) => {
                const sp = subPct(sub.id, sub.tasks), ss = subStars(sub.id, sub.tasks), done = sp === 100;
                const prev = activeTopic.subtopics[idx - 1];
                const unlocked = idx === 0 || subPct(prev.id, prev.tasks) >= 40;
                return (
                  <Card key={sub.id} onClick={() => unlocked && openSubtopic(sub)}
                    className={`p-6 border-2 transition-all group relative overflow-hidden ${unlocked ? "cursor-pointer hover:shadow-xl hover:-translate-y-1" : "opacity-55 cursor-not-allowed"} ${done ? "border-yellow-400" : activeTopic.borderColor}`}>
                    <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${activeTopic.lightColor} opacity-10`} />
                    {!unlocked && <div className="absolute top-3 right-3 bg-gray-400 rounded-full p-1.5"><Lock className="w-3.5 h-3.5 text-white" /></div>}
                    {done && <div className="absolute top-3 right-3 bg-yellow-400 rounded-full p-1.5"><Trophy className="w-3.5 h-3.5 text-white" /></div>}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeTopic.lightColor} flex items-center justify-center text-2xl mb-4 shadow group-hover:scale-110 transition-transform`}>{sub.emoji}</div>
                    <h3 className="font-bold mb-1">{language === "RU" ? sub.title : sub.titleKY}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{sub.tasks.length} {language === "RU" ? "заданий" : "тапшырма"}</p>
                    <div className="flex gap-1 mb-3">{sub.tasks.map((_, i) => <Star key={i} className={`w-4 h-4 ${i < ss ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />)}</div>
                    <Progress value={sp} className="h-2 mb-1" /><p className="text-xs text-muted-foreground mb-4">{sp}%</p>
                    <Button className={`w-full min-h-[44px] bg-gradient-to-r ${activeTopic.lightColor} text-white hover:opacity-90 gap-2`} disabled={!unlocked}>
                      {done ? (language === "RU" ? "Повторить" : "Кайталоо") : ss > 0 ? (language === "RU" ? "Продолжить" : "Улантуу") : (language === "RU" ? "Начать" : "Башта")}<ChevronRight className="w-4 h-4" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {view === "tasks" && activeSubtopic && activeTopic && curTask && (
          <div className="max-w-[700px] mx-auto">

            <div className={`${activeTopic.bgColor} ${activeTopic.borderColor} border-2 rounded-2xl p-4 mb-6 flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeTopic.lightColor} flex items-center justify-center text-xl shadow flex-shrink-0`}>{activeSubtopic.emoji}</div>
              <div className="flex-1">
                <h2 className="font-bold">{language === "RU" ? activeSubtopic.title : activeSubtopic.titleKY}</h2>
                <div className="flex justify-between mt-0.5"><span className="text-xs text-muted-foreground">{subStars(activeSubtopic.id, activeSubtopic.tasks)}/{activeSubtopic.tasks.length} ⭐</span><span className="text-xs font-bold text-primary">{subPct(activeSubtopic.id, activeSubtopic.tasks)}%</span></div>
                <Progress value={subPct(activeSubtopic.id, activeSubtopic.tasks)} className="h-1.5 mt-1" />
              </div>
            </div>

            <Card className={`p-5 mb-6 border-2 ${activeTopic.borderColor} ${activeTopic.bgColor}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeTopic.color} flex items-center justify-center flex-shrink-0`}><BookOpen className="w-5 h-5 text-white" /></div>
                <div><div className="flex items-center gap-2 mb-1"><Lightbulb className="w-4 h-4 text-amber-500" /><span className="font-bold text-sm text-amber-700">{language === "RU" ? "Объяснение" : "Түшүндүрмө"}</span></div>
                  <p className="text-sm text-foreground leading-relaxed">{language === "RU" ? activeSubtopic.explanation : activeSubtopic.explanationKY}</p></div>
              </div>
            </Card>

            <div className="flex items-center gap-2 mb-5 justify-center">
              {activeSubtopic.tasks.map((t, i) => {
                const ts = getState(activeSubtopic.id, t.id);
                const isCur = i === currentTaskIdx;
                return (
                  <button key={t.id} onClick={() => i <= currentTaskIdx && setCurrentTaskIdx(i)}
                    className={`transition-all rounded-full ${isCur ? "w-8 h-4 scale-110" : "w-4 h-4"} ${
                      ts.result === true ? "bg-green-500" :
                      ts.result === false ? "bg-red-400" :
                      ts.completed ? "bg-gray-400" :
                      isCur ? `bg-gradient-to-r ${activeTopic.color}` : "bg-gray-300"
                    }`} />
                );
              })}
              <span className="ml-2 text-sm font-bold text-muted-foreground">{currentTaskIdx + 1}/{activeSubtopic.tasks.length}</span>
            </div>

            <Card key={`${activeSubtopic.id}-${curTask.id}`}
              className={`p-6 sm:p-8 border-2 transition-all ${isAnswered && isCorrect ? "border-green-400 bg-green-50/30" : isAnswered && isWrong ? "border-red-300 bg-red-50/30" : "border-border"}`}>

              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeTopic.lightColor} flex items-center justify-center text-2xl shadow flex-shrink-0`}>{curTask.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${activeTopic.bgColor} ${activeTopic.borderColor} border`}>
                      {(() => {
                        const t = (curTask as any).type || "choice";
                        const icons: Record<string, string> = { choice: "🔘 Выбор", multi: "☑️ Несколько", input: "⌨️ Ввод", match: "🔗 Сопоставление", sequence: "📋 Последовательность", dragdrop: "🎯 Распределение" };
                        return icons[t] || "🔘 Выбор";
                      })()}
                    </span>
                    {isAnswered && isCorrect && <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex items-center gap-1"><Star className="w-3 h-3 fill-green-600 text-green-600" /> +1 ⭐</span>}
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl text-foreground">{curTask.question}</h3>
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />}
                {isAnswered && isWrong  && <XCircle    className="w-8 h-8 text-red-400 flex-shrink-0" />}
              </div>

              <TaskRenderer
                key={`renderer-${activeSubtopic.id}-${curTask.id}`}
                task={curTask}
                onSubmit={handleTaskSubmit}
                isAnswered={isAnswered}
                savedResult={curState?.result ?? null}
              />

              {!isAnswered && (
                <div className="mt-5">
                  {!showHint ? (
                    <button onClick={() => setShowHint(true)} className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-4 py-2 rounded-xl min-h-[44px] transition-all">
                      💡 {language === "RU" ? "Подсказка" : "Кеңеш"}
                    </button>
                  ) : (
                    <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mt-2">
                      <span className="text-xl">💡</span>
                      <p className="text-amber-800 font-medium text-sm">{curTask.hint}</p>
                    </div>
                  )}
                </div>
              )}

              {isAnswered && (
                <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {isCorrect ? <><Sparkles className="w-4 h-4" /><span className="font-semibold">{language === "RU" ? "Правильно! 🎉" : "Туура! 🎉"}</span></> : <><XCircle className="w-4 h-4" /><span className="font-semibold">{language === "RU" ? "Ошибка! Попробуй ещё." : "Ката! Кайтадан аракет."}</span></>}
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    {isWrong && (
                      <button onClick={handleReset} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted hover:bg-muted/80 px-4 py-2 rounded-xl min-h-[44px] transition-all">
                        <RefreshCw className="w-4 h-4" />{language === "RU" ? "Попробовать снова" : "Кайра аракет"}
                      </button>
                    )}
                    {!isLastTask && (
                      <Button onClick={handleNext} className={`min-h-[44px] bg-gradient-to-r ${activeTopic.lightColor} text-white gap-2`}>
                        {language === "RU" ? "Следующее" : "Кийинки"} <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <div className="flex justify-between items-center mt-4">
              <button onClick={() => { setCurrentTaskIdx(i => Math.max(i - 1, 0)); setShowHint(false); }}
                disabled={currentTaskIdx === 0}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground bg-white border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl min-h-[44px] transition-all disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />{language === "RU" ? "Назад" : "Артка"}
              </button>
              {isLastTask && allTasksDone && (
                <Button onClick={goSubtopics} className={`bg-gradient-to-r ${activeTopic.color} text-white gap-2 min-h-[44px]`}>
                  <Trophy className="w-4 h-4" />{language === "RU" ? "К подтемам" : "Подтемаларга"}
                </Button>
              )}
            </div>

            {allTasksDone && isLastTask && (
              <div className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl text-center">
                <div className="text-5xl mb-3">🏆</div>
                <h3 className="text-2xl font-bold mb-2">{language === "RU" ? "Подтема пройдена!" : "Подтема аяктады!"}</h3>
                <p className="opacity-90 mb-2">{language === "RU" ? `Получено ${subStars(activeSubtopic.id, activeSubtopic.tasks)} из ${activeSubtopic.tasks.length} звёзд` : `${activeSubtopic.tasks.length} тапшырманын ${subStars(activeSubtopic.id, activeSubtopic.tasks)} жылдызы алынды`}</p>
                <div className="flex justify-center gap-2 mb-5">{activeSubtopic.tasks.map(t => <Star key={t.id} className={`w-6 h-6 ${getState(activeSubtopic.id, t.id).result === true ? "fill-white text-white" : "text-white/40"}`} />)}</div>
                <div className="flex justify-center gap-3 flex-wrap">
                  <Button onClick={goSubtopics} className="bg-white text-orange-500 hover:bg-orange-50 min-h-[44px] gap-2">
                    <ArrowLeft className="w-4 h-4" />{language === "RU" ? "К подтемам" : "Подтемаларга"}
                  </Button>
                  <Link to="/dashboard">
                    <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/40 min-h-[44px]">
                      {language === "RU" ? "На главную" : "Башкы бетке"}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}