import { useEffect, useRef, useState, type ComponentProps } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";
import type { Classroom, Grade, Page, Roadmap, RoadmapItem, Student, Submission } from "./types";
import { Badge, EmptyState, Modal, fieldClass, fieldClassFor, FieldError, CharCount, primaryBtn, secondaryBtn, dangerBtn } from "./ui";
import { classroomCodeFromName, roadmapBreakdown, uid } from "./utils";
import { AddStudentsDialog, AddStudentsForm } from "./AddStudentsDialog";
import { RoadmapDefinition } from "./roadmapUi";
import { LIMITS, uniqueClassroomCode, validateClassroomName, validateDescription, validateRoadmapItems } from "./validate";
import { SCENES } from "./data";
import { CourseworkSequenceEditor } from "./CourseworkSequenceEditor";
import { GradingPage } from "./GradingPage";
import { CourseworkProgress } from "./CourseworkProgress";
import { ClassReportsTab } from "./ReportsPage";
import { ClassStudentsTab } from "./GradebookPage";

type ClassroomTab = "students" | "roadmaps" | "grades" | "reports";

const TAB_HEADER: Record<ClassroomTab, string> = {
  roadmaps: "Curriculum",
  grades: "Grading",
  students: "Students",
  reports: "Reports",
};

type View =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "detail"; id: string };

type InviteRow = { name: string; email: string; password?: string };

