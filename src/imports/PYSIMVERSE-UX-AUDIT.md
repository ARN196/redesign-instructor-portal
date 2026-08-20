# PySimverse — Product & UX Audit for Figma Redesign

**Source:** frontend codebase (`pysimver-frontend`), React SPA  
**Date:** August 12, 2026  
**Purpose:** Single source of truth for a full redesign in Figma Make

---

## 1. App Overview

### What the app does

**PySimverse** is a Python-driven drone physics simulator by **Computer Vision Zone**. Users write Python (`from pysimverse import Drone`) and fly a virtual drone in a high-fidelity physics engine. The core product is a **desktop launcher** (Windows + macOS). This web app is the marketing site, account layer, payments, tutorials/LMS, ops console, and an instructor classroom portal.

The SPA has four product surfaces that currently look and behave like four different products:

1. **Public marketing + consumer account** — landing, auth, Stripe Pro checkout, account dashboard, tutorials player
2. **Ops Admin (`/pysim-ops`)** — user management, scene catalog, release uploads, email campaigns, competitions, orders, maintenance
3. **LMS Admin (`/lms-admin`)** — course CRUD, LMS users, analytics
4. **Instructor Portal (`/instructor`)** — classrooms, roadmaps (missions + quizzes), grading, gradebook, reports

Students in classrooms are expected to use the **Unity/desktop sim**, not a web classroom. Web tutorials are a separate published-course gallery.

### Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, React Router 7 |
| Build | Vite 7 (TypeScript config present; app is mostly JSX) |
| State | Redux Toolkit — **only an `auth` slice**. Everything else is local component state |
| HTTP | Axios (`withCredentials: true`), cookie + `pysimverse_jwt` |
| Payments | Stripe Checkout (hosted redirect, not in-app Payment Element) |
| CSS | Tailwind v4 + custom CSS (`LMS.css`, `CourseBuilder.css`, `userPanel.css`) + MUI 7 + Emotion |
| Editors | TipTap (lesson HTML, email compose), Prism + `react-simple-code-editor` |
| Charts | Chart.js / react-chartjs-2 |
| Alerts | SweetAlert2, react-hot-toast, react-confirm-alert |
| Other | AOS, reCAPTCHA v3, `@hello-pangea/dnd`, xlsx, date-fns, react-icons, MUI icons |

**API base:** `VITE_API_URL` or production DigitalOcean backend; Vite proxies `/api` → `localhost:5000` in dev.

### Target user roles

| Role | Who | Access |
|---|---|---|
| **Guest** | Unauthenticated visitor | Landing, auth, terms, tutorials gallery, LMS player, maintenance |
| **User (Free)** | Signed-up consumer | Account, download launcher, 3 levels / basic missions (enforced in desktop app) |
| **User (Pro)** | Paid lifetime | Same web UI + Pro badge; desktop unlocks all levels, competitions, multi-drone, live sessions |
| **Admin** | Platform operator | `/pysim-ops/*` and `/lms-admin/*` after `verifyAdmin` |
| **Teacher** | Institutional instructor | Intended for `/instructor`; **portal is currently not auth-gated** |
| **Student** | Institutional learner | Created via classroom invites; **no student web portal** in this frontend |

Tiers: **Free** / **Pro** (`accessLevel`; legacy `access === true` = Pro).  
Status: **Verified** / **Unverified**.  
Institutional: **Teacher** / **Student** (separate from platform role).

---

## 2. Full Page / Route Inventory

Admin slug defaults to `/pysim-ops` (`VITE_ADMIN_BASE_PATH`). Catch-all `*` redirects to `/`.

### Public & consumer

| URL | Purpose | Primary components |
|---|---|---|
| `/` | Marketing landing | `Header`, `PageIllustration`, `Hero`, `Deployments`, `Demos`, `FeaturesPlanet`, `DownloadCTA`, `Pricing`, admin `Footer` |
| `/signin` | Log in | `SignInPage` → `AuthLayout` + sign-in form |
| `/signup` | Register + email OTP | `SignUpPage` → `AuthLayout` + `SignUpComponent` |
| `/forgot-password` | Request reset email | `ForgotPasswordPage` |
| `/reset-password?token=&email=` | Set new password | `ResetPasswordPage` |
| `/terms` | Terms & privacy | `TermsAndPrivacyPage` + landing `Footer` |
| `/account-settings` | Account dashboard | `AccountSettings` (MUI AppBar + cards). **Not auth-gated** |
| `/home` | Protected alias of account | Same `AccountSettings` if authenticated; else `/signin` |
| `/checkout` | Stripe session redirect | `Checkout` (status text only). **Not auth-gated** |
| `/payment-success?session_id=` | Post-purchase confirmation | `PaymentSuccess` |
| `/invoices` | Invoice list | `Invoice`. **Not auth-gated**; demo-mode fallback |
| `/tutorials` | Published course gallery | `CourseGallery` |
| `/lms?courseId=&lessonId=` | Lesson player | `CourseLessonPage` |
| `/maintenance` | Site lockout screen | `MaintenancePage` |

**Dead / unused:** `src/pages/Home.jsx` (old “PyVisual” editor) is not mounted.

### Ops Admin (`isAuthenticated && effectiveIsAdmin`)

| URL | Purpose | Components |
|---|---|---|
| `/pysim-ops/` | Single-page ops console | `Dashboard` = `Header` + `Sidebar` + panel from `activePage` state (**not URL**) |
| `/pysim-ops/course-builder` | New course | `CourseBuilder` |
| `/pysim-ops/course-builder/:courseId` | Edit course | `CourseBuilder` |
| `/pysim-ops/course-preview/:courseId` | Preview unpublished | `CoursePreview` → `CourseLessonPage allowUnpublished` |

Unauthenticated → `/signin`. Authenticated non-admin → `/home`.

**Dashboard panels (sidebar, no unique URL):** home analytics, user panel, per-scene access, player progress, add scene, scene stats, bundle/catalog/build/launcher/versions/installer uploads, email (4 tabs), competition manage/leaderboard/gallery, orders, sales history, ad banner, maintenance.

