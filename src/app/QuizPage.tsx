import { useState } from "react";
import { AlignLeft, ArrowLeft, Code2, ListChecks, Plus, Terminal, Trash2 } from "lucide-react";
import type { QuizItem, QuizQuestion } from "./types";
import { Badge, fieldClass, fieldClassFor, FieldError, CharCount, primaryBtn, secondaryBtn } from "./ui";
import { uid } from "./utils";
import { LIMITS, validateQuizItem } from "./validate";

const TYPE_META = {
  mcq: {
    label: "Multiple choice",
    hint: "Write the question, then click any option (A, B, C…) to mark it as the correct answer.",
    icon: ListChecks,
    bar: "bg-indigo-500",
  },
  short: {
    label: "Short answer",
    hint: "Students type a brief reply. You grade it later.",
    icon: AlignLeft,
    bar: "bg-sky-500",
  },
  "code-output": {
    label: "Predict output",
    hint: "Paste the snippet. Students predict what it prints.",
    icon: Terminal,
    bar: "bg-amber-500",
  },
  "code-write": {
    label: "Write code",
    hint: "Describe what students should write in the sim.",
    icon: Code2,
    bar: "bg-emerald-500",
  },
} as const;

const TYPE_ORDER = ["mcq", "short", "code-output", "code-write"] as const;

function emptyMcqOptions() {
  return [
    { id: uid("o"), text: "", correct: true },
    { id: uid("o"), text: "", correct: false },
    { id: uid("o"), text: "", correct: false },
    { id: uid("o"), text: "", correct: false },
  ];
}

function emptyQuestion(): QuizQuestion {
  return {
    id: uid("q"),
    type: "mcq",
    prompt: "",
    maxPoints: 10,
    options: emptyMcqOptions(),
  };
}

