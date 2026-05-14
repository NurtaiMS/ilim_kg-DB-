/**
 * ILIM.KG — MongoDB Simulation Engine
 *
 * Simulates a MongoDB-compatible API using localStorage as the storage backend.
 * When migrating to a real MongoDB backend (Node.js + MongoDB driver or
 * Mongoose), replace the Collection class implementation while keeping the
 * same interface — all calling code will work without changes.
 *
 * Storage keys: every collection is stored as "ilim_mongo_{collectionName}"
 */

import type {
  BaseDocument,
  FilterQuery,
  UpdateQuery,
  ObjectId,
} from "./mongoTypes";

// ── ObjectId Generator ────────────────────────────────────────────────────────

/** Generates a MongoDB-style 24-char hex ObjectId */
export function generateObjectId(): ObjectId {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const machineId = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  const processId = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");
  const counter   = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return timestamp + machineId + processId + counter;
}

// ── Password Utilities ────────────────────────────────────────────────────────
// NOTE: This is a browser-side implementation using a simple hash.
// In production with a real MongoDB backend, use bcrypt or argon2 server-side.

const PEPPER = "ILIM_KG_SECRET_PEPPER_2024_v1";

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // Keep as 32-bit int
  }
  return Math.abs(hash);
}

/** Generates a random 16-character salt */
export function generateSalt(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let salt = "";
  for (let i = 0; i < 16; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  return salt;
}

/** Hashes a password with salt + pepper using double djb2 */
export function hashPassword(password: string, salt: string): string {
  const round1 = djb2(password + salt).toString(16).padStart(8, "0");
  const round2 = djb2(round1 + salt + PEPPER).toString(16).padStart(8, "0");
  const round3 = djb2(round2 + password + PEPPER).toString(16).padStart(8, "0");
  return round1 + round2 + round3; // 24-char hex string
}

/** Verifies a plain password against stored hash+salt */
export function verifyPassword(plainPassword: string, salt: string, storedHash: string): boolean {
  return hashPassword(plainPassword, salt) === storedHash;
}

// ── Filter Matcher ────────────────────────────────────────────────────────────

function matchesValue(docVal: unknown, filterVal: unknown): boolean {
  if (filterVal === null || filterVal === undefined) {
    return docVal === filterVal;
  }
  if (typeof filterVal === "object" && !Array.isArray(filterVal)) {
    const ops = filterVal as Record<string, unknown>;
    if ("$eq"  in ops) return docVal === ops.$eq;
    if ("$ne"  in ops) return docVal !== ops.$ne;
    if ("$gt"  in ops) return (docVal as number) > (ops.$gt as number);
    if ("$lt"  in ops) return (docVal as number) < (ops.$lt as number);
    if ("$gte" in ops) return (docVal as number) >= (ops.$gte as number);
    if ("$lte" in ops) return (docVal as number) <= (ops.$lte as number);
    if ("$in"  in ops) return Array.isArray(ops.$in) && ops.$in.includes(docVal);
    if ("$nin" in ops) return Array.isArray(ops.$nin) && !ops.$nin.includes(docVal);
  }
  return docVal === filterVal;
}

function matchesFilter<T extends BaseDocument>(doc: T, filter: FilterQuery<T>): boolean {
  return Object.entries(filter).every(([key, filterVal]) => {
    const docVal = (doc as Record<string, unknown>)[key];
    return matchesValue(docVal, filterVal);
  });
}

// ── Update Applier ────────────────────────────────────────────────────────────

function applyUpdate<T extends BaseDocument>(doc: T, update: UpdateQuery<T>): T {
  let result: Record<string, unknown> = { ...doc };

  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      result[k] = v;
    }
  }

  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc as Record<string, number>)) {
      result[k] = ((result[k] as number) || 0) + v;
    }
  }

  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push as Record<string, unknown>)) {
      const arr = (result[k] as unknown[]) || [];
      result[k] = [...arr, v];
    }
  }

  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull as Record<string, unknown>)) {
      const arr = (result[k] as unknown[]) || [];
      result[k] = arr.filter((item) => item !== v);
    }
  }

  if (update.$addToSet) {
    for (const [k, v] of Object.entries(update.$addToSet as Record<string, unknown>)) {
      const arr = (result[k] as unknown[]) || [];
      if (!arr.includes(v)) result[k] = [...arr, v];
    }
  }

  // Always update the updatedAt timestamp
  result.updatedAt = new Date().toISOString();

  return result as T;
}

