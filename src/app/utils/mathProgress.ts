// Shared utility for Math subject progress
// Used by both MathSubjectPage and StudentDashboard

// All sub-topic IDs and their task counts (3 topics × 3 subtopics × 5 tasks = 45)
export const MATH_TOPICS = [
  { id: "numbers_count10",   taskCount: 5 },
  { id: "numbers_count20",   taskCount: 5 },
  { id: "numbers_compare",   taskCount: 5 },
  { id: "addition_to10",     taskCount: 5 },
  { id: "subtraction_to10",  taskCount: 5 },
  { id: "addSub_to20",       taskCount: 5 },
  { id: "word_addition",     taskCount: 5 },
  { id: "word_subtraction",  taskCount: 5 },
  { id: "word_compare",      taskCount: 5 },
];

export const MATH_TOTAL_TASKS = MATH_TOPICS.reduce((acc, t) => acc + t.taskCount, 0); // 45

export const LS_KEY = "ilim_math_progress";

// XP and coins awarded per correct answer
export const XP_PER_STAR    = 10;
export const COINS_PER_STAR = 5;

// Base values (before any math tasks are done)
export const BASE_XP    = 1000;
export const BASE_COINS = 300;

interface TaskState {
  selectedAnswer: string | null;
  result: boolean | null;
  showHint: boolean;
  completed: boolean;
}

interface MathProgress {
  [subtopicId: string]: { [taskId: number]: TaskState };
}

export interface MathStats {
  totalStars:      number;
  totalTasks:      number;
  progressPercent: number;
  earnedXP:        number;
  earnedCoins:     number;
}

export function getMathStats(): MathStats {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyStats();

    const data: MathProgress = JSON.parse(raw);
    let stars = 0;

    MATH_TOPICS.forEach(({ id, taskCount }) => {
      for (let i = 1; i <= taskCount; i++) {
        if (data[id]?.[i]?.result === true) stars++;
      }
    });

    return {
      totalStars:      stars,
      totalTasks:      MATH_TOTAL_TASKS,
      progressPercent: Math.round((stars / MATH_TOTAL_TASKS) * 100),
      earnedXP:        stars * XP_PER_STAR,
      earnedCoins:     stars * COINS_PER_STAR,
    };
  } catch {
    return emptyStats();
  }
}

function emptyStats(): MathStats {
  return {
    totalStars:      0,
    totalTasks:      MATH_TOTAL_TASKS,
    progressPercent: 0,
    earnedXP:        0,
    earnedCoins:     0,
  };
}
