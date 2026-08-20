import { useRef, useState } from "react";
import { HelpCircle, Mail } from "lucide-react";
import type { Profile } from "./types";
import { Avatar, Badge, Modal, fieldClass, fieldClassFor, FieldError, primaryBtn, secondaryBtn, dangerBtn } from "./ui";
import { SUPPORT_EMAIL, downloadTextFile, initialsFromName } from "./utils";
import { LIMITS, validateDisplayName, validateEmail, validatePassword, validatePhotoFile } from "./validate";

const INVOICES = [
  { id: "inv-aug", date: "Aug 1, 2026", plan: "Pro", amount: "$49.00", status: "Paid" },
  { id: "inv-jul", date: "Jul 1, 2026", plan: "Pro", amount: "$49.00", status: "Paid" },
  { id: "inv-jun", date: "Jun 1, 2026", plan: "Pro", amount: "$49.00", status: "Paid" },
];

export function SettingsPage({
  profile,
  onSave,
  onSignOut,
  showToast,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
  onSignOut: () => void;
  showToast: (msg: string) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [notifySubmissions, setNotifySubmissions] = useState(profile.notifySubmissions);
  const [notifyActivity, setNotifyActivity] = useState(profile.notifyActivity);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [billingEmail, setBillingEmail] = useState(profile.billingEmail);
  const [cardBrand, setCardBrand] = useState(profile.cardBrand);
  const [cardLast4, setCardLast4] = useState(profile.cardLast4);
  const [cardExp, setCardExp] = useState(profile.cardExp);
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passErrors, setPassErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [billingEmailError, setBillingEmailError] = useState<string | undefined>();
  const [cardModal, setCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpInput, setCardExpInput] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardError, setCardError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const snapshot = (extra: Partial<Profile> = {}): Profile => ({
    name: name.trim() || profile.name,
    email: email.trim() || profile.email,
    photoUrl,
    notifySubmissions,
    notifyActivity,
    billingEmail: billingEmail.trim() || profile.billingEmail,
    cardBrand,
    cardLast4,
    cardExp,
    ...extra,
  });

  const save = () => {
    const nameErr = validateDisplayName(name);
    const emailErr = validateEmail(email);
    setErrors({ name: nameErr, email: emailErr });
    if (nameErr || emailErr) return;
    onSave(snapshot({ name: name.trim(), email: email.trim() }));
    showToast("Settings saved");
  };

  const savePassword = () => {
    const currentErr = currentPassword.trim() ? undefined : "Current password is required";
    const nextErr = validatePassword(newPassword);
    const confirmErr = confirmPassword !== newPassword ? "Passwords do not match" : undefined;
    setPassErrors({ current: currentErr, next: nextErr, confirm: confirmErr });
    if (currentErr || nextErr || confirmErr) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassErrors({});
    showToast("Password updated");
  };

  const saveBilling = () => {
    const err = validateEmail(billingEmail);
    setBillingEmailError(err);
    if (err) return;
    const next = snapshot({ billingEmail: billingEmail.trim() });
    onSave(next);
    showToast("Billing details saved");
  };

  const saveCard = () => {
    const digits = cardNumber.replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(digits)) {
      setCardError("Enter a valid card number");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpInput.trim())) {
      setCardError("Expiry must be MM/YY");
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvc.trim())) {
      setCardError("Enter a valid CVC");
      return;
    }
    const last4 = digits.slice(-4);
    const brand = digits.startsWith("4") ? "Visa" : digits.startsWith("5") ? "Mastercard" : "Card";
    setCardBrand(brand);
    setCardLast4(last4);
    setCardExp(cardExpInput.trim());
    onSave(snapshot({ cardBrand: brand, cardLast4: last4, cardExp: cardExpInput.trim() }));
    setCardModal(false);
    setCardNumber("");
    setCardExpInput("");
    setCardCvc("");
    setCardError("");
    showToast("Payment method updated");
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-white rounded-xl border border-border p-4 sm:p-6 space-y-5">
        <h3 className="text-sm font-semibold text-zinc-900">Profile</h3>
        <div className="flex items-center gap-4">
          <Avatar initials={initialsFromName(name)} size="lg" photoUrl={photoUrl} />
          <div>
            <div className="text-sm font-medium text-zinc-700">Profile photo</div>
            <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 mt-0.5" onClick={() => fileRef.current?.click()}>
              Update photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const err = validatePhotoFile(file);
                if (err) {
                  showToast(err);
                  return;
                }
                setPhotoUrl(URL.createObjectURL(file));
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Display name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
            className={fieldClassFor(!!errors.name)}
            maxLength={LIMITS.className.max + 10}
            aria-invalid={!!errors.name}
          />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
            className={fieldClassFor(!!errors.email)}
            maxLength={LIMITS.email.max}
            aria-invalid={!!errors.email}
          />
          <FieldError message={errors.email} />
        </div>
        <button type="button" className={primaryBtn} onClick={save}>Save changes</button>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">Change password</h3>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setPassErrors((p) => ({ ...p, current: undefined })); }}
            className={fieldClassFor(!!passErrors.current)}
            maxLength={LIMITS.password.max}
            autoComplete="current-password"
          />
          <FieldError message={passErrors.current} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPassErrors((p) => ({ ...p, next: undefined })); }}
            className={fieldClassFor(!!passErrors.next)}
            maxLength={LIMITS.password.max}
            autoComplete="new-password"
          />
          <FieldError message={passErrors.next} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setPassErrors((p) => ({ ...p, confirm: undefined })); }}
            className={fieldClassFor(!!passErrors.confirm)}
            maxLength={LIMITS.password.max}
            autoComplete="new-password"
          />
          <FieldError message={passErrors.confirm} />
        </div>
        <button type="button" className={primaryBtn} onClick={savePassword}>Update password</button>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">Billing</h3>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-medium text-zinc-800">Payment method</div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {cardBrand} ···· {cardLast4} · Exp {cardExp}
            </div>
          </div>
          <button type="button" className={secondaryBtn} onClick={() => { setCardError(""); setCardModal(true); }}>
            Update card
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Billing email</label>
          <input
            type="email"
            value={billingEmail}
            onChange={(e) => { setBillingEmail(e.target.value); setBillingEmailError(undefined); }}
            className={fieldClassFor(!!billingEmailError)}
            maxLength={LIMITS.email.max}
          />
          <FieldError message={billingEmailError} />
        </div>
        <button type="button" className={primaryBtn} onClick={saveBilling}>Save billing</button>
        <div className="pt-2 border-t border-border">
          <div className="text-xs font-medium text-zinc-700 mb-2">Invoices</div>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="px-3 py-2.5 flex items-center gap-3 bg-white">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-zinc-800">{inv.date}</div>
                  <div className="text-xs text-zinc-400">{inv.plan} · {inv.amount}</div>
                </div>
                <Badge label={inv.status} variant="green" />
                <button
                  type="button"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  onClick={() => {
                    downloadTextFile(`${inv.id}.txt`, `PySimverse invoice\n${inv.date}\n${inv.plan}\n${inv.amount}\n${inv.status}\n`);
                    showToast("Invoice downloaded");
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
        {[
          { label: "New submissions", sub: "When students submit from the desktop sim", value: notifySubmissions, set: setNotifySubmissions },
          { label: "Classroom activity", sub: "Invites accepted and roster changes", value: notifyActivity, set: setNotifyActivity },
        ].map((t) => (
          <div key={t.label} className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-800">{t.label}</div>
              <div className="text-xs text-zinc-400">{t.sub}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={t.value}
              onClick={() => t.set(!t.value)}
              className={`relative flex-shrink-0 w-10 h-6 rounded-full ${t.value ? "bg-indigo-600" : "bg-zinc-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow ${t.value ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-800">Sign out</div>
          <div className="text-xs text-zinc-400">End this instructor session</div>
        </div>
        <button type="button" className={dangerBtn} onClick={() => setConfirm(true)}>Sign out</button>
      </div>

      {confirm && (
        <Modal title="Sign out?" onClose={() => setConfirm(false)}>
          <p className="text-sm text-zinc-600">This preview will stay open. Refresh the page to reset demo data.</p>
          <div className="flex gap-3">
            <button type="button" className={`${secondaryBtn} flex-1`} onClick={() => setConfirm(false)}>Cancel</button>
            <button
              type="button"
              className={`${dangerBtn} flex-1 bg-rose-600 text-white border-rose-600 hover:bg-rose-700`}
              onClick={() => { setConfirm(false); onSignOut(); }}
            >
              Sign out
            </button>
          </div>
        </Modal>
      )}

      {cardModal && (
        <Modal title="Update payment method" onClose={() => setCardModal(false)}>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Card number</label>
            <input
              value={cardNumber}
              onChange={(e) => { setCardNumber(e.target.value); setCardError(""); }}
              className={fieldClass}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Expiry</label>
              <input
                value={cardExpInput}
                onChange={(e) => { setCardExpInput(e.target.value); setCardError(""); }}
                className={fieldClass}
                placeholder="08/27"
                autoComplete="cc-exp"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">CVC</label>
              <input
                value={cardCvc}
                onChange={(e) => { setCardCvc(e.target.value); setCardError(""); }}
                className={fieldClass}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </div>
          </div>
          <FieldError message={cardError} />
          <div className="flex gap-3">
            <button type="button" className={`${secondaryBtn} flex-1`} onClick={() => setCardModal(false)}>Cancel</button>
            <button type="button" className={`${primaryBtn} flex-1`} onClick={saveCard}>Save card</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const FAQS = [
  { q: "Where do students submit work?", a: "In the PySimverse desktop simulator, not on the web. This portal is for instructors only." },
  { q: "What is curriculum?", a: "The list of work for one class, in order. Teaching is practice in the sim, an assessment is graded with a due date, and a quiz is questions you write. Publish so students see it. Use the eye to hide an item without deleting it." },
  { q: "How do I add a class?", a: "Dashboard → New Classroom. Step 1 is details, step 2 adds students, step 3 selects the class curriculum (copy from another class or pick missions)." },
  { q: "How do I hide work from students?", a: "In Curriculum → Edit, click the eye on an item. Hidden items stay in your plan but do not show in the desktop sim until you click the eye again." },
  { q: "Where are student grades?", a: "Open a class → Students. The roster and published scores are in one table. Search by name, export CSV, and View opens that work in Grading." },
  { q: "Where are class reports?", a: "Open a class → Reports. That tab is facts for this classroom only: roster, completion, scores, and who needs attention. Export CSV from there." },
  { q: "Can I import Excel?", a: "Download the template, fill Email (required) and Password (optional), then upload CSV. Max 500 students per class." },
];

export function HelpPage() {
  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Help</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Short answers for the teaching loop. Still stuck? Email us.</p>
      </div>
      <div className="bg-white rounded-xl border border-border divide-y divide-border">
        {FAQS.map((f) => (
          <div key={f.q} className="px-4 sm:px-5 py-4">
            <div className="text-sm font-medium text-zinc-900">{f.q}</div>
            <p className="text-sm text-zinc-500 mt-1">{f.a}</p>
          </div>
        ))}
      </div>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className={`${primaryBtn} w-full h-auto whitespace-normal text-center`}
      >
        <Mail size={15} /> Email {SUPPORT_EMAIL}
      </a>
      <p className="text-xs text-zinc-400 flex items-center gap-1.5">
        <HelpCircle size={12} /> Keyboard: in Grading, use ← and → to move between students.
      </p>
    </div>
  );
}
