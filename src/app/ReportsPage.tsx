import { AlertTriangle, CheckCircle2, FileDown, FileText, Star, Users } from "lucide-react";
import type { Classroom, Grade, Roadmap, Student, Submission } from "./types";
import { Avatar, Badge, EmptyState, secondaryBtn } from "./ui";
import { downloadTextFile, findRoadmapItem, formatToday, itemLabel, ROADMAP_TYPE_META, workKind } from "./utils";
import { SCENES } from "./data";

export function ClassReportsTab({
  classroom,
  students,
  submissions,
  grades,
  roadmaps,
  showToast,
}: {
  classroom: Classroom;
  students: Student[];
  submissions: Submission[];
  grades: Grade[];
  roadmaps: Roadmap[];
  showToast: (msg: string) => void;
}) {
  const sceneName = (id: string) => SCENES.find((s) => s.id === id)?.name ?? id;
  const roadmap = roadmaps[0];
  const active = students.filter((s) => s.status === "active");
  const invited = students.filter((s) => s.status === "invited").length;

  const avgScore = grades.length
    ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.max) * 100, 0) / grades.length)
    : null;

  const pct = (g: Grade) => Math.round((g.score / g.max) * 100);

  const avgFor = (kind: "teaching" | "assessment" | "quiz") => {
    const list = grades.filter((g) => workKind(findRoadmapItem(roadmaps, g.itemId, g.item), g.type) === kind);
    if (!list.length) return null;
    return Math.round(list.reduce((sum, g) => sum + pct(g), 0) / list.length);
  };

  const scoreByType = (["teaching", "assessment", "quiz"] as const).map((kind) => ({
    kind,
    label: ROADMAP_TYPE_META[kind].label,
    avg: avgFor(kind),
    count: grades.filter((g) => workKind(findRoadmapItem(roadmaps, g.itemId, g.item), g.type) === kind).length,
  }));

  const percents = grades.map(pct);
  const high = percents.filter((p) => p >= 80).length;
  const mid = percents.filter((p) => p >= 60 && p < 80).length;
  const low = percents.filter((p) => p < 60).length;
  const top = percents.length ? Math.max(...percents) : null;
  const bottom = percents.length ? Math.min(...percents) : null;

  const statusFor = (itemId: string, title: string, studentId: string) => {
    if (grades.some((g) => g.studentId === studentId && (g.itemId === itemId || g.item === title))) return "graded";
    if (submissions.some((s) => s.studentId === studentId && s.itemId === itemId)) return "pending";
    return "waiting";
  };

  const itemRows = (roadmap?.items ?? []).map((item) => {
    const title = itemLabel(item, sceneName);
    const graded = active.filter((s) => statusFor(item.id, title, s.id) === "graded").length;
    const pending = active.filter((s) => statusFor(item.id, title, s.id) === "pending").length;
    const waiting = Math.max(0, active.length - graded - pending);
    return {
      id: item.id,
      title,
      type: item.type,
      graded,
      pending,
      waiting,
      pct: active.length ? Math.round((graded / active.length) * 100) : 0,
    };
  });

  const studentRows = students.map((st) => {
    const mine = grades.filter((g) => g.studentId === st.id);
    const pending = submissions.filter((s) => s.studentId === st.id).length;
    const avg = mine.length
      ? Math.round(mine.reduce((n, g) => n + (g.score / g.max) * 100, 0) / mine.length)
      : null;
    let issue = "";
    if (st.status === "invited") issue = "Invited — not yet in the sim";
    else if (mine.length && avg != null && avg < 70) issue = "Below 70% average";
    else if (pending > 0) issue = `${pending} submission${pending === 1 ? "" : "s"} to grade`;
    else if (mine.length === 0) issue = "No graded work yet";
    return { student: st, avg, graded: mine.length, pending, issue };
  });

  const atRisk = studentRows.filter(
    (r) => r.student.status === "active" && ((r.avg != null && r.avg < 70) || (r.graded === 0 && r.pending === 0))
  );

  const kpis = [
    { label: "Students", value: String(students.length), hint: invited ? `${invited} invited` : `${active.length} active`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "To grade", value: String(submissions.length), hint: "Waiting in Grading", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Published", value: String(grades.length), hint: "Scores in this class", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Class average", value: avgScore == null ? "—" : `${avgScore}%`, hint: grades.length ? "From published scores" : "No scores yet", icon: Star, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const exportReport = () => {
    const lines = [
      `PySimverse class report — ${classroom.name} (${classroom.code})`,
      `Generated: ${formatToday()}`,
      "",
      `Students,${students.length}`,
      `Active,${active.length}`,
      `Invited,${invited}`,
      `To grade,${submissions.length}`,
      `Published grades,${grades.length}`,
      `Class average,${avgScore == null ? "" : `${avgScore}%`}`,
      `Teaching avg,${avgFor("teaching") == null ? "" : `${avgFor("teaching")}%`}`,
      `Assessment avg,${avgFor("assessment") == null ? "" : `${avgFor("assessment")}%`}`,
      `Quiz avg,${avgFor("quiz") == null ? "" : `${avgFor("quiz")}%`}`,
      `Scores 80%+,${high}`,
      `Scores 60–79%,${mid}`,
      `Scores below 60%,${low}`,
      "",
      "Item,Type,Graded,To grade,Not submitted,Complete %",
      ...itemRows.map((r) => `${r.title},${r.type},${r.graded},${r.pending},${r.waiting},${r.pct}%`),
      "",
      "Student,Email,Status,Avg,Graded,To grade,Note",
      ...studentRows.map((r) =>
        [r.student.name, r.student.email, r.student.status, r.avg == null ? "" : `${r.avg}%`, r.graded, r.pending, `"${r.issue}"`].join(",")
      ),
    ];
    downloadTextFile(`report-${classroom.code}.csv`, lines.join("\n"));
    showToast(`Report for ${classroom.code} downloaded`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500">Facts for this class only — roster, curriculum progress, and scores.</p>
        <button type="button" onClick={exportReport} className={secondaryBtn}>
          <FileDown size={14} /> Export class CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-border p-4">
            <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
              <k.icon size={15} className={k.color} />
            </div>
            <div className="text-xl font-bold text-zinc-900">{k.value}</div>
            <div className="text-xs font-medium text-zinc-600 mt-0.5">{k.label}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{k.hint}</div>
          </div>
        ))}
      </div>

      {itemRows.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-border text-sm font-semibold text-zinc-900">Curriculum completion</div>
          <div className="divide-y divide-border">
            {itemRows.map((r) => (
              <div key={r.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-900 truncate">{r.title}</span>
                    <Badge label={ROADMAP_TYPE_META[r.type].label} variant={ROADMAP_TYPE_META[r.type].badge} />
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {r.graded} graded · {r.pending} to grade · {r.waiting} not submitted
                  </div>
                </div>
                <div className="w-24 flex-shrink-0">
                  <div className="text-xs font-medium text-zinc-700 text-right mb-1">{r.pct}%</div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {grades.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Class scores</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Published work in this classroom</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {scoreByType.map((r) => (
              <div key={r.kind} className="rounded-xl border border-border px-3 py-3">
                <div className="text-xs font-medium text-zinc-500">{r.label}</div>
                <div className="text-xl font-bold text-zinc-900 mt-1 tabular-nums">{r.avg == null ? "—" : `${r.avg}%`}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{r.count} score{r.count === 1 ? "" : "s"}</div>
                <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.kind === "teaching" ? "bg-blue-500" : r.kind === "assessment" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${r.avg ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div>
              <div className="text-[11px] text-zinc-400">80% and up</div>
              <div className="text-sm font-semibold text-emerald-600 tabular-nums">{high}</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">60–79%</div>
              <div className="text-sm font-semibold text-amber-600 tabular-nums">{mid}</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">Below 60%</div>
              <div className="text-sm font-semibold text-rose-600 tabular-nums">{low}</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">Highest</div>
              <div className="text-sm font-semibold text-zinc-900 tabular-nums">{top == null ? "—" : `${top}%`}</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">Lowest</div>
              <div className="text-sm font-semibold text-zinc-900 tabular-nums">{bottom == null ? "—" : `${bottom}%`}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Needs attention</h3>
          </div>
          {atRisk.length === 0 ? (
            <div className="px-5 py-8 text-sm text-zinc-400 text-center">No one in this class is flagged.</div>
          ) : (
            <div className="divide-y divide-border">
              {atRisk.map((s) => (
                <div key={s.student.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <Avatar initials={s.student.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-900">{s.student.name}</div>
                    <div className="text-xs text-rose-500 mt-0.5">{s.issue}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${s.avg != null && s.avg < 70 ? "text-rose-600" : "text-zinc-400"}`}>
                      {s.avg == null ? "—" : `${s.avg}%`}
                    </div>
                    <div className="text-xs text-zinc-400">avg</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-sm font-semibold text-zinc-900">By student</div>
          {students.length === 0 ? (
            <EmptyState icon={Users} title="No students yet" body="Add a roster to see class facts." />
          ) : (
            <div className="divide-y divide-border max-h-[22rem] overflow-y-auto">
              {studentRows.map((r) => (
                <div key={r.student.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <Avatar initials={r.student.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-900 truncate">{r.student.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {r.graded} graded{r.pending ? ` · ${r.pending} to grade` : ""}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-zinc-800 tabular-nums">
                    {r.avg == null ? "—" : `${r.avg}%`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
