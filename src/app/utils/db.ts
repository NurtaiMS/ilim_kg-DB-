/**
 * ILIM.KG — Database Layer (MongoDB Simulation)
 *
 * Exposes the MongoDB collections and domain-specific helper functions.
 * All auth/user/student operations must go through this module.
 *
 * Collections:
 *   db.users    — Parent & Teacher accounts
 *   db.students — Student accounts with full progress data
 *
 * To migrate to a real MongoDB backend:
 *   1. Replace Collection imports with your Mongoose models / MongoDB driver
 *   2. Make the helpers async and await the DB calls
 *   3. The rest of the app (authStore, components) needs no changes
 */

import { Collection, generateSalt, hashPassword, verifyPassword } from "./mongoService";
import type {
  UserDocument,
  StudentDocument,
  SessionUser,
  ObjectId,
  SubjectProgress,
  EquippedItems,
  StudentSettings,
  SubjectProgressData,
} from "./mongoTypes";

// ── Collection Instances ──────────────────────────────────────────────────────

const users    = new Collection<UserDocument>("users");
const students = new Collection<StudentDocument>("students");

/** Exported database object — mirrors the MongoDB `db` variable convention */
export const db = { users, students } as const;

// ── Defaults ──────────────────────────────────────────────────────────────────

function defaultSubjectProgress(): SubjectProgress {
  return { math: {}, russian: {}, science: {}, english: {}, kyrgyz: {} };
}

function defaultEquipped(): EquippedItems {
  return { avatar: "🎓", frame: "border-primary", badge: "" };
}

function defaultSettings(): StudentSettings {
  return { language: "RU", soundEnabled: true, notificationsEnabled: true };
}

// ── User (Parent / Teacher) Operations ───────────────────────────────────────

export interface CreateUserInput {
  username:   string;
  email:      string;
  password:   string; // plain text — will be hashed
  role:       "parent" | "teacher";
  avatar?:    string;
}

export function dbCreateUser(input: CreateUserInput): UserDocument {
  const salt = generateSalt();
  const { doc } = db.users.insertOne({
    username:     input.username,
    email:        input.email.toLowerCase().trim(),
    passwordHash: hashPassword(input.password, salt),
    passwordSalt: salt,
    role:         input.role,
    avatar:       input.avatar,
    studentIds:   [],
  });
  return doc;
}

export function dbFindUserByEmail(email: string): UserDocument | null {
  return db.users.findOne({ email: email.toLowerCase().trim() } as any);
}

export function dbFindUserByUsername(username: string): UserDocument | null {
  return db.users.find().find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  ) ?? null;
}

export function dbAuthenticateUser(
  emailOrUsername: string,
  password: string
): UserDocument | null {
  const user =
    dbFindUserByEmail(emailOrUsername) ??
    dbFindUserByUsername(emailOrUsername);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;
  return user;
}

export function dbGetUserById(id: ObjectId): UserDocument | null {
  return db.users.findById(id);
}

export function dbUpdateUser(id: ObjectId, updates: Partial<UserDocument>): void {
  db.users.updateOne({ _id: id } as any, { $set: updates });
}

export function dbLinkStudentToUser(userId: ObjectId, studentId: ObjectId): void {
  const user = db.users.findById(userId);
  if (!user) return;
  if (!user.studentIds.includes(studentId)) {
    db.users.updateOne({ _id: userId } as any, {
      $addToSet: { studentIds: studentId },
    });
  }
}

export function dbUnlinkStudentFromUser(userId: ObjectId, studentId: ObjectId): void {
  db.users.updateOne({ _id: userId } as any, {
    $pull: { studentIds: studentId },
  });
}

// ── Student Operations ────────────────────────────────────────────────────────

export interface CreateStudentInput {
  _id?:        ObjectId;
  username:    string;
  avatar:      string;
  grade:       string;
  login:       string;
  password:    string; // plain text — will be hashed
  managedById: ObjectId; // the parent/teacher's _id
}

