/**
 * ILIM.KG — Auth Store
 *
 * Public API layer that wraps the MongoDB simulation (db.ts).
 * All existing components import from here — the API is 100% backward-compatible.
 *
 * Internally every operation delegates to the MongoDB collection helpers in db.ts.
 */

import {
  db,
  dbCreateUser,
  dbCreateStudent,
  dbGetStudentById,
  dbGetStudentsByIds,
  dbUpdateStudent,
  dbUpdateUser,
  dbLinkStudentToUser,
  dbUnlinkStudentFromUser,
  dbFindUserByEmail,
  dbFindUserByUsername,
  dbAuthenticateUser,
  dbAuthenticateStudent,
  dbSetSession,
  dbGetSession,
  dbClearSession,
  dbIsAuthenticated,
  dbGenerateStudentCredentials,
  dbRestoreSubjectProgress,
  dbRestoreStudentSession,
  dbSyncStudentSession,
  dbResetAllStudentProgress,
} from "./db";
import type { UserDocument, StudentDocument, SessionUser, ObjectId } from "./mongoTypes";

// ── Re-exports for backward compat ────────────────────────────────────────────

export type UserRole = "student" | "parent" | "teacher";

/** Legacy User shape (maps to UserDocument) */
export interface User {
  id:          string;
  username:    string;
  email:       string;
  role:        UserRole;
  avatar?:     string;
  createdAt:   string;
  studentIds?: string[];
}

/** Legacy Student shape (maps to StudentDocument) */
export interface Student {
  id:        string;
  username:  string;
  avatar:    string;
  grade?:    string;
  createdAt: string;
  login?:    string;
  password?: string; // plain text stored only at generation time for display
}

// ── Internal converters ───────────────────────────────────────────────────────

function userDocToLegacy(doc: UserDocument): User {
  return {
    id:         doc._id,
    username:   doc.username,
    email:      doc.email,
    role:       doc.role,
    avatar:     doc.avatar,
    createdAt:  doc.createdAt,
    studentIds: doc.studentIds,
  };
}

function studentDocToLegacy(doc: StudentDocument): Student {
  return {
    id:        doc._id,
    username:  doc.username,
    avatar:    doc.avatar,
    grade:     doc.grade,
    createdAt: doc.createdAt,
    login:     doc.login,
  };
}

function sessionFromUser(doc: UserDocument): SessionUser {
  return {
    _id:        doc._id,
    username:   doc.username,
    email:      doc.email,
    role:       doc.role,
    avatar:     doc.avatar,
    studentIds: doc.studentIds,
  };
}

function sessionFromStudent(doc: StudentDocument): SessionUser {
  return {
    _id:      doc._id,
    username: doc.username,
    login:    doc.login,
    role:     "student",
    avatar:   doc.avatar,
  };
}

// ── Legacy helpers: migration from old ilim_users_db / ilim_students_db ───────

/**
 * One-time migration: reads old localStorage keys and imports them into MongoDB.
 * Safe to call on every app start — skips if already migrated.
 */
function migrateOldData(): void {
  const MIGRATED_KEY = "ilim_mongo_migrated_v1";
  if (localStorage.getItem(MIGRATED_KEY)) return;

  try {
    // Old users (no password stored — they'll get a temporary hash)
    const oldUsersRaw = localStorage.getItem("ilim_users_db");
    if (oldUsersRaw) {
      const oldUsers = JSON.parse(oldUsersRaw) as Array<{
        id: string; username: string; email: string; role: string;
        avatar?: string; createdAt: string; studentIds?: string[];
      }>;
      for (const u of oldUsers) {
        const exists = dbFindUserByEmail(u.email) || dbFindUserByUsername(u.username);
        if (!exists && (u.role === "parent" || u.role === "teacher")) {
          // Migrate without password — user will need to reset
          dbCreateUser({
            username: u.username,
            email:    u.email,
            password: "__migrated__",
            role:     u.role as "parent" | "teacher",
            avatar:   u.avatar,
          });
        }
      }
    }
  } catch {
    // silent
  }

  localStorage.setItem(MIGRATED_KEY, "1");
}

