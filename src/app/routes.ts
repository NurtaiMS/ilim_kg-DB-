import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { SignUpPage } from "./components/SignUpPage";
import { SignInPage } from "./components/SignInPage";
import { StudentDashboard } from "./components/StudentDashboard";
import { LessonInterface } from "./components/LessonInterface";
import { ParentTeacherDashboard } from "./components/ParentTeacherDashboard";
import { ShopPage } from "./components/ShopPage";
import { MathSubjectPage } from "./components/MathSubjectPage";
import { RussianSubjectPage } from "./components/RussianSubjectPage";
import { ScienceSubjectPage } from "./components/ScienceSubjectPage";
import { EnglishSubjectPage } from "./components/EnglishSubjectPage";
import { KyrgyzSubjectPage } from "./components/KyrgyzSubjectPage";
import { ProfileSettingsPage } from "./components/ProfileSettingsPage";

export const router = createBrowserRouter([
  { path: "/",               Component: LandingPage },
  { path: "/signup",         Component: SignUpPage },
  { path: "/signin",         Component: SignInPage },
  { path: "/dashboard",      Component: StudentDashboard },
  { path: "/settings",       Component: ProfileSettingsPage },
  { path: "/lesson",         Component: LessonInterface },
  { path: "/analytics",      Component: ParentTeacherDashboard },
  { path: "/shop",           Component: ShopPage },
  { path: "/subject/math",   Component: MathSubjectPage },
  { path: "/subject/russian",Component: RussianSubjectPage },
  { path: "/subject/science",Component: ScienceSubjectPage },
  { path: "/subject/english",Component: EnglishSubjectPage },
  { path: "/subject/kyrgyz", Component: KyrgyzSubjectPage },
]);