// ── Collection Class ──────────────────────────────────────────────────────────

export interface InsertOneResult { insertedId: ObjectId; acknowledged: boolean }
export interface UpdateResult    { matchedCount: number; modifiedCount: number; acknowledged: boolean }
export interface DeleteResult    { deletedCount: number; acknowledged: boolean }

export class Collection<T extends BaseDocument> {
  private readonly storageKey: string;

  constructor(public readonly collectionName: string) {
    this.storageKey = `ilim_mongo_${collectionName}`;
  }

  // ── Internal ──

  private read(): T[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private write(docs: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(docs));
  }

  // ── Public API (mirrors MongoDB Node.js driver) ──

  /** Returns the total number of documents in the collection */
  countDocuments(filter?: FilterQuery<T>): number {
    const docs = this.read();
    if (!filter || Object.keys(filter).length === 0) return docs.length;
    return docs.filter((d) => matchesFilter(d, filter)).length;
  }

  /** Returns all documents matching the optional filter */
  find(filter?: FilterQuery<T>): T[] {
    const docs = this.read();
    if (!filter || Object.keys(filter).length === 0) return docs;
    return docs.filter((d) => matchesFilter(d, filter));
  }

  /** Returns the first document matching the filter, or null */
  findOne(filter: FilterQuery<T>): T | null {
    const docs = this.read();
    return docs.find((d) => matchesFilter(d, filter)) ?? null;
  }

  /** Returns a document by its _id */
  findById(id: ObjectId): T | null {
    return this.findOne({ _id: id } as FilterQuery<T>);
  }

  /** Inserts a new document. Automatically adds _id, createdAt, updatedAt */
  insertOne(docData: Omit<T, "createdAt" | "updatedAt"> & Partial<Pick<T, "_id">>): InsertOneResult & { doc: T } {
    const docs = this.read();
    const now = new Date().toISOString();
    const newDoc = {
      ...docData,
      _id: (docData as Partial<Pick<T, "_id">>)._id || generateObjectId(),
      createdAt: now,
      updatedAt: now,
    } as T;
    docs.push(newDoc);
    this.write(docs);
    return { insertedId: newDoc._id, acknowledged: true, doc: newDoc };
  }

  /** Updates the first document matching the filter using update operators */
  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): UpdateResult {
    const docs = this.read();
    const idx = docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
    docs[idx] = applyUpdate(docs[idx], update);
    this.write(docs);
    return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
  }

  /** Updates all documents matching the filter */
  updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): UpdateResult {
    const docs = this.read();
    let modifiedCount = 0;
    const updated = docs.map((d) => {
      if (matchesFilter(d, filter)) {
        modifiedCount++;
        return applyUpdate(d, update);
      }
      return d;
    });
    this.write(updated);
    return { matchedCount: modifiedCount, modifiedCount, acknowledged: true };
  }

  /** Inserts or updates a document (upsert by filter) */
  upsertOne(filter: FilterQuery<T>, docData: Omit<T, "_id" | "createdAt" | "updatedAt">): InsertOneResult & { doc: T; isNew: boolean } {
    const existing = this.findOne(filter);
    if (existing) {
      this.updateOne(filter, { $set: docData as Partial<T> });
      const updated = this.findOne(filter)!;
      return { insertedId: updated._id, acknowledged: true, doc: updated, isNew: false };
    }
    const result = this.insertOne(docData);
    return { ...result, isNew: true };
  }

  /** Deletes the first document matching the filter */
  deleteOne(filter: FilterQuery<T>): DeleteResult {
    const docs = this.read();
    const idx = docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { deletedCount: 0, acknowledged: true };
    docs.splice(idx, 1);
    this.write(docs);
    return { deletedCount: 1, acknowledged: true };
  }

  /** Deletes all documents matching the filter */
  deleteMany(filter: FilterQuery<T>): DeleteResult {
    const docs = this.read();
    const remaining = docs.filter((d) => !matchesFilter(d, filter));
    const deletedCount = docs.length - remaining.length;
    this.write(remaining);
    return { deletedCount, acknowledged: true };
  }

  /** Drops the entire collection */
  drop(): void {
    localStorage.removeItem(this.storageKey);
  }

  /** Returns a serializable snapshot of the collection (for export/viewer) */
  exportSnapshot(): T[] {
    return this.read();
  }
}
