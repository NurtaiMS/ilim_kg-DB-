/**
 * ILIM.KG — MongoDB Document Type Definitions
 * Simulates MongoDB document structure for browser-side storage.
 * When connecting to a real MongoDB instance, these interfaces map 1:1
 * to MongoDB collections and documents.
 *
 * Collections:
 *   • users    → Parents and Teachers
 *   • students → Student accounts with full progress data
 */

// ── ObjectId ──────────────────────────────────────────────────────────────────

/** Simulates MongoDB ObjectId (24-char hex string) */
export type ObjectId = string;

// ── Base Document ─────────────────────────────────────────────────────────────

export interface BaseDocument {
  _id: ObjectId;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export type UserRole    = "parent" | "teacher";
export type StudentRole = "student";
export type AnyRole     = UserRole | StudentRole;

// ── users Collection ──────────────────────────────────────────────────────────
/**
 * Represents a parent or teacher account.
 * Index: email (unique), username (unique)
 */
export interface UserDocument extends BaseDocument {
  username:     string;
  email:        string;
  passwordHash: string;  // djb2 double-hash with salt
  passwordSalt: string;  // random 16-char salt
  role:         UserRole;
  avatar?:      string;
  /** References to student._id documents this user manages */
  studentIds:   ObjectId[];
}

// ── students Collection ───────────────────────────────────────────────────────

/** Result of a single lesson task */
export interface LessonTaskResult {
  result:       boolean;
  attempts:     number;
  completedAt?: string; // ISO 8601
  xpEarned?:   number;
  coinsEarned?: number;
}

/**
 * Progress for one subject.
 * Structure: { [subtopicId]: { [taskNumber]: LessonTaskResult } }
 */
export type SubjectProgressData = Record<
  string,
  Record<string, LessonTaskResult>
>;

export interface SubjectProgress {
  math:    SubjectProgressData;
  russian: SubjectProgressData;
  science: SubjectProgressData;
  english: SubjectProgressData;
  kyrgyz:  SubjectProgressData;
}

export interface EquippedItems {
  avatar: string;
  frame:  string;
  badge:  string;
}

export interface StudentSettings {
  language:             "RU" | "KY";
  soundEnabled:         boolean;
  notificationsEnabled: boolean;
}

/**
 * Represents a student (child) account.
 * Index: login (unique)
 * Relations: managedByIds → users._id
 */
export interface StudentDocument extends BaseDocument {
  username:     string;
  avatar:       string;    // emoji
  grade:        string;    // e.g. "3"
  login:        string;    // auto-generated, e.g. "aizhan_2847"
  passwordHash: string;
  passwordSalt: string;

  /** Parent/teacher IDs who manage this student */
  managedByIds: ObjectId[];

  // ── Gamification ────────────────────────────────────────────────────────────
  xp:             number;
  level:          number;  // floor(xp / 300) + 1
  streak:         number;  // consecutive days active
  lastActiveDate: string;  // ISO date string (YYYY-MM-DD)

  // ── Subject Progress ────────────────────────────────────────────────────────
  subjectProgress: SubjectProgress;

  // ── Inventory & Shop ────────────────────────────────────────────────────────
  purchasedItems: string[];   // item IDs from SHOP_ITEMS
  equippedItems:  EquippedItems;
  spentCoins:     number;

  // ── Achievements ────────────────────────────────────────────────────────────
  unlockedAchievements: string[]; // achievement IDs

  // ── Settings ─────────────────────────────────────────────────────────────────
  settings: StudentSettings;
}

// ── Query / Update Operators ──────────────────────────────────────────────────

export type QueryOperator<T> =
  | T
  | { $eq?: T; $ne?: T; $gt?: number; $lt?: number; $gte?: number; $lte?: number; $in?: T[]; $nin?: T[] };

export type FilterQuery<T extends BaseDocument> = {
  [K in keyof T]?: QueryOperator<T[K]>;
};

export interface UpdateQuery<T extends BaseDocument> {
  $set?:      Partial<T>;
  $inc?:      Partial<Record<keyof T, number>>;
  $push?:     Partial<Record<keyof T, unknown>>;
  $pull?:     Partial<Record<keyof T, unknown>>;
  $addToSet?: Partial<Record<keyof T, unknown>>;
}

// ── Session ───────────────────────────────────────────────────────────────────

/** Stored in localStorage as the active session */
export interface SessionUser {
  _id:       ObjectId;
  username:  string;
  email?:    string;  // only for parent/teacher
  login?:    string;  // only for student
  role:      AnyRole;
  avatar?:   string;
  studentIds?: ObjectId[]; // only for parent/teacher
}
