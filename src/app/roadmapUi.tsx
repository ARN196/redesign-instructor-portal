import type { ReactNode } from "react";
import { BookMarked } from "lucide-react";
import type { RoadmapItem, Scene } from "./types";
import { Badge } from "./ui";
import { ROADMAP_TYPE_META, itemLabel, itemSubtitle } from "./utils";

export function RoadmapDefinition({ compact }: { compact?: boolean }) {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
          <BookMarked size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900">Curriculum</div>
          <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
            The work for this class, in the order students should do it. Each class has one list.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(
          [
            ["teaching", "Practice a mission in the sim"],
            ["assessment", "Graded mission with a due date"],
            ["quiz", "Questions you write"],
          ] as const
        ).map(([type, hint]) => (
          <div key={type} className="bg-white/70 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${ROADMAP_TYPE_META[type].bar}`} />
              <span className="text-xs font-semibold text-zinc-800">{ROADMAP_TYPE_META[type].label}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 leading-snug">{hint}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500 mt-3">
        {compact
          ? "Publish to show this list in the sim. Use the eye to hide an item without deleting it."
          : "Save a draft while you build. Publish when students should see it in the sim."}
      </p>
    </div>
  );
}

export function RoadmapSequence({
  items,
  scenes,
  empty,
  actions,
}: {
  items: RoadmapItem[];
  scenes: Scene[];
  empty?: ReactNode;
  actions?: (item: RoadmapItem, index: number) => ReactNode;
}) {
  const sceneName = (id: string) => scenes.find((s) => s.id === id)?.name ?? id;

  if (items.length === 0) return <>{empty}</>;

  return (
    <div className="divide-y divide-border">
      {items.map((item, index) => {
        const meta = ROADMAP_TYPE_META[item.type];
        return (
          <div key={item.id} className={`px-4 sm:px-5 py-3 flex items-start gap-3 ${item.hiddenFromSim ? "opacity-55" : ""}`}>
            <div className="text-xs font-mono text-zinc-400 w-5 pt-0.5 tabular-nums">{index + 1}</div>
            <div className={`mt-0.5 w-1.5 self-stretch rounded-full flex-shrink-0 ${meta.bar}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-medium text-zinc-900 truncate">{itemLabel(item, sceneName)}</div>
                <Badge label={meta.label} variant={meta.badge} />
                {item.hiddenFromSim && <Badge label="Hidden in sim" variant="gray" />}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">{itemSubtitle(item)}</div>
            </div>
            {actions ? <div className="flex items-center gap-1 flex-shrink-0">{actions(item, index)}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
