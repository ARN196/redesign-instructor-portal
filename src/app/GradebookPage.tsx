import { useMemo, useState } from "react";
import { ChevronRight, Eye, FileDown, Plus, Search, Users } from "lucide-react";
import type { Classroom, Grade, Roadmap, Student, Submission } from "./types";
import { Avatar, Badge, EmptyState, Modal, fieldClass, primaryBtn, secondaryBtn } from "./ui";
import { downloadTextFile, findRoadmapItem, workKind, ROADMAP_TYPE_META } from "./utils";

type WorkRow = {
  key: string;
  assignment: string;
  itemId?: string;
  kind: "teaching" | "assessment" | "quiz";
  status: "pending" | "graded";
  submitted?: string;
  score?: number;
  max?: number;
  graded?: string;
};

export function ClassStudentsTab({
  classroom,
  grades,
  students,
  submissions = [],
  roadmaps = [],
  onView,
  onAdd,
  showToast,
}: {
  classroom: Classroom;
  grades: Grade[];
  students: Student[];
  submissions?: Submission[];
  roadmaps?: Roadmap[];
  onView: (studentId: string, assignment: string, itemId?: string) => void;
  onAdd: () => void;
  showToast: (msg: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState<{ student: Student; works: WorkRow[] } | null>(null);
  const q = query.trim().toLowerCase();

  const classStudents = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );

  const visibleStudents = q
    ? classStudents.filter(
        (st) => st.name.toLowerCase().includes(q) || st.email.toLowerCase().includes(q)
      )
    : classStudents;

  const worksFor = (studentId: string): WorkRow[] => {
    const pending = submissions
      .filter((s) => s.studentId === studentId)
      .map((s) => {
        const kind = workKind(findRoadmapItem(roadmaps, s.itemId, s.assignment), s.type);
        return {
          key: s.id,
          assignment: s.assignment,
          itemId: s.itemId,
          kind,
          status: "pending" as const,
          submitted: s.submitted,
        };
      });
    const done = grades
      .filter((g) => g.studentId === studentId)
      .map((g) => {
        const kind = workKind(findRoadmapItem(roadmaps, g.itemId, g.item), g.type);
        return {
          key: g.id,
          assignment: g.item,
          itemId: g.itemId,
          kind,
          status: "graded" as const,
          score: g.score,
          max: g.max,
          graded: g.graded,
        };
      });
    return [...pending, ...done];
  };

  const rows = visibleStudents.map((st) => {
    const mine = grades.filter((g) => g.studentId === st.id);
    const pending = submissions.filter((s) => s.studentId === st.id);
    const latest = mine[0];
    const avg =
      mine.length > 0
        ? Math.round(mine.reduce((sum, g) => sum + (g.score / g.max) * 100, 0) / mine.length)
        : null;
    return { student: st, mine, pending, latest, avg };
  });

  const openView = (student: Student) => {
    const works = worksFor(student.id);
    if (works.length === 1) {
      onView(student.id, works[0].assignment, works[0].itemId);
      return;
    }
    if (works.length > 1) setPicker({ student, works });
  };

  const exportCsv = () => {
    const header = "Class,Student,Email,Status,Average,Grades";
    const csvRows = rows.map(({ student, mine, avg }) =>
      [classroom.code, student.name, student.email, student.status, avg == null ? "" : `${avg}%`, mine.length].join(",")
    );
    downloadTextFile(`students-${classroom.code}.csv`, [header, ...csvRows].join("\n"));
    showToast("CSV downloaded");
  };

  const countLabel = q
    ? `${visibleStudents.length} of ${classStudents.length} students`
    : `${classStudents.length} ${classStudents.length === 1 ? "student" : "students"}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-zinc-400 w-full sm:w-auto order-last sm:order-none sm:ml-auto">{countLabel}</span>
        <div className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${fieldClass} !pl-9`}
            placeholder="Search by name"
            aria-label="Search students by name"
          />
        </div>
        <button type="button" onClick={exportCsv} className={`${secondaryBtn} sm:ml-auto`} disabled={rows.length === 0}>
          <FileDown size={14} /> Export CSV
        </button>
        <button type="button" className={primaryBtn} onClick={onAdd}>
          <Plus size={14} /> Add students
        </button>
      </div>

      {classStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-border">
          <EmptyState
            icon={Users}
            title="No students yet"
            body="Add them by email or import an Excel/CSV. Published scores will show next to each student."
            action={
              <button type="button" className={primaryBtn} onClick={onAdd}>
                Add students
              </button>
            }
          />
        </div>
      ) : visibleStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-border">
          <EmptyState
            icon={Search}
            title="No matching students"
            body={`No one in this class matches “${query.trim()}”.`}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[28rem]">
            <thead className="bg-zinc-50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-3 sm:px-5 py-3">Student</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-3 sm:px-5 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-3 sm:px-5 py-3">Average</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-3 sm:px-5 py-3 hidden lg:table-cell">Graded</th>
                <th className="px-3 sm:px-5 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ student, mine, pending, latest, avg }) => (
                <tr key={student.id} className="hover:bg-zinc-50/60">
                  <td className="px-3 sm:px-5 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar initials={student.initials} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 truncate">{student.name}</div>
                        <div className="text-xs text-zinc-400 truncate">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-5 py-3.5 hidden sm:table-cell">
                    <Badge
                      label={student.status === "active" ? "Active" : "Invited"}
                      variant={student.status === "active" ? "green" : "amber"}
                    />
                  </td>
                  <td className="px-3 sm:px-5 py-3.5">
                    {avg == null ? (
                      <span className="text-sm text-zinc-400">—</span>
                    ) : (
                      <>
                        <div className={`text-sm font-semibold ${avg >= 80 ? "text-emerald-600" : avg >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                          {avg}%
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {mine.length} grade{mine.length === 1 ? "" : "s"}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-3 sm:px-5 py-3.5 hidden lg:table-cell text-sm text-zinc-400">
                    {mine.length ? `${mine.length}` : "—"}
                  </td>
                  <td className="px-3 sm:px-5 py-3.5">
                    {(latest || pending.length > 0) && (
                      <button
                        type="button"
                        onClick={() => openView(student)}
                        className="text-xs text-zinc-400 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <Eye size={13} /> View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {picker && (
        <Modal title={`${picker.student.name}’s work`} onClose={() => setPicker(null)} wide>
          <p className="text-sm text-zinc-500 -mt-2">Choose an assignment to open in Grading.</p>
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border max-h-80 overflow-y-auto">
            {picker.works.map((work) => {
              const meta = ROADMAP_TYPE_META[work.kind];
              const pct = work.status === "graded" && work.max ? Math.round((work.score! / work.max) * 100) : null;
              return (
                <button
                  key={work.key}
                  type="button"
                  onClick={() => {
                    onView(picker.student.id, work.assignment, work.itemId);
                    setPicker(null);
                  }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-900 truncate">{work.assignment}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge label={meta.label} variant={meta.badge} />
                      {work.status === "pending" ? (
                        <span className="text-xs text-amber-700">To grade · {work.submitted}</span>
                      ) : (
                        <span className="text-xs text-zinc-400">{work.graded}</span>
                      )}
                    </div>
                  </div>
                  {work.status === "graded" && pct != null ? (
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-zinc-900">
                        {work.score}<span className="text-zinc-400 font-normal">/{work.max}</span>
                      </div>
                      <div className={`text-xs font-medium ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                        {pct}%
                      </div>
                    </div>
                  ) : null}
                  <ChevronRight size={16} className="text-zinc-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
