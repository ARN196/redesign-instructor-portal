import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Settings, Menu, Bell, X, HelpCircle, LogOut,
} from "lucide-react";
import lockup from "../assets/pysimverse-lockup.png";
import type { Activity, Classroom, Grade, NotificationItem, Page, Profile, Roadmap, Student, Submission } from "./types";
import {
  INITIAL_ACTIVITY, INITIAL_CLASSROOMS, INITIAL_GRADES, INITIAL_NOTIFICATIONS,
  INITIAL_PROFILE, INITIAL_ROADMAPS, INITIAL_STUDENTS, INITIAL_SUBMISSIONS, SCENES,
} from "./data";
import { Avatar, Toast } from "./ui";
import { formatToday, initialsFromName, uid } from "./utils";
import { ClassroomsPage } from "./ClassroomsPage";
import { RoadmapsPage } from "./RoadmapsPage";
import { GradingPage } from "./GradingPage";
import { HelpPage, SettingsPage } from "./SettingsHelp";

type ClassroomTab = "students" | "roadmaps" | "grades" | "reports";

function BrandMark() {
  return (
    <span className="block min-w-0">
      <img src={lockup} alt="" className="w-full h-auto object-contain object-left" />
      <span className="block text-right text-[#46AEEC] text-[16px] font-extrabold tracking-[0.28em] leading-none mt-1.5 uppercase">
        Campus
      </span>
    </span>
  );
}

const TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  classrooms: "Dashboard",
  roadmaps: "Curriculum",
  grading: "Grading",
  gradebook: "Gradebook",
  reports: "Reports",
  settings: "Settings",
  help: "Help",
};