// Run migration on module load
migrateOldData();

// ── Session API ───────────────────────────────────────────────────────────────

/** Returns the currently logged-in User (parent/teacher) or null */
function getLegacyCurrentUser(): User | null {
  const raw = localStorage.getItem("ilim_current_user");
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<User> & { name?: string; login?: string; role?: UserRole; email?: string };
    if (!stored.role || stored.role === "student") return null;
    return {
      id: stored.id ?? stored.login ?? "",
      username: stored.username ?? stored.name ?? stored.login ?? "Пользователь",
      email: stored.email ?? "",
      role: stored.role,
      avatar: stored.avatar,
      createdAt: stored.createdAt ?? new Date().toISOString(),
      studentIds: stored.studentIds,
    };
  } catch {
    return null;
  }
}

function getLegacySession(): SessionUser | null {
  const raw = localStorage.getItem("ilim_current_user");
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<SessionUser> & { login?: string; role?: UserRole; email?: string };
    if (!stored.role) return null;
    return {
      _id: stored._id ?? stored.id ?? stored.login ?? "",
      username: stored.username ?? stored.login ?? "",
      email: stored.email,
      role: stored.role,
      avatar: stored.avatar,
      studentIds: stored.studentIds,
    } as SessionUser;
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  const session = dbGetSession();
  if (session && session.role !== "student") {
    const doc = db.users.findById(session._id);
    if (doc) return userDocToLegacy(doc);
  }
  return getLegacyCurrentUser();
}

/** Returns the current session regardless of role (parent/teacher/student) */
export function getCurrentSession(): SessionUser | null {
  return dbGetSession() ?? getLegacySession();
}

/** Sets the current session from a User object (parent/teacher login) */
export function setCurrentUser(user: User): void {
  const doc = db.users.findById(user.id);
  if (!doc) return;
  dbSetSession(sessionFromUser(doc));
}

export function clearCurrentUser(): void {
  const session = getCurrentSession();
  if (session?.role === "student") {
    dbSyncStudentSession(session._id);
  }

  dbClearSession();
  localStorage.removeItem("ilim_authenticated");
  localStorage.removeItem("ilim_user");
  localStorage.removeItem("ilim_current_user");

  // Also clear generic student session data to avoid leaking progress across accounts
  localStorage.removeItem("ilim_purchases");
  localStorage.removeItem("ilim_equipped");
  localStorage.removeItem("ilim_spent_coins");
  localStorage.removeItem("ilim_settings");
  localStorage.removeItem("ilim_math_progress");
  localStorage.removeItem("ilim_russian_progress");
  localStorage.removeItem("ilim_science_progress");
  localStorage.removeItem("ilim_english_progress");
  localStorage.removeItem("ilim_kyrgyz_progress");
}

export function isAuthenticated(): boolean {
  return dbIsAuthenticated() || localStorage.getItem("ilim_authenticated") === "true";
}

// ── Users CRUD ────────────────────────────────────────────────────────────────

/** Creates a parent or teacher account. Password is required. */
export function createUser(
  userData: Omit<User, "id" | "createdAt"> & { password?: string }
): User {
  const role = userData.role as "parent" | "teacher";
  const doc = dbCreateUser({
    username: userData.username,
    email:    userData.email,
    password: userData.password || "__no_password__",
    role,
    avatar:   userData.avatar,
  });
  return userDocToLegacy(doc);
}

