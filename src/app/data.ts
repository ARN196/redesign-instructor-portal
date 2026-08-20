import type {
  Activity,
  Classroom,
  Grade,
  NotificationItem,
  Profile,
  QuizItem,
  Roadmap,
  Scene,
  Student,
  Submission,
} from "./types";

export const SCENES: Scene[] = [
  { id: "sc-hover", name: "Hover Stability", category: "drone", simulationType: "sim", levels: 3, description: "Hold altitude and heading in light wind.", image: "/missions/hover-stability.png" },
  { id: "sc-obstacle", name: "Obstacle Course", category: "drone", simulationType: "game", levels: 3, description: "Navigate gates without collisions.", image: "/missions/obstacle-course.png" },
  { id: "sc-camera", name: "Camera Calibration", category: "drone", simulationType: "sim", levels: 2, description: "Calibrate onboard camera intrinsics.", image: "/missions/camera-calibration.png" },
  { id: "sc-sensor", name: "Sensor Data Collection", category: "robot", simulationType: "sim", levels: 3, description: "Log IMU and range data in Python.", image: "/missions/sensor-data.png" },
  { id: "sc-auto", name: "Autonomous Flight", category: "drone", simulationType: "sim", levels: 3, description: "Waypoint following with the Python API.", image: "/missions/autonomous-flight.png" },
  { id: "sc-warehouse", name: "Warehouse Navigation", category: "drone", simulationType: "sim", levels: 2, description: "Indoor pathing around shelves.", image: "/missions/warehouse-navigation.png" },
  { id: "sc-python", name: "Python Drone Control", category: "drone", simulationType: "sim", levels: 3, description: "from pysimverse import Drone — takeoff, hover, land.", image: "/missions/python-drone.png" },
];

export const INITIAL_CLASSROOMS: Classroom[] = [
  { id: "c1", name: "Advanced Drone Programming", code: "ADP-301", description: "Autonomous flight and Python control for third-year students.", lastActive: "2 hours ago" },
  { id: "c2", name: "Intro to Python Robotics", code: "IPR-101", description: "Foundations of robotics with Python in the sim.", lastActive: "Yesterday" },
  { id: "c3", name: "Computer Vision Fundamentals", code: "CVF-201", description: "Camera setup, calibration, and vision basics.", lastActive: "3 days ago" },
];

export const INITIAL_STUDENTS: Student[] = [
  { id: "st1", classroomId: "c1", name: "Marcus Webb", email: "marcus.webb@uni.edu", initials: "MW", status: "active" },
  { id: "st2", classroomId: "c1", name: "Jordan Liu", email: "jordan.liu@uni.edu", initials: "JL", status: "active" },
  { id: "st3", classroomId: "c1", name: "Priya Nair", email: "priya.nair@uni.edu", initials: "PN", status: "active" },
  { id: "st4", classroomId: "c1", name: "Sofia Andreou", email: "sofia.andreou@uni.edu", initials: "SA", status: "active" },
  { id: "st5", classroomId: "c1", name: "Devon Park", email: "devon.park@uni.edu", initials: "DP", status: "invited" },
  { id: "st6", classroomId: "c2", name: "Tomás Reyes", email: "tomas.reyes@uni.edu", initials: "TR", status: "active" },
  { id: "st7", classroomId: "c2", name: "Aisha Kamara", email: "aisha.kamara@uni.edu", initials: "AK", status: "active" },
  { id: "st8", classroomId: "c2", name: "Chloe Birch", email: "chloe.birch@uni.edu", initials: "CB", status: "active" },
  { id: "st9", classroomId: "c2", name: "Noah Patel", email: "noah.patel@uni.edu", initials: "NP", status: "invited" },
  { id: "st10", classroomId: "c3", name: "Fatima Al-Hassan", email: "fatima.alhassan@uni.edu", initials: "FA", status: "active" },
  { id: "st11", classroomId: "c3", name: "Leo Rossi", email: "leo.rossi@uni.edu", initials: "LR", status: "active" },
  { id: "st12", classroomId: "c3", name: "Maya Chen", email: "maya.chen@uni.edu", initials: "MC", status: "invited" },
];