export default function App() {
  const [page, setPage] = useState<Page>("classrooms");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>(INITIAL_CLASSROOMS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(INITIAL_ROADMAPS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [grades, setGrades] = useState<Grade[]>(INITIAL_GRADES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activity, setActivity] = useState<Activity[]>(INITIAL_ACTIVITY);
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [roadmapClassroomId, setRoadmapClassroomId] = useState<string | undefined>();
  const [editRoadmapId, setEditRoadmapId] = useState<string | undefined>();
  const [restoreClassroom, setRestoreClassroom] = useState<{
    id: string;
    tab: ClassroomTab;
  } | undefined>();
  const [gradeFocus, setGradeFocus] = useState<{ studentId?: string; assignment?: string; classroomId: string } | null>(null);
  const [listEpoch, setListEpoch] = useState(0);
  const [classroomTitle, setClassroomTitle] = useState("Dashboard");
  const [activeClassroomId, setActiveClassroomId] = useState<string | undefined>();
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const firstName = profile.name.split(/\s+/)[0] || "there";
  const unread = notifications.filter((n) => !n.read).length;

  const openClassGrading = (classroomId: string, studentId?: string, assignment?: string) => {
    setGradeFocus({ classroomId, studentId, assignment });
    setRestoreClassroom({ id: classroomId, tab: "grades" });
    go("classrooms");
  };

  const goDashboard = () => {
    setRestoreClassroom(undefined);
    setListEpoch((n) => n + 1);
    go("classrooms");
  };

  const go = (p: Page) => {
    if (p === "grading") {
      const classroomId = gradeFocus?.classroomId ?? submissions[0]?.classroomId ?? classrooms[0]?.id;
      if (classroomId) {
        setRestoreClassroom({ id: classroomId, tab: "grades" });
      }
      setPage("classrooms");
      setSidebarOpen(false);
      return;
    }
    if (p === "reports") {
      const classroomId = activeClassroomId ?? classrooms[0]?.id;
      if (classroomId) setRestoreClassroom({ id: classroomId, tab: "reports" });
      setPage("classrooms");
      setSidebarOpen(false);
      return;
    }
    if (p === "gradebook") {
      const classroomId = activeClassroomId ?? grades[0]?.classroomId ?? classrooms[0]?.id;
      if (classroomId) setRestoreClassroom({ id: classroomId, tab: "students" });
      setPage("classrooms");
      setSidebarOpen(false);
      return;
    }
    setPage(p === "dashboard" ? "classrooms" : p);
    setSidebarOpen(false);
  };

  const handleInvite = (classroomId: string, incoming: { name: string; email: string }[]) => {
    const existing = new Set(
      students.filter((s) => s.classroomId === classroomId).map((s) => s.email.toLowerCase())
    );
    const room = students.filter((s) => s.classroomId === classroomId).length;
    const cap = Math.max(0, 500 - room);
    let added = 0;
    let skipped = 0;
    const next: Student[] = [];
    for (const row of incoming) {
      if (added >= cap) { skipped += 1; continue; }
      if (existing.has(row.email.toLowerCase())) { skipped += 1; continue; }
      existing.add(row.email.toLowerCase());
      next.push({
        id: uid("st"),
        classroomId,
        name: row.name,
        email: row.email,
        initials: initialsFromName(row.name),
        status: "invited",
      });
      added += 1;
    }
    if (next.length) setStudents((prev) => [...prev, ...next]);
    return { added, skipped };
  };

  const handleSaveRoadmap = (roadmap: Roadmap, publish: boolean) => {
    setRoadmaps((prev) => {
      const forClass = prev.find((r) => r.classroomId === roadmap.classroomId);
      if (forClass) {
        return prev.map((r) => (r.id === forClass.id ? { ...roadmap, id: forClass.id } : r));
      }
      return [roadmap, ...prev];
    });
    if (publish) {
      setActivity((prev) => [
        { id: uid("a"), text: `Published “${roadmap.name}”`, time: "Just now", tag: "Published" },
        ...prev,
      ]);
    } else {
      setActivity((prev) => [
        { id: uid("a"), text: `Saved draft “${roadmap.name}”`, time: "Just now", tag: "Draft" },
        ...prev,
      ]);
    }
  };

  const handleGrade: React.ComponentProps<typeof GradingPage>["onGrade"] = (payload) => {
    const grade: Grade = {
      id: uid("g"),
      submissionId: payload.submissionId,
      studentId: payload.studentId,
      classroomId: payload.classroomId,
      item: payload.assignment,
      type: payload.type,
      score: payload.score,
      max: payload.max,
      feedback: payload.feedback || undefined,
      perQuestion: payload.perQuestion,
      graded: formatToday(),
      code: payload.code,
      videoUrl: payload.videoUrl,
      sceneName: payload.sceneName,
    };
    setGrades((prev) => [grade, ...prev]);
    if (payload.submissionId) {
      setSubmissions((prev) => prev.filter((s) => s.id !== payload.submissionId));
    }
    const st = students.find((s) => s.id === payload.studentId);
    setActivity((prev) => [
      { id: uid("a"), text: `Graded ${st?.name ?? "student"} — ${payload.assignment}`, time: "Just now", tag: "Graded" },
      ...prev,
    ]);
  };

  const dashboardActive = page === "classrooms" || page === "dashboard" || page === "roadmaps";

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-[min(15rem,85vw)] bg-zinc-900 flex flex-col z-30 transition-transform duration-200 pt-[env(safe-area-inset-top)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="relative flex-shrink-0 px-3 pt-5 pb-4 border-b border-white/[0.07]">
          <button type="button" onClick={() => setSidebarOpen(false)} className="absolute top-2 right-2 text-zinc-500 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
          <button
            type="button"
            onClick={goDashboard}
            className="block w-full text-left"
            aria-label="PySimverse Campus"
          >
            <BrandMark />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <button
            type="button"
            onClick={goDashboard}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${dashboardActive ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
          >
            <LayoutDashboard size={16} className="flex-shrink-0" />
            <span className="flex-1 text-left">Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => go("help")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${page === "help" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
          >
            <HelpCircle size={16} className="flex-shrink-0" />
            <span className="flex-1 text-left">Help</span>
          </button>
          <button
            type="button"
            onClick={() => go("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${page === "settings" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
          >
            <Settings size={16} className="flex-shrink-0" />
            <span className="flex-1 text-left">Settings</span>
          </button>
        </nav>
        <div className="border-t border-white/[0.07] px-3 py-3">
          <button
            type="button"
            onClick={() => go("settings")}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-zinc-800 transition-colors"
          >
            <Avatar initials={initialsFromName(profile.name)} size="sm" photoUrl={profile.photoUrl} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{profile.name}</div>
              <div className="text-xs text-zinc-500 truncate">{profile.email}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => showToast("Signed out (demo) — refresh to reset")}
            className="w-full flex items-center gap-3 px-3 py-2 mt-0.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <LogOut size={16} className="flex-shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={page === "classrooms" || page === "dashboard" ? classroomTitle : TITLES[page]}
          firstName={firstName}
          profile={profile}
          unread={unread}
          notifications={notifications}
          onMenu={() => setSidebarOpen(true)}
          onOpenNotif={(n) => {
            setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
            if (n.link === "grading") {
              const sub = submissions.find((s) => n.body.includes(s.assignment));
              const st = students.find((s) => n.body.includes(s.name));
              const classroomId = sub?.classroomId ?? st?.classroomId ?? classrooms[0]?.id;
              if (classroomId) {
                openClassGrading(classroomId, sub?.studentId ?? st?.id, sub?.assignment);
                return;
              }
            }
            go(n.link);
          }}
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          onSettings={() => go("settings")}
          onHelp={() => go("help")}
          onSignOut={() => showToast("Signed out (demo) — refresh to reset")}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 lg:px-7 lg:pt-4 lg:pb-7">
          {(page === "classrooms" || page === "dashboard") && (
            <ClassroomsPage
              classrooms={classrooms}
              students={students}
              roadmaps={roadmaps}
              submissions={submissions}
              grades={grades}
              restoreClassroom={restoreClassroom}
              listEpoch={listEpoch}
              onTitle={setClassroomTitle}
              onActiveClassroom={setActiveClassroomId}
              onConsumedRestore={() => setRestoreClassroom(undefined)}
              onCreate={(c) => setClassrooms((prev) => [c, ...prev])}
              onInvite={handleInvite}
              onDelete={(id) => {
                setClassrooms((prev) => prev.filter((c) => c.id !== id));
                setStudents((prev) => prev.filter((s) => s.classroomId !== id));
                setRoadmaps((prev) => prev.filter((r) => r.classroomId !== id));
              }}
              onOpenRoadmap={(classroomId, roadmapId) => {
                const existing = roadmaps.find((r) => r.classroomId === classroomId);
                setRoadmapClassroomId(classroomId);
                setEditRoadmapId(roadmapId || existing?.id);
                go("roadmaps");
              }}
              onSaveRoadmap={handleSaveRoadmap}
              onNav={go}
              onGrade={handleGrade}
              gradeFocus={gradeFocus}
              onConsumedFocus={() => setGradeFocus(null)}
              showToast={showToast}
            />
          )}
          {page === "roadmaps" && (
            <RoadmapsPage
              roadmaps={roadmaps}
              classrooms={classrooms}
              scenes={SCENES}
              classroomId={roadmapClassroomId}
              editId={editRoadmapId}
              onBack={() => {
                if (roadmapClassroomId) setRestoreClassroom({ id: roadmapClassroomId, tab: "roadmaps" });
                setEditRoadmapId(undefined);
                go("classrooms");
              }}
              onSave={(roadmap, publish) => {
                handleSaveRoadmap(roadmap, publish);
                setRestoreClassroom({ id: roadmap.classroomId, tab: "roadmaps" });
                setEditRoadmapId(undefined);
                go("classrooms");
              }}
              showToast={showToast}
            />
          )}
          {page === "settings" && (
            <SettingsPage
              profile={profile}
              onSave={setProfile}
              onSignOut={() => showToast("Signed out (demo) — refresh to reset")}
              showToast={showToast}
            />
          )}
          {page === "help" && <HelpPage />}
        </main>
      </div>
      <Toast message={toast} />
    </div>
  );
}

function Header({
  title,
  firstName,
  profile,
  unread,
  notifications,
  onMenu,
  onOpenNotif,
  onMarkAllRead,
  onSettings,
  onHelp,
  onSignOut,
}: {
  title: string;
  firstName: string;
  profile: Profile;
  unread: number;
  notifications: NotificationItem[];
  onMenu: () => void;
  onOpenNotif: (n: NotificationItem) => void;
  onMarkAllRead: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onSignOut: () => void;
}) {
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setBellOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="flex items-center gap-3 px-3 sm:px-6 bg-white border-b border-border flex-shrink-0 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]">
      <button type="button" onClick={onMenu} className="lg:hidden text-zinc-500 hover:text-zinc-900 flex-shrink-0" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <span className="text-sm font-semibold text-zinc-900 truncate min-w-0">{title}</span>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2" ref={wrap}>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setBellOpen((v) => !v); setProfileOpen(false); }}
            className="relative p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white border border-border rounded-xl shadow-lg z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900">Notifications</span>
                {unread > 0 && (
                  <button type="button" className="text-xs text-indigo-600" onClick={onMarkAllRead}>Mark all read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-sm text-zinc-400 text-center">You're all caught up.</div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => { onOpenNotif(n); setBellOpen(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-zinc-50 ${n.read ? "opacity-60" : ""}`}
                    >
                      <div className="text-sm font-medium text-zinc-900">{n.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{n.body}</div>
                      <div className="text-xs text-zinc-400 mt-1">{n.time}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100"
            aria-label="Profile menu"
          >
            <Avatar initials={initialsFromName(profile.name)} size="sm" photoUrl={profile.photoUrl} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-lg z-40 py-1">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-sm font-medium text-zinc-900 truncate">{profile.name}</div>
                <div className="text-xs text-zinc-400 truncate">{profile.email}</div>
              </div>
              <button type="button" className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" onClick={() => { setProfileOpen(false); onSettings(); }}>
                Settings
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" onClick={() => { setProfileOpen(false); onHelp(); }}>
                Help
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2" onClick={() => { setProfileOpen(false); onSignOut(); }}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      <span className="sr-only">{firstName}</span>
    </header>
  );
}
