import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

export function Avatar({
  initials,
  size = "md",
  photoUrl,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  photoUrl?: string | null;
}) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };
  const palette = AVATAR_PALETTES[initials.charCodeAt(0) % AVATAR_PALETTES.length];
  if (photoUrl) {
    return <img src={photoUrl} alt="" className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sizes[size]} ${palette} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

type BadgeVariant = "green" | "amber" | "blue" | "gray" | "rose" | "indigo";
const BADGE_STYLES: Record<BadgeVariant, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  gray: "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
  rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
};

export function Badge({ label, variant }: { label: string; variant: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${BADGE_STYLES[variant]}`}>
      {label}
    </span>
  );
}

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  labelFn,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelFn?: (v: T) => string;
}) {
  return (
    <div className="flex bg-zinc-100 rounded-lg p-0.5 flex-shrink-0">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${value === opt ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          {labelFn ? labelFn(opt) : opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
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
        className={`bg-white rounded-t-2xl sm:rounded-2xl w-full shadow-xl p-4 sm:p-6 space-y-5 max-h-[min(92dvh,40rem)] overflow-y-auto ${wide ? "max-w-lg" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg max-w-[min(90vw,28rem)] text-center mb-[env(safe-area-inset-bottom)]">
      {message}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-14 text-center px-6">
      <Icon size={28} className="text-zinc-200 mx-auto mb-3" />
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      <p className="text-sm text-zinc-400 mt-1">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const fieldClass =
  "w-full min-w-0 px-3 py-2.5 border border-border rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white";

export function fieldClassFor(invalid?: boolean) {
  return invalid
    ? `${fieldClass} border-rose-300 focus:border-rose-400 focus:ring-rose-200`
    : fieldClass;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-600 mt-1.5" role="alert">
      {message}
    </p>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`text-xs tabular-nums ${over ? "text-rose-600" : "text-zinc-400"}`}>
      {value.length}/{max}
    </span>
  );
}

export const primaryBtn =
  "inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap";

export const secondaryBtn =
  "inline-flex items-center justify-center gap-1.5 border border-border text-zinc-700 hover:bg-zinc-50 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap";

export const dangerBtn =
  "inline-flex items-center justify-center gap-1.5 text-rose-600 border border-rose-200 hover:bg-rose-50 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap";