### LMS Admin (`isAuthenticated && effectiveIsAdmin`)

| URL | Purpose | Components |
|---|---|---|
| `/lms-admin` | LMS dashboard | `LMSAdminLayout` + `LMSDashboard` (`LMSStatCards`, `UserGrowthChart`, `RecentCourseActivity`, `NewUsersList`) |
| `/lms-admin/courses` | Course list | `CourseManagement` → `CourseTable` |
| `/lms-admin/courses/edit/:courseId` | Edit in LMS chrome | `CourseBuilder lmsMode={true}` |
| `/lms-admin/users` | LMS users | `UserManagement` |
| `/lms-admin/analytics` | Analytics (reused admin widgets) | `LMSAnalytics` |
| `/lms-admin/settings` | Branding placeholder + logout | `LMSSettings` |

### Instructor (currently public — “frontend preview”)

| URL | Purpose | Components |
|---|---|---|
| `/instructor` | Instructor home | `InstructorLayout` + `Dashboard` |
| `/instructor/classrooms` | Classroom grid; `?new=1` create | `Classrooms` / `CreateClassroomView` |
| `/instructor/roadmaps` | Roadmap builder; `?roadmapId=` edit | `Roadmaps` |
| `/instructor/grading` | Grading slideshow | `GradingSession` (`?classroomId`, `studentId`, `submissionId`) |
| `/instructor/grading/:assignmentId` | Legacy redirect | `RedirectToGrading` |
| `/instructor/grading/:assignmentId/:studentId` | Legacy redirect | `RedirectToGrading` |
| `/instructor/recordings` | Retired → grading | `RedirectToGrading` |
| `/instructor/quiz-submissions` | Retired → grading | `RedirectToGrading` |
| `/instructor/gradebook` | Published grades | `Gradebook` |
| `/instructor/reports` | KPIs + charts + CSV | `Reports` |
| `/instructor/settings` | Placeholder | `PlaceholderPage` |
| `/instructor/help` | Placeholder (not in sidebar) | `PlaceholderPage` |

---

## 3. Feature List (grouped by page / section)

Legend: **Core** = must exist in redesign. **Minor** = supporting. **Edge / broken** = incomplete, unused, or misleading.

### 3.1 Landing (`/`)

**Core**

- Hero: Python snippet + “Run Code & Fly” plays `/video/drone-sim.mp4`
- 4-step “how it works”: Download → Connect → Control → Optimize
- Feature grid: Camera Simulation, Physics Engine, Python API, Multi-Drone Swarms, Environment Builder, Telemetry
- Demos carousel (9 videos): Car Chase, Drone Show, Face Tracking, Animal Tracking, Warehouse Surveillance, Jogging Tracking, Drone Delivery, Drone Obstacles, Indoor Navigation
- Industry applications: Security, Agriculture, Delivery, Rescue + 8 autoplay videos
- Windows / macOS launcher download (latest from API) + download tracking
- Pricing: Free $0 vs Pro **$347 lifetime**; Buy Now requires login (`/signin?redirect=/#pricing`)
- Header: Features / Demos / Applications anchors, Buy Now, Download, Login/Register or avatar

**Minor**

- Ecosystem badges (Python, OpenCV, YOLO, LLM, AI)
- “v2.0 Performance Update” badge
- Logged-in avatar with Free/Pro badge

**Edge / unused**

- `LargeTestimonial`, `KickstarterCard`, `Cta` commented out
- Hero “Start” handler exists but is not bound
- Footer is the **admin** blue footer, not the landing footer

### 3.2 Auth

**Core**

- Sign up: name, email, password, confirm, country → OTP email
- Verify code; resend max 3, 60s cooldown
- Sign in: email + password; show/hide password
- Forgot password (60s cooldown); reset via `?token=&email=`
- reCAPTCHA v3 on signup only
- Redirect query `?redirect=`
- Maintenance-aware: admins can still sign in and reach ops

**Minor**

- Split-pane auth layout with fake terminal animation
- “Access denied” special copy (beta waitlist)

**Edge**

- No client password strength rules
- Header logout on landing does not always hit server logout (account page does)

### 3.3 Account (`/account-settings`, `/home`)

**Core**

- Profile card: avatar initial, name, email, member since, tier, hardcoded “Active”
- My Tutorials card → `/tutorials` (count of recent courses, not true enrollments)
- Transactions accordion: date, description, amount, status, receipt; Refresh / Load More
- Sign out with confirm dialog
- Light/dark toggle (`theme_preference`)

**Minor**

- Address accordion (hardcoded CVZone HQ, Sheridan WY — not user billing)
- Avatar menu: Tutorials, Logout

**Edge**

- Placeholder fallbacks: “John Doe”, `john.doe@example.com`, “Jan 2024”, “Jan 12, 2024”
- Dark mode does not restyle MUI AppBar; incomplete `dark:` coverage
- Profile is **read-only** (no edit name/email/password)
- Route not auth-gated at `/account-settings`

### 3.4 Checkout & invoices

**Core**

- `/checkout` creates Stripe session and redirects
- `/payment-success` verifies session, refreshes user to Pro, lists perks
- Pricing Free card: download launcher without paying

**Minor / edge**

- Checkout is a pulse + status string, not a review UI
- Two different Stripe price IDs (pricing vs checkout defaults)
- `/invoices` “Demo mode”; drawer links to `/payment` (no such route)
- Promotion codes and tax disabled

### 3.5 Tutorials / LMS player

**Core**

- Gallery of **published** courses (title, description, chapter/lesson counts, cover or gradient)
- Lesson player: chapter accordion, Vimeo, prev/next, Mark as Complete
- Tabs: Description (always); Materials / Code if present
- Prism highlighting; copy-code
- Local completion (`pysim_completed_lessons`); theme (`lms_theme_preference`)
- Help popup (mailto)

**Minor**

- Avatar → My Account (`/home`)
- Admin preview via `allowUnpublished`

**Edge**

- Progress bar = current lesson index / total, **not** completed count
- Completion not synced to API
- Course switcher CSS exists but is not rendered
- No enrollment model — all published courses are public