export function updateUser(userId: string, updates: Partial<User>): void {
  const patch: Partial<UserDocument> = {};
  if (updates.username) patch.username = updates.username;
  if (updates.email)    patch.email    = updates.email;
  if (updates.avatar)   patch.avatar   = updates.avatar;
  if (updates.studentIds) patch.studentIds = updates.studentIds;
  dbUpdateUser(userId, patch);

  // Refresh session if this is the current user
  const session = dbGetSession();
  if (session && session._id === userId && session.role !== "student") {
    const doc = db.users.findById(userId);
    if (doc) dbSetSession(sessionFromUser(doc));
  }
}

export { dbFindUserByEmail as findUserByEmail };
export { dbFindUserByUsername as findUserByUsername };

// Wrap to return legacy User type
export function findUserByEmailLegacy(email: string): User | null {
  const doc = dbFindUserByEmail(email);
  return doc ? userDocToLegacy(doc) : null;
}

export function findUserByUsernameLegacy(username: string): User | null {
  const doc = dbFindUserByUsername(username);
  return doc ? userDocToLegacy(doc) : null;
}

// ── Students CRUD ─────────────────────────────────────────────────────────────

export function createStudent(
  studentData: Omit<Student, "id" | "createdAt"> & {
    id?:         string;
    login:       string;
    password:    string;
    managedById?: string;
  }
): Student {
  const doc = dbCreateStudent({
    _id:         studentData.id,
    username:    studentData.username,
    avatar:      studentData.avatar,
    grade:       studentData.grade ?? "",
    login:       studentData.login,
    password:    studentData.password,
    managedById: studentData.managedById ?? "",
  });
  return studentDocToLegacy(doc);
}

export function getStudentById(studentId: string): Student | null {
  const doc = dbGetStudentById(studentId);
  return doc ? studentDocToLegacy(doc) : null;
}

export function getStudentsByIds(studentIds: string[]): Student[] {
  return dbGetStudentsByIds(studentIds).map(studentDocToLegacy);
}

export function updateStudent(studentId: string, updates: Partial<Student>): void {
  const patch: Partial<StudentDocument> = {};
  if (updates.username) patch.username = updates.username;
  if (updates.avatar)   patch.avatar   = updates.avatar;
  if (updates.grade)    patch.grade    = updates.grade;
  dbUpdateStudent(studentId, patch);
}

export function resetAllStudentProgress(): void {
  dbResetAllStudentProgress();
}

// ── Link Students ─────────────────────────────────────────────────────────────

export function linkStudentToUser(userId: string, studentId: string): void {
  dbLinkStudentToUser(userId, studentId);
}

export function unlinkStudentFromUser(userId: string, studentId: string): void {
  dbUnlinkStudentFromUser(userId, studentId);
}

// ── Student Login ─────────────────────────────────────────────────────────────

export function loginAsStudent(studentId: string): boolean {
  const currentSession = getCurrentSession();
  if (currentSession?.role === "student" && currentSession._id !== studentId) {
    dbSyncStudentSession(currentSession._id);
  }

  const doc = dbGetStudentById(studentId);
  if (!doc) return false;

  dbSetSession(sessionFromStudent(doc));

  // Restore student-specific session data into localStorage
  dbRestoreStudentSession(studentId);

  // Legacy compatibility
  localStorage.setItem("ilim_user", JSON.stringify({
    username: doc.username,
    avatar:   doc.avatar,
  }));

  return true;
}

export function loginAsStudentByCredentials(login: string, password: string): boolean {
  const doc = dbAuthenticateStudent(login, password);
  if (!doc) return false;
  return loginAsStudent(doc._id);
}

// ── Parent / Teacher Login ────────────────────────────────────────────────────

/**
 * Authenticates a parent/teacher and sets the session.
 * Returns the User or null if credentials are wrong.
 */
export function loginUser(emailOrUsername: string, password: string): User | null {
  const doc = dbAuthenticateUser(emailOrUsername, password);
  if (!doc) return null;
  dbSetSession(sessionFromUser(doc));
  return userDocToLegacy(doc);
}

// ── Credential Generator ──────────────────────────────────────────────────────

export const generateStudentCredentials = dbGenerateStudentCredentials;