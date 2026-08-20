import { useEffect, useRef, useState } from "react";
import {
  Download, Eye, EyeOff, FileSpreadsheet, KeyRound, Plus, Trash2, UserPlus, X,
} from "lucide-react";
import { fieldClass, fieldClassFor, FieldError, primaryBtn } from "./ui";
import {
  downloadTextFile,
  generatePassword,
  parseStudentCsv,
  uid,
} from "./utils";
import { LIMITS, validateCsvFile, validateEmail, validatePassword } from "./validate";

export type StudentDraft = {
  id: string;
  email: string;
  password: string;
  showPassword: boolean;
  error?: string;
};

export function emptyDraft(): StudentDraft {
  return { id: uid("row"), email: "", password: generatePassword(), showPassword: true };
}

export function draftsFromImport(fileText: string): StudentDraft[] {
  return parseStudentCsv(fileText).map((row) => ({
    id: uid("row"),
    email: row.email,
    password: row.password,
    showPassword: true,
    error: row.error,
  }));
}

function validateDraft(row: StudentDraft, emailsInClass: Set<string>, seen: Set<string>): string | undefined {
  const emailErr = validateEmail(row.email);
  if (emailErr) return emailErr;
  const passErr = validatePassword(row.password);
  if (passErr) return passErr;
  const key = row.email.trim().toLowerCase();
  if (emailsInClass.has(key)) return "Already in this classroom";
  if (seen.has(key)) return "Duplicate in this batch";
  seen.add(key);
  return undefined;
}