### 3.6 Ops Admin dashboard

**Core**

- KPI cards: total users, active today, with/without access, total downloads
- User growth + active users charts (1 Day / 1 Week / 1 Month / 1 Year / From Start)
- **User Panel:** search, filters, sort, CRUD, bulk role/status/access/tier, institutional Teacher/Student
- **Per Scene Access:** Free vs Pro checkboxes per scene
- **Add Scene:** catalog CRUD (name, key, category drone/robot/vehicle, sim/game/competition, levels, duration, tags)
- **Player Progress:** list + modal (time, flight hours, levels, stars, score, per-scene table, achievements)
- **Release uploads:** Bundle, Catalog, Build, Launcher, Live Versions, Add Installer (Windows/Mac, versioning, drag-drop)
- **Email:** 4-step campaign wizard (compose → subject/from → recipients → review/send) + job progress modal
- **Sender settings** (localStorage only)
- **Sent mails + email analytics**
- **Competitions:** status/start/end, leaderboard (rank, player, country, best time, attempts), video gallery player
- **Orders:** list + details, status, refund
- **Sales history:** total sales/revenue/pro upgrades + table
- **Ad Banner:** upload image/gif/video, duration, toggle active
- **Maintenance Mode:** enable with duration presets (30/60/120/custom min) + message; disable

**Minor / edge**

- Header search is a no-op
- Course Builder has no sidebar link (URL only)
- Orphaned panels: User Stats, User Profiles, Manifest, Version History
- Add User does not refresh table; Bulk Edit does not call API
- Duplicate launcher UIs (Launcher vs Add Installer)
- `TotalProjectsCount` commented out
- Admin auth pages (login/signup/OTP) fully commented out

### 3.7 LMS Admin

**Core**

- Dashboard stats: active courses, enrolled users, pending reviews, new signups
- Course table: status Draft/Published/Archived, edit, delete, pagination
- User table: search, pagination, edit, delete, bulk delete, invite
- Analytics wrapping ops counters/charts
- Course Builder in `lmsMode` (back to `/lms-admin/courses`)

**Minor / edge**

- Fake % deltas (“+5.2% vs last week”)
- Header search no-op; “+ Add New Course” goes to **ops** course-builder URL
- Settings branding field not saved; logout navigates to `/login` (app uses `/signin`)
- Title typo: **“LSM Analytics”**
- Bulk access edit is client-only
- `EnrollmentChart` unused; `realTimeStats` fetched and unused

### 3.8 Instructor

**Core**

- Dashboard: active classrooms, assignments, pending review, published grades; student progress table; recent activity
- Classrooms: create (name, description), invite students (manual + Excel/CSV, max 500), detail modal (Students / Roadmaps tabs), delete
- Roadmaps: pick classroom, name, add teaching missions, assessment missions + deadline, quiz builder; reorder; publish
- Grading: classroom select, pending/include-graded, student slideshow, mission video + code + score, quiz per-question points, keyboard ← →
- Gradebook: published grades, type pills All/Missions/Quizzes, View → grading
- Reports: range 7d / 30d / term, KPIs, line chart, mix bars, classroom table, at-risk list, CSV export
- Header: notifications (REST + SSE), profile, New Roadmap, Create Classroom

**Minor**

- “Automate Grading” CTA (copy about PyTest; link is just grading)
- Help Center mailto in sidebar

**Edge / incomplete**

- Settings & Help = “Coming soon”
- Hardcoded “Welcome back, Prof. Miller.”
- Quiz builder has **no `maxPoints`**, so grade totals can be 0
- `?new=1` on roadmaps ignored
- Assignment/draft APIs defined but unused
- Portal not auth-gated
- No student-facing web UI for roadmaps/quizzes

---

## 4. UI Components Inventory

There is **no shared design system**. Redesign should treat these as four families to unify.

### 4.1 Marketing / auth

| Component | Variants / states |
|---|---|
| `Header` | Logged out (Login/Register) vs logged in (avatar); desktop vs `lg` hamburger; Download Windows/Mac dropdown |
| `Logo` | Click → `/` |
| `UserAvatarWithTier` | Initial letter; Pro blue badge / Free gray |
| Primary CTA | `#3a86ff` / hover `#42b0f0` (“Buy Now”, “Download”) |
| Pricing cards | Free (checked + crossed features) vs Pro (highlighted, $347) |
| `AuthLayout` | Split pane; right panel hidden below `lg` (572px terminal) |
| Auth inputs | Default, password show/hide, loading submit, toast error/success |
| `PageIllustration` | Stripes SVG + blue blur orbs |
| Landing `Footer` vs admin `Footer` | Two different footers in use |

### 4.2 Shared / global

| Component | Variants / states |
|---|---|
| `MaintenanceGuard` | Pass-through (admin); redirect to `/maintenance`; loading spinner |
| App boot spinner | Full-screen blue ring |
| Toasts | react-hot-toast success/error |
| SweetAlert2 | confirm, success, error, HTML forms |
| `react-confirm-alert` | Logout (account + instructor) |

### 4.3 Account / LMS learner

| Component | Variants / states |
|---|---|
| Account cards | Default, hover, accordion expanded/collapsed |
| Tier badge | Pro / Free |
| Transaction status chip | paid/succeeded green; open/pending yellow; else red |
| Course gallery card | Thumbnail or gradient fallback; loading / error retry / empty |
| LMS sidebar | Chapter accordion; completed checkmark |
| LMS tabs | Description / Materials / Code; active underline |
| LMS theme toggle | Light / dark (div `role="button"`) |
| Copy code | Idle / “Copied!” |
| Help popup | Closed / open mailto |
| Video empty | Decorative play icon (not clickable) |

### 4.4 Ops Admin