function SummaryCards({
  classrooms,
  submissions,
  grades,
  onNav,
  onToGrade,
  onGradebook,
}: {
  classrooms: Classroom[];
  submissions: Submission[];
  grades: Grade[];
  onNav: (p: Page) => void;
  onToGrade: () => void;
  onGradebook: () => void;
}) {
  const assignmentCount = new Set([...submissions.map((s) => s.assignment), ...grades.map((g) => g.item)]).size;
  const stats = [
    { label: "Classrooms", value: String(classrooms.length), icon: Users, color: "text-blue-600", bg: "bg-blue-50", onClick: () => onNav("classrooms") },
    { label: "Assignments", value: String(assignmentCount), icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50", onClick: onGradebook },
    { label: "To grade", value: String(submissions.length), icon: Clock, color: "text-amber-600", bg: "bg-amber-50", onClick: onToGrade },
    { label: "Graded", value: String(grades.length), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", onClick: onGradebook },
  ];

  return (
    <div className="rounded-xl border border-border bg-zinc-100 overflow-hidden grid grid-cols-2 lg:grid-cols-1 gap-px">
      {stats.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={s.onClick}
          className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 flex items-center gap-2 bg-white"
        >
          <div className={`w-6 h-6 ${s.bg} rounded flex items-center justify-center flex-shrink-0`}>
            <s.icon size={12} className={s.color} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-bold text-zinc-900">{s.value}</div>
            <div className="text-[10px] text-zinc-500 truncate">{s.label}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ClassroomsPage({
  classrooms,
  students,
  roadmaps,
  submissions,
  grades,
  restoreClassroom,
  listEpoch,
  onTitle,
  onActiveClassroom,
  onConsumedRestore,
  onCreate,
  onInvite,
  onDelete,
  onOpenRoadmap,
  onSaveRoadmap,
  onNav,
  onGrade,
  gradeFocus,
  onConsumedFocus,
  showToast,
}: {
  classrooms: Classroom[];
  students: Student[];
  roadmaps: Roadmap[];
  submissions: Submission[];
  grades: Grade[];
  restoreClassroom?: { id: string; tab: ClassroomTab };
  listEpoch?: number;
  onTitle: (title: string) => void;
  onActiveClassroom?: (id: string | undefined) => void;
  onConsumedRestore: () => void;
  onCreate: (c: Classroom) => void;
  onInvite: (classroomId: string, incoming: InviteRow[]) => { added: number; skipped: number };
  onDelete: (id: string) => void;
  onOpenRoadmap: (classroomId: string, roadmapId?: string) => void;
  onSaveRoadmap: (roadmap: Roadmap, publish: boolean) => void;
  onNav: (p: Page) => void;
  onGrade: ComponentProps<typeof GradingPage>["onGrade"];
  gradeFocus: { studentId?: string; assignment?: string; classroomId: string } | null;
  onConsumedFocus: () => void;
  showToast: (msg: string) => void;
}) {
  const [view, setView] = useState<View>(
    restoreClassroom ? { kind: "detail", id: restoreClassroom.id } : { kind: "list" }
  );
  const [openTab, setOpenTab] = useState<ClassroomTab>(restoreClassroom?.tab ?? "roadmaps");
  const prevListEpoch = useRef(listEpoch);

  useEffect(() => {
    if (!restoreClassroom) return;
    setView({ kind: "detail", id: restoreClassroom.id });
    setOpenTab(restoreClassroom.tab);
    onConsumedRestore();
  }, [restoreClassroom, onConsumedRestore]);

  useEffect(() => {
    if (listEpoch == null || listEpoch === prevListEpoch.current) return;
    prevListEpoch.current = listEpoch;
    setView({ kind: "list" });
  }, [listEpoch]);

  useEffect(() => {
    onActiveClassroom?.(view.kind === "detail" ? view.id : undefined);
  }, [view, onActiveClassroom]);

  useEffect(() => () => onActiveClassroom?.(undefined), [onActiveClassroom]);

  useEffect(() => {
    if (view.kind === "list") onTitle("Dashboard");
    else if (view.kind === "create") onTitle("New classroom");
  }, [view, onTitle]);

  if (view.kind === "create") {
    return (
      <CreateClassroom
        existingRoadmaps={roadmaps}
        classrooms={classrooms}
        onCancel={() => setView({ kind: "list" })}
        onCreated={(c, invited, roadmap) => {
          onCreate(c);
          if (invited.length) onInvite(c.id, invited);
          if (roadmap) onSaveRoadmap({ ...roadmap, classroomId: c.id }, roadmap.status === "published");
          const bits = [
            `Classroom “${c.name}” created`,
            invited.length ? `${invited.length} student${invited.length === 1 ? "" : "s"}` : null,
            roadmap ? "curriculum set" : null,
          ].filter(Boolean);
          showToast(bits.join(" · "));
          setOpenTab(roadmap ? "roadmaps" : "students");
          setView({ kind: "detail", id: c.id });
        }}
      />
    );
  }

  if (view.kind === "detail") {
    const classroom = classrooms.find((c) => c.id === view.id);
    if (!classroom) {
      return (
        <EmptyState
          icon={Users}
          title="Classroom not found"
          body="It may have been deleted."
          action={
            <button type="button" className={secondaryBtn} onClick={() => setView({ kind: "list" })}>
              Back to dashboard
            </button>
          }
        />
      );
    }
    return (
      <ClassroomDetail
        key={`${classroom.id}-${openTab}`}
        classroom={classroom}
        students={students.filter((s) => s.classroomId === classroom.id)}
        roadmaps={roadmaps.filter((r) => r.classroomId === classroom.id)}
        grades={grades.filter((g) => g.classroomId === classroom.id)}
        submissions={submissions.filter((s) => s.classroomId === classroom.id)}
        allClassrooms={classrooms}
        onBack={() => setView({ kind: "list" })}
        backLabel="Dashboard"
        onInvite={(rows) => {
          const result = onInvite(classroom.id, rows);
          showToast(`Added ${result.added} student${result.added === 1 ? "" : "s"}${result.skipped ? ` · ${result.skipped} skipped` : ""}`);
        }}
        onDelete={() => {
          onDelete(classroom.id);
          showToast("Classroom deleted");
          setView({ kind: "list" });
        }}
        onOpenRoadmap={(roadmapId) => onOpenRoadmap(classroom.id, roadmapId)}
        onGrade={onGrade}
        focusStudentId={gradeFocus?.classroomId === classroom.id ? gradeFocus.studentId : undefined}
        focusAssignment={gradeFocus?.classroomId === classroom.id ? gradeFocus.assignment : undefined}
        onConsumedFocus={onConsumedFocus}
        showToast={showToast}
        initialTab={openTab}
        onTitle={onTitle}
      />
    );
  }

  return (
    <div className="space-y-4 w-full">
      <p className="text-sm text-zinc-500">Your classes. Open one to manage students, curriculum, and grades.</p>
      <div className="flex flex-col lg:flex-row lg:gap-6 gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">
          {classrooms.length === 0 ? (
            <div className="bg-white rounded-xl border border-border">
              <EmptyState
                icon={Users}
                title="No classrooms yet"
                body="Create a class, then add students by email or Excel/CSV."
                action={
                  <button type="button" className={primaryBtn} onClick={() => setView({ kind: "create" })}>
                    Create classroom
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {classrooms.map((c) => {
            const roster = students.filter((s) => s.classroomId === c.id);
            const maps = roadmaps.filter((r) => r.classroomId === c.id);
            const pending = submissions.filter((s) => s.classroomId === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setOpenTab("roadmaps");
                  setView({ kind: "detail", id: c.id });
                }}
                className="bg-white rounded-xl border border-border hover:border-zinc-300 hover:shadow-sm transition-all p-4 sm:p-5 space-y-4 text-left min-w-0"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <BookOpen size={18} className="text-indigo-600" />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-50 border border-border px-2 py-0.5 rounded">
                    {c.code}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 text-sm leading-snug">{c.name}</div>
                  <div className="text-xs text-zinc-400 mt-1">Last active {c.lastActive}</div>
                </div>
                <div className="flex items-end gap-4 pt-2 border-t border-border flex-wrap">
                  <div>
                    <div className="text-sm font-bold text-zinc-900">{roster.length}</div>
                    <div className="text-xs text-zinc-400">Students</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">
                      {maps[0] ? (maps[0].status === "published" ? "Live" : maps[0].status === "archived" ? "Archived" : "Draft") : "—"}
                    </div>
                    <div className="text-xs text-zinc-400">Curriculum</div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${pending ? "text-amber-600" : "text-zinc-900"}`}>{pending}</div>
                    <div className="text-xs text-zinc-400">To grade</div>
                  </div>
                  <span className="ml-auto text-xs font-medium text-indigo-600">Open →</span>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setView({ kind: "create" })}
            className="bg-white rounded-xl border border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all p-5 flex flex-col items-center justify-center gap-2 min-h-[10rem] sm:min-h-[200px]"
          >
            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Plus size={18} className="text-zinc-400" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Create classroom</span>
          </button>
            </div>
          )}
        </div>
        <aside className="hidden lg:block w-56 flex-shrink-0 lg:sticky lg:top-0">
          <SummaryCards
            classrooms={classrooms}
            submissions={submissions}
            grades={grades}
            onNav={onNav}
            onGradebook={() => {
              const classroomId = grades[0]?.classroomId ?? classrooms[0]?.id;
              if (!classroomId) return;
              setOpenTab("students");
              setView({ kind: "detail", id: classroomId });
            }}
            onToGrade={() => {
              const classroomId = submissions[0]?.classroomId ?? classrooms[0]?.id;
              if (!classroomId) return;
              setOpenTab("grades");
              setView({ kind: "detail", id: classroomId });
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function CreateClassroom({
  existingRoadmaps,
  classrooms,
  onCancel,
  onCreated,
}: {
  existingRoadmaps: Roadmap[];
  classrooms: Classroom[];
  onCancel: () => void;
  onCreated: (c: Classroom, invited: InviteRow[], roadmap?: Roadmap) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [invited, setInvited] = useState<InviteRow[]>([]);
  const [triedDetails, setTriedDetails] = useState(false);
  const [quizView, setQuizView] = useState(false);

  const nameError = triedDetails ? validateClassroomName(name, classrooms.map((c) => c.name)) : undefined;
  const descError = triedDetails ? validateDescription(description) : undefined;

  const finish = (roadmap?: Roadmap) => {
    const classroom: Classroom = {
      id: uid("c"),
      name: name.trim(),
      code: uniqueClassroomCode(
        classroomCodeFromName(name),
        new Set(classrooms.map((c) => c.code))
      ),
      description: description.trim(),
      lastActive: "Just now",
    };
    onCreated(classroom, invited, roadmap);
  };

  const stepLabel = step === 1 ? "Class details" : step === 2 ? "Add students" : "Select curriculum";
  const STEPS = ["Details", "Students", "Curriculum"] as const;

  return (
    <div className={`${quizView ? "max-w-3xl" : "max-w-2xl"} space-y-5`}>
      {!quizView && (
        <>
          <button type="button" onClick={onCancel} className="text-sm text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">New classroom · Step {step} of 3</p>
            <h2 className="text-lg font-semibold text-zinc-900 mt-1">{stepLabel}</h2>
          </div>
          <div className="flex gap-2">
            {STEPS.map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const active = step === n;
              const done = step > n;
              return (
                <div key={label} className="flex-1 min-w-0">
                  <div className={`h-1 rounded-full ${done || active ? "bg-indigo-600" : "bg-zinc-200"}`} />
                  <div className={`mt-1.5 text-xs font-medium truncate ${active ? "text-indigo-700" : done ? "text-zinc-700" : "text-zinc-400"}`}>
                    {n}. {label}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 1 && (
        <div className="bg-white rounded-xl border border-border p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Class name <span className="text-rose-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClassFor(!!nameError)}
              placeholder="e.g. Advanced Drone Programming"
              maxLength={LIMITS.className.max + 20}
              autoFocus
              aria-invalid={!!nameError}
            />
            <FieldError message={nameError} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-700">Description</label>
              <CharCount value={description} max={LIMITS.description.max} />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${fieldClassFor(!!descError)} resize-none`}
              placeholder="What students will learn…"
              maxLength={LIMITS.description.max + 40}
              aria-invalid={!!descError}
            />
            <FieldError message={descError} />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button type="button" className={`${secondaryBtn} w-full sm:w-auto`} onClick={onCancel}>Cancel</button>
            <button
              type="button"
              className={`${primaryBtn} w-full sm:w-auto`}
              onClick={() => {
                setTriedDetails(true);
                if (validateClassroomName(name, classrooms.map((c) => c.name)) || validateDescription(description)) return;
                setStep(2);
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl border border-border p-4 sm:p-6">
          <AddStudentsForm
            existingEmails={[]}
            remainingSlots={500}
            submitLabel="Continue"
            onCancel={onCancel}
            extraCancel={{ label: "Skip students", onClick: () => { setInvited([]); setStep(3); } }}
            onSubmit={(rows) => { setInvited(rows); setStep(3); }}
          />
        </div>
      )}

      {step === 3 && (
        <RoadmapSelectStep
          courseName={name.trim()}
          existingRoadmaps={existingRoadmaps}
          classrooms={classrooms}
          quizView={quizView}
          onQuizViewChange={setQuizView}
          onBack={() => setStep(2)}
          onSkip={() => finish()}
          onDone={(roadmap) => finish(roadmap)}
        />
      )}
    </div>
  );
}

function cloneItems(items: RoadmapItem[]): RoadmapItem[] {
  return items.map((item) => {
    if (item.type === "quiz") {
      return {
        ...item,
        id: uid("it"),
        questions: item.questions.map((q) => ({
          ...q,
          id: uid("q"),
          options: q.options?.map((o) => ({ ...o, id: uid("o") })),
        })),
      };
    }
    return { ...item, id: uid("it") };
  });
}

function RoadmapSelectStep({
  courseName,
  existingRoadmaps,
  classrooms,
  quizView,
  onQuizViewChange,
  onBack,
  onSkip,
  onDone,
}: {
  courseName: string;
  existingRoadmaps: Roadmap[];
  classrooms: Classroom[];
  quizView: boolean;
  onQuizViewChange: (open: boolean) => void;
  onBack: () => void;
  onSkip: () => void;
  onDone: (roadmap: Roadmap) => void;
}) {
  const [copyId, setCopyId] = useState<string | null>(null);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [publish, setPublish] = useState(false);
  const [tried, setTried] = useState(false);
  const [formError, setFormError] = useState<string>();

  const canSave = items.length > 0;
  const pickError = tried && !canSave ? "Add curriculum or skip this step" : formError;
  const classesWithRoadmaps = classrooms.filter((c) => existingRoadmaps.some((r) => r.classroomId === c.id));
  const copyClassroomId = existingRoadmaps.find((r) => r.id === copyId)?.classroomId ?? "";

  const tryCreate = () => {
    setTried(true);
    setFormError(undefined);
    if (!canSave) return;
    const issue = validateRoadmapItems(items, SCENES, { publish });
    if (issue) {
      setFormError(issue);
      return;
    }
    onDone({
      id: uid("r"),
      name: `${courseName} Curriculum`,
      classroomId: "",
      status: publish ? "published" : "draft",
      items,
    });
  };

  return (
    <div className={quizView ? undefined : "space-y-4"}>
      {!quizView && <RoadmapDefinition compact />}
      <div className={quizView ? undefined : "bg-white rounded-xl border border-border p-4 sm:p-6 space-y-5"}>
      {!quizView && classesWithRoadmaps.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-700">Copy from class</label>
          <select
            value={copyClassroomId}
            onChange={(e) => {
              const classroomId = e.target.value;
              if (!classroomId) {
                setCopyId(null);
                setItems([]);
                return;
              }
              const r = existingRoadmaps.find((x) => x.classroomId === classroomId);
              if (!r) return;
              setCopyId(r.id);
              setItems(cloneItems(r.items));
              setFormError(undefined);
            }}
            className={fieldClass}
          >
            <option value="">Select a class…</option>
            {classesWithRoadmaps.map((c) => {
              const r = existingRoadmaps.find((x) => x.classroomId === c.id);
              return (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}{r ? ` (${r.items.length} items)` : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className={quizView ? undefined : "space-y-2"}>
        {!quizView && (
          <label className="text-xs font-medium text-zinc-700">
            {classesWithRoadmaps.length > 0 ? "Or build curriculum" : "Curriculum"}
          </label>
        )}
        <div className={quizView ? undefined : "rounded-lg border border-border overflow-hidden"}>
          <CourseworkSequenceEditor
            key={copyId ?? "new"}
            items={items}
            scenes={SCENES}
            onQuizViewChange={onQuizViewChange}
            onChange={(next) => {
              setItems(next);
              setFormError(undefined);
            }}
          />
        </div>
      </div>

      {!quizView && (
        <>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            <span>Publish now</span>
          </label>

          <FieldError message={pickError} />
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-border">
            <button type="button" className="text-sm font-medium text-zinc-500 hover:text-zinc-800 px-2 py-2" onClick={onBack}>
              Back
            </button>
            <button type="button" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2" onClick={onSkip}>
              Skip
            </button>
            <button type="button" className={primaryBtn} onClick={tryCreate}>
              Create class
            </button>
          </div>
        </>
      )}
    </div>
    </div>
  );
}

function ClassroomDetail({
  classroom,
  students,
  roadmaps,
  grades,
  submissions,
  allClassrooms,
  onBack,
  backLabel = "Dashboard",
  onInvite,
  onDelete,
  onOpenRoadmap,
  onGrade,
  focusStudentId,
  focusAssignment,
  onConsumedFocus,
  showToast,
  initialTab = "roadmaps",
  onTitle,
}: {
  classroom: Classroom;
  students: Student[];
  roadmaps: Roadmap[];
  grades: Grade[];
  submissions: Submission[];
  allClassrooms: Classroom[];
  onBack: () => void;
  backLabel?: string;
  onInvite: (rows: InviteRow[]) => void;
  onDelete: () => void;
  onOpenRoadmap: (roadmapId?: string) => void;
  onGrade: ComponentProps<typeof GradingPage>["onGrade"];
  focusStudentId?: string;
  focusAssignment?: string;
  onConsumedFocus: () => void;
  showToast: (msg: string) => void;
  initialTab?: ClassroomTab;
  onTitle: (title: string) => void;
}) {
  const [tab, setTab] = useState<ClassroomTab>(initialTab);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [gradeItemId, setGradeItemId] = useState<string | undefined>();
  const [gradeShowPast, setGradeShowPast] = useState(false);
  const [localFocus, setLocalFocus] = useState<string | undefined>();
  const [localAssignment, setLocalAssignment] = useState<string | undefined>();
  const roadmap = roadmaps[0];
  const codeMatches = deleteCode.trim().toUpperCase() === classroom.code.trim().toUpperCase();

  useEffect(() => {
    onTitle(TAB_HEADER[tab]);
  }, [tab, onTitle]);

  const closeDelete = () => {
    setConfirmDelete(false);
    setDeleteCode("");
  };

  return (
    <div className="space-y-4">
      <div>
        <button type="button" onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1">
          <ArrowLeft size={14} /> {backLabel}
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap mt-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-zinc-900 break-words">{classroom.name}</h2>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-50 border border-border px-2 py-0.5 rounded">{classroom.code}</span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{classroom.description || "No description yet."}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3 px-3 sm:mx-0 sm:px-0">
        {(
          [
            ["roadmaps", "Curriculum"],
            ["grades", "Grading"],
            ["students", "Students"],
            ["reports", "Reports"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              if (t === "grades") {
                setGradeItemId(undefined);
                setGradeShowPast(false);
                setLocalFocus(undefined);
                setLocalAssignment(undefined);
              }
              setTab(t);
            }}
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
              tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "students" && (
        <ClassStudentsTab
          classroom={classroom}
          grades={grades}
          students={students}
          submissions={submissions}
          roadmaps={roadmaps}
          onAdd={() => setShowAdd(true)}
          onView={(studentId, assignment, itemId) => {
            setLocalFocus(studentId);
            setLocalAssignment(assignment);
            setGradeItemId(itemId);
            setGradeShowPast(true);
            setTab("grades");
          }}
          showToast={showToast}
        />
      )}

      {tab === "roadmaps" && (
        <div className="space-y-4">
          <RoadmapDefinition compact />
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{roadmap ? roadmap.name : "Curriculum"}</div>
                {roadmap && <div className="text-xs text-zinc-400 mt-0.5">{roadmapBreakdown(roadmap)}</div>}
              </div>
              <div className="flex items-center gap-2">
                {roadmap && (
                  <Badge
                    label={roadmap.status === "published" ? "Published" : roadmap.status === "archived" ? "Archived" : "Draft"}
                    variant={roadmap.status === "published" ? "green" : roadmap.status === "archived" ? "gray" : "amber"}
                  />
                )}
                {roadmap ? (
                  <button type="button" className={primaryBtn} onClick={() => onOpenRoadmap(roadmap.id)}>
                    <Pencil size={14} /> Edit curriculum
                  </button>
                ) : (
                  <button type="button" className={primaryBtn} onClick={() => onOpenRoadmap()}>
                    <Plus size={14} /> Create curriculum
                  </button>
                )}
              </div>
            </div>
            {!roadmap ? (
              <EmptyState
                icon={BookOpen}
                title="No curriculum yet"
                body="Add the work students should do: teaching to practice, assessments to grade, and quizzes."
                action={
                  <button type="button" className={primaryBtn} onClick={() => onOpenRoadmap()}>
                    Create curriculum
                  </button>
                }
              />
            ) : roadmap.items.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Curriculum is empty"
                body="Add at least one item, then publish so students see it in the sim."
                action={
                  <button type="button" className={primaryBtn} onClick={() => onOpenRoadmap(roadmap.id)}>
                    Add items
                  </button>
                }
              />
            ) : null}
          </div>
          {roadmap && roadmap.items.length > 0 && (
            <CourseworkProgress
              items={roadmap.items}
              scenes={SCENES}
              students={students}
              grades={grades}
              submissions={submissions}
              onReview={(itemId, showPast) => {
                setLocalFocus(undefined);
                setGradeItemId(itemId);
                setGradeShowPast(showPast);
                setTab("grades");
              }}
            />
          )}
        </div>
      )}

      {tab === "grades" && (
        <GradingPage
          key={`${gradeItemId ?? "all"}-${gradeShowPast ? "past" : "now"}`}
          classrooms={allClassrooms}
          students={students}
          submissions={submissions}
          grades={grades}
          roadmaps={roadmaps}
          lockedClassroomId={classroom.id}
          initialItemId={gradeItemId}
          initialShowPast={gradeShowPast}
          focusStudentId={localFocus ?? focusStudentId}
          focusAssignment={localAssignment ?? focusAssignment}
          onConsumedFocus={() => {
            setLocalFocus(undefined);
            setLocalAssignment(undefined);
            onConsumedFocus();
          }}
          onGrade={onGrade}
          showToast={showToast}
        />
      )}

      {tab === "reports" && (
        <ClassReportsTab
          classroom={classroom}
          students={students}
          submissions={submissions}
          grades={grades}
          roadmaps={roadmaps}
          showToast={showToast}
        />
      )}

      <div className="pt-2">
        <button type="button" className={dangerBtn} onClick={() => { setDeleteCode(""); setConfirmDelete(true); }}>
          <Trash2 size={14} /> Delete classroom
        </button>
      </div>

      {showAdd && (
        <AddStudentsDialog
          existingEmails={students.map((s) => s.email)}
          remainingSlots={Math.max(0, 500 - students.length)}
          onClose={() => setShowAdd(false)}
          onAdd={(rows) => onInvite(rows)}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete classroom?" onClose={closeDelete}>
          <p className="text-sm text-zinc-600">
            This removes “{classroom.name}”, its roster, and its curriculum. Type the class code{" "}
            <span className="font-mono font-medium text-zinc-800">{classroom.code}</span> to confirm.
          </p>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Class code</label>
            <input
              value={deleteCode}
              onChange={(e) => setDeleteCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && codeMatches) onDelete();
              }}
              className={fieldClass}
              placeholder={classroom.code}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button type="button" className={`${secondaryBtn} flex-1`} onClick={closeDelete}>Cancel</button>
            <button
              type="button"
              className={`${dangerBtn} flex-1 bg-rose-600 text-white border-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:pointer-events-none`}
              disabled={!codeMatches}
              onClick={() => {
                if (!codeMatches) return;
                onDelete();
              }}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