export function AddStudentsDialog({
  onClose,
  onAdd,
  existingEmails,
  remainingSlots,
}: {
  onClose: () => void;
  onAdd: (rows: { name: string; email: string; password: string }[]) => void;
  existingEmails: string[];
  remainingSlots: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-xl max-h-[min(92dvh,40rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add Students"
      >
        <div className="px-4 sm:px-6 pt-6 pb-4 flex items-start gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <UserPlus size={18} className="text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-zinc-900">Add Students</h3>
            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
              Add manually or import many students from an Excel file. They'll receive an email with their login credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 sm:px-6 pb-6 overflow-y-auto">
          <AddStudentsForm
            existingEmails={existingEmails}
            remainingSlots={remainingSlots}
            submitLabel="Add to Classroom"
            onCancel={onClose}
            onSubmit={(rows) => {
              onAdd(rows);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function AddStudentsForm({
  existingEmails,
  remainingSlots,
  submitLabel,
  onCancel,
  onSubmit,
  extraCancel,
}: {
  existingEmails: string[];
  remainingSlots: number;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (rows: { name: string; email: string; password: string }[]) => void;
  extraCancel?: { label: string; onClick: () => void };
}) {
  const [rows, setRows] = useState<StudentDraft[]>([emptyDraft()]);
  const [fileError, setFileError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inClass = new Set(existingEmails.map((e) => e.toLowerCase()));

  const update = (id: string, patch: Partial<StudentDraft>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: undefined } : r)));
  };

  const validated = () => {
    const seen = new Set<string>();
    return rows.map((r) => ({ ...r, error: validateDraft(r, inClass, seen) }));
  };

  const addAnother = () => {
    if (rows.length >= remainingSlots) return;
    setRows((prev) => [...prev, emptyDraft()]);
  };

  const importFile = (file: File) => {
    setFileError("");
    const fileErr = validateCsvFile(file);
    if (fileErr) {
      setFileError(fileErr);
      return;
    }
    if (remainingSlots <= 0) {
      setFileError("This classroom is full (500 students).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imported = draftsFromImport(String(reader.result || ""));
      if (!imported.length) {
        setFileError("No email rows found. Use columns Email, Password.");
        return;
      }
      const capped = imported.slice(0, remainingSlots);
      if (imported.length > remainingSlots) {
        setFileError(`Only ${remainingSlots} seat${remainingSlots === 1 ? "" : "s"} left. Extra rows were not added.`);
      }
      setRows(capped.length ? capped : [emptyDraft()]);
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (remainingSlots <= 0) {
      setFileError("This classroom is full (500 students).");
      return;
    }
    setSubmitted(true);
    const filled = rows.filter((r) => r.email.trim());
    const working = filled.length ? filled : rows;
    const seen = new Set<string>();
    const next = working.map((r) => ({ ...r, error: validateDraft(r, inClass, seen) }));
    setRows(filled.length ? next : next);
    const ready = next.filter((r) => r.email.trim() && !r.error);
    const hasErrors = next.some((r) => r.error);
    if (!ready.length || hasErrors) {
      if (!filled.length) setRows(rows.map((r, i) => (i === 0 ? { ...r, error: "Email is required" } : r)));
      else setRows(rows.map((r) => next.find((n) => n.id === r.id) ?? r));
      return;
    }
    onSubmit(
      ready.slice(0, remainingSlots).map((r) => ({
        email: r.email.trim(),
        password: r.password.trim(),
        name: r.email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      }))
    );
  };

  const count = rows.length;
  const display = submitted ? validated() : rows;

  return (
    <div className="space-y-5">
      <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Import from Excel</div>
            <p className="text-xs text-zinc-500 mt-0.5">Columns: Email (required), Password (optional)</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex-shrink-0"
            onClick={() =>
              downloadTextFile(
                "pysimverse-students-template.csv",
                "Email,Password\nstudent@example.com,HBNvuhG656\n"
              )
            }
          >
            <Download size={14} />
            Download template
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full bg-white border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-lg py-3 text-sm font-medium text-zinc-800 inline-flex items-center justify-center gap-2"
        >
          <FileSpreadsheet size={16} className="text-zinc-500" />
          Choose Excel or CSV file
        </button>
        {fileError && <FieldError message={fileError} />}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-medium text-zinc-800">
          {count} student{count !== 1 ? "s" : ""} in this batch
        </span>
        <button
          type="button"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          onClick={() => setRows((prev) => prev.map((r) => ({ ...r, password: generatePassword(), error: undefined })))}
        >
          Regenerate all passwords
        </button>
      </div>

      <div className="space-y-3">
        {display.map((row, i) => (
          <div key={row.id} className="bg-zinc-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-800">Student {i + 1}</span>
              {rows.length > 1 && (
                <button
                  type="button"
                  className="text-zinc-400 hover:text-rose-600 p-1"
                  aria-label={`Remove student ${i + 1}`}
                  onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={row.email}
                onChange={(e) => update(row.id, { email: e.target.value })}
                placeholder="student@example.com"
                maxLength={LIMITS.email.max}
                aria-invalid={!!row.error}
                className={`${fieldClassFor(!!row.error)}`}
              />
              <div className="flex sm:w-[16.5rem] flex-shrink-0">
                <input
                  type={row.showPassword ? "text" : "password"}
                  value={row.password}
                  onChange={(e) => update(row.id, { password: e.target.value })}
                  className={`${fieldClass} rounded-r-none border-r-0`}
                  maxLength={LIMITS.password.max}
                  aria-label={`Password for student ${i + 1}`}
                />
                <button
                  type="button"
                  className="px-2.5 border border-border border-l-0 bg-white text-zinc-500 hover:text-zinc-800"
                  aria-label={row.showPassword ? "Hide password" : "Show password"}
                  onClick={() => update(row.id, { showPassword: !row.showPassword })}
                >
                  {row.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  type="button"
                  className="px-2.5 border border-border border-l-0 rounded-r-lg bg-white text-zinc-500 hover:text-zinc-800"
                  aria-label="Regenerate password"
                  onClick={() => update(row.id, { password: generatePassword() })}
                >
                  <KeyRound size={15} />
                </button>
              </div>
            </div>
            {row.error && <p className="text-xs text-rose-600">{row.error}</p>}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addAnother}
        disabled={rows.length >= remainingSlots}
        className="w-full border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 rounded-lg py-3 text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
      >
        <Plus size={16} />
        Add another student
      </button>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Once you save the classroom, students receive an email containing the class name, your name, and their login credentials.
      </p>

      <div className="flex items-center justify-end gap-3 pt-1">
        {extraCancel && (
          <button type="button" className="text-sm font-medium text-zinc-500 hover:text-zinc-800 px-2 py-2" onClick={extraCancel.onClick}>
            {extraCancel.label}
          </button>
        )}
        <button type="button" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={primaryBtn} onClick={handleSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