export function QuizPage({
  existing,
  onBack,
  onCommit,
}: {
  existing?: QuizItem;
  onBack: () => void;
  onCommit: (item: QuizItem) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(existing?.questions?.length ? existing.questions : [emptyQuestion()]);
  const [err, setErr] = useState("");

  const updateQ = (id: string, patch: Partial<QuizQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const setType = (id: string, type: QuizQuestion["type"]) => {
    const q = questions.find((x) => x.id === id);
    if (!q) return;
    const patch: Partial<QuizQuestion> = { type };
    if (type === "mcq") {
      const opts = [...(q.options ?? [])];
      while (opts.length < 4) {
        opts.push({ id: uid("o"), text: "", correct: opts.length === 0 });
      }
      if (!opts.some((o) => o.correct)) opts[0] = { ...opts[0], correct: true };
      patch.options = opts;
    }
    updateQ(id, patch);
  };

  const save = () => {
    const issue = validateQuizItem({
      id: existing?.id ?? "new",
      type: "quiz",
      title,
      description,
      questions,
    });
    if (issue) {
      setErr(issue);
      return;
    }
    onCommit({
      id: existing?.id ?? uid("it"),
      type: "quiz",
      title: title.trim(),
      description: description.trim(),
      questions,
      ...(existing?.hiddenFromSim ? { hiddenFromSim: true } : {}),
    });
  };

  const total = questions.reduce((s, q) => s + (Number(q.maxPoints) || 0), 0);

  return (
    <div className="max-w-3xl space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Back to curriculum
      </button>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{existing ? "Edit quiz" : "Add quiz"}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Title, questions, and points. Students take this in the desktop sim after you publish.</p>
        </div>
        <span className="text-sm font-medium text-indigo-700">{total} pts total</span>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErr(""); }}
            className={fieldClassFor(!!err && !title.trim())}
            placeholder="Week 2 Quiz"
            maxLength={LIMITS.quizTitle.max + 20}
            aria-invalid={!!err && !title.trim()}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-zinc-700">Description</label>
            <CharCount value={description} max={LIMITS.quizDescription.max} />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
            placeholder="Short description (optional)"
            maxLength={LIMITS.quizDescription.max + 20}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Questions</h3>
        <span className="text-xs text-zinc-400">{questions.length} question{questions.length === 1 ? "" : "s"}</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <QuestionCard
            key={q.id}
            index={qi}
            question={q}
            canRemove={questions.length > 1}
            onType={(type) => setType(q.id, type)}
            onChange={(patch) => updateQ(q.id, patch)}
            onRemove={() => setQuestions(questions.filter((x) => x.id !== q.id))}
          />
        ))}
        <button
          type="button"
          className="w-full rounded-xl border-2 border-dashed border-zinc-200 py-3.5 text-sm font-medium text-zinc-500 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/40 transition-colors"
          onClick={() => setQuestions([...questions, emptyQuestion()])}
        >
          + Add question
        </button>
      </div>

      {err && <FieldError message={err} />}
      <div className="flex gap-3 flex-wrap">
        <button type="button" className={secondaryBtn} onClick={onBack}>
          Cancel
        </button>
        <button type="button" className={`${primaryBtn} ml-auto`} onClick={save}>
          {existing ? "Save quiz" : "Add quiz"}
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  canRemove,
  onType,
  onChange,
  onRemove,
}: {
  index: number;
  question: QuizQuestion;
  canRemove: boolean;
  onType: (type: QuizQuestion["type"]) => void;
  onChange: (patch: Partial<QuizQuestion>) => void;
  onRemove: () => void;
}) {
  const meta = TYPE_META[question.type];
  const letters = "ABCDEF";

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="flex">
        <div className={`w-1.5 flex-shrink-0 ${meta.bar}`} />
        <div className="min-w-0 flex-1 p-5 space-y-4">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {TYPE_ORDER.map((type) => {
                  const t = TYPE_META[type];
                  const TIcon = t.icon;
                  const on = question.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onType(type)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        on ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <TIcon size={12} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-1.5 bg-zinc-50 border border-border rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Pts</span>
                <input
                  type="number"
                  min={LIMITS.points.min}
                  max={LIMITS.points.max}
                  value={question.maxPoints}
                  onChange={(e) => onChange({ maxPoints: Number(e.target.value) })}
                  className="w-10 bg-transparent text-sm font-semibold text-zinc-900 text-center outline-none"
                  aria-label="Points"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Question <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={question.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
              rows={3}
              className={`${fieldClass} resize-none`}
              placeholder={
                question.type === "mcq"
                  ? "e.g. Which call starts the motors?"
                  : question.type === "short"
                    ? "e.g. Name the import used to create a virtual drone."
                    : question.type === "code-output"
                      ? "e.g. What does this snippet print after takeoff?"
                      : "e.g. Write a loop that hovers for 3 seconds then lands."
              }
              maxLength={LIMITS.prompt.max + 40}
            />
            <p className="text-xs text-zinc-400 mt-1.5">{meta.hint}</p>
          </div>

          {question.type === "short" && (
            <div className="rounded-lg bg-zinc-50 border border-dashed border-zinc-200 px-3 py-2.5 text-xs text-zinc-500">
              Students will type their answer here. You’ll score it in Grading.
            </div>
          )}

          {question.type === "mcq" && (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xs font-medium text-zinc-700">Answer options</div>
                <div className="text-[11px] text-zinc-400">Click an option to mark it correct — not only A</div>
              </div>
              {(question.options ?? []).map((opt, oi) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                    opt.correct ? "border-emerald-300 bg-emerald-50" : "border-border bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        options: (question.options ?? []).map((o) => ({ ...o, correct: o.id === opt.id })),
                      })
                    }
                    className={`w-8 h-8 rounded-full text-xs font-semibold flex-shrink-0 ${
                      opt.correct ? "bg-emerald-600 text-white" : "bg-white text-zinc-500 border border-border hover:border-emerald-400"
                    }`}
                    aria-label={`Mark option ${letters[oi]} as the correct answer`}
                    aria-pressed={opt.correct}
                  >
                    {letters[oi]}
                  </button>
                  <input
                    value={opt.text}
                    onChange={(e) =>
                      onChange({
                        options: (question.options ?? []).map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)),
                      })
                    }
                    className="flex-1 min-w-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                    placeholder={`Option ${letters[oi]}`}
                    maxLength={LIMITS.option.max + 10}
                  />
                  {opt.correct ? (
                    <Badge label="Correct" variant="green" />
                  ) : (
                    <button
                      type="button"
                      className="text-[11px] font-medium text-zinc-400 hover:text-emerald-700 whitespace-nowrap"
                      onClick={() =>
                        onChange({
                          options: (question.options ?? []).map((o) => ({ ...o, correct: o.id === opt.id })),
                        })
                      }
                    >
                      Mark correct
                    </button>
                  )}
                  {(question.options ?? []).length > 2 && (
                    <button
                      type="button"
                      className="p-1.5 text-zinc-400 hover:text-rose-600"
                      aria-label="Remove option"
                      onClick={() =>
                        onChange({
                          options: (question.options ?? []).filter((o) => o.id !== opt.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              {(question.options ?? []).length < 6 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  onClick={() =>
                    onChange({ options: [...(question.options ?? []), { id: uid("o"), text: "", correct: false }] })
                  }
                >
                  <Plus size={12} /> Add option
                </button>
              )}
            </div>
          )}

          {question.type === "code-output" && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Code snippet</label>
              <textarea
                value={question.code ?? ""}
                onChange={(e) => onChange({ code: e.target.value })}
                rows={5}
                className={`${fieldClass} resize-none font-mono text-xs bg-zinc-950 text-zinc-100 border-zinc-800`}
                placeholder={"from pysimverse import Drone\nd = Drone()\nd.takeoff()\nprint(round(d.alt, 1))"}
                maxLength={LIMITS.code.max}
              />
            </div>
          )}

          {canRemove && (
            <div className="pt-3 border-t border-border">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700"
                onClick={onRemove}
              >
                <Trash2 size={14} /> Remove question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

