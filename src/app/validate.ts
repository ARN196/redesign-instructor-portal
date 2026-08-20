import type { QuizItem, QuizQuestion, RoadmapItem, Scene } from "./types";
import { emailOk } from "./utils";

export const LIMITS = {
  className: { min: 3, max: 80 },
  description: { max: 500 },
  roadmapName: { min: 3, max: 80 },
  quizTitle: { min: 2, max: 120 },
  quizDescription: { max: 240 },
  prompt: { min: 2, max: 800 },
  option: { max: 160 },
  code: { max: 8000 },
  feedback: { max: 2000 },
  password: { min: 6, max: 64 },
  email: { max: 254 },
  points: { min: 1, max: 100 },
  missionScore: { min: 0, max: 100 },
  studentsPerClass: 500,
  photoBytes: 2 * 1024 * 1024,
  csvBytes: 512 * 1024,
};

export function fieldLen(value: string, max: number, label: string) {
  if (value.length > max) return `${label} must be ${max} characters or fewer`;
}

export function requiredName(value: string, label: string, min: number, max: number) {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length < min) return `${label} must be at least ${min} characters`;
  if (v.length > max) return `${label} must be ${max} characters or fewer`;
}

export function validateClassroomName(name: string, existingNames: string[]) {
  const err = requiredName(name, "Class name", LIMITS.className.min, LIMITS.className.max);
  if (err) return err;
  const key = name.trim().toLowerCase();
  if (existingNames.some((n) => n.trim().toLowerCase() === key)) {
    return "A classroom with this name already exists";
  }
}

export function validateDescription(value: string) {
  return fieldLen(value.trim(), LIMITS.description.max, "Description");
}

export function validateRoadmapName(name: string) {
  return requiredName(name, "Curriculum name", LIMITS.roadmapName.min, LIMITS.roadmapName.max);
}

export function validateEmail(email: string, required = true) {
  const v = email.trim();
  if (!v) return required ? "Email is required" : undefined;
  if (v.length > LIMITS.email.max) return `Email must be ${LIMITS.email.max} characters or fewer`;
  if (!emailOk(v)) return "Enter a valid email";
}

export function validatePassword(password: string) {
  const v = password.trim();
  if (!v) return "Password is required";
  if (/\s/.test(password)) return "Password cannot contain spaces";
  if (v.length < LIMITS.password.min) return `Password must be at least ${LIMITS.password.min} characters`;
  if (v.length > LIMITS.password.max) return `Password must be ${LIMITS.password.max} characters or fewer`;
}

export function validateDisplayName(name: string) {
  return requiredName(name, "Display name", 2, LIMITS.className.max);
}

export function validateIntegerInRange(raw: string, min: number, max: number, label: string) {
  const v = raw.trim();
  if (v === "") return `${label} is required`;
  if (!/^-?\d+$/.test(v)) return `${label} must be a whole number`;
  const n = Number(v);
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
}

export function datetimeLocalNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function validateDeadline(iso: string, { requireFuture = true } = {}) {
  if (!iso.trim()) return "Deadline is required";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Enter a valid date and time";
  if (requireFuture && t < Date.now() - 60_000) return "Deadline must be in the future";
}

export function validateQuestion(q: QuizQuestion, index: number) {
  const label = `Question ${index + 1}`;
  const prompt = q.prompt.trim();
  if (!prompt) return `${label} needs a prompt`;
  if (prompt.length < LIMITS.prompt.min) return `${label} prompt is too short`;
  if (prompt.length > LIMITS.prompt.max) return `${label} prompt must be ${LIMITS.prompt.max} characters or fewer`;
  if (!Number.isInteger(q.maxPoints) || q.maxPoints < LIMITS.points.min || q.maxPoints > LIMITS.points.max) {
    return `${label} points must be a whole number from ${LIMITS.points.min} to ${LIMITS.points.max}`;
  }
  if (q.type === "mcq") {
    const opts = q.options ?? [];
    const filled = opts.map((o) => o.text.trim()).filter(Boolean);
    if (filled.length < 2) return `${label}: add at least 2 answer options`;
    if (opts.some((o) => o.text.trim().length > LIMITS.option.max)) {
      return `${label}: each option must be ${LIMITS.option.max} characters or fewer`;
    }
    const keys = filled.map((t) => t.toLowerCase());
    if (new Set(keys).size !== keys.length) return `${label}: answer options must be unique`;
    if (!opts.some((o) => o.correct && o.text.trim())) return `${label}: mark one correct answer`;
  }
  if (q.type === "code-output") {
    if (!q.code?.trim()) return `${label}: add the code snippet students will predict`;
    if ((q.code?.length ?? 0) > LIMITS.code.max) return `${label}: code must be ${LIMITS.code.max} characters or fewer`;
  }
}