export function dbCreateStudent(input: CreateStudentInput): StudentDocument {
  const salt = generateSalt();
  const managedByIds = input.managedById ? [input.managedById] : [];
  const { doc } = db.students.insertOne({
    _id:          input._id,
    username:     input.username,
    avatar:       input.avatar,
    grade:        input.grade,
    login:        input.login,
    passwordHash: hashPassword(input.password, salt),
    passwordSalt: salt,
    managedByIds,
    // Gamification defaults
    xp:             0,
    level:          1,
    streak:         0,
    lastActiveDate: new Date().toISOString().split("T")[0],
    // Progress
    subjectProgress: defaultSubjectProgress(),
    // Inventory
    purchasedItems:      [],
    equippedItems:       defaultEquipped(),
    spentCoins:          0,
    unlockedAchievements: [],
    // Settings
    settings: defaultSettings(),
  });
  return doc;
}

export function dbGetStudentById(id: ObjectId): StudentDocument | null {
  return db.students.findById(id);
}

export function dbGetStudentsByIds(ids: ObjectId[]): StudentDocument[] {
  return db.students.find().filter((s) => ids.includes(s._id));
}

export function dbFindStudentByLogin(login: string): StudentDocument | null {
  return db.students.find().find(
    (s) => s.login.toLowerCase() === login.toLowerCase()
  ) ?? null;
}

export function dbAuthenticateStudent(
  login: string,
  password: string
): StudentDocument | null {
  const student = dbFindStudentByLogin(login);
  if (!student) return null;
  if (!verifyPassword(password, student.passwordSalt, student.passwordHash)) return null;
  return student;
}

export function dbUpdateStudent(id: ObjectId, updates: Partial<StudentDocument>): void {
  db.students.updateOne({ _id: id } as any, { $set: updates });
}

export function dbAddXP(studentId: ObjectId, xp: number): void {
  const student = db.students.findById(studentId);
  if (!student) return;
  const newXP    = student.xp + xp;
  const newLevel = Math.floor(newXP / 300) + 1;
  db.students.updateOne({ _id: studentId } as any, {
    $set: { xp: newXP, level: newLevel },
  });
}

export function dbSpendCoins(studentId: ObjectId, amount: number): void {
  db.students.updateOne({ _id: studentId } as any, {
    $inc: { spentCoins: amount },
  });
}

export function dbPurchaseItem(studentId: ObjectId, itemId: string): void {
  db.students.updateOne({ _id: studentId } as any, {
    $addToSet: { purchasedItems: itemId },
  });
}

export function dbEquipItem(
  studentId: ObjectId,
  slot: keyof EquippedItems,
  value: string
): void {
  const student = db.students.findById(studentId);
  if (!student) return;
  const equippedItems = { ...student.equippedItems, [slot]: value };
  db.students.updateOne({ _id: studentId } as any, {
    $set: { equippedItems },
  });
}

export function dbUnlockAchievement(studentId: ObjectId, achievementId: string): void {
  db.students.updateOne({ _id: studentId } as any, {
    $addToSet: { unlockedAchievements: achievementId },
  });
}

/** Sync subject progress from localStorage into the student's MongoDB document */
export function dbSyncSubjectProgress(studentId: ObjectId): void {
  const student = db.students.findById(studentId);
  if (!student) return;

  const subjectKeys: Record<keyof SubjectProgress, string> = {
    math:    "ilim_math_progress",
    russian: "ilim_russian_progress",
    science: "ilim_science_progress",
    english: "ilim_english_progress",
    kyrgyz:  "ilim_kyrgyz_progress",
  };

  const progress = { ...student.subjectProgress };
  let changed = false;

  for (const [subject, lsKey] of Object.entries(subjectKeys)) {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as SubjectProgressData;
        (progress as Record<string, SubjectProgressData>)[subject] = parsed;
        changed = true;
      }
    } catch {
      // ignore parse errors
    }
  }

  if (changed) {
    db.students.updateOne({ _id: studentId } as any, {
      $set: { subjectProgress: progress },
    });
  }
}