| Component | Variants / states |
|---|---|
| Admin `Header` | Logo, LMS Admin button, dummy Search |
| `Sidebar` | Folders open/closed; item active; collapsed `w-14` on small screens |
| `CountDisplayTemplate` | loading, error+retry, empty, number |
| User table | Checkbox, chips: Verified/Unverified, Access True/False, Free/Pro, Teacher/Student |
| `EditUserDialog` / `AddUserDialog` | MUI Dialog |
| `PlayerProgressModal` | Summary + `LevelProgressTable` + `AchievementsSection` (locked/unlocked) |
| `PlatformToggle` | Windows / Mac |
| Release uploaders | idle / dragging / uploading % / processing / error |
| Email `StepBar` | 1 Compose, 2 Subject, 3 Recipients, 4 Review — numbered / complete check |
| `EmailSendProgressModal` | sending / done / error |
| `FilterSelect` | role, status, tier |
| Order `StatusBadge` | Pending / Completed / Refunded / Cancelled |
| Competition `StatusBadge` | upcoming / active / ended |
| `CustomDropdown` | Competition status |
| Video gallery player | play/pause, seek, volume, mute, fullscreen |
| Course `DropdownSelect` | status, code language |
| `SettingsModal` / `RenameCourseSectionModal` | Course builder |
| TipTap toolbar | Bold, italic, underline, lists, links, images, color, highlight, align |

### 4.5 LMS Admin

| Component | Variants / states |
|---|---|
| `LMSAdminSidebar` | Expanded `w-64` / collapsed `w-20` (labels **and icons** hide — blank links); mobile drawer |
| `LMSAdminHeader` | Hamburger, collapse, dummy search, “+ Add New Course” |
| `LMSStatCards` | 4 cards or `CardSkeleton` |
| `CourseTable` | Status badge Published/Draft/Archived; status `<select>`; pagination 5/10/25 |
| `NewUsersList` | Skeletons / empty / rows |
| `RecentCourseActivity` | Status colors; **no loading/empty UI** |
| `EditUserDialog` | name, email, access |

### 4.6 Instructor

| Component | Variants / states |
|---|---|
| `InstructorHeader` | Section title; New Roadmap; Create New; notifications (unread badge, empty); profile dropdown |
| `InstructorSidebar` | Active `bg-blue-50 text-blue-700`; collapsed icons-only; mobile overlay |
| `InstructorStatCards` | Icon colors blue/emerald/rose/amber; trend up/flat/alert; loading pulse |
| `StudentProgressTable` | Status `graded` / `submitted` / `pending_upload`; rotating avatar colors |
| `RecentActivityFeed` | Tags Published / Auto / Draft / Pending |
| `AutomateGradingCTA` | Gradient promo |
| `PlaceholderPage` | Construction + “Coming soon” |
| Classroom cards | Click → modal; delete nested |
| `CreateClassroomView` | Saving disabled |
| `ClassroomDetailModal` | Tabs Students / Roadmaps; roadmap badges published/archived/draft |
| `AddStudentsDialog` | Manual rows / file import; success/warning/error; per-row errors |
| `SceneCard` / `AssessmentMissionCard` | Category + sim type chips; expanded levels; added vs add |
| `DeadlineDialog` | empty / invalid / past errors |
| `QuestionEditor` | Types: mcq, short, code-output, code-write; languages python/js/ts/java/cpp/c/csharp/go/ruby/rust/plaintext; MCQ max 6 options |
| `QuizBuilderTab` | Title, description, question list |
| `RoadmapPanel` | Type colors teaching blue / assessment amber / quiz emerald; empty / ordered |
| `MissionGradePanel` | Video, code, score form; graded vs editing |
| `QuizGradePanel` | Compact published vs full editor |
| `ReportsActivityChart` | Chart.js filled line |
| Gradebook type pills | All / Missions / Quizzes |

### Buttons (cross-app — inconsistent)

There is no shared `Button`. Observed patterns to replace with one component:

- **Primary:** blue fill (`#3a86ff`, `bg-blue-600`, `bg-blue-700`)
- **Secondary:** white + border
- **Danger:** red fill or `bg-red-50 text-red-600` (Sign Out)
- **Ghost / text:** underline “Go back”
- **Disabled:** `opacity-50 cursor-not-allowed`
- **Loading:** spinner + label (“Publishing…”, “Creating Scene…”, “Preparing checkout…”)
- **Icon-only:** edit/delete in tables (often no `aria-label`)

---

## 5. User Flows

### 5.1 Guest → Free user → download

1. Land on `/`
2. Register → OTP email → verify → `/signin`
3. Sign in → `/home` (account)
4. Download Windows or macOS launcher from header, pricing, or Download CTA
5. Use desktop sim (Free: 3 levels / basic missions)

### 5.2 Upgrade to Pro

1. Pricing **Buy Now**
2. If logged out → `/signin?redirect=/#pricing` → back to pricing
3. `/checkout` (no review UI) → Stripe hosted checkout (card only)
4. Success → `/payment-success?session_id=` → profile refresh Free → Pro
5. Cancel → `/`

### 5.3 Take a tutorial

1. Account “My Tutorials” or avatar → `/tutorials`
2. Pick published course → `/lms?courseId=`
3. Watch Vimeo; read description; download materials; copy code
4. Mark complete (local only) → Next lesson
5. Back to gallery or My Account

### 5.4 Admin operate the platform

1. Sign in as Admin → `/pysim-ops`
2. Sidebar (state, not URL) to users, scenes, releases, mail, competitions, sales, ads, maintenance
3. Optional: Header **LMS Admin** → `/lms-admin` → courses/users
4. Course Builder: structure sidebar (chapters/lessons) → lesson editor (title, Vimeo, TipTap, code, materials) → Settings (title, description, thumbnail, draft/published/archived) → Preview
5. Enable maintenance → non-admins see `/maintenance` with countdown; admins bypass

### 5.5 Email campaign (4-step wizard)

1. **Compose** — rich text body
2. **Subject & settings** — subject, fromEmail, fromName, replyTo
3. **Recipients** — filter by role / status / tier; add/remove
4. **Review & send** — POST job → progress modal (sending / done / error)

### 5.6 Instructor classroom → roadmap → grade