export function validateQuizItem(item: QuizItem) {
  const titleErr = requiredName(item.title, "Quiz title", LIMITS.quizTitle.min, LIMITS.quizTitle.max);
  if (titleErr) return titleErr;
  const descErr = fieldLen(item.description.trim(), LIMITS.quizDescription.max, "Quiz description");
  if (descErr) return descErr;
  if (item.questions.length < 1) return "Add at least one question";
  for (let i = 0; i < item.questions.length; i++) {
    const err = validateQuestion(item.questions[i], i);
    if (err) return err;
  }
}

export function validateRoadmapItems(items: RoadmapItem[], scenes: Scene[], { publish }: { publish: boolean }) {
  if (publish && items.length < 1) return "Add at least one item before publishing";
  const titles = new Set<string>();
  for (const item of items) {
    if (item.type === "teaching") {
      const scene = scenes.find((s) => s.id === item.sceneId);
      if (!scene) return "A teaching item is missing its mission";
      if (item.level != null && (!Number.isInteger(item.level) || item.level < 1 || item.level > scene.levels)) {
        return `${scene.name} level must be between 1 and ${scene.levels}`;
      }
      const pts = item.maxPoints ?? 100;
      if (!Number.isInteger(pts) || pts < LIMITS.points.min || pts > LIMITS.points.max) {
        return `${scene.name} score must be between ${LIMITS.points.min} and ${LIMITS.points.max}`;
      }
    } else if (item.type === "assessment") {
      const scene = scenes.find((s) => s.id === item.sceneId);
      if (!scene) return "An assessment is missing its mission";
      if (item.level != null && (!Number.isInteger(item.level) || item.level < 1 || item.level > scene.levels)) {
        return `${scene.name} assessment level must be between 1 and ${scene.levels}`;
      }
      const pts = item.maxPoints ?? 100;
      if (!Number.isInteger(pts) || pts < LIMITS.points.min || pts > LIMITS.points.max) {
        return `${scene.name} score must be between ${LIMITS.points.min} and ${LIMITS.points.max}`;
      }
      const dl = validateDeadline(item.deadline);
      if (dl) return `${scene.name}: ${dl.toLowerCase()}`;
    } else {
      const quizErr = validateQuizItem(item);
      if (quizErr) return quizErr;
      const key = item.title.trim().toLowerCase();
      if (titles.has(key)) return "Quiz titles in this curriculum must be unique";
      titles.add(key);
    }
  }
}

export function validateRoadmapForm(
  name: string,
  classroomId: string,
  items: RoadmapItem[],
  scenes: Scene[],
  publish: boolean
) {
  const nameErr = validateRoadmapName(name);
  if (nameErr) return { field: "name" as const, message: nameErr };
  if (!classroomId) return { field: "classroom" as const, message: "Classroom is required" };
  const itemsErr = validateRoadmapItems(items, scenes, { publish });
  if (itemsErr) return { field: "items" as const, message: itemsErr };
}

export function validatePhotoFile(file: File) {
  if (!file.type.startsWith("image/")) return "Please choose an image file";
  if (file.size > LIMITS.photoBytes) return "Photo must be 2 MB or smaller";
}

export function validateCsvFile(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return "Save the sheet as CSV from Excel, then choose that file.";
  }
  if (!name.endsWith(".csv") && !name.endsWith(".txt")) {
    return "Use a CSV file (Email, Password columns).";
  }
  if (file.size > LIMITS.csvBytes) return "File is too large. Use a CSV under 512 KB.";
}

export function validateMissionScore(raw: string, max = LIMITS.missionScore.max) {
  return validateIntegerInRange(raw, LIMITS.missionScore.min, max, "Score");
}

export function validateQuestionPoints(raw: string, max: number) {
  return validateIntegerInRange(raw, 0, max, "Points");
}

export function validateFeedback(value: string) {
  return fieldLen(value, LIMITS.feedback.max, "Feedback");
}

export function uniqueClassroomCode(base: string, used: Set<string>) {
  let code = base;
  let n = 0;
  while (used.has(code) && n < 250) {
    n += 1;
    code = `${base.replace(/-\d+$/, "")}-${100 + ((n * 17) % 200)}`;
  }
  if (used.has(code)) code = `${base.replace(/-\d+$/, "")}-${Date.now().toString().slice(-4)}`;
  return code;
}
