import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, Users, BookOpen, User } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { createStudent, getStudentById, loginUser, loginAsStudentByCredentials } from "../utils/authStore";
import { fetchStudentProfile } from "../utils/serverApi";

export function SignInPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "parent" | "teacher" | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [studentFormData, setStudentFormData] = useState({ login: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedRole) newErrors.role = "Выберите роль";
    if (selectedRole === "student") {
      if (!studentFormData.login.trim()) newErrors.studentLogin = "Введите логин";
      if (!studentFormData.password) newErrors.studentPassword = "Введите пароль";
    } else {
      if (!formData.email.trim()) newErrors.email = "Введите email или логин";
      if (!formData.password) newErrors.password = "Введите пароль";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const persistLegacyAuth = (user: any, token?: string) => {
    const username = user.username || user.name || user.login || "Ученик";
    const avatar = user.avatar || "🎓";
    const studentIds = user.studentIds ?? user.childrenIds ?? [];

    if (token) {
      localStorage.setItem("token", token);
    }

    localStorage.setItem("ilim_authenticated", "true");
    localStorage.setItem("ilim_user", JSON.stringify({ username, avatar }));
    localStorage.setItem(
      "ilim_current_user",
      JSON.stringify({ ...user, username, avatar, studentIds })
    );
  };

  const clearStudentSessionData = () => {
    [
      "ilim_purchases",
      "ilim_equipped",
      "ilim_spent_coins",
      "ilim_settings",
      "ilim_math_progress",
      "ilim_russian_progress",
      "ilim_science_progress",
      "ilim_english_progress",
      "ilim_kyrgyz_progress",
    ].forEach((key) => localStorage.removeItem(key));
  };

  const restoreStudentProgressFromServer = async (
    studentId: string,
    loginProfile?: Record<string, unknown>
  ) => {
    try {
      const profile = loginProfile
        ? loginProfile
        : await fetchStudentProfile(studentId);
      clearStudentSessionData();
      const subjectKeys: Record<string, string> = {
        math: "ilim_math_progress",
        russian: "ilim_russian_progress",
        science: "ilim_science_progress",
        english: "ilim_english_progress",
        kyrgyz: "ilim_kyrgyz_progress",
      };

      if (profile.taskProgress && typeof profile.taskProgress === "object") {
        for (const [subject, lsKey] of Object.entries(subjectKeys)) {
          const value = (profile.taskProgress as Record<string, unknown>)[subject];
          if (value !== undefined) {
            localStorage.setItem(lsKey, JSON.stringify(value));
          }
        }
      }
    } catch (error) {
      console.warn("Не удалось восстановить прогресс ученика из сервера:", error);
    }
  };

  const syncServerStudent = (child: any, parentId: string) => {
    if (!child || !child._id || !child.login) return;
    if (getStudentById(child._id)) return;

    createStudent({
      id: child._id,
      username: child.name || child.login || "Ученик",
      avatar: child.avatar || "🎓",
      grade: child.grade || "",
      login: child.login,
      password: "__server__",
      managedById: parentId,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    if (!validateForm() || !selectedRole) {
      setIsLoading(false);
      return;
    }

    if (selectedRole === "student") {
      let serverAvailable = true;
      let serverSuccess = false;
      try {
        const response = await fetch("http://localhost:5001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: studentFormData.login, password: studentFormData.password }),
        });
        const data = await response.json();
        if (response.ok) {
          serverSuccess = true;
          persistLegacyAuth(data.user, data.token);
          if (data.user && data.user.id) {
            await restoreStudentProgressFromServer(data.user.id, data.user);
          }
          navigate("/dashboard");
          setIsLoading(false);
          return;
        }
        if (data.error) {
          setLoginError(data.error);
        } else {
          setLoginError("Неверный логин или пароль");
        }
      } catch (err) {
        serverAvailable = false;
      }

      if (!serverSuccess) {
        if (!serverAvailable) {
          const ok = loginAsStudentByCredentials(studentFormData.login, studentFormData.password);
          if (ok) {
            navigate("/dashboard");
          } else {
            setLoginError("Ошибка входа. Проверьте соединение.");
          }
        }
      }

      setIsLoading(false);
      return;
    }

    const localUser = loginUser(formData.email, formData.password);
    if (localUser) {
      navigate(localUser.role === "parent" || localUser.role === "teacher" ? "/analytics" : "/dashboard");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || "Неверный email/логин или пароль");
        setIsLoading(false);
        return;
      }

      persistLegacyAuth(data.user, data.token);
      if (Array.isArray(data.user.children)) {
        data.user.children.forEach((child: any) => syncServerStudent(child, data.user.id));
      }

      navigate(data.user.role === "parent" || data.user.role === "teacher" ? "/analytics" : "/dashboard");
    } catch (err) {
      setLoginError("Ошибка входа. Проверьте соединение.");
    }

    setIsLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    if (loginError) setLoginError("");
  };

  const handleStudentChange = (field: string, value: string) => {
    setStudentFormData(prev => ({ ...prev, [field]: value }));
    const errorField = field === "login" ? "studentLogin" : "studentPassword";
    if (errors[errorField]) setErrors(prev => ({ ...prev, [errorField]: "" }));
    if (loginError) setLoginError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col">
      <header className="bg-white border-b-2 border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ILIM.KG</span>
            </Link>
            <Link to="/signup"><Button variant="outline" className="min-h-[44px]">Создать аккаунт</Button></Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block space-y-6">
            <h2 className="text-4xl font-bold mb-4">Добро пожаловать <br /><span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">в ILIM.KG!</span></h2>
            <p className="text-lg text-muted-foreground">Войдите в свой аккаунт и продолжите изучать новые предметы, получайте награды и соревнуйтесь с друзьями!</p>
            <div className="space-y-4">
              {[{ icon: "🎯", text: "Интерактивное обучение" }, { icon: "🏆", text: "Система достижений" }, { icon: "📊", text: "Отслеживание прогресса" }, { icon: "👥", text: "Соревнования с друзьями" }].map((item, i) => (
                <div key={i} className="flex items-center gap-3"><div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center text-2xl">{item.icon}</div><span className="text-foreground font-medium">{item.text}</span></div>
              ))}
            </div>
          </div>

          <Card className="w-full p-8 border-2 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><LogIn className="w-8 h-8 text-white" /></div>
              <h1 className="text-3xl font-bold mb-2">Вход в систему</h1>
              <p className="text-muted-foreground">Выберите роль и введите данные</p>
            </div>

            {loginError && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl"><p className="text-sm text-red-600 text-center">{loginError}</p></div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Users className="w-4 h-4" />Выберите роль</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setSelectedRole("student")} className={`p-4 rounded-xl border-2 transition-all ${selectedRole === "student" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}><div className="text-2xl mb-1">👦</div><div className="text-sm font-semibold">Ученик</div></button>
                  <button type="button" onClick={() => setSelectedRole("parent")} className={`p-4 rounded-xl border-2 transition-all ${selectedRole === "parent" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}><div className="text-2xl mb-1">👨‍👩‍👧</div><div className="text-sm font-semibold">Родитель</div></button>
                  <button type="button" onClick={() => setSelectedRole("teacher")} className={`p-4 rounded-xl border-2 transition-all ${selectedRole === "teacher" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}><div className="text-2xl mb-1">👨‍🏫</div><div className="text-sm font-semibold">Учитель</div></button>
                </div>
                {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
              </div>

              {selectedRole === "student" ? (
                <>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center"><BookOpen className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm text-blue-900 font-medium">Вход для учеников</p><p className="text-xs text-blue-700 mt-1">Используйте логин и пароль, которые получили родители/учитель</p></div>
                  <div className="space-y-2"><Label htmlFor="studentLogin">Логин ученика</Label><Input id="studentLogin" type="text" placeholder="например: aizhan_2847" value={studentFormData.login} onChange={(e) => handleStudentChange("login", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="studentPassword">Пароль</Label><Input id="studentPassword" type={showPassword ? "text" : "password"} placeholder="Введите пароль" value={studentFormData.password} onChange={(e) => handleStudentChange("password", e.target.value)} /></div>
                </>
              ) : selectedRole && (
                <>
                  <div className="space-y-2"><Label htmlFor="email">Email или Логин</Label><Input id="email" type="text" placeholder="example@gmail.com или логин" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="password">Пароль</Label><Input id="password" type={showPassword ? "text" : "password"} placeholder="Введите пароль" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} /></div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Вход..." : "Войти"}</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}