1. `/instructor/classrooms?new=1` → name + description
2. Add students (rows or `.xlsx/.xls/.csv`; email regex, password ≥ 6, max 500)
3. Save classroom + invitations (`role: "student"`)
4. Open classroom → Roadmaps tab → New Roadmap
5. Select classroom, name roadmap
6. Teaching: pick scenes/levels; Assessment: scene + future deadline; Quiz: questions
7. Reorder in `RoadmapPanel` → Publish
8. Students submit in Unity
9. `/instructor/grading` → pick classroom → slideshow → score mission/quiz → published
10. Gradebook / Reports / CSV

### 5.7 Password recovery

1. `/forgot-password` → email
2. Link `/reset-password?token=&email=`
3. New password + confirm → `/signin` after 2s

---

## 6. Data Displayed

### Entities (inferred)

**User:** id, name, email, role (Admin/User/Teacher/Student), status (Verified/Unverified), access (bool), accessLevel (Free/Pro), country, loginCount, createdAt, lastLogin, isAdmin

**Course:** id, title, subtitle/tagline/description, status (draft/published/archived), thumbnail, instructorName (default “Murtaza Hassan”), chapters[], studentCount, updatedAt

**Chapter:** id, title, lessons[]

**Lesson:** id, title, description (HTML), videoUrl, materials[] (label, type file|link, url, mimeType, sizeKB), code, codeLanguage

**Scene:** sceneName, sceneKey, category (drone/robot/vehicle), simulationType (sim/game/competition), description, tags, levels, estimatedDuration, isActive, freeAccess, proAccess

**Player progress:** flightHours, levelsCompleted, starsEarned, totalScore, totalTime, lastActive; per scene level 1–3 bestTime/attempts/stars; achievements (drone/footprint/star, locked/unlocked)

**Order / transaction:** order #, customer name/email/country/userId, date, status, items (name, id, qty, total), subtotal, total, currency, transactionId, paidAt, receiptUrl

**Competition:** status (upcoming/active/ended), startTime, endTime; leaderboard rank, player, country, bestTime, attempts, achievedAt; recordings title/date/duration

**Classroom:** name, description, students[], invitations[]

**Roadmap item types:** `teaching_mission`, `teaching_level`, `assessment_mission`, `assessment_level`, `quiz`

**Quiz question:** type mcq/short/code-output/code-write, prompt, options, correct, code, language

**Grade:** score, maxScore, feedback, perQuestion[], status (graded/published), code preview

**Launcher / release:** platform, version, fileUrl, file

**Maintenance:** enabled, message, startsAt, endsAt

**Notification:** id, text, link, read, createdAt

### Tables / lists / charts by page

| Page | What’s shown |
|---|---|
| Landing | Marketing copy, videos, pricing feature lists — no live user data except launcher URLs |
| Account | Profile fields; transactions table; 5 recent courses |
| Gallery | Course cards |
| LMS player | Course structure, lesson HTML/video/code/materials, local completion |
| Ops home | 5 KPI cards; bar+line user growth; active users line |
| User Panel | Full user table + filters |
| Per Scene Access | Summary cards + scene access table |
| Add Scene | Scene catalog table |
| Scene Stats | Per-scene level times/attempts/stars |
| Player Progress | Player cards + modal tables |
| Orders / Sales | Order/sales tables + order detail pane |
| Email sent | Campaigns + expandable recipients |
| Email analytics | Stat cards; sent vs failed line; doughnut; bar |
| Leaderboard | Ranked table per competition tab |
| Video gallery | Recording grid + custom player |
| LMS Admin home | 4 stats; enrollment-style chart (actually 30-day signups); recent courses; new users |
| Course table | name, students, status, updated (raw ISO) |
| LMS users | name, email, role, status, access, accessLevel |
| Instructor home | 4 stats; progress table; activity feed |
| Gradebook | Student, Item, Type, Classroom, Score, %, Code, Feedback, Graded |
| Reports | KPIs; line chart; mix %; classroom table; at-risk list |

---

## 7. Interactive Elements & States

### Forms & validation

| Form | Fields | Client validation |
|---|---|---|
| Sign up | name, email, password, confirm, country | HTML required; email type; passwords must match; reCAPTCHA ready. **No min length** |
| OTP | verificationCode | Required; resend 60s / max 3 |
| Sign in | email, password | Required |
| Forgot | email | Required; 60s cooldown even on error |
| Reset | password, confirm | Match only |
| Checkout | none | Auto-redirect |
| Account | none | Read-only |
| Add/Edit user | name, email, role, status, access, accessLevel | None |
| Add Scene | name, description, levels, category, type, duration, tags | Name/description/type required; levels ≥ 1; duration 5–300 min |
| Email send | subject, body, from, recipients | Warn if missing subject/content/recipients |
| Sender settings | fromEmail, fromName, replyTo | None (localStorage) |
| Maintenance | duration, message | Custom ≥ 1 minute |
| Ad banner | type, file, duration, isActive | File required |
| Installer / releases | platform, file, version | Ext by platform; size caps (e.g. 500MB installer) |
| Course settings | title, description, thumbnail, status | Thumbnail after save |
| Lesson | title, video, HTML, code, language, materials | Must save course/lesson before materials |
| Create classroom | name, description, roster | Name required |
| Invite students | email, password | Email regex; password ≥ 6; no dupes; Excel headers Email/Password; max 500 |
| Roadmap | classroom, name, items | Name, classroom, ≥1 item |
| Quiz builder | title, questions | Title; ≥1 question; MCQ ≥2 options + ≥1 correct; code-output needs code |
| Deadline | datetime-local | Required, valid, future (1 min slack) |
| Mission grade | score, maxScore, feedback | Score required, 0…maxScore |
| Quiz grade | per-question points + note | Clamped 0…maxPoints; empty treated as 0 |
| LMS settings | Platform Name | Uncontrolled, not saved |

### Loading / empty / error / success (high-signal gaps)

**Present in many places:** spinners, “No X found”, Swal success, red error text.

**Missing or weak:**

