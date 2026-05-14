import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, CheckCircle, Users, BookOpen, Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function SignUpPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"parent" | "teacher" | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [children, setChildren] = useState<Array<{ username: string; avatar: string; grade: string }>>([]);
  const [currentChild, setCurrentChild] = useState({ username: "", avatar: "🎓", grade: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<Array<{ username: string; login: string; password: string; avatar: string; grade: string }>>([]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedRole) {
      newErrors.role = "Выберите роль";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Введите логин";
    } else if (formData.username.length < 3) {
      newErrors.username = "Логин должен содержать минимум 3 символа";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Введите email";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Введите корректный email адрес";
    }

    if (!formData.password) {
      newErrors.password = "Введите пароль";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Подтвердите пароль";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    if (children.length === 0) {
      newErrors.children = "Добавьте хотя бы одного ребёнка";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm() || !selectedRole) return;

  try {
    const childrenData = children.map(child => ({
      username: child.username,
      avatar: "🎓",
      grade: child.grade,
    }));

    const response = await fetch('http://localhost:5001/api/auth/register-with-children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: formData.username,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        name: formData.username,
        children: childrenData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при регистрации');
    }

    const data = await response.json();
    setGeneratedCredentials(data.students);
    setShowCredentials(true);
  } catch (err: any) {
    console.error('Ошибка регистрации:', err);
    alert(err.message || 'Ошибка при регистрации. Попробуйте ещё раз.');
  }
};

  const handleAddChild = () => {
    if (!currentChild.username.trim()) {
      setErrors(prev => ({ ...prev, childName: "Введите имя ребёнка" }));
      return;
    }
    if (!currentChild.grade.trim()) {
      setErrors(prev => ({ ...prev, childGrade: "Введите класс" }));
      return;
    }

    const gradeNum = parseInt(currentChild.grade);
    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 5) {
      setErrors(prev => ({ ...prev, childGrade: "Класс должен быть от 1 до 5" }));
      return;
    }

    setChildren([...children, { ...currentChild }]);
    setCurrentChild({ username: "", avatar: "🎓", grade: "" });
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.childName;
      delete newErrors.childGrade;
      delete newErrors.children;
      return newErrors;
    });
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ILIM.KG
              </span>
            </Link>
            <Link to="/signin">
              <Button variant="outline" className="min-h-[44px]">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl p-8 border-2 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Регистрация для взрослых</h1>
            <p className="text-muted-foreground">
              Родители и учителя могут зарегистрировать детей
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Выберите вашу роль
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole("parent")}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    selectedRole === "parent"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
                  <div className="font-bold">Родитель</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Следите за успехами ребёнка
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("teacher")}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    selectedRole === "teacher"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-4xl mb-2">👨‍🏫</div>
                  <div className="font-bold">Учитель</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Управляйте классами
                  </div>
                </button>
              </div>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role}</p>
              )}
            </div>
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Логин
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите логин"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className={`min-h-[48px] ${errors.username ? "border-red-500" : ""}`}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email (Gmail)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`min-h-[48px] ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Минимум 6 символов"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`min-h-[48px] pr-12 ${errors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Подтвердите пароль
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль еще раз"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className={`min-h-[48px] ${errors.confirmPassword ? "border-red-500" : ""}`}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Children Registration */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Зарегистрируйте детей
              </Label>

              {/* Added Children List */}
              {children.length > 0 && (
                <div className="space-y-2 mb-3">
                  {children.map((child, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl border-2 border-border">
                      <div className="text-2xl">{child.avatar}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{child.username}</div>
                        <div className="text-xs text-muted-foreground">{child.grade} класс</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChild(index)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Child Form */}
              <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="childName" className="text-xs">Имя ребёнка</Label>
                    <Input
                      id="childName"
                      type="text"
                      placeholder="Айжан"
                      value={currentChild.username}
                      onChange={(e) => setCurrentChild({ ...currentChild, username: e.target.value })}
                      className="min-h-[44px] mt-1"
                    />
                    {errors.childName && (
                      <p className="text-xs text-red-500 mt-1">{errors.childName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="childGrade" className="text-xs">Класс</Label>
                    <Input
                      id="childGrade"
                      type="text"
                      placeholder="3"
                      value={currentChild.grade}
                      onChange={(e) => setCurrentChild({ ...currentChild, grade: e.target.value })}
                      className="min-h-[44px] mt-1"
                    />
                    {errors.childGrade && (
                      <p className="text-xs text-red-500 mt-1">{errors.childGrade}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddChild}
                  variant="outline"
                  className="w-full min-h-[44px] border-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить ребёнка
                </Button>
              </div>
              {errors.children && (
                <p className="text-sm text-red-500">{errors.children}</p>
              )}
            </div>

            {/* Features List */}
            <div className="bg-accent/50 p-4 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-foreground mb-2">Вы получите доступ к:</p>
              {[
                "Подробной аналитике успехов детей",
                "Отчётам по всем предметам",
                "Системе уведомлений о прогрессе",
                "Управлению несколькими учениками"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {feature}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 min-h-[52px] text-lg"
            >
              Зарегистрироваться
            </Button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/signin" className="text-primary font-semibold hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </Card>
      </div>

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl p-8 border-2 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Регистрация успешна!</h2>
              <p className="text-muted-foreground">
                Сохраните учетные данные для входа детей
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium mb-2">
                📋 Сохраните учетные данные
              </p>
              <p className="text-xs text-blue-700">
                Запишите или сделайте скриншот этих данных. Они понадобятся детям для входа в систему.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {generatedCredentials.map((cred, index) => (
                <div key={index} className="bg-accent/50 rounded-xl p-5 border-2 border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{cred.avatar}</div>
                    <div>
                      <div className="font-bold text-lg">{cred.username}</div>
                      <div className="text-xs text-muted-foreground">{cred.grade} класс</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground mb-1">Логин для входа:</div>
                      <div className="font-mono font-bold text-primary">{cred.login}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground mb-1">Пароль:</div>
                      <div className="font-mono font-bold text-primary">{cred.password}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-orange-900 font-medium">
                ⚠️ Важно: Сохраните эти данные
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Дети будут использовать эти логины и пароли для входа в систему. Запишите их или сделайте скриншот.
              </p>
            </div>

            <Button
              onClick={() => {
                setShowCredentials(false);
                navigate("/analytics");
              }}
              className="w-full bg-primary hover:bg-primary/90 min-h-[52px] text-lg"
            >
              Продолжить в личный кабинет
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}