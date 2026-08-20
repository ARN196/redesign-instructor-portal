import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Classroom, Roadmap, RoadmapItem, Scene } from "./types";
import { Badge, fieldClass, fieldClassFor, FieldError, primaryBtn, secondaryBtn } from "./ui";
import { uid } from "./utils";
import { LIMITS, validateRoadmapForm, validateRoadmapName } from "./validate";
import { CourseworkSequenceEditor } from "./CourseworkSequenceEditor";
import { RoadmapDefinition } from "./roadmapUi";

export function RoadmapsPage({
  roadmaps,
  classrooms,
  scenes,
  classroomId,
  editId,
  onBack,
  onSave,
  showToast,
}: {
  roadmaps: Roadmap[];
  classrooms: Classroom[];
  scenes: Scene[];
  classroomId?: string;
  editId?: string;
  onBack: () => void;
  onSave: (roadmap: Roadmap, publish: boolean) => void;
  showToast: (msg: string) => void;
}) {
  const existing = editId ? roadmaps.find((r) => r.id === editId) ?? null : null;
  const lockedClassroomId = existing?.classroomId || classroomId || classrooms[0]?.id;

  return (
    <RoadmapBuilder
      existing={existing}
      defaultClassroomId={lockedClassroomId}
      classrooms={classrooms}
      scenes={scenes}
      lockClassroom
      onCancel={onBack}
      onSave={(roadmap, publish) => {
        onSave(roadmap, publish);
        showToast(publish ? "Curriculum published" : "Draft saved");
      }}
    />
  );
}

function defaultRoadmapName(classrooms: Classroom[], classroomId?: string) {
  const c = classrooms.find((x) => x.id === classroomId);
  return c ? `${c.code} Curriculum` : "";
}

function RoadmapBuilder({
  existing,
  defaultClassroomId,
  classrooms,
  scenes,
  lockClassroom,
  onCancel,
  onSave,
}: {
  existing: Roadmap | null;
  defaultClassroomId?: string;
  classrooms: Classroom[];
  scenes: Scene[];
  lockClassroom?: boolean;
  onCancel: () => void;
  onSave: (roadmap: Roadmap, publish: boolean) => void;
}) {
  const [name, setName] = useState(existing?.name || defaultRoadmapName(classrooms, defaultClassroomId));
  const [classroomId, setClassroomId] = useState(defaultClassroomId || classrooms[0]?.id || "");
  const [items, setItems] = useState<RoadmapItem[]>(existing?.items ?? []);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [tried, setTried] = useState(false);
  const [quizView, setQuizView] = useState(false);

  const classroom = classrooms.find((c) => c.id === classroomId);

  const commit = (publish: boolean) => {
    setTried(true);
    const result = validateRoadmapForm(name, classroomId, items, scenes, publish);
    if (result) {
      setNameError(result.field === "name" ? result.message : "");
      setError(result.field === "name" ? "" : result.message);
      return;
    }
    setNameError("");
    setError("");
    onSave(
      {
        id: existing?.id ?? uid("r"),
        name: name.trim(),
        classroomId,
        status: publish ? "published" : "draft",
        items,
      },
      publish
    );
  };

  return (
    <div className="max-w-3xl space-y-5">
      {!quizView && (
        <>
          <button type="button" onClick={onCancel} className="text-sm text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to classroom
          </button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{existing ? "Edit curriculum" : "Create curriculum"}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                Add work in order. Students follow this list in the sim after you publish.
              </p>
            </div>
            {existing && (
              <Badge
                label={existing.status === "published" ? "Published" : existing.status === "archived" ? "Archived" : "Draft"}
                variant={existing.status === "published" ? "green" : existing.status === "archived" ? "gray" : "amber"}
              />
            )}
          </div>

          <RoadmapDefinition />

          <div className="bg-white rounded-xl border border-border p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (tried) setNameError(validateRoadmapName(e.target.value) ?? "");
                  }}
                  className={fieldClassFor(!!nameError)}
                  placeholder="Week 5: Path Planning"
                  maxLength={LIMITS.roadmapName.max + 20}
                  aria-invalid={!!nameError}
                />
                <FieldError message={nameError} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Classroom</label>
                {lockClassroom ? (
                  <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-zinc-600 bg-zinc-50">
                    {classroom ? `${classroom.code} — ${classroom.name}` : "Classroom"}
                  </div>
                ) : (
                  <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} className={fieldClass}>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className={quizView ? undefined : "bg-white rounded-xl border border-border overflow-hidden"}>
        <CourseworkSequenceEditor items={items} scenes={scenes} onChange={setItems} onQuizViewChange={setQuizView} />
      </div>

      {!quizView && (
        <>
          {error && <FieldError message={error} />}
          <div className="flex gap-3 flex-wrap">
            <button type="button" className={`${secondaryBtn} w-full sm:w-auto`} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={`${secondaryBtn} sm:ml-auto w-full sm:w-auto`} onClick={() => commit(false)}>
              Save draft
            </button>
            <button type="button" className={`${primaryBtn} w-full sm:w-auto`} onClick={() => commit(true)}>
              Publish
            </button>
          </div>
        </>
      )}
    </div>
  );
}