- Landing: no loading/error if launcher API fails (download silently no-ops)
- Checkout: text-only; no skeleton of order summary
- Account: fake placeholders instead of empty profile
- LMS: no `.lms-centered` class referenced by error/empty layouts; **no `@media` in `LMS.css`**
- `RecentCourseActivity`: ignores loading/error; `course.action` never passed
- `CourseTable`: empty `<tbody>` with no empty state
- Ops analytics `error` state never set
- PlayerList fetch failure → empty, not error
- Instructor Settings/Help: static coming soon
- Grading: classroom fetch failure → empty `<select>`
- Header searches (ops + LMS Admin): no results UI because they do nothing

### Other patterns

- **Modals:** MUI dialogs, custom overlays (`role="dialog"` on classroom modal), Swal, Stripe (external), video overlay
- **Dropdowns:** native `<select>`, MUI select, custom div menus (header avatar, notifications, competition status)
- **Accordions:** account transactions/address; LMS chapters
- **Tabs:** LMS lesson tabs; classroom Students/Roadmaps; roadmap Teaching/Assessment/Quiz; gradebook type pills; email via sidebar not in-page tabs
- **Wizards:** Email 4-step; classroom create full-page; roadmap 3-tab + sticky panel
- **DnD:** `@hello-pangea/dnd` in course structure / roadmap reorder
- **File drop:** release uploaders, student CSV/Excel, lesson materials, ads, thumbnails
- **SSE:** instructor notifications stream
- **Keyboard:** grading ← → only; LMS theme toggle not keyboard-operable

---

## 8. Navigation Structure

### Public header (`landingpage/ui/Header.jsx`)

- Logo → `/`
- Anchors (desktop `lg+`): Features, Demos, Applications
- Buy Now → `#pricing`
- Download → Windows / Mac
- Login / Register **or** `UserAvatarWithTier`
- Mobile: hamburger at `< lg`

No breadcrumbs. No footer nav beyond Terms / Privacy / Support mailto.

### Consumer account

- MUI AppBar: Logo, theme toggle, avatar (Tutorials, Logout)
- Back chevron → `/`
- In-page cards, not a sidebar
- `/home` and `/account-settings` are the same page (confusing IA)

### Ops Admin

```
Header (fixed): [Pysimverse] [LMS Admin] [Search ———]
Sidebar (fixed, blue-900):
  Dashboard
  User ▸ User Panel, Per Scene Access, Player Progress
  Scene ▸ Add Scene, Scene Stats
  Release ▸ Bundle, Catalog, Build, Launcher, Live Versions, Add Installer
  Mail ▸ Send Campaign, Sender Settings, Sent Mails, Analytics
  Competition ▸ Manage, Leaderboard, Video Gallery
  Sales ▸ Orders, Order History
  Ad Banner
  Maintenance Mode
Floating: Back to Home → /home
```

**Not URL-based.** Refresh always returns to Dashboard. Course Builder is a separate route with no sidebar entry.

### LMS Admin

```
Sidebar: Dashboard | Course Management | User Management | Analytics | Settings
         Footer card: “Need additional access? Contact the super-admin team”
Header: “LMS Admin” + page title | collapse | + Add New Course
```

Title map **misses** course edit URL → falls back to “LMS Administration”.  
Duplicate collapse controls (sidebar + header).

### Instructor

```
Header (full width, 5rem): hamburger | section label | New Roadmap | Create New | bell | profile
Sidebar:
  Dashboard, Classrooms, Roadmaps, Grading, Gradebook, Reports, Settings
  Bottom: Help Center mailto (not /instructor/help)
```

Nested: classroom modal tabs; roadmap builder tabs; gradebook pills; reports range select.

### Learner LMS

- Left: back to `/tutorials` (or admin preview path), chapter list, Help
- Top: Previous / Next, Mark complete, theme, avatar
- No course switcher in UI

---

## 9. Responsive / Breakpoint Behavior

Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. `body { min-width: 320px }`. AOS animations **disabled on phone**.

| Surface | Behavior |
|---|---|
| Landing header | Links + auth hidden `< lg`; hamburger sheet |
| Auth | Right terminal panel `hidden lg:block` |
| Pricing | 1 col → 2 at `md` |
| Features / apps | 1 → 2 (`md`) → 4 (`lg`) |
| Account | 1 col → 3-col grid at `lg` (profile + cards) |
| Invoices | 1 / 2@640 / 3@1024 |
| Ops sidebar | `w-14` default, `md:w-64`; **sub-items `hidden md:block` — most admin features unreachable on mobile** |
| Ops content | `ml-64` even when sidebar is `w-14` (layout bug) |
| LMS Admin / Instructor | Drawer `-translate-x-full` + overlay `< md`; collapse `w-20` vs `w-64`; content `md:ml-64` / `md:ml-20` |
| LMS Admin collapsed | Nav items have **no icons** — collapsed = empty clickable rows |
| LMS player | **No media queries in `LMS.css`**; 300px sidebar does not stack |
| Instructor stats | 1 → 2 (`sm`) → 4 (`xl`) |
| Grading | Stacks; chrome `top-0` can sit under 5rem header |
| Landing videos | 8+ autoplay still load on mobile (heavy) |

**Implication for Figma:** design **mobile-first for marketing + account + LMS player**; treat ops admin as **desktop-primary** but do not hide entire feature trees; instructor should match LMS Admin’s drawer pattern (already closer).

---

## 10. Design & UX Critique

### What’s working — preserve in the redesign

- **Clear product story on the landing hero:** code-to-flight is distinctive; keep the Python snippet + sim video pairing.
- **Simple two-tier pricing** (Free vs Lifetime Pro) is easy to scan; keep the included-vs-locked contrast on Free.
- **Auth OTP + resend cooldown** is a solid anti-abuse pattern; keep the two-step signup.
- **Stripe hosted checkout** is the right payment pattern; don’t rebuild card fields in-app.
- **LMS lesson layout** (structure | video | tabs) is a familiar, teachable pattern — keep IA, restyle.
- **Instructor IA** (Classrooms → Roadmaps → Grading → Gradebook → Reports) matches a real teaching workflow; keep this sequence.
- **Email 4-step wizard** is the only polished multi-step pattern; reuse for classroom create / roadmap publish.
- **Free/Pro badge on avatar** is a compact status signal; keep it globally.
- **Maintenance countdown + admin bypass** is operationally sound.
- **Instructor notifications + SSE** is a good real-time pattern.
- **Scene taxonomy** (drone/robot/vehicle × sim/game/competition) is a strong content model for both admin and roadmaps.

