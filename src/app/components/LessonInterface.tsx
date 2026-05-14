import { useState, useEffect } from "react";
import { Link } from "react-router";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { X, HelpCircle, CheckCircle, XCircle, Coins, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";

interface DragItem {
  id: number;
  number: number;
}

interface DropItem {
  id: number;
  targetNumber: number;
  droppedNumber: number | null;
}

function NumberCard({ number, id }: { number: number; id: number }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "number",
    item: { id, number },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center cursor-move shadow-lg hover:scale-105 transition-transform border-4 border-white ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <span className="text-3xl font-bold text-white">{number}</span>
    </div>
  );
}

function DropZone({
  item,
  onDrop,
  isChecked,
  isCorrect,
}: {
  item: DropItem;
  onDrop: (id: number, droppedNumber: number) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "number",
    drop: (draggedItem: DragItem) => onDrop(item.id, draggedItem.number),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const renderObjects = () => {
    const objects = [];
    for (let i = 0; i < item.targetNumber; i++) {
      objects.push(
        <div
          key={i}
          className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-full border-2 border-white shadow-md"
        />
      );
    }
    return objects;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-3 justify-center p-6 bg-white rounded-2xl border-2 border-border shadow-sm min-h-[140px] w-full max-w-[300px]">
        {renderObjects()}
      </div>

      <div
        ref={drop}
        className={`w-28 h-28 rounded-2xl border-4 border-dashed flex items-center justify-center transition-all ${
          isOver
            ? "border-primary bg-primary/10 scale-105"
            : isChecked && isCorrect !== null
            ? isCorrect
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50"
            : "border-border bg-muted/30"
        }`}
      >
        {item.droppedNumber !== null ? (
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
              isChecked && isCorrect !== null
                ? isCorrect
                  ? "bg-gradient-to-br from-green-500 to-green-600"
                  : "bg-gradient-to-br from-red-500 to-red-600"
                : "bg-gradient-to-br from-primary to-primary/80"
            }`}
          >
            <span className="text-3xl font-bold text-white">{item.droppedNumber}</span>
          </div>
        ) : (
          <span className="text-4xl text-muted-foreground">?</span>
        )}
      </div>
    </div>
  );
}

function LessonContent() {
  const [dropItems, setDropItems] = useState<DropItem[]>([
    { id: 1, targetNumber: 3, droppedNumber: null },
    { id: 2, targetNumber: 5, droppedNumber: null },
    { id: 3, targetNumber: 2, droppedNumber: null },
  ]);

  const [availableNumbers] = useState([1, 2, 3, 4, 5]);
  const [isChecked, setIsChecked] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect" | null>(null);
  const [earnedCoins, setEarnedCoins] = useState(0);
  
  const [studentId, setStudentId] = useState<string | null>(null);
  const [currentCoins, setCurrentCoins] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rawUser = localStorage.getItem('ilim_current_user');
    if (!rawUser) { setIsLoading(false); return; }

    try {
      const user = JSON.parse(rawUser) as Record<string, unknown>;
      const id = (user.id || user._id) as string | undefined;
      if (id && user.role === 'student') {
        setStudentId(id);
        fetch(`http://localhost:5001/api/user/progress/${id}`)
          .then(res => res.json())
          .then(data => {
            setCurrentCoins(data.coins || 0);
            setCurrentLevel(data.level || 1);
            console.log(`📊 Загружен прогресс: уровень ${data.level}, монет ${data.coins}`);
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Ошибка загрузки прогресса:', err);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Ошибка разбора пользователя:', err);
      setIsLoading(false);
    }
  }, []);

  const handleDrop = (dropZoneId: number, droppedNumber: number) => {
    if (isChecked) return;
    setDropItems((prev) =>
      prev.map((item) =>
        item.id === dropZoneId ? { ...item, droppedNumber } : item
      )
    );
  };

 const checkAnswers = async () => {
  const allCorrect = dropItems.every(
    (item) => item.droppedNumber === item.targetNumber
  );
  
  setIsChecked(true);
  setFeedbackType(allCorrect ? "correct" : "incorrect");
  setShowFeedback(true);
  
  if (!allCorrect || !studentId) return;
  
  console.log(`📤 Отправка: студент ${studentId}, опыт +10, монеты +5`);
  setEarnedCoins(5);
  
  try {
    // 1. Отправляем монеты
    const coinsRes = await fetch('http://localhost:5001/api/user/add-coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, coins: 5 })
    });
    const coinsData = await coinsRes.json();
    console.log('💰 Ответ монет:', coinsData);
    
    // 2. Отправляем опыт
    const expRes = await fetch('http://localhost:5001/api/user/add-experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, exp: 10 })
    });
    const expData = await expRes.json();
    console.log('⭐ Ответ опыта:', expData);
    
    // 3. Обновляем локальное состояние
    setCurrentCoins(prev => prev + 5);
    setCurrentLevel(expData.newLevel);
    
    console.log(`💰 +5 монет, +10 опыта, новый уровень: ${expData.newLevel}`);
  } catch (err) {
    console.error('Ошибка сохранения прогресса:', err);
  }
};

  const resetLesson = () => {
    setDropItems((prev) =>
      prev.map((item) => ({ ...item, droppedNumber: null }))
    );
    setIsChecked(false);
    setShowFeedback(false);
    setFeedbackType(null);
  };

  const allAnswered = dropItems.every((item) => item.droppedNumber !== null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка прогресса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">{currentCoins} монет</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Уровень {currentLevel}</span>
        </div>
      </div>

      <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Задание: Посчитай и сопоставь</h3>
            <p className="text-muted-foreground">
              Посмотри на объекты в каждой коробке. Посчитай их и перетащи правильное число в пустое место.
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-8">
        <h4 className="mb-4 text-center font-bold text-lg">Выбери числа:</h4>
        <div className="flex flex-wrap justify-center gap-4">
          {availableNumbers.map((num) => (
            <NumberCard key={num} number={num} id={num} />
          ))}
        </div>
      </div>

      <div className="flex-1 mb-8">
        <h4 className="mb-6 text-center font-bold text-lg">Перетащи числа сюда:</h4>
        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {dropItems.map((item) => {
            const isCorrect = isChecked && item.droppedNumber === item.targetNumber;
            return (
              <DropZone
                key={item.id}
                item={item}
                onDrop={handleDrop}
                isChecked={isChecked}
                isCorrect={isCorrect}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {!isChecked ? (
          <Button
            onClick={checkAnswers}
            disabled={!allAnswered}
            className="bg-secondary hover:bg-secondary/90 px-8 py-6 text-lg min-h-[60px] min-w-[200px]"
          >
            Проверить
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button
              onClick={resetLesson}
              variant="outline"
              className="px-8 py-6 text-lg min-h-[60px] border-2"
            >
              Попробовать снова
            </Button>
            <Link to="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg min-h-[60px]">
                Следующий урок
              </Button>
            </Link>
          </div>
        )}
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
            {feedbackType === "correct" ? (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-green-600">Отлично! 🎉</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Ты правильно решил все задания!
                </p>
                <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-secondary/10 to-secondary/20 p-4 rounded-2xl mb-6">
                  <Coins className="w-8 h-8 text-secondary" />
                  <span className="text-2xl font-bold text-foreground">+{earnedCoins}</span>
                  <Star className="w-6 h-6 fill-secondary text-secondary" />
                  <span className="text-2xl font-bold text-foreground">+1</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-red-600">Попробуй ещё раз!</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Подсказка: Посчитай внимательно количество кружков в каждой коробке.
                </p>
              </>
            )}
            <Button
              onClick={() => setShowFeedback(false)}
              className="w-full bg-primary hover:bg-primary/90 min-h-[52px]"
            >
              Продолжить
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export function LessonInterface() {
  const [progress] = useState(45);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col">
        <header className="bg-white border-b-2 border-border shadow-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-foreground hover:bg-muted min-h-[48px] min-w-[48px]"
                >
                  <X className="w-6 h-6" />
                </Button>
              </Link>

              <div className="flex-1 max-w-2xl mx-8">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    Урок 5/12
                  </span>
                  <Progress value={progress} className="h-3 flex-1" />
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    {progress}%
                  </span>
                </div>
              </div>

              <div className="w-[48px]" />
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <LessonContent />
        </div>
      </div>
    </DndProvider>
  );
}