import { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import { SubjectPageTemplate, SubjectConfig } from "./SubjectPageTemplate";

const config: SubjectConfig = {
  lsKey: "ilim_math_progress",
  name: "Математика",
  nameKY: "Математика",
  emoji: "🔢",
  Icon: Calculator,
  headerGradient: "from-blue-600 to-blue-800",
  topics: [
    // ── ЧИСЛА И ВЕЛИЧИНЫ ─────────────────────────────────────────────────────
    {
      id: "numbers",
      title: "Числа и величины",
      titleKY: "Сандар жана чоңдуктар",
      emoji: "🔢",
      color: "from-blue-500 to-blue-700",
      lightColor: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      subtopics: [
        {
          id: "numbers_count10",
          title: "Числа от 1 до 10",
          titleKY: "1ден 10го чейин сандар",
          emoji: "🍎",
          explanation: "Числа от 1 до 10 помогают нам считать предметы. Посмотри на свои пальчики — их ровно 10!",
          explanationKY: "1ден 10го чейинки сандар бизге буюмдарды саноого жардам берет.",
          tasks: [
            {
              id: 1, type: "choice",
              question: "Сколько яблок? 🍎🍎🍎🍎",
              options: ["3", "4", "5", "6"], correct: "4",
              hint: "Посчитай каждое яблоко по одному: 1, 2, 3, 4", emoji: "🍎",
            },
            {
              id: 2, type: "sequence",
              question: "Расставь числа от 1 до 5 по порядку:",
              correctOrder: ["1", "2", "3", "4", "5"],
              hint: "Числа идут по порядку: 1, 2, 3, 4, 5!", emoji: "📋",
            },
            {
              id: 3, type: "input",
              question: "Какое число идёт после 6?",
              correct: "7",
              placeholder: "Число...",
              hint: "Считай вперёд: 6, следующее — 7!", emoji: "➡️",
            },
            {
              id: 4, type: "match",
              question: "Соедини число с правильным количеством звёздочек",
              pairs: [
                { left: "3", right: "⭐⭐⭐" },
                { left: "5", right: "⭐⭐⭐⭐⭐" },
                { left: "2", right: "⭐⭐" },
                { left: "4", right: "⭐⭐⭐⭐" },
              ],
              hint: "Считай звёздочки в каждой группе!", emoji: "⭐",
            },
            {
              id: 5, type: "dragdrop",
              question: "Раздели числа на маленькие (1-5) и большие (6-10)",
              items: [
                { label: "2", zone: "Маленькие (1-5)" }, { label: "8", zone: "Большие (6-10)" },
                { label: "4", zone: "Маленькие (1-5)" }, { label: "9", zone: "Большие (6-10)" },
                { label: "1", zone: "Маленькие (1-5)" }, { label: "7", zone: "Большие (6-10)" },
              ],
              zones: ["Маленькие (1-5)", "Большие (6-10)"],
              hint: "1,2,3,4,5 — маленькие. 6,7,8,9,10 — большие!", emoji: "🎯",
            },
          ],
        },
        {
          id: "numbers_count20",
          title: "Числа от 11 до 20",
          titleKY: "11ден 20го чейин сандар",
          emoji: "🔟",
          explanation: "После 10 идут числа от 11 до 20.",
          explanationKY: "10дан кийин 11ден 20го чейинки сандар келет.",
          tasks: [
            {
              id: 1, type: "choice", question: "10 + 3 = ?",
              options: ["12", "13", "14", "30"], correct: "13",
              hint: "10 и ещё 3 = 10+3 = 13", emoji: "🔢",
            },
            {
              id: 2, type: "input", question: "Какое число идёт после 14?",
              correct: "15", placeholder: "Число...",
              hint: "Считай: 14, следующее — 15!", emoji: "➡️",
            },
            {
              id: 3, type: "sequence", question: "Расставь числа по порядку:",
              correctOrder: ["11", "13", "15", "17", "19"],
              hint: "Нечётные числа: 11, 13, 15, 17, 19!", emoji: "📋",
            },
            {
              id: 4, type: "match", question: "Соедини выражение с ответом",
              pairs: [
                { left: "10 + 5", right: "15" }, { left: "10 + 8", right: "18" },
                { left: "10 + 2", right: "12" }, { left: "10 + 9", right: "19" },
              ],
              hint: "10 плюс что-нибудь: просто добавляй к 10!", emoji: "🔗",
            },
            {
              id: 5, type: "dragdrop", question: "Раздели числа: от 11 до 15 и от 16 до 20",
              items: [
                { label: "12", zone: "11–15" }, { label: "17", zone: "16–20" },
                { label: "14", zone: "11–15" }, { label: "19", zone: "16–20" },
                { label: "11", zone: "11–15" }, { label: "20", zone: "16–20" },
              ],
              zones: ["11–15", "16–20"],
              hint: "11,12,13,14,15 — первая группа. 16,17,18,19,20 — вторая!", emoji: "🎯",
            },
          ],
        },
        {
          id: "numbers_compare",
          title: "Сравнение чисел",
          titleKY: "Сандарды салыштыруу",
          emoji: "⚖️",
          explanation: "Мы сравниваем числа с помощью знаков: > (больше), < (меньше), = (равно).",
          explanationKY: "Биз сандарды белгилер менен салыштырабыз: > (чоңурак), < (кичирек), = (барабар).",
          tasks: [
            {
              id: 1, type: "choice", question: "Какое число больше: 7 или 4?",
              options: ["4", "7", "Равны", "Не знаю"], correct: "7",
              hint: "Представь: 7 яблок и 4 яблока — где больше?", emoji: "⚖️",
            },
            {
              id: 2, type: "choice", question: "8 __ 8 — что поставить между ними?",
              options: [">", "<", "=", "+"], correct: "=",
              hint: "Числа одинаковые! Одинаковые числа равны", emoji: "🤔",
            },
            {
              id: 3, type: "input", question: "Поставь знак: 9 ___ 6 (>, < или =)?",
              correct: ">", placeholder: "> или < или =",
              hint: "9 больше чем 6, значит 9 > 6!", emoji: "🔍",
            },
            {
              id: 4, type: "match", question: "Соедини пару чисел с правильным знаком",
              pairs: [
                { left: "5 и 3", right: "5 > 3" }, { left: "2 и 7", right: "2 < 7" },
                { left: "4 и 4", right: "4 = 4" }, { left: "9 и 6", right: "9 > 6" },
              ],
              hint: "Больше = >, меньше = <, одинаково = =!", emoji: "🔗",
            },
            {
              id: 5, type: "sequence", question: "Расставь числа от наименьшего к наибольшему:",
              correctOrder: ["1", "3", "5", "7", "9"],
              hint: "Начни с самого маленького и иди к большему: 1, 3, 5, 7, 9!", emoji: "📊",
            },
          ],
        },
      ],
    },
    // ── СЛОЖЕНИЕ И ВЫЧИТАНИЕ ──────────────────────────────────────────────────
    {
      id: "addition",
      title: "Сложение и вычитание",
      titleKY: "Кошуу жана кемитүү",
      emoji: "➕",
      color: "from-orange-500 to-orange-700",
      lightColor: "from-orange-400 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-300",
      subtopics: [
        {
          id: "addition_to10",
          title: "Сложение до 10",
          titleKY: "10га чейин кошуу",
          emoji: "➕",
          explanation: "Сложение — это когда мы объединяем предметы вместе.",
          explanationKY: "Кошуу — биз буюмдарды бириктиргенде болот.",
          tasks: [
            { id: 1, type: "choice", question: "2 + 3 = ?", options: ["4", "5", "6", "7"], correct: "5", hint: "Загни 2 пальца, потом ещё 3 — сколько получилось?", emoji: "✌️" },
            { id: 2, type: "input", question: "4 + 4 = ?", correct: "8", placeholder: "Ответ...", hint: "4 + 4: считай с 4... 5, 6, 7, 8!", emoji: "🖐️" },
            { id: 3, type: "match", question: "Соедини пример с ответом", pairs: [{ left: "1 + 6", right: "7" }, { left: "5 + 3", right: "8" }, { left: "0 + 9", right: "9" }, { left: "3 + 3", right: "6" }], hint: "Сложи числа в каждой паре!", emoji: "🔗" },
            { id: 4, type: "sequence", question: "Расставь примеры от наименьшего ответа к наибольшему:", correctOrder: ["1+1", "2+3", "4+3", "5+4"], hint: "1+1=2, 2+3=5, 4+3=7, 5+4=9", emoji: "📊" },
            { id: 5, type: "dragdrop", question: "Раздели примеры: ответ меньше 5 и ответ 5 или больше", items: [{ label: "1+2", zone: "Меньше 5" }, { label: "3+4", zone: "5 или больше" }, { label: "2+2", zone: "Меньше 5" }, { label: "4+5", zone: "5 или больше" }, { label: "1+1", zone: "Меньше 5" }, { label: "5+3", zone: "5 или больше" }], zones: ["Меньше 5", "5 или больше"], hint: "1+2=3, 2+2=4, 1+1=2 — меньше 5", emoji: "🎯" },
          ],
        },
        {
          id: "subtraction_to10",
          title: "Вычитание до 10",
          titleKY: "10га чейин кемитүү",
          emoji: "➖",
          explanation: "Вычитание — это когда мы убираем предметы.",
          explanationKY: "Кемитүү — биз буюмдарды алып таштаганда болот.",
          tasks: [
            { id: 1, type: "choice", question: "7 – 3 = ?", options: ["3", "4", "5", "6"], correct: "4", hint: "От 7 считай назад 3 шага", emoji: "🎈" },
            { id: 2, type: "input", question: "9 – 4 = ?", correct: "5", placeholder: "Ответ...", hint: "От 9 считай назад 4 шага", emoji: "🔢" },
            { id: 3, type: "match", question: "Соедини пример с ответом", pairs: [{ left: "6 – 6", right: "0" }, { left: "8 – 5", right: "3" }, { left: "10 – 7", right: "3" }, { left: "9 – 2", right: "7" }], hint: "6-6=0, 8-5=3, 10-7=3, 9-2=7!", emoji: "🔗" },
            { id: 4, type: "sequence", question: "Расставь результаты вычитания от меньшего к большему:", correctOrder: ["10-9", "8-5", "7-2", "9-1"], hint: "10-9=1, 8-5=3, 7-2=5, 9-1=8", emoji: "📊" },
            { id: 5, type: "dragdrop", question: "Раздели: ответ 0 и ответ больше 0", items: [{ label: "5-5", zone: "Ответ = 0" }, { label: "8-3", zone: "Ответ > 0" }, { label: "7-7", zone: "Ответ = 0" }, { label: "9-4", zone: "Ответ > 0" }, { label: "3-3", zone: "Ответ = 0" }, { label: "6-1", zone: "Ответ > 0" }], zones: ["Ответ = 0", "Ответ > 0"], hint: "Одинаковые числа дают 0", emoji: "🎯" },
          ],
        },
        {
          id: "addSub_to20",
          title: "Сложение и вычитание до 20",
          titleKY: "20га чейин кошуу жана кемитүү",
          emoji: "🧮",
          explanation: "Теперь мы умеем считать до 20!",
          explanationKY: "Эми биз 20га чейин эсептей алабыз!",
          tasks: [
            { id: 1, type: "choice", question: "11 + 4 = ?", options: ["14", "15", "16", "17"], correct: "15", hint: "От 11 посчитай ещё 4", emoji: "➕" },
            { id: 2, type: "input", question: "18 – 6 = ?", correct: "12", placeholder: "Ответ...", hint: "От 18 считай назад 6 шагов", emoji: "➖" },
            { id: 3, type: "match", question: "Соедини пример с правильным ответом", pairs: [{ left: "13 + 3", right: "16" }, { left: "20 – 9", right: "11" }, { left: "14 + 5", right: "19" }, { left: "17 – 4", right: "13" }], hint: "13+3=16, 20-9=11, 14+5=19, 17-4=13", emoji: "🔗" },
            { id: 4, type: "sequence", question: "Расставь ответы примеров по порядку от меньшего:", correctOrder: ["15-4", "12+3", "11+7", "20-1"], hint: "15-4=11, 12+3=15, 11+7=18, 20-1=19", emoji: "📊" },
            { id: 5, type: "multi", question: "Выбери ВСЕ примеры, ответ которых равен 15:", options: ["10+5", "20-5", "13+3", "16-1", "8+7"], correct: ["10+5", "20-5", "16-1", "8+7"], hint: "10+5=15✓, 20-5=15✓, 13+3=16✗, 16-1=15✓, 8+7=15✓", emoji: "☑️" },
          ],
        },
      ],
    },
    // ── ТЕКСТОВЫЕ ЗАДАЧИ ─────────────────────────────────────────────────────
    {
      id: "wordproblems",
      title: "Текстовые задачи",
      titleKY: "Текстик маселелер",
      emoji: "📝",
      color: "from-purple-500 to-purple-700",
      lightColor: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
      subtopics: [
        {
          id: "word_addition",
          title: "Задачи на сложение",
          titleKY: "Кошуу маселелери",
          emoji: "🧺",
          explanation: "В текстовой задаче нам рассказывают историю, а мы должны найти ответ.",
          explanationKY: "Текстик масселеде бизге бир окуя айтылат.",
          tasks: [
            { id: 1, type: "choice", question: "У Айгуль было 3 шарика 🎈. Ей подарили ещё 2. Сколько стало?", options: ["4", "5", "6", "7"], correct: "5", hint: "Было 3, дали ещё 2: 3 + 2 = ?", emoji: "🎈" },
            { id: 2, type: "input", question: "В клетке 4 птички 🐦. Прилетели ещё 3. Сколько стало?", correct: "7", placeholder: "Ответ...", hint: "Было 4, прилетели 3: 4 + 3 = ?", emoji: "🐦" },
            { id: 3, type: "dragdrop", question: "Раздели ключевые слова: для сложения и для вычитания", items: [{ label: "дали ещё", zone: "Сложение (+)" }, { label: "съели", zone: "Вычитание (–)" }, { label: "добавили", zone: "Сложение (+)" }, { label: "ушли", zone: "Вычитание (–)" }, { label: "купили ещё", zone: "Сложение (+)" }, { label: "потеряли", zone: "Вычитание (–)" }], zones: ["Сложение (+)", "Вычитание (–)"], hint: "Прибавляем: «дали, добавили, купили ещё». Убираем: «съели, ушли, потеряли»!", emoji: "🎯" },
            { id: 4, type: "match", question: "Соедини задачу с нужным действием", pairs: [{ left: "Маша купила 5 яблок и ещё 4", right: "5 + 4 = 9" }, { left: "Было 7 конфет, съели 3", right: "7 – 3 = 4" }, { left: "Пришли 3 гостя, ещё 2", right: "3 + 2 = 5" }, { left: "Было 8 птиц, улетели 5", right: "8 – 5 = 3" }], hint: "«Ещё» = сложение. «Съели, улетели» = вычитание!", emoji: "🔗" },
            { id: 5, type: "sequence", question: "Расставь шаги решения задачи по порядку:", correctOrder: ["Прочитать задачу", "Найти числа", "Выбрать действие", "Решить пример", "Написать ответ"], hint: "Сначала читаем, находим числа, выбираем +/–, решаем, пишем ответ!", emoji: "📋" },
          ],
        },
        {
          id: "word_subtraction",
          title: "Задачи на вычитание",
          titleKY: "Кемитүү маселелери",
          emoji: "🍬",
          explanation: "Ключевые слова для вычитания: «съели», «ушли», «потеряли», «отдали», «осталось».",
          explanationKY: "Кемитүү үчүн негизги сөздөр: «жеди», «кетти», «жоготту», «берди», «калды».",
          tasks: [
            { id: 1, type: "choice", question: "У Эмира было 8 конфет 🍬. Он съел 3. Сколько осталось?", options: ["4", "5", "6", "7"], correct: "5", hint: "Было 8, съел 3: 8 – 3 = ?", emoji: "🍬" },
            { id: 2, type: "input", question: "На ветке 9 воробьёв 🐦. Улетели 4. Сколько осталось?", correct: "5", placeholder: "Ответ...", hint: "Было 9, улетели 4: 9 – 4 = ?", emoji: "🐦" },
            { id: 3, type: "match", question: "Соедини задачу с правильным примером", pairs: [{ left: "7 монет, потерял 2", right: "7 – 2 = 5" }, { left: "10 шаров, 6 улетело", right: "10 – 6 = 4" }, { left: "Было 9, ушли 5", right: "9 – 5 = 4" }, { left: "Было 8, съели 4", right: "8 – 4 = 4" }], hint: "Ищи слова «потерял, улетело, ушли, съели» — это вычитание!", emoji: "🔗" },
            { id: 4, type: "dragdrop", question: "Раздели задачи: нужно сложить или вычесть?", items: [{ label: "Дали 3 яблока ещё", zone: "Сложение" }, { label: "Съели 2 конфеты", zone: "Вычитание" }, { label: "Пришли 4 друга", zone: "Сложение" }, { label: "Улетели 5 птиц", zone: "Вычитание" }], zones: ["Сложение", "Вычитание"], hint: "Добавляется = сложение. Убывает = вычитание!", emoji: "🎯" },
            { id: 5, type: "sequence", question: "Расставь числа вычитания по порядку (от наибольшего остатка):", correctOrder: ["7-1", "9-4", "8-5", "6-5"], hint: "7-1=6, 9-4=5, 8-5=3, 6-5=1", emoji: "📊" },
          ],
        },
        {
          id: "word_compare",
          title: "Задачи на сравнение",
          titleKY: "Салыштыруу маселелери",
          emoji: "🔍",
          explanation: "В задачах на сравнение нужно узнать: «на сколько больше» или «на сколько меньше»?",
          explanationKY: "Салыштыруу маселесинде «канча чоңурак» же «канча кичирек» экенин табуу керек.",
          tasks: [
            { id: 1, type: "choice", question: "У Айгуль 5 яблок 🍎, у Бекзата 3 яблока. На сколько больше у Айгуль?", options: ["1", "2", "3", "4"], correct: "2", hint: "5 – 3 = 2", emoji: "🍎" },
            { id: 2, type: "input", question: "В красной коробке 8 карандашей, в синей 6. На сколько больше в красной?", correct: "2", placeholder: "Ответ...", hint: "8 – 6 = ?", emoji: "✏️" },
            { id: 3, type: "match", question: "Соедини задачу с правильным ответом", pairs: [{ left: "7 и 4, на сколько больше?", right: "3" }, { left: "9 и 6, на сколько меньше?", right: "3" }, { left: "8 и 5, разница?", right: "3" }, { left: "10 и 7, на сколько больше?", right: "3" }], hint: "Разница = большее – меньшее", emoji: "🔗" },
            { id: 4, type: "multi", question: "Выбери ВСЕ задачи, где нужно ВЫЧИТАТЬ:", options: ["На сколько больше?", "Сколько всего?", "На сколько меньше?", "Сколько добавили?", "Какая разница?"], correct: ["На сколько больше?", "На сколько меньше?", "Какая разница?"], hint: "«На сколько больше/меньше» и «разница» — это вычитание!", emoji: "☑️" },
            { id: 5, type: "sequence", question: "Расставь пары чисел по разнице (от наименьшей разницы):", correctOrder: ["5 и 4", "7 и 4", "9 и 4", "10 и 4"], hint: "5-4=1, 7-4=3, 9-4=5, 10-4=6", emoji: "📊" },
          ],
        },
      ],
    },
  ],
};

export function MathSubjectPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const rawUser = localStorage.getItem("ilim_current_user");
      if (!rawUser) {
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(rawUser);
        const userId = user.id || user._id;
        if (userId && user.role === "student") {
          setStudentId(userId);
          const res = await fetch(`http://localhost:5001/api/user/progress/${userId}`);
          if (res.ok) {
            const data = await res.json();
            setProgress(data.taskProgress || {});
            console.log("📚 Загружен прогресс математики из MongoDB:", data.taskProgress);
          }
        }
      } catch (err) {
        console.error("Ошибка загрузки прогресса:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateProgress = async (subtopicId: string, taskId: number, result: boolean) => {
    if (!studentId) return;

    const newProgress = {
      ...progress,
      [subtopicId]: {
        ...(progress?.[subtopicId] || {}),
        [taskId]: { result, completed: true, showHint: false }
      }
    };
    setProgress(newProgress);

    try {
      await fetch("http://localhost:5001/api/user/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, taskProgress: newProgress })
      });
      console.log(`✅ Прогресс сохранён: ${subtopicId} → задание ${taskId}`);
    } catch (err) {
      console.error("Ошибка сохранения прогресса:", err);
    }
  };

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
    <SubjectPageTemplate
      config={config}
      externalProgress={progress}
      onUpdateProgress={updateProgress}
    />
  );
}