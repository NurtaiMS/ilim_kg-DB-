import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useEffect } from "react";
import { dbExportAll } from "./utils/db";
import { projectId, publicAnonKey } from "/utils/supabase/info";

declare global {
  interface Window {
    __ilimPushToServer:    () => Promise<void>;
    __ilimDownloadUsers:   () => Promise<void>;
    __ilimDownloadStudents:() => Promise<void>;
    __ilimDownloadAll:     () => Promise<void>;
    __ilimDbExport:        () => ReturnType<typeof dbExportAll>;
  }
}

// Helper — authenticated fetch → triggers browser download
async function authedDownload(url: string, filename: string) {
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${publicAnonKey}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[ILIM.KG] ❌ Download failed:", err);
    return;
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  console.log(`[ILIM.KG] ✅ Downloaded: ${filename}`);
}

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6143d7d0`;

export default function App() {
  useEffect(() => {
    console.log("[ILIM.KG] 🔧 Регистрация консольных хелперов...");

    window.__ilimDbExport = () => dbExportAll();

    // 1. Push localStorage → server KV
    window.__ilimPushToServer = async () => {
      const data = dbExportAll();
      console.log(`[ILIM.KG] Pushing: ${data.users.length} users, ${data.students.length} students…`);
      const res = await fetch(`${BASE}/dev/db-push`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        console.log("[ILIM.KG] ✅ Saved:", json.saved);
        console.log("[ILIM.KG] Теперь запустите для скачивания:");
        console.log("  window.__ilimDownloadUsers()");
        console.log("  window.__ilimDownloadStudents()");
        console.log("  window.__ilimDownloadAll()   // весь снимок целиком");
      } else {
        console.error("[ILIM.KG] ❌ Error:", json);
      }
    };

    // 2. Download users.json
    window.__ilimDownloadUsers = async () => {
      await authedDownload(`${BASE}/dev/db-export?collection=users`, "users.json");
    };

    // 3. Download students.json
    window.__ilimDownloadStudents = async () => {
      await authedDownload(`${BASE}/dev/db-export?collection=students`, "students.json");
    };

    // 4. Download full snapshot
    window.__ilimDownloadAll = async () => {
      const today = new Date().toISOString().slice(0, 10);
      await authedDownload(`${BASE}/dev/db-export`, `ilim_kg_${today}.json`);
    };

    console.log("[ILIM.KG] ✅ Консольные хелперы зарегистрированы:");
    console.log("  window.__ilimPushToServer()    — отправить данные на сервер");
    console.log("  window.__ilimDownloadUsers()   — скачать users.json");
    console.log("  window.__ilimDownloadStudents() — скачать students.json");
    console.log("  window.__ilimDownloadAll()     — скачать полный снимок");
    console.log("  window.__ilimDbExport()        — получить экспорт в консоль");
  }, []);

  return <RouterProvider router={router} />;
}