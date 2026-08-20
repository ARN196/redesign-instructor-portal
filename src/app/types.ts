export type Page =
  | "dashboard"
  | "classrooms"
  | "roadmaps"
  | "grading"
  | "gradebook"
  | "reports"
  | "settings"
  | "help";

export type Classroom = {
  id: string;
  name: string;
  code: string;
  description: string;
  lastActive: string;
};

export type Student = {
  id: string;
  classroomId: string;
  name: string;
  email: string;
  initials: string;
  status: "active" | "invited";
};

export type Scene = {
  id: string;
  name: string;
  category: "drone" | "robot" | "vehicle";
  simulationType: "sim" | "game" | "competition";
  levels: number;
  description: string;
  image: string;
};

export type QuizOption = { id: string; text: string; correct: boolean };

export type QuizQuestion = {
  id: string;
  type: "mcq" | "short" | "code-output" | "code-write";
  prompt: string;
  maxPoints: number;
  options?: QuizOption[];
  language?: string;
  code?: string;
};

export type TeachingItem = {
  id: string;
  type: "teaching";
  sceneId: string;
  /** Omit for every level of the mission. */
  level?: number;
  maxPoints: number;
  /** When true, students do not see this item in the desktop sim. */
  hiddenFromSim?: boolean;
};

export type AssessmentItem = {
  id: string;
  type: "assessment";
  sceneId: string;
  deadline: string;
  /** Omit for every level of the mission. */
  level?: number;
  maxPoints: number;
  /** When true, students do not see this item in the desktop sim. */
  hiddenFromSim?: boolean;
};

export type QuizItem = {
  id: string;
  type: "quiz";
  title: string;
  description: string;
  questions: QuizQuestion[];
  /** When true, students do not see this item in the desktop sim. */
  hiddenFromSim?: boolean;
};

export type RoadmapItem = TeachingItem | AssessmentItem | QuizItem;
export type RoadmapStatus = "draft" | "published" | "archived";

export type Roadmap = {
  id: string;
  name: string;
  classroomId: string;
  status: RoadmapStatus;
  items: RoadmapItem[];
};

export type QuizAnswer = { questionId: string; answer: string };

export type Submission = {
  id: string;
  studentId: string;
  classroomId: string;
  itemId: string;
  assignment: string;
  type: "mission" | "quiz";
  submitted: string;
  code?: string;
  videoLabel?: string;
  videoUrl?: string;
  sceneName?: string;
  quizAnswers?: QuizAnswer[];
};

export type Grade = {
  id: string;
  submissionId?: string;
  studentId: string;
  classroomId: string;
  item: string;
  itemId?: string;
  type: "mission" | "quiz";
  score: number;
  max: number;
  feedback?: string;
  perQuestion?: { questionId: string; points: number; note?: string }[];
  graded: string;
  code?: string;
  videoUrl?: string;
  sceneName?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  link: Page;
};

export type Profile = {
  name: string;
  email: string;
  photoUrl: string | null;
  notifySubmissions: boolean;
  notifyActivity: boolean;
  billingEmail: string;
  cardBrand: string;
  cardLast4: string;
  cardExp: string;
};

export type Activity = {
  id: string;
  text: string;
  time: string;
  tag: "Published" | "Graded" | "Draft" | "Pending";
};