---

### Issues and redesign recommendations

**1. Four visual languages, one product**  
Ops is navy MUI tables; LMS Admin/Instructor are gray-50 Tailwind cards; learner LMS is custom CSS; landing is Cruip. Users who are both Pro customers and teachers will feel like they switched products.  
**Fix:** One token set (color, type, radius, elevation, spacing 4/8/12/16/24/32/48). One sidebar, header, table, card, badge, and button. Map all four surfaces to the same kit; differentiate only by product area color (e.g. ops = slate, teaching = blue, learn = indigo).

**2. `/home` is not a home**  
Authenticated users land on Account Settings. `Home.jsx` still says “PyVisual”. There is no “what to do next” (download, continue tutorial, upgrade).  
**Fix:** Replace `/home` with a real **My PySimverse** hub: Download launcher, Continue tutorial, Upgrade/Pro status, (if Teacher) Enter classroom. Keep settings as a nested page.

**3. Account, checkout, invoices, instructor are not properly gated**  
`/account-settings`, `/checkout`, `/invoices` are public; `/instructor` is fully public.  
**Fix:** Auth-gate account/checkout/invoices. Gate instructor on `role === Teacher` (or Admin). Show a dedicated “not authorized” page instead of silent redirect to landing.

**4. Ops navigation is not URL-addressable**  
Refresh loses the panel; cannot bookmark “User Panel” or share “Orders”.  
**Fix:** `/pysim-ops/users`, `/pysim-ops/orders`, etc. Sidebar = router. Keep folders, but each leaf is a route.

**5. Admin is unusable on mobile**  
Sub-items hidden below `md`; content still `ml-64`.  
**Fix:** Either declare ops **desktop-only** with a clear empty state (“Use a larger screen”), or a real mobile nav (bottom bar + sheet for folders). Do not ship a 56px icon rail with no labels and no children.

**6. Dummy search in two admin headers**  
Search inputs that do nothing train users to distrust search.  
**Fix:** Remove until implemented, or wire to users/courses/orders with a command palette (⌘K) that actually filters.

**7. LMS Admin collapsed sidebar is blank**  
Nav items have text only; collapse hides text.  
**Fix:** Add icons (same as Instructor sidebar) and tooltips when collapsed.

**8. Duplicate / conflicting admin consoles**  
User management exists in Ops User Panel **and** LMS User Management (different fields, different bulk behavior). Course Builder is launched from LMS Admin but “Add New Course” jumps to ops URL. Analytics is copied with a typo.  
**Fix:** One **Users** module, one **Courses** module. LMS Admin should be a filtered view or a role-based home, not a second app. Kill “LSM Analytics” as a wrap of the same widgets.

**9. Fake data and placeholders leak into production UI**  
“Prof. Miller”, “John Doe”, “Jan 12, 2024”, “+5.2% vs last week”, invoice Demo mode, hardcoded “Active” status, company HQ as user Address.  
**Fix:** Empty states with illustration + CTA (“No purchases yet — View plans”). Never show another person’s name. Address = user billing from Stripe or hide the section. Stats: omit trend if you don’t have it.

**10. Terms still describe a UI design tool**  
Cruip leftover copy. Legal/trust failure.  
**Fix:** Rewrite terms/privacy for a drone simulator + account + payments. Match footer (one footer component).

**11. Pricing copy quality**  
Typos (“Competetions”), Free vs Pro lists are long and overlapping, $347 with no comparison or FAQ, Buy Now skips an order-summary page.  
**Fix:** Short feature matrix (rows = capabilities, columns = Free/Pro). Add “What’s included” confirmation on `/checkout` before Stripe. Fix typos. Align a single Stripe price ID.

**12. Checkout is not a page**  
Pulse emoji + “Preparing checkout…” is not a conversion UI. Errors are a string.  
**Fix:** Order summary (plan, price, account email), then redirect. Error state with retry + support mailto.

**13. Account cannot be edited**  
Users cannot change name, password, country, or email. Dark mode is half-applied. Address is the company.  
**Fix:** Settings sections: Profile (editable), Security (password), Billing (Stripe portal / invoices), Preferences (theme). Drop fake address or load real billing.

**14. Tutorials are not “My” tutorials**  
Copy says “enrolled courses”; API returns all courses; gallery then filters published. Progress is localStorage.  
**Fix:** Either true enrollment + server progress, or rename to “Tutorials” / “Learn”. Progress bar = completed / total. Sync completion if users switch browsers.

**15. LMS player is not responsive and has a11y holes**  
Fixed 300px sidebar; theme toggle is a `div`; dropdown items are `<li onClick>`; `dangerouslySetInnerHTML` for lesson HTML.  
**Fix:** Stack sidebar as a drawer on mobile. Real `<button>`s. Keyboard theme toggle. Sanitize HTML. Visible focus rings. Caption/transcript slot for videos.

**16. Inconsistent help emails and domains**  
LMS: `pysimverse@computervisionzone.com` vs Instructor: `pysimverse@computervision.zone` vs other copy `computervision.com`.  
**Fix:** One support email in a constant; one Help pattern (mailto vs `/help`).

**17. Instructor Settings/Help are dead ends**  
Sidebar links to Coming soon; Help route isn’t even in the sidebar.  
**Fix:** Don’t link unfinished pages. Settings v1: name, notification prefs, logout. Help: FAQ + mailto.

**18. Quiz points mismatch**  
Builder has no `maxPoints`; grading expects it → totals can be 0.  
**Fix:** Required points per question in `QuestionEditor`; show running total on the quiz card and in grading.

**19. Classroom invite UX is dense but good — polish states**  
Excel import is powerful; errors are per-row. Nested dialogs (`z-70`) and password-in-spreadsheet are risky.  
**Fix:** Keep bulk import. Default to **invite link / magic email** without teacher-chosen passwords. Confirm “emails sent 18/20” as a dedicated result screen, not only Swal.

