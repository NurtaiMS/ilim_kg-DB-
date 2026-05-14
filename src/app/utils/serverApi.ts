const API_BASE = "http://localhost:5001/api";

async function jsonRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body && (body as any).error) || `Request failed: ${res.status}`);
  }
  return body;
}

export async function fetchStudentProfile(studentId: string) {
  return jsonRequest(`/user/profile/${studentId}`);
}

export async function fetchStudentProgress(studentId: string) {
  return jsonRequest(`/user/progress/${studentId}`);
}

export async function purchaseShopItem(studentId: string, itemId: string, type: string, value: string, price: number) {
  return jsonRequest(`/user/shop/purchase`, {
    method: "POST",
    body: JSON.stringify({ studentId, itemId, type, value, price }),
  });
}

export async function equipShopItem(studentId: string, itemId: string | null, type: string, value: string) {
  return jsonRequest(`/user/shop/equip`, {
    method: "POST",
    body: JSON.stringify({ studentId, itemId, type, value }),
  });
}

export async function saveStudentProgress(studentId: string, payload: {
  taskProgress: Record<string, unknown>;
  subjectsProgress: Record<string, { score: number; tasksCompleted: number }>;
  experience: number;
  level: number;
  coins: number;
  totalTasksCompleted: number;
}) {
  return jsonRequest(`/user/save-progress`, {
    method: "POST",
    body: JSON.stringify({ studentId, ...payload }),
  });
}
