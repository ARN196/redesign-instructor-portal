import { useEffect, useMemo, useState } from "react";
import { CheckSquare, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Classroom, Grade, Roadmap, Student, Submission } from "./types";
import { Avatar, Badge, EmptyState, SegmentControl, fieldClass, fieldClassFor, FieldError, primaryBtn } from "./ui";
import { quizMax, itemMaxPoints, findRoadmapItem, workKind, ROADMAP_TYPE_META, itemLabel } from "./utils";
import { LIMITS, validateFeedback, validateMissionScore, validateQuestionPoints } from "./validate";
import { SCENES } from "./data";

type ScopeFilter = "pending" | "all";

type QueueItem = {
  key: string;
  kind: "pending" | "graded";
  submission?: Submission;
  grade?: Grade;
  studentId: string;
  classroomId: string;
  assignment: string;
  itemId?: string;
  type: "mission" | "quiz";
  work: "teaching" | "assessment" | "quiz";
};

export function GradingPage({
  classrooms,
  students,
  submissions,
  grades,
  roadmaps,
  focusStudentId,
  focusAssignment,
  focusClassroomId,
  lockedClassroomId,
  initialItemId,
  initialShowPast,
  onConsumedFocus,
  onGrade,
  showToast,
}: {
  classrooms: Classroom[];
  students: Student[];
  submissions: Submission[];
  grades: Grade[];
  roadmaps: Roadmap[];
  focusStudentId?: string;
  focusAssignment?: string;
  focusClassroomId?: string;
  lockedClassroomId?: string;
  initialItemId?: string;
  initialShowPast?: boolean;
  onConsumedFocus: () => void;
  onGrade: (payload: {
    submissionId?: string;
    studentId: string;
    classroomId: string;
    assignment: string;
    type: "mission" | "quiz";
    score: number;
    max: number;
    feedback: string;
    perQuestion?: { questionId: string; points: number; note?: string }[];
    code?: string;
    videoUrl?: string;
    sceneName?: string;
  }) => void;
  showToast: (msg: string) => void;
}) {
  const [classroomId, setClassroomId] = useState(lockedClassroomId ?? "all");
  const [itemFilter, setItemFilter] = useState(initialItemId ?? "all");
  const [scope, setScope] = useState<ScopeFilter>(initialShowPast ? "all" : "pending");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [perQ, setPerQ] = useState<Record<string, string>>({});
  const [gradeError, setGradeError] = useState("");
  const [qErrors, setQErrors] = useState<Record<string, string>>({});

  const studentById = (id: string) => students.find((s) => s.id === id);

  const sceneName = (id: string) => SCENES.find((s) => s.id === id)?.name ?? id;
  const activeRoadmap = roadmaps.find((r) => r.classroomId === (lockedClassroomId || classroomId));

  const queue = useMemo(() => {
    const pending: QueueItem[] = submissions
      .filter((s) => classroomId === "all" || s.classroomId === classroomId)
      .map((s) => {
        const item = findRoadmapItem(roadmaps, s.itemId, s.assignment);
        return {
          key: s.id,
          kind: "pending" as const,
          submission: s,
          studentId: s.studentId,
          classroomId: s.classroomId,
          assignment: s.assignment,
          itemId: s.itemId,
          type: s.type,
          work: workKind(item, s.type),
        };
      });
    const graded: QueueItem[] =
      scope === "all"
        ? grades
            .filter((g) => classroomId === "all" || g.classroomId === classroomId)
            .map((g) => {
              const item = findRoadmapItem(roadmaps, g.itemId, g.item);
              return {
                key: g.id,
                kind: "graded" as const,
                grade: g,
                studentId: g.studentId,
                classroomId: g.classroomId,
                assignment: g.item,
                itemId: g.itemId,
                type: g.type,
                work: workKind(item, g.type),
              };
            })
        : [];
    const order = new Map((activeRoadmap?.items ?? []).map((it, i) => [it.id, i]));
    return [...pending, ...graded]
      .filter((q) => itemFilter === "all" || q.itemId === itemFilter)
      .sort((a, b) => {
        const ai = a.itemId != null ? order.get(a.itemId) ?? 999 : 999;
        const bi = b.itemId != null ? order.get(b.itemId) ?? 999 : 999;
        if (ai !== bi) return ai - bi;
        if (a.kind !== b.kind) return a.kind === "pending" ? -1 : 1;
        return a.assignment.localeCompare(b.assignment);
      });
  }, [submissions, grades, classroomId, scope, itemFilter, roadmaps, activeRoadmap]);

  useEffect(() => {
    if (lockedClassroomId) setClassroomId(lockedClassroomId);
  }, [lockedClassroomId]);

  useEffect(() => {
    if (initialItemId) setItemFilter(initialItemId);
  }, [initialItemId]);

  useEffect(() => {
    if (initialShowPast) setScope("all");
  }, [initialShowPast]);

  useEffect(() => {
    if (!focusStudentId && !focusClassroomId) return;

    const resolvedClass =
      focusClassroomId ?? students.find((s) => s.id === focusStudentId)?.classroomId;

    if (resolvedClass && classroomId !== resolvedClass) {
      setClassroomId(resolvedClass);
      if (focusStudentId) setScope("all");
      return;
    }
    if (focusStudentId && scope !== "all") {
      setScope("all");
      return;
    }

    if (focusStudentId) {
      const i = queue.findIndex(
        (q) => q.studentId === focusStudentId && (!focusAssignment || q.assignment === focusAssignment)
      );
      if (i >= 0) setIndex(i);
    } else {
      setIndex(0);
    }
    onConsumedFocus();
  }, [focusStudentId, focusAssignment, focusClassroomId, classroomId, scope, queue, onConsumedFocus, students]);

  useEffect(() => {
    if (queue.length === 0) {
      if (index !== 0) setIndex(0);
      return;
    }
    if (index < 0 || index >= queue.length) {
      setIndex(Math.max(0, Math.min(index, queue.length - 1)));
    }
  }, [queue.length, index]);

  const current = queue[index];
  const student = current ? studentById(current.studentId) : undefined;
  const roadmapItem = current
    ? findRoadmapItem(roadmaps, current.itemId, current.assignment)
    : undefined;
  const quiz = roadmapItem?.type === "quiz" ? roadmapItem : undefined;
  const missionMax = roadmapItem && roadmapItem.type !== "quiz" ? itemMaxPoints(roadmapItem) : 100;

  useEffect(() => {
    if (!current) return;
    if (current.kind === "graded" && current.grade) {
      setScore(String(current.grade.score));
      setFeedback(current.grade.feedback ?? "");
      const next: Record<string, string> = {};
      current.grade.perQuestion?.forEach((p) => {
        next[p.questionId] = String(p.points);
      });
      setPerQ(next);
    } else {
      setScore("");
      setFeedback("");
      setPerQ({});
    }
    setGradeError("");
    setQErrors({});
  }, [current?.key]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(Math.max(queue.length - 1, 0), i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue.length]);

  const quizTotal = quiz
    ? quiz.questions.reduce((sum, q) => sum + (Number(perQ[q.id]) || 0), 0)
    : 0;
  const quizMaxPts = quiz ? quizMax(quiz) : 0;

  const publish = () => {
    if (!current || current.kind === "graded") return;
    const sub = current.submission!;
    setGradeError("");
    setQErrors({});

    const fbErr = validateFeedback(feedback);
    if (fbErr) {
      setGradeError(fbErr);
      return;
    }

    if (current.type === "quiz" && quiz) {
      const nextErrs: Record<string, string> = {};
      for (const q of quiz.questions) {
        const err = validateQuestionPoints(perQ[q.id] ?? "", q.maxPoints);
        if (err) nextErrs[q.id] = err;
      }
      if (Object.keys(nextErrs).length) {
        setQErrors(nextErrs);
        setGradeError("Enter valid points for every question.");
        return;
      }
      const perQuestion = quiz.questions.map((q) => ({
        questionId: q.id,
        points: Number(perQ[q.id]),
      }));
      onGrade({
        submissionId: sub.id,
        studentId: sub.studentId,
        classroomId: sub.classroomId,
        assignment: sub.assignment,
        type: "quiz",
        score: perQuestion.reduce((s, p) => s + p.points, 0),
        max: quizMaxPts,
        feedback: feedback.trim(),
        perQuestion,
      });
      showToast(`Published ${student?.name ?? "student"} — ${sub.assignment}`);
      return;
    }

    const scoreErr = validateMissionScore(score, missionMax);
    if (scoreErr) {
      setGradeError(scoreErr);
      return;
    }
    onGrade({
      submissionId: sub.id,
      studentId: sub.studentId,
      classroomId: sub.classroomId,
      assignment: sub.assignment,
      type: current.type,
      score: Number(score),
      max: missionMax,
      feedback: feedback.trim(),
      code: sub.code,
      videoUrl: sub.videoUrl,
      sceneName: sub.sceneName,
    });
    showToast(`Published ${student?.name ?? "student"} — ${sub.assignment}`);
  };

  const pendingCount = queue.filter((q) => q.kind === "pending").length;
  const items = activeRoadmap?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SegmentControl
          options={["pending", "all"] as const}
          value={scope}
          onChange={(v) => { setScope(v); setIndex(0); }}
          labelFn={(v) => (v === "pending" ? "To grade" : "Graded")}
        />
        <select
          value={itemFilter}
          onChange={(e) => { setItemFilter(e.target.value); setIndex(0); }}
          className={`${fieldClass} w-full sm:w-auto sm:max-w-[20rem] sm:flex-1 min-w-0`}
          aria-label="Assignment"
        >
          <option value="all">All assignments</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {itemLabel(item, sceneName)}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-400 sm:ml-auto">
          {scope === "pending" ? `${pendingCount} left` : `${queue.length} in this view`}
        </span>
      </div>

      {queue.length === 0 || !current ? (
        <div className="bg-white rounded-xl border border-border">
          <EmptyState
            icon={CheckSquare}
            title={scope === "pending" ? "Caught up" : "Nothing here"}
            body={
              scope === "pending"
                ? "No submissions waiting. Switch to Graded to reopen published scores."
                : "No published work matches this assignment yet."
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-border flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 flex-shrink-0"
              disabled={index <= 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <Avatar initials={student?.initials ?? "?"} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-zinc-900 truncate">{student?.name ?? "Unknown"}</div>
              <div className="text-xs text-zinc-500 truncate">
                {current.assignment}
                {current.kind === "graded" ? " · published" : ` · ${current.submission?.submitted ?? ""}`}
              </div>
            </div>
            <span className="hidden sm:inline-flex">
              <Badge label={ROADMAP_TYPE_META[current.work].label} variant={ROADMAP_TYPE_META[current.work].badge} />
            </span>
            <span className="text-xs text-zinc-400 tabular-nums flex-shrink-0">{index + 1}/{queue.length}</span>
            <button
              type="button"
              className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 flex-shrink-0"
              disabled={index >= queue.length - 1}
              onClick={() => setIndex((i) => Math.min(queue.length - 1, i + 1))}
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-[1fr_17rem] lg:items-start">
            <div className="min-w-0 p-4 space-y-3 border-b lg:border-b-0 lg:border-r border-border">
              {current.type === "mission" ? (
                <SimRecordingPlayer
                  src={current.submission?.videoUrl || current.grade?.videoUrl}
                  sceneName={current.submission?.sceneName || current.grade?.sceneName || current.assignment}
                />
              ) : (
                <div className="space-y-3">
                  {!quiz && <p className="text-sm text-zinc-400">Score this quiz as a total.</p>}
                  {quiz?.questions.map((q, i) => {
                    const answer = current.submission?.quizAnswers?.find((a) => a.questionId === q.id)?.answer;
                    return (
                      <div key={q.id} className="space-y-1.5">
                        <p className="text-sm text-zinc-900">
                          <span className="text-zinc-400 mr-1">{i + 1}.</span>
                          {q.prompt}
                        </p>
                        {q.code && (
                          <pre className="bg-zinc-900 text-zinc-100 text-xs rounded-lg p-2.5 overflow-x-auto">{q.code}</pre>
                        )}
                        <div className="flex items-stretch sm:items-center gap-2 flex-col sm:flex-row">
                          <p className="text-sm text-zinc-600 bg-zinc-50 rounded-lg px-2.5 py-1.5 flex-1 min-w-0 truncate">
                            {answer || current.grade?.feedback || "—"}
                          </p>
                          <input
                            type="number"
                            min={0}
                            max={q.maxPoints}
                            value={perQ[q.id] ?? ""}
                            disabled={current.kind === "graded"}
                            onChange={(e) => {
                              setPerQ({ ...perQ, [q.id]: e.target.value });
                              setQErrors((prev) => ({ ...prev, [q.id]: "" }));
                            }}
                            className={`${fieldClassFor(!!qErrors[q.id])} w-16 text-center py-1.5`}
                            placeholder={`/${q.maxPoints}`}
                            aria-label={`Points for question ${i + 1}`}
                            aria-invalid={!!qErrors[q.id]}
                          />
                        </div>
                        <FieldError message={qErrors[q.id]} />
                      </div>
                    );
                  })}
                  {quiz && (
                    <p className="text-sm font-medium text-zinc-800">Total {quizTotal} / {quizMaxPts}</p>
                  )}
                  {!quiz && (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={score}
                      onChange={(e) => { setScore(e.target.value); setGradeError(""); }}
                      className={`${fieldClassFor(!!gradeError)} w-24`}
                      aria-invalid={!!gradeError}
                    />
                  )}
                </div>
              )}

              {(current.submission?.code || current.grade?.code) && (
                <CodePanel code={current.submission?.code || current.grade?.code || ""} />
              )}
            </div>

            <div className="p-4 space-y-3">
              {current.type === "mission" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Score / {missionMax}</label>
                  <input
                    type="number"
                    min={0}
                    max={missionMax}
                    value={score}
                    onChange={(e) => { setScore(e.target.value); setGradeError(""); }}
                    disabled={current.kind === "graded"}
                    className={`${fieldClassFor(!!gradeError && current.type === "mission")} text-center text-lg font-semibold`}
                    aria-invalid={!!gradeError && current.type === "mission"}
                  />
                </div>
              )}

              {current.type === "quiz" && quiz && (
                <div className="text-sm font-semibold text-zinc-900">{quizTotal} / {quizMaxPts}</div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Feedback</label>
                <textarea
                  rows={4}
                  value={feedback}
                  disabled={current.kind === "graded"}
                  onChange={(e) => setFeedback(e.target.value)}
                  className={`${fieldClassFor(!!gradeError && feedback.length > LIMITS.feedback.max)} resize-none`}
                  placeholder="Optional note for the student…"
                  maxLength={LIMITS.feedback.max}
                />
              </div>

              {current.kind === "pending" ? (
                <>
                  <FieldError message={gradeError} />
                  <button type="button" className={`${primaryBtn} w-full`} onClick={publish}>
                    Publish
                  </button>
                </>
              ) : (
                <p className="text-sm font-medium text-emerald-700">Published</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimRecordingPlayer({
  src,
  sceneName,
}: {
  src?: string;
  sceneName: string;
}) {
  return (
    <div className="bg-zinc-950 rounded-xl overflow-hidden">
      {src ? (
        <video
          key={src}
          src={src}
          controls
          playsInline
          preload="metadata"
          className="w-full aspect-video object-contain bg-black"
        />
      ) : (
        <div className="aspect-video bg-zinc-900 flex items-center justify-center text-sm text-zinc-500">
          No recording
        </div>
      )}
      <div className="px-3 py-1.5 text-[11px] text-zinc-500 truncate">{sceneName}</div>
    </div>
  );
}

function CodePanel({ code }: { code: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-zinc-600 hover:bg-zinc-50"
      >
        Code
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <pre className="bg-zinc-900 text-zinc-100 text-xs p-3 overflow-x-auto leading-relaxed m-0 border-t border-zinc-800">
          {code}
        </pre>
      )}
    </div>
  );
}