**20. Grading chrome collides with the header**  
Sticky `top-0` under a 5rem header.  
**Fix:** Sticky offset = header height. Persistent student name + mission title + prev/next in one bar.

**21. “Automate Grading” CTA overpromises**  
PyTest marketing on a dashboard that only links to manual grading.  
**Fix:** Remove or label “Coming soon”. Don’t sell automation that isn’t shipped.

**22. Visual hierarchy in ops tables is weak**  
Every column equal weight; chips in many colors (green/pink/gray) without a legend; icon-only actions.  
**Fix:** Primary column = name + email stacked. One badge system (status, tier, role). Actions in a trailing menu (⋯) with labels. Sticky header + pagination always visible.

**23. Release uploaders are six near-duplicate screens**  
Bundle / Catalog / Build / Launcher / Versions / Installer share platform toggle + dropzone but different copy and APIs.  
**Fix:** One **Releases** page with tabs (Launcher, App build, Catalog, Bundles, Live versions). Shared dropzone component (idle/drag/progress/error).

**24. Email sender settings live in localStorage**  
From-address is not a real org setting; easy to send as the wrong identity on another browser.  
**Fix:** Persist sender identity on the server; show a preview “This will send as X” on the review step (already have step 4 — bind it to real data).

**25. Accessibility: focus, labels, color-only status**  
Sidebar `focus:ring-0`; many icon buttons unlabeled; custom listboxes are divs; duplicate `id="timePeriod"` on charts; color-only chips.  
**Fix:** Visible focus (2px ring). `aria-label` on icon actions. Native `<select>` or a real listbox. Don’t rely on color alone — include text (“Pro”, “Unverified”). Skip-to-content on admin shells.

**26. Global CSS fights components**  
`index.css` `button:hover { border-color: #646cff }` and `color-scheme: light` leak into every surface.  
**Fix:** Kill global button hover. Tokens on `:root`. Dark theme as a first-class scheme, not a one-page class toggle.

**27. Landing performance vs mobile**  
8 autoplay application videos + demo carousel + hero video. AOS off on phone but assets still load.  
**Fix:** Poster images; play on click; lazy-load below fold. One featured demo, not nine autoplay.

**28. Conversion: hero “Run Code & Fly” doesn’t continue the journey**  
It plays a video; Start is unbound. Primary jobs (Download, Buy, Sign up) compete in the header.  
**Fix:** Hero: one primary (Download) + one secondary (Watch demo). Sticky header CTA changes after login (“Open launcher” vs “Buy Pro”).

**29. LMS Admin “+ Add New Course” contrast**  
Black text on blue (`text-black`). Logout on Settings is `bg-green-500 text-blue-500` hovering to red, then navigates to a nonexistent `/login`.  
**Fix:** Primary button = white text on blue. Logout = danger outline. Navigate to `/signin` and clear session.

**30. Course table “updated” is raw ISO**  
Unreadable (`2026-08-12T…`). Student counts often 0 (`studentCount` unused).  
**Fix:** Relative dates (“Updated 3 days ago”). Hide Students until enrollment exists, or show lesson/chapter counts.

**31. Security/trust nits that affect UX copy**  
`window.forceAdmin` / JWT debug on `window`; test reCAPTCHA and Stripe keys in source. Users don’t see this, but “beta Access denied” copy and waitlist messaging should be a designed state, not a string match on `"Access denied"`.  
**Fix:** Designed **Waitlist** and **Maintenance** full pages. Remove debug globals from production builds.

**32. Footer inconsistency**  
Landing uses navy admin footer; Terms uses light marketing footer.  
**Fix:** One marketing footer (product links, legal, download, support). Admin shells get no marketing footer.

**33. Missing empty/error illustrations**  
Many “No users found” / “No orders found.” are plain table rows.  
**Fix:** Standard EmptyState: icon, title, one sentence, one CTA (e.g. “Invite users”, “Create classroom”, “Browse tutorials”).

**34. Inconsistent confirmation patterns**  
Swal vs `window.confirm` (refund) vs `react-confirm-alert` (logout) vs no confirm (some deletes).  
**Fix:** One modal: title, body, cancel, destructive/primary. Use it for delete, refund, logout, publish, enable maintenance.

**35. Instructor welcome and brand block**  
“Instructor Portal / Professional Track” + fake professor name.  
**Fix:** “Hi, {firstName}” from auth. Brand: PySimverse Instructor, not a generic “Professional Track” unless that’s a real SKU.

---

## Appendix A — Suggested Figma page map (IA for redesign)

Use this as the file structure in Figma Make:

1. **Marketing** — Landing, Pricing, Terms, Maintenance, Waitlist
2. **Auth** — Sign in, Sign up + OTP, Forgot, Reset
3. **Consumer app** — Home hub, Account/settings, Billing/invoices, Checkout summary, Payment success, Tutorials gallery, Lesson player
4. **Instructor** — Dashboard, Classrooms (list, create, detail), Roadmaps builder, Grading session, Gradebook, Reports, Settings
5. **LMS Admin** — (merge into Ops or keep as Courses + Users views)
6. **Ops** — Overview, Users, Scenes & access, Player progress, Releases, Campaigns, Competitions, Orders, Ads, Maintenance, Course builder/preview
7. **Core components** — Button, Input, Select, Table, Badge, Card, Sidebar, Header, Modal, EmptyState, Stepper, Dropzone, Video player, Code block, Toast

## Appendix B — Copy / content to fix while redesigning

- Competetions → Competitions
- LSM Analytics → LMS Analytics
- cataloge → catalog (API name may stay; UI should say Catalog)
- delievery.mp4 / “Drone Display Spectacula” / “OpenCv”
- Terms: replace UI-design-tool language
- Help emails: pick one domain
- Default instructor name “Murtaza Hassan” — make it a course field with empty placeholder

## Appendix C — States every redesigned screen must include

For each page in Figma, spec: **Default, Loading, Empty, Error, Success/toast, Disabled, Mobile, Empty-search**. Current code is strongest on loading+Swal, weakest on empty, error, and mobile.