/** Load subject progress from MongoDB into localStorage (for subject pages) */
export function dbRestoreSubjectProgress(studentId: ObjectId): void {
  const student = db.students.findById(studentId);
  if (!student) return;

  const subjectKeys: Record<keyof SubjectProgress, string> = {
    math:    "ilim_math_progress",
    russian: "ilim_russian_progress",
    science: "ilim_science_progress",
    english: "ilim_english_progress",
    kyrgyz:  "ilim_kyrgyz_progress",
  };

  for (const lsKey of Object.values(subjectKeys)) {
    localStorage.removeItem(lsKey);
  }

  for (const [subject, lsKey] of Object.entries(subjectKeys)) {
    const data = (student.subjectProgress as Record<string, SubjectProgressData>)[subject];
    localStorage.setItem(lsKey, JSON.stringify(data ?? {}));
  }
}

const STUDENT_SESSION_KEYS = [
  "ilim_purchases",
  "ilim_equipped",
  "ilim_spent_coins",
  "ilim_settings",
  "ilim_math_progress",
  "ilim_russian_progress",
  "ilim_science_progress",
  "ilim_english_progress",
  "ilim_kyrgyz_progress",
];

function clearStudentSessionData(): void {
  for (const key of STUDENT_SESSION_KEYS) {
    localStorage.removeItem(key);
  }
}

export function dbRestoreStudentSession(studentId: ObjectId): void {
  const student = db.students.findById(studentId);
  if (!student) return;

  clearStudentSessionData();

  localStorage.setItem("ilim_purchases", JSON.stringify(student.purchasedItems));
  localStorage.setItem("ilim_equipped", JSON.stringify(student.equippedItems));
  localStorage.setItem("ilim_spent_coins", String(student.spentCoins));
  localStorage.setItem("ilim_settings", JSON.stringify(student.settings));

  const subjectKeys: Record<keyof SubjectProgress, string> = {
    math:    "ilim_math_progress",
    russian: "ilim_russian_progress",
    science: "ilim_science_progress",
    english: "ilim_english_progress",
    kyrgyz:  "ilim_kyrgyz_progress",
  };

  for (const [subject, lsKey] of Object.entries(subjectKeys)) {
    const data = (student.subjectProgress as Record<string, SubjectProgressData>)[subject];
    localStorage.setItem(lsKey, JSON.stringify(data ?? {}));
  }
}

export function dbResetAllStudentProgress(): void {
  clearStudentSessionData();

  const emptyProgress = defaultSubjectProgress();

  const studentsList = db.students.find();
  for (const student of studentsList) {
    db.students.updateOne({ _id: student._id } as any, {
      $set: {
        subjectProgress: emptyProgress,
        xp: 0,
        level: 1,
        streak: 0,
        lastActiveDate: new Date().toISOString().split("T")[0],
        purchasedItems: [],
        equippedItems: defaultEquipped(),
        spentCoins: 0,
        unlockedAchievements: [],
        settings: defaultSettings(),
      },
    });
  }
}

export function dbSyncStudentSession(studentId: ObjectId): void {
  const student = db.students.findById(studentId);
  if (!student) return;

  const subjectKeys: Record<keyof SubjectProgress, string> = {
    math:    "ilim_math_progress",
    russian: "ilim_russian_progress",
    science: "ilim_science_progress",
    english: "ilim_english_progress",
    kyrgyz:  "ilim_kyrgyz_progress",
  };

  const subjectProgress = { ...student.subjectProgress } as SubjectProgress;
  for (const [subject, lsKey] of Object.entries(subjectKeys)) {
    try {
      const raw = localStorage.getItem(lsKey);
      subjectProgress[subject as keyof SubjectProgress] = raw ? JSON.parse(raw) : {};
    } catch {
      subjectProgress[subject as keyof SubjectProgress] = {};
    }
  }

  const purchasedItems = (() => {
    try {
      const raw = localStorage.getItem("ilim_purchases");
      return raw ? (JSON.parse(raw) as string[]) : student.purchasedItems;
    } catch {
      return student.purchasedItems;
    }
  })();

  const equippedItems = (() => {
    try {
      const raw = localStorage.getItem("ilim_equipped");
      return raw ? (JSON.parse(raw) as { avatar: string; frame: string; badge: string }) : student.equippedItems;
    } catch {
      return student.equippedItems;
    }
  })();

  const spentCoins = (() => {
    try {
      const raw = localStorage.getItem("ilim_spent_coins");
      return raw ? parseInt(raw, 10) : student.spentCoins;
    } catch {
      return student.spentCoins;
    }
  })();

  const settings = (() => {
    try {
      const raw = localStorage.getItem("ilim_settings");
      return raw ? (JSON.parse(raw) as StudentSettings) : student.settings;
    } catch {
      return student.settings;
    }
  })();

  db.students.updateOne({ _id: studentId } as any, {
    $set: {
      subjectProgress,
      purchasedItems,
      equippedItems,
      spentCoins,
      settings,
    },
  });
}

