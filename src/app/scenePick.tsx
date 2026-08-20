import type { AssessmentItem, RoadmapItem, Scene, TeachingItem } from "./types";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { uid } from "./utils";

export type LevelPick = { all: boolean; levels: number[] };

export const EMPTY_PICK: LevelPick = { all: false, levels: [] };

export function pickIsSet(p: LevelPick) {
  return p.all || p.levels.length > 0;
}

export function toggleAll(current: LevelPick): LevelPick {
  return current.all ? EMPTY_PICK : { all: true, levels: [] };
}

export function toggleLevel(current: LevelPick, n: number): LevelPick {
  const has = current.levels.includes(n);
  const levels = has ? current.levels.filter((x) => x !== n) : [...current.levels, n].sort((a, b) => a - b);
  return { all: false, levels };
}

export function clampPick(pick: LevelPick, max: number): LevelPick {
  if (pick.all) return pick;
  return { all: false, levels: pick.levels.filter((n) => n >= 1 && n <= max) };
}

export function pickFromItem(item?: TeachingItem | AssessmentItem): LevelPick {
  if (!item) return EMPTY_PICK;
  if (item.level == null) return { all: true, levels: [] };
  return { all: false, levels: [item.level] };
}

export function itemsFromPick(
  scene: Scene,
  kind: "teaching" | "assessment",
  pick: LevelPick,
  extra?: { deadline?: string; existingId?: string; maxPoints?: number; hiddenFromSim?: boolean }
): RoadmapItem[] {
  if (!pickIsSet(pick)) return [];
  const idAt = (i: number) => (i === 0 && extra?.existingId ? extra.existingId : uid("it"));
  const maxPoints = extra?.maxPoints ?? 100;
  const hidden = extra?.hiddenFromSim ? { hiddenFromSim: true as const } : {};
  const make = (i: number, level?: number): RoadmapItem =>
    kind === "teaching"
      ? { id: idAt(i), type: "teaching", sceneId: scene.id, maxPoints, ...hidden, ...(level != null ? { level } : {}) }
      : { id: idAt(i), type: "assessment", sceneId: scene.id, deadline: extra?.deadline ?? "", maxPoints, ...hidden, ...(level != null ? { level } : {}) };
  if (pick.all) return [make(0)];
  return pick.levels.map((level, i) => make(i, level));
}

const checkClass = "rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500";

export function LevelChecklist({
  max,
  value,
  onChange,
}: {
  max: number;
  value: LevelPick;
  onChange: (next: LevelPick) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
        <input type="checkbox" className={checkClass} checked={value.all} onChange={() => onChange(toggleAll(value))} />
        All
      </label>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <label key={n} className="inline-flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            className={checkClass}
            checked={!value.all && value.levels.includes(n)}
            onChange={() => onChange(toggleLevel(value, n))}
          />
          {n}
        </label>
      ))}
    </div>
  );
}

export function MissionThumb({ scene, className }: { scene: Scene; className?: string }) {
  return (
    <ImageWithFallback
      src={scene.image}
      alt=""
      className={className ?? "block w-full h-28 object-cover bg-zinc-100"}
    />
  );
}
