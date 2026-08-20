import type { Grade, RoadmapItem, Scene, Student, Submission } from "./types";
import { Badge } from "./ui";
import { ROADMAP_TYPE_META, itemLabel } from "./utils";

export function CourseworkProgress({
  items,
  scenes,
  students,
  grades,
  submissions,
  onReview,
}: {
  items: RoadmapItem[];
  scenes: Scene[];
  students: Student[];
  grades: Grade[];
  submissions: Submission[];
  onReview: (itemId: string, showPast: boolean) => void;
}) {
  const sceneName = (id: string) => scenes.find((s) => s.id === id)?.name ?? id;
  const active = students.filter((s) => s.status === "active");

  const statusFor = (item: RoadmapItem, studentId: string) => {
    const graded = grades.some(
      (g) => g.studentId === studentId && (g.itemId === item.id || (item.type === "quiz" && g.item === item.title))
    );
    if (graded) return "graded" as const;
    const pending = submissions.some((s) => s.studentId === studentId && s.itemId === item.id);
    if (pending) return "pending" as const;
    return "waiting" as const;
  };

  const currentIndex = items.findIndex(
    (item) => !item.hiddenFromSim && active.some((s) => statusFor(item, s.id) !== "graded")
  );
  const stageIndex = currentIndex < 0 ? items.length : currentIndex;
  const stageItem = currentIndex >= 0 ? items[currentIndex] : undefined;
  const doneCount = currentIndex < 0 ? active.length : active.filter((s) => statusFor(items[currentIndex], s.id) === "graded").length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border px-4 sm:px-5 py-4">
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Class stage</div>
        {stageItem ? (
          <div className="mt-1 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                Step {stageIndex + 1} of {items.length} · {itemLabel(stageItem, sceneName)}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {ROADMAP_TYPE_META[stageItem.type].label} · {doneCount} of {active.length} students graded
              </div>
            </div>
            <Badge label="In progress" variant="amber" />
          </div>
        ) : (
          <div className="mt-1 text-sm font-semibold text-zinc-900">All published items are graded</div>
        )}
        <div className="mt-3 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full"
            style={{ width: `${items.length ? Math.round((stageIndex / items.length) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-border text-sm font-semibold text-zinc-900">Progress by item</div>
        <div className="divide-y divide-border">
          {items.map((item, index) => {
            const meta = ROADMAP_TYPE_META[item.type];
            const graded = active.filter((s) => statusFor(item, s.id) === "graded").length;
            const pending = active.filter((s) => statusFor(item, s.id) === "pending").length;
            const waiting = active.length - graded - pending;
            const isNow = index === currentIndex;
            return (
              <div key={item.id} className={`px-4 sm:px-5 py-3 flex items-start gap-3 ${isNow ? "bg-amber-50/60" : ""} ${item.hiddenFromSim ? "opacity-55" : ""}`}>
                <div className="text-xs font-mono text-zinc-400 w-5 pt-0.5 tabular-nums">{index + 1}</div>
                <div className={`mt-0.5 w-1.5 self-stretch rounded-full flex-shrink-0 ${meta.bar}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-medium text-zinc-900 truncate">{itemLabel(item, sceneName)}</div>
                    <Badge label={meta.label} variant={meta.badge} />
                    {item.hiddenFromSim && <Badge label="Hidden in sim" variant="gray" />}
                    {isNow && <Badge label="Now" variant="amber" />}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {graded} graded · {pending} to grade · {waiting} not submitted
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pending > 0 && (
                    <button type="button" onClick={() => onReview(item.id, false)} className="text-xs font-medium text-amber-700 hover:text-amber-800">
                      Grade
                    </button>
                  )}
                  {graded > 0 && (
                    <button type="button" onClick={() => onReview(item.id, true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                      View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