// ── Session Management ────────────────────────────────────────────────────────

const SESSION_KEY    = "ilim_mongo_session";
const AUTH_FLAG_KEY  = "ilim_authenticated";

export function dbSetSession(session: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(AUTH_FLAG_KEY, "true");

  // Keep legacy ilim_user key for backward compatibility with subject pages
  localStorage.setItem("ilim_user", JSON.stringify({
    username: session.username,
    avatar:   session.avatar ?? "🎓",
  }));

  // Also keep legacy current user object for session-aware components
  localStorage.setItem("ilim_current_user", JSON.stringify(session));
}

export function dbGetSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function dbClearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(AUTH_FLAG_KEY);
  localStorage.removeItem("ilim_user");
  localStorage.removeItem("ilim_current_user"); // legacy
}

export function dbIsAuthenticated(): boolean {
  return (
    localStorage.getItem(AUTH_FLAG_KEY) === "true" &&
    dbGetSession() !== null
  );
}

// ── Credential Generator ──────────────────────────────────────────────────────

export function dbGenerateStudentCredentials(username: string): {
  login: string;
  password: string;
} {
  const clean = username.toLowerCase().replace(/\s+/g, "").replace(/[^a-zа-яёА-ЯЁ0-9]/gi, "");
  // Transliterate common Cyrillic chars for login
  const translitMap: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",
    й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",
    у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",
    ь:"",э:"e",ю:"yu",я:"ya",
  };
  const latin = clean.split("").map((c) => translitMap[c.toLowerCase()] ?? c).join("").slice(0, 10);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const login  = `${latin || "student"}_${suffix}`;

  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // removed confusing chars
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return { login, password };
}

// ── Database Statistics ───────────────────────────────────────────────────────

export interface DbStats {
  collections: {
    name:          string;
    documentCount: number;
    storageBytes:  number;
  }[];
  totalDocuments: number;
  totalStorageBytes: number;
  lastUpdated: string;
}

export function dbGetStats(): DbStats {
  const collectionsData = [
    { name: "users",    collection: db.users },
    { name: "students", collection: db.students },
  ].map(({ name, collection }) => {
    const docs = collection.exportSnapshot();
    const raw  = localStorage.getItem(`ilim_mongo_${name}`) ?? "";
    return {
      name,
      documentCount: docs.length,
      storageBytes:  new Blob([raw]).size,
    };
  });

  return {
    collections:       collectionsData,
    totalDocuments:    collectionsData.reduce((s, c) => s + c.documentCount, 0),
    totalStorageBytes: collectionsData.reduce((s, c) => s + c.storageBytes, 0),
    lastUpdated:       new Date().toISOString(),
  };
}

// ── Data Export / Import ──────────────────────────────────────────────────────

export interface DbExport {
  version:    string;
  exportedAt: string;
  users:      UserDocument[];
  students:   StudentDocument[];
}

export function dbExportAll(): DbExport {
  return {
    version:    "1.0.0",
    exportedAt: new Date().toISOString(),
    users:      db.users.exportSnapshot(),
    students:   db.students.exportSnapshot(),
  };
}

/** Drops all collections and resets to factory state */
export function dbDropAll(): void {
  db.users.drop();
  db.students.drop();
  dbClearSession();
}