const WEEK2_QUIZ: QuizItem = {
  id: "it-quiz-w2",
  type: "quiz",
  title: "Week 2 Quiz",
  description: "Hover, API basics, and a short code-output check.",
  questions: [
    {
      id: "q1",
      type: "mcq",
      prompt: "Which call starts the motors in the Python API?",
      maxPoints: 10,
      options: [
        { id: "o1", text: "drone.arm()", correct: true },
        { id: "o2", text: "drone.start()", correct: false },
        { id: "o3", text: "drone.ignite()", correct: false },
        { id: "o4", text: "drone.power()", correct: false },
      ],
    },
    {
      id: "q2",
      type: "short",
      prompt: "Name the import used to create a virtual drone.",
      maxPoints: 10,
    },
    {
      id: "q3",
      type: "code-output",
      prompt: "What does this snippet print after takeoff?",
      maxPoints: 15,
      language: "python",
      code: "from pysimverse import Drone\nd = Drone()\nd.takeoff()\nprint(round(d.alt, 1))",
    },
    {
      id: "q4",
      type: "code-write",
      prompt: "Write a loop that hovers for 3 seconds then lands.",
      maxPoints: 15,
      language: "python",
    },
  ],
};

const PYTHON_QUIZ: QuizItem = {
  id: "it-quiz-py",
  type: "quiz",
  title: "Python Basics Quiz",
  description: "Variables, lists, and a tiny control snippet.",
  questions: [
    {
      id: "pq1",
      type: "mcq",
      prompt: "Which type stores an ordered collection of waypoints?",
      maxPoints: 10,
      options: [
        { id: "a", text: "list", correct: true },
        { id: "b", text: "set", correct: false },
        { id: "c", text: "dict", correct: false },
      ],
    },
    {
      id: "pq2",
      type: "short",
      prompt: "What keyword defines a function in Python?",
      maxPoints: 10,
    },
  ],
};

const OBSTACLE_QUIZ: QuizItem = {
  id: "it-quiz-obs",
  type: "quiz",
  title: "Obstacle Course Quiz",
  description: "Gates, collisions, and scoring.",
  questions: [
    {
      id: "oq1",
      type: "mcq",
      prompt: "A collision with a gate should…",
      maxPoints: 25,
      options: [
        { id: "a", text: "Reset the run", correct: true },
        { id: "b", text: "Add bonus points", correct: false },
      ],
    },
    {
      id: "oq2",
      type: "short",
      prompt: "Name one sensor useful for gate detection.",
      maxPoints: 25,
    },
  ],
};

export const INITIAL_ROADMAPS: Roadmap[] = [
  {
    id: "r1",
    name: "ADP-301 Curriculum",
    classroomId: "c1",
    status: "published",
    items: [
      { id: "it-t1", type: "teaching", sceneId: "sc-python", level: 1, maxPoints: 100 },
      { id: "it-t2", type: "teaching", sceneId: "sc-hover", level: 2, maxPoints: 100 },
      { id: "it-a1", type: "assessment", sceneId: "sc-hover", deadline: "2026-09-15T17:00", maxPoints: 100 },
      WEEK2_QUIZ,
      { id: "it-t3", type: "teaching", sceneId: "sc-auto", level: 1, maxPoints: 100 },
      { id: "it-t4", type: "teaching", sceneId: "sc-obstacle", level: 2, maxPoints: 100 },
      { id: "it-a2", type: "assessment", sceneId: "sc-auto", deadline: "2026-09-29T17:00", maxPoints: 100 },
      OBSTACLE_QUIZ,
    ],
  },
  {
    id: "r3",
    name: "IPR-101 Curriculum",
    classroomId: "c2",
    status: "published",
    items: [
      { id: "it-t5", type: "teaching", sceneId: "sc-python", level: 1, maxPoints: 100 },
      { id: "it-a3", type: "assessment", sceneId: "sc-sensor", deadline: "2026-09-20T17:00", maxPoints: 100 },
      PYTHON_QUIZ,
      { id: "it-t6", type: "teaching", sceneId: "sc-sensor", level: 2, maxPoints: 100 },
      { id: "it-t7", type: "teaching", sceneId: "sc-warehouse", level: 1, maxPoints: 100 },
    ],
  },
  {
    id: "r5",
    name: "CVF-201 Curriculum",
    classroomId: "c3",
    status: "published",
    items: [
      { id: "it-t8", type: "teaching", sceneId: "sc-camera", level: 1, maxPoints: 100 },
      { id: "it-a4", type: "assessment", sceneId: "sc-camera", deadline: "2026-09-18T17:00", maxPoints: 100 },
    ],
  },
];

const HOVER_CODE = `from pysimverse import Drone

d = Drone()
d.arm()
d.takeoff()
for _ in range(30):
    d.hover()
d.land()
`;

const SENSOR_CODE = `from pysimverse import Drone

d = Drone()
d.arm()
log = []
for i in range(20):
    log.append(d.imu())
print(len(log))
`;

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: "s1",
    studentId: "st1",
    classroomId: "c1",
    itemId: "it-a1",
    assignment: "Hover Stability",
    type: "mission",
    submitted: "2h ago",
    videoLabel: "believer415_Åland_Islands.mp4",
    videoUrl: "/recordings/aland-islands.mp4",
    sceneName: "Åland Islands",
    code: HOVER_CODE,
  },
  {
    id: "s2",
    studentId: "st6",
    classroomId: "c2",
    itemId: "it-a3",
    assignment: "Sensor Data Collection",
    type: "mission",
    submitted: "3h ago",
    videoLabel: "believer415_Åland_Islands.mp4",
    videoUrl: "/recordings/aland-islands.mp4",
    sceneName: "Åland Islands",
    code: SENSOR_CODE,
  },
  {
    id: "s3",
    studentId: "st2",
    classroomId: "c1",
    itemId: "it-quiz-w2",
    assignment: "Week 2 Quiz",
    type: "quiz",
    submitted: "5h ago",
    quizAnswers: [
      { questionId: "q1", answer: "drone.arm()" },
      { questionId: "q2", answer: "from pysimverse import Drone" },
      { questionId: "q3", answer: "1.0" },
      { questionId: "q4", answer: "for i in range(3):\n    d.hover()\nd.land()" },
    ],
  },
  {
    id: "s4",
    studentId: "st10",
    classroomId: "c3",
    itemId: "it-a4",
    assignment: "Camera Calibration",
    type: "mission",
    submitted: "Yesterday",
    videoLabel: "believer415_Åland_Islands.mp4",
    videoUrl: "/recordings/aland-islands.mp4",
    sceneName: "Åland Islands",
    code: "from pysimverse import Drone\nd = Drone()\nprint(d.camera.calibrate())\n",
  },
  {
    id: "s5",
    studentId: "st4",
    classroomId: "c1",
    itemId: "it-t2",
    assignment: "Hover Stability",
    type: "mission",
    submitted: "Yesterday",
    videoLabel: "believer415_Åland_Islands.mp4",
    videoUrl: "/recordings/aland-islands.mp4",
    sceneName: "Åland Islands",
  },
  {
    id: "s6",
    studentId: "st11",
    classroomId: "c3",
    itemId: "it-t8",
    assignment: "Camera Calibration",
    type: "mission",
    submitted: "4h ago",
    videoLabel: "believer415_Åland_Islands.mp4",
    videoUrl: "/recordings/aland-islands.mp4",
    sceneName: "Åland Islands",
  },
];

