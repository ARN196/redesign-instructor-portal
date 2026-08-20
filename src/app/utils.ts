import type { QuizItem, Roadmap, RoadmapItem } from "./types";

export const SUPPORT_EMAIL = "pysimverse@computervision.zone";

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function classroomCodeFromName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 3).map((w) => w[0].toUpperCase()).join("") || "CLS";
  const num = String(100 + Math.floor(Math.random() * 200));
  return `${letters}-${num}`;
}

export function formatToday() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function emailOk(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ROADMAP_TYPE_META = {
  teaching: { label: "Teaching", bar: "bg-blue-500", badge: "blue" as const },
  assessment: { label: "Assessment", bar: "bg-amber-500", badge: "amber" as const },
  quiz: { label: "Quiz", bar: "bg-emerald-500", badge: "green" as const },
};

export function formatDeadline(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.replace("T", " ");
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function itemLabel(item: RoadmapItem, sceneName: (id: string) => string) {
  if (item.type === "quiz") return item.title;
  return sceneName(item.sceneId);
}

export function levelLabel(level?: number) {
  return level == null ? "All levels" : `Level ${level}`;
}

export function itemSubtitle(item: RoadmapItem) {
  if (item.type === "teaching") return `${levelLabel(item.level)} · ${item.maxPoints ?? 100} pts`;
  if (item.type === "assessment") return `Due ${formatDeadline(item.deadline)} · ${levelLabel(item.level)} · ${item.maxPoints ?? 100} pts`;
  return `${item.questions.length} question${item.questions.length === 1 ? "" : "s"} · ${quizMax(item)} pts`;
}

export function quizMax(item: QuizItem) {
  return item.questions.reduce((sum, q) => sum + (q.maxPoints || 0), 0);
}

export function itemMaxPoints(item: RoadmapItem) {
  if (item.type === "quiz") return quizMax(item);
  return item.maxPoints ?? 100;
}

export function isHiddenFromSim(item: RoadmapItem) {
  return !!item.hiddenFromSim;
}

export function findRoadmapItem(roadmaps: Roadmap[], itemId?: string, title?: string): RoadmapItem | undefined {
  if (itemId) {
    for (const r of roadmaps) {
      for (const item of r.items) {
        if (item.id === itemId) return item;
      }
    }
  }
  if (!title) return undefined;
  for (const r of roadmaps) {
    for (const item of r.items) {
      if (item.type === "quiz" && item.title === title) return item;
    }
  }
}

export function workKind(
  item: RoadmapItem | undefined,
  fallback?: "mission" | "quiz"
): keyof typeof ROADMAP_TYPE_META {
  if (item) return item.type;
  return fallback === "quiz" ? "quiz" : "teaching";
}

export function roadmapBreakdown(roadmap: Roadmap) {
  const teaching = roadmap.items.filter((i) => i.type === "teaching").length;
  const assessment = roadmap.items.filter((i) => i.type === "assessment").length;
  const quizzes = roadmap.items.filter((i) => i.type === "quiz").length;
  const parts: string[] = [];
  if (teaching) parts.push(`${teaching} teaching`);
  if (assessment) parts.push(`${assessment} assessment`);
  if (quizzes) parts.push(`${quizzes} quiz${quizzes === 1 ? "" : "zes"}`);
  return parts.join(" · ") || "Empty";
}

export function generatePassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const nums = "23456789";
  let out = "";
  for (let i = 0; i < 7; i++) out += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) out += nums[Math.floor(Math.random() * nums.length)];
  return out;
}

export type StudentImportRow = {
  email: string;
  name: string;
  password: string;
  error?: string;
};

function nameFromEmail(email: string) {
  return email.split("@")[0].replace(/[._]/g, " ");
}

export function parseStudentCsv(text: string): StudentImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const first = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, "").toLowerCase());
  const hasHeader = first.includes("email") || first[0] === "e-mail";
  const emailIdx = hasHeader ? Math.max(0, first.findIndex((c) => c === "email" || c === "e-mail")) : 0;
  const passwordIdx = hasHeader ? first.findIndex((c) => c === "password") : 1;
  const nameIdx = hasHeader ? first.findIndex((c) => c === "name") : -1;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: StudentImportRow[] = [];
  for (const line of dataLines) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const email = cells[emailIdx] || "";
    if (!email) continue;
    const password = (passwordIdx >= 0 ? cells[passwordIdx] : "") || generatePassword();
    const name = (nameIdx >= 0 ? cells[nameIdx] : "") || nameFromEmail(email);
    const error =
      !emailOk(email)
        ? "Invalid email"
        : email.length > 254
          ? "Email is too long"
          : password.length < 6
            ? "Password must be at least 6 characters"
            : password.length > 64
              ? "Password must be 64 characters or fewer"
              : undefined;
    rows.push({ email, name, password, error });
  }
  return rows;
}

export function moveItem<T>(list: T[], index: number, dir: -1 | 1) {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return next;
  const tmp = next[index];
  next[index] = next[target];
  next[target] = tmp;
  return next;
}
