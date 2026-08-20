import { useState } from "react";
import { ArrowDown, ArrowUp, BookMarked, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { AssessmentItem, QuizItem, RoadmapItem, Scene, TeachingItem } from "./types";
import { EmptyState, fieldClass, fieldClassFor, FieldError, primaryBtn, secondaryBtn } from "./ui";
import { RoadmapSequence } from "./roadmapUi";
import { moveItem } from "./utils";
import { datetimeLocalNow, LIMITS, validateDeadline } from "./validate";
import { LevelChecklist, MissionThumb, clampPick, itemsFromPick, pickFromItem, pickIsSet, type LevelPick } from "./scenePick";
import { QuizPage } from "./QuizPage";

type Panel =
  | null
  | { mode: "add"; type: "teaching" | "assessment" }
  | { mode: "edit"; itemId: string };

export function CourseworkSequenceEditor({
  items,
  scenes,
  onChange,
  onQuizViewChange,
}: {
  items: RoadmapItem[];
  scenes: Scene[];
  onChange: (items: RoadmapItem[]) => void;
  onQuizViewChange?: (open: boolean) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [quiz, setQuiz] = useState<QuizItem | "new" | null>(null);
  const panelItem = panel?.mode === "edit" ? items.find((i) => i.id === panel.itemId) : undefined;
  const panelType = panel?.mode === "add" ? panel.type : panelItem?.type;

  const commitItems = (next: RoadmapItem[]) => {
    if (!next.length) return;
    if (panel?.mode === "edit" && panelItem) {
      const idx = items.findIndex((i) => i.id === panelItem.id);
      const copy = [...items];
      copy.splice(idx, 1, ...next);
      onChange(copy);
    } else {
      onChange([...items, ...next]);
    }
    setPanel(null);
  };

  const openQuiz = (existing?: QuizItem) => {
    setPanel(null);
    setQuiz(existing ?? "new");
    onQuizViewChange?.(true);
  };

  const closeQuiz = () => {
    setQuiz(null);
    onQuizViewChange?.(false);
  };

  if (quiz != null) {
    const existing = quiz === "new" ? undefined : quiz;
    return (
      <QuizPage
        existing={existing}
        onBack={closeQuiz}
        onCommit={(item) => {
          if (existing) onChange(items.map((i) => (i.id === existing.id ? item : i)));
          else onChange([...items, item]);
          closeQuiz();
        }}
      />
    );
  }

  return (
    <div>
      <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-900">Sequence</span>
        <span className="text-xs text-zinc-400">{items.length} item{items.length === 1 ? "" : "s"}</span>
      </div>
      <RoadmapSequence
        items={items}
        scenes={scenes}
        empty={
          !panel ? (
            <EmptyState
              icon={BookMarked}
              title="Nothing here yet"
              body="Add teaching to practice, an assessment to grade, or a quiz."
            />
          ) : null
        }
        actions={(_item, index) => (
          <>
            <button
              type="button"
              className={`p-1.5 rounded ${
                items[index].hiddenFromSim
                  ? "text-zinc-500 hover:bg-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-100"
              }`}
              aria-label={items[index].hiddenFromSim ? "Show in simulator" : "Hide from simulator"}
              title={items[index].hiddenFromSim ? "Hidden from students in the sim — click to show" : "Visible in the sim — click to hide from students"}
              onClick={() =>
                onChange(
                  items.map((item, i) =>
                    i === index ? { ...item, hiddenFromSim: !item.hiddenFromSim } : item
                  )
                )
              }
            >
              {items[index].hiddenFromSim ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded"
              aria-label="Edit"
              onClick={() => {
                const item = items[index];
                if (item.type === "quiz") openQuiz(item);
                else setPanel({ mode: "edit", itemId: item.id });
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded"
              aria-label="Move up"
              onClick={() => onChange(moveItem(items, index, -1))}
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded"
              aria-label="Move down"
              onClick={() => onChange(moveItem(items, index, 1))}
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              aria-label="Remove"
              onClick={() => {
                onChange(items.filter((i) => i.id !== items[index].id));
                if (panel?.mode === "edit" && panel.itemId === items[index].id) setPanel(null);
              }}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      {panelType === "teaching" || panelType === "assessment" ? (
        <ScenePicker
          key={panelItem?.id ?? panelType}
          scenes={scenes}
          mode={panelType}
          existing={panelItem && panelItem.type !== "quiz" ? panelItem : undefined}
          onCancel={() => setPanel(null)}
          onCommit={commitItems}
        />
      ) : null}

      {!panel && (
        <div className="px-4 sm:px-5 py-3 border-t border-border flex flex-wrap gap-2">
          <button type="button" className={secondaryBtn} onClick={() => setPanel({ mode: "add", type: "teaching" })}>
            + Teaching
          </button>
          <button type="button" className={secondaryBtn} onClick={() => setPanel({ mode: "add", type: "assessment" })}>
            + Assessment
          </button>
          <button type="button" className={secondaryBtn} onClick={() => openQuiz()}>
            + Quiz
          </button>
        </div>
      )}
    </div>
  );
}

function ScenePicker({
  scenes,
  mode,
  existing,
  onCancel,
  onCommit,
}: {
  scenes: Scene[];
  mode: "teaching" | "assessment";
  existing?: TeachingItem | AssessmentItem;
  onCancel: () => void;
  onCommit: (items: RoadmapItem[]) => void;
}) {
  const [sceneId, setSceneId] = useState(existing?.sceneId ?? scenes[0]?.id ?? "");
  const [pick, setPick] = useState<LevelPick>(() =>
    existing
      ? pickFromItem(existing)
      : mode === "teaching"
        ? { all: false, levels: [1] }
        : { all: true, levels: [] }
  );
  const [deadline, setDeadline] = useState(existing?.type === "assessment" ? existing.deadline : "");
  const [maxPoints, setMaxPoints] = useState(existing?.maxPoints ?? 100);
  const [err, setErr] = useState("");
  const scene = scenes.find((s) => s.id === sceneId);

  const pickScene = (id: string) => {
    setSceneId(id);
    const next = scenes.find((s) => s.id === id);
    if (next) setPick((p) => clampPick(p, next.levels));
  };

  const add = () => {
    if (!scene) {
      setErr("Pick a mission.");
      return;
    }
    if (!pickIsSet(pick)) {
      setErr("Check All or at least one level.");
      return;
    }
    if (mode === "assessment") {
      const dl = validateDeadline(deadline);
      if (dl) {
        setErr(dl);
        return;
      }
    }
    if (!Number.isInteger(maxPoints) || maxPoints < LIMITS.points.min || maxPoints > LIMITS.points.max) {
      setErr(`Score must be between ${LIMITS.points.min} and ${LIMITS.points.max}.`);
      return;
    }
    onCommit(itemsFromPick(scene, mode, pick, { deadline, existingId: existing?.id, maxPoints, hiddenFromSim: existing?.hiddenFromSim }));
  };

  return (
    <div className="px-4 sm:px-5 py-4 bg-zinc-50 border-t border-border space-y-3">
      <div className="text-sm font-medium text-zinc-900">
        {existing ? "Edit" : "Add"} {mode === "teaching" ? "teaching mission" : "assessment"}
      </div>
      {scenes.length === 0 ? (
        <p className="text-sm text-zinc-500">No missions are available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scenes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pickScene(s.id)}
              className={`text-left rounded-lg border overflow-hidden transition-colors bg-white ${
                sceneId === s.id ? "border-indigo-400 ring-1 ring-indigo-200" : "border-border hover:border-zinc-300"
              }`}
            >
              <MissionThumb scene={s} className="block w-full h-24 object-cover bg-zinc-100" />
              <div className="p-3">
                <div className="text-sm font-medium text-zinc-900">{s.name}</div>
                <div className="text-xs text-zinc-400 mt-0.5 capitalize">
                  {s.category} · {s.simulationType} · {s.levels} levels
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {scene && (
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Levels</label>
          <LevelChecklist max={scene.levels} value={pick} onChange={(next) => { setPick(next); setErr(""); }} />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
          Score <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={LIMITS.points.min}
            max={LIMITS.points.max}
            value={maxPoints}
            onChange={(e) => { setMaxPoints(Number(e.target.value)); setErr(""); }}
            className={`${fieldClass} w-24 text-center`}
            aria-label="Score"
          />
          <span className="text-xs text-zinc-400">pts (max {LIMITS.points.max})</span>
        </div>
      </div>
      {mode === "assessment" && (
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Deadline <span className="text-rose-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={deadline}
            min={datetimeLocalNow()}
            onChange={(e) => {
              const next = e.target.value;
              if (next && validateDeadline(next)) {
                setDeadline(next);
                setErr("Deadline must be in the future");
                return;
              }
              setDeadline(next);
              setErr("");
            }}
            className={`${fieldClassFor(!!err && mode === "assessment")} max-w-xs`}
            aria-invalid={!!err && mode === "assessment"}
          />
        </div>
      )}
      {err && <FieldError message={err} />}
      <div className="flex gap-2">
        <button type="button" className={secondaryBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={primaryBtn} onClick={add}>
          {existing ? "Save item" : "Add"}
        </button>
      </div>
    </div>
  );
}