export const INITIAL_GRADES: Grade[] = [
  { id: "g1", studentId: "st1", classroomId: "c1", itemId: "it-t1", item: "Python Drone Control", type: "mission", score: 88, max: 100, graded: "Aug 8, 2026" },
  { id: "g9", studentId: "st1", classroomId: "c1", itemId: "it-t2", item: "Hover Stability", type: "mission", score: 82, max: 100, graded: "Aug 10, 2026", code: HOVER_CODE, feedback: "Solid hover. Watch yaw drift after second 20.", videoUrl: "/recordings/aland-islands.mp4", sceneName: "Åland Islands" },
  { id: "g6", studentId: "st2", classroomId: "c1", itemId: "it-t1", item: "Python Drone Control", type: "mission", score: 80, max: 100, graded: "Aug 8, 2026" },
  { id: "g10", studentId: "st2", classroomId: "c1", itemId: "it-t2", item: "Hover Stability", type: "mission", score: 71, max: 100, graded: "Aug 10, 2026" },
  { id: "g14", studentId: "st2", classroomId: "c1", itemId: "it-a1", item: "Hover Stability", type: "mission", score: 78, max: 100, graded: "Aug 11, 2026" },
  { id: "g7", studentId: "st3", classroomId: "c1", itemId: "it-t1", item: "Python Drone Control", type: "mission", score: 91, max: 100, graded: "Aug 7, 2026" },
  { id: "g11", studentId: "st3", classroomId: "c1", itemId: "it-t2", item: "Hover Stability", type: "mission", score: 86, max: 100, graded: "Aug 9, 2026" },
  { id: "g12", studentId: "st3", classroomId: "c1", itemId: "it-a1", item: "Hover Stability", type: "mission", score: 84, max: 100, graded: "Aug 11, 2026" },
  { id: "g4", studentId: "st3", classroomId: "c1", itemId: "it-quiz-w2", item: "Week 2 Quiz", type: "quiz", score: 45, max: 50, graded: "Aug 12, 2026" },
  { id: "g2", studentId: "st3", classroomId: "c1", itemId: "it-quiz-obs", item: "Obstacle Course Quiz", type: "quiz", score: 44, max: 50, graded: "Aug 12, 2026" },
  { id: "g13", studentId: "st4", classroomId: "c1", itemId: "it-t1", item: "Python Drone Control", type: "mission", score: 76, max: 100, graded: "Aug 14, 2026" },
  { id: "g5", studentId: "st6", classroomId: "c2", itemId: "it-t5", item: "Python Drone Control", type: "mission", score: 79, max: 100, graded: "Aug 11, 2026", code: SENSOR_CODE },
  { id: "g8", studentId: "st7", classroomId: "c2", itemId: "it-quiz-py", item: "Python Basics Quiz", type: "quiz", score: 38, max: 50, graded: "Aug 9, 2026" },
  { id: "g3", studentId: "st10", classroomId: "c3", itemId: "it-t8", item: "Camera Calibration", type: "mission", score: 74, max: 100, graded: "Aug 13, 2026", feedback: "Intrinsics look good; retry distortion on level 2." },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "New submission", body: "Marcus Webb submitted Hover Stability", time: "2h ago", read: false, link: "grading" },
  { id: "n2", title: "New submission", body: "Tomás Reyes submitted Sensor Data Collection", time: "3h ago", read: false, link: "grading" },
  { id: "n3", title: "Quiz ready", body: "Jordan Liu completed Week 2 Quiz", time: "5h ago", read: false, link: "grading" },
];

export const INITIAL_ACTIVITY: Activity[] = [
  { id: "a1", text: "Published the ADP-301 curriculum", time: "Mon", tag: "Published" },
  { id: "a2", text: "Graded Priya Nair — Obstacle Course Quiz", time: "Tue", tag: "Graded" },
  { id: "a3", text: "Updated the IPR-101 curriculum", time: "Wed", tag: "Draft" },
  { id: "a4", text: "5 submissions waiting for review", time: "Today", tag: "Pending" },
];

export const INITIAL_PROFILE: Profile = {
  name: "Sarah Chen",
  email: "sarah.chen@uni.edu",
  photoUrl: null,
  notifySubmissions: true,
  notifyActivity: false,
  billingEmail: "sarah.chen@uni.edu",
  cardBrand: "Visa",
  cardLast4: "4242",
  cardExp: "08/27",
};

