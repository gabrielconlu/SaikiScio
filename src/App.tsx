import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type IconName =
  | "arrow"
  | "spark"
  | "check"
  | "target"
  | "book"
  | "video"
  | "hands"
  | "clock"
  | "chart"
  | "back"
  | "leaf"
  | "chevron";

type Skill = {
  name: string;
  category: string;
  icon: string;
  tint: string;
  description: string;
};

type LearningMethod = "Short lessons" | "Hands-on projects" | "Reading" | "Videos" | "Guided practice";
type JourneyPage = "assessment" | "results";
type CookiePreferences = { analytics: boolean };
type AuthUser = { id: string; email: string };
type LegalPath = "/terms" | "/privacy" | "/cookies";

type SavedProgress = {
  step: number;
  selectedSkills: string[];
  goal: string;
  confidence: Record<string, number>;
  selectedMethods: LearningMethod[];
  hours: number;
  targetDate: string;
  savedPage: JourneyPage;
  started: boolean;
  completedTasks: number[];
  activeLearningSkill: string;
  activeLesson: LearningMethod | null;
  completedActivities: string[];
  activityNotes: Record<string, string>;
  projectChecks: Record<string, boolean[]>;
  videoScenes: Record<string, number>;
};

const progressStorageKey = "saikiscio-progress-v1";
const cookieStorageKey = "saikiscio-cookie-preferences-v1";

const skills: Skill[] = [
  { name: "Communication", category: "People", icon: "◌", tint: "peach", description: "Share ideas with clarity and confidence." },
  { name: "Problem solving", category: "Thinking", icon: "⌘", tint: "lilac", description: "Find a way forward when things get complex." },
  { name: "Creativity", category: "Thinking", icon: "✳", tint: "yellow", description: "Turn fresh ideas into something real." },
  { name: "Leadership", category: "People", icon: "↗", tint: "mint", description: "Bring people together and help them thrive." },
  { name: "Technical skills", category: "Craft", icon: "⌁", tint: "blue", description: "Build practical skills for the digital world." },
];

const methods: { name: LearningMethod; icon: IconName; note: string }[] = [
  { name: "Short lessons", icon: "book", note: "Bite-sized ideas" },
  { name: "Hands-on projects", icon: "hands", note: "Learn by making" },
  { name: "Reading", icon: "book", note: "Go at your pace" },
  { name: "Videos", icon: "video", note: "See it in action" },
  { name: "Guided practice", icon: "target", note: "Try with support" },
];

const steps = ["Your focus", "Starting point", "Your rhythm"];

const skillChallenges: Record<string, {
  scenario: string;
  choices: { label: string; insight: string }[];
  goal: string;
}> = {
  Communication: {
    scenario: "You have a useful idea in a busy meeting, but the conversation is moving quickly. What could help your idea land?",
    choices: [
      { label: "Lead with the main point, then give one reason.", insight: "A clear headline gives listeners something to hold onto; one reason adds context without burying the idea." },
      { label: "Start with every detail so nobody misses anything.", insight: "Details can help, but starting with the headline makes it easier for people to follow the story that comes next." },
      { label: "Ask a short question to make room for the idea.", insight: "A focused question can invite others in and create a natural opening to share your perspective." },
    ],
    goal: "share my ideas clearly and make room for a useful conversation",
  },
  "Problem solving": {
    scenario: "A task is delayed for the second time. Before suggesting a fix, what would help you understand the problem?",
    choices: [
      { label: "Separate what you know from what you’re assuming.", insight: "That distinction makes it easier to find the real obstacle and choose a small test instead of guessing." },
      { label: "Try the first solution that worked on another project.", insight: "Past solutions are useful clues; first check whether the cause is the same in this situation." },
      { label: "Ask what changed and look for one observable cause.", insight: "A specific question about what changed turns a vague delay into something you can investigate." },
    ],
    goal: "break a tricky problem into clear facts and small testable steps",
  },
  Creativity: {
    scenario: "You need a fresh idea for a familiar task. What might help you get past the first obvious answer?",
    choices: [
      { label: "Write three different ideas before choosing one.", insight: "Making several options before evaluating them gives unexpected ideas room to appear." },
      { label: "Look at the task from a different person’s perspective.", insight: "A new point of view can reveal needs and possibilities that are easy to miss from your usual angle." },
      { label: "Make a rough version and see what it suggests.", insight: "A quick draft gives you something real to react to—and often sparks the next idea." },
    ],
    goal: "generate fresh ideas and turn one into a small experiment",
  },
  Leadership: {
    scenario: "A group agrees the work matters, but everyone leaves unsure what should happen next. What could you do?",
    choices: [
      { label: "Summarize the shared goal and agree on one next step.", insight: "Connecting the goal to a clear action helps a group move forward without needing a perfect plan." },
      { label: "Ask what support or clarity would help each person.", insight: "A thoughtful question can surface what is blocking progress and helps people feel included." },
      { label: "Check who owns the follow-up and when to reconnect.", insight: "Clear ownership and a light check-in turn a good intention into shared momentum." },
    ],
    goal: "help people feel heard and make shared next steps clearer",
  },
  "Technical skills": {
    scenario: "A new tool feels unfamiliar and you are not sure what a setting does. What is a safe way to learn it?",
    choices: [
      { label: "Try one change in a copy or practice space.", insight: "A safe space and one change at a time help you see what happened without risking your original work." },
      { label: "Start with a real task you want the tool to help with.", insight: "A practical goal gives you a reason to learn only the feature you need right now." },
      { label: "Write down what you tried and what happened.", insight: "A short learning note makes the experiment repeatable and helps build confidence over time." },
    ],
    goal: "learn new digital tools by trying small, safe, practical experiments",
  },
};

const skillGuides: Record<string, {
  principle: string;
  example: string;
  challenge: string;
  reading: string[];
  project: string[];
  practice: string[];
  video: { title: string; narration: string }[];
  reflection: string;
}> = {
  Communication: {
    principle: "Clarity comes before confidence. A simple message is easier to share and easier for someone else to act on.",
    example: "Instead of “I have a few thoughts about the timeline,” try “Could we move the review to Thursday so there’s time to test the changes?”",
    challenge: "Make one idea easier to hear, understand, or act on.",
    reading: [
      "Start with the point you want someone to remember. Then add only the context they need to understand it.",
      "A useful message often has three parts: the situation, your main point, and a clear next step. Pausing to invite a question makes it a conversation rather than a performance.",
    ],
    project: ["Choose one message you need to share this week.", "Rewrite it as: context → main point → next step.", "Share it, then note what response or question you received."],
    practice: ["Take one slow breath and relax your shoulders.", "Say your main point in one sentence.", "Add one useful detail, then pause and invite a response."],
    video: [
      { title: "Before you speak", narration: "Picture the person listening. What do they need to know, and what would you like them to do next?" },
      { title: "Lead with the point", narration: "Try the headline first: “I recommend we test the smaller option this week.” Add your reason after the main idea." },
      { title: "Make room for a reply", narration: "Finish with an open invitation: “What would you change?” Clear communication leaves room for another perspective." },
    ],
    reflection: "When did someone understand your point more easily than expected?",
  },
  "Problem solving": {
    principle: "A tangled problem gets easier when you separate what you know from what you’re guessing, then test one small next step.",
    example: "If a project feels stuck, list the visible obstacle, the assumption behind it, and one low-risk way to check that assumption.",
    challenge: "Turn one frustrating unknown into a question you can test.",
    reading: [
      "Name the problem in terms you can observe. “The hand-off has missed its date twice” gives you more to work with than “the process is broken.”",
      "Write down facts and assumptions separately. Generate a few possible explanations, choose a reversible experiment, and use what you learn to decide what to try next.",
    ],
    project: ["Write one problem as a specific, observable sentence.", "List two facts and one assumption about it.", "Try a small test and record what changed."],
    practice: ["Describe the problem without assigning blame.", "Ask: what do I know, and what am I assuming?", "Pick one action that can teach you something today."],
    video: [
      { title: "Zoom in", narration: "Replace a broad worry with one observable moment. A smaller problem is easier to investigate." },
      { title: "Sort the evidence", narration: "Separate facts from assumptions. Mark anything you could verify with a quick question or check." },
      { title: "Run a small test", narration: "Choose the least risky experiment that could change your next decision. Learning is progress, even when the first idea isn’t right." },
    ],
    reflection: "What did your small test teach you that guessing could not?",
  },
  Creativity: {
    principle: "Creativity is a practice of making possibilities before judging them. One imperfect draft gives you something real to improve.",
    example: "For a presentation, sketch three different opening ideas before choosing one. The unexpected option may be the most memorable.",
    challenge: "Generate several possibilities, then make one small version real.",
    reading: [
      "Give idea-making and idea-choosing different moments. When every idea is judged immediately, it is hard to discover a surprising direction.",
      "Use constraints as creative prompts: a smaller budget, a shorter time, or a different audience can reveal options you would otherwise miss. Then make a rough draft and learn from it.",
    ],
    project: ["Pick an everyday challenge worth improving.", "Make a list of five possible solutions without ranking them.", "Build or sketch the smallest version of one idea and ask for feedback."],
    practice: ["Set a two-minute timer and write every idea that comes to mind.", "Circle the idea that surprises you most.", "Ask how you could test it in ten minutes or less."],
    video: [
      { title: "Open the possibility space", narration: "Choose a small challenge. For two minutes, make options without deciding which one is best." },
      { title: "Change the prompt", narration: "Ask how a child, a newcomer, or someone with half the time might approach the same challenge." },
      { title: "Make a rough draft", narration: "Choose one surprising direction. A quick sketch or prototype gives your next idea something to react to." },
    ],
    reflection: "Which idea appeared only after you stopped trying to find the perfect one?",
  },
  Leadership: {
    principle: "Leadership can be a small act of helping people understand the shared goal, feel heard, and know what happens next.",
    example: "At the end of a meeting, summarize the decision, ask who owns the next step, and check whether anyone needs support.",
    challenge: "Help a group move forward without taking every task on yourself.",
    reading: [
      "A team can lose momentum when purpose, ownership, or support is unclear. You don’t need a title to notice the gap and help make it visible.",
      "Listen for what people need, reflect back what you heard, and agree on one concrete next step. Follow up on commitments—and make it safe to revisit them when circumstances change.",
    ],
    project: ["Ask a teammate what would make one shared task easier.", "Agree on one next step and who will own it.", "Check back with curiosity rather than blame."],
    practice: ["Name the shared outcome in one sentence.", "Ask each person what they need to move forward.", "Close by repeating the next step and its owner."],
    video: [
      { title: "Start with the shared goal", narration: "A short reminder of why the work matters can bring a scattered conversation back together." },
      { title: "Listen for what’s missing", narration: "Ask one open question and leave space for the answer. People may need context, support, or a decision." },
      { title: "Make the next step clear", narration: "Summarize what happens next, who owns it, and when you’ll check in. Clarity is a form of care." },
    ],
    reflection: "What changed when you made room for someone else’s perspective?",
  },
  "Technical skills": {
    principle: "Technical confidence grows through small, repeatable experiments. Make one change at a time so you can see what caused the result.",
    example: "When learning a new tool, change one setting, observe what happens, and write down how to restore the original before trying another.",
    challenge: "Learn one useful feature by trying it, observing the result, and explaining it in your own words.",
    reading: [
      "A new tool can feel like a wall of buttons. Pick one real task you want to complete, then learn only the feature that helps with that task.",
      "Make a safe copy before experimenting. Change one thing at a time, notice the result, and keep a short note of what worked. Explaining the steps to someone else helps reveal what you understand.",
    ],
    project: ["Choose a small task you want a tool to make easier.", "Make a copy or use a safe practice space; try one feature.", "Write down what you changed, what happened, and how to repeat it."],
    practice: ["Name the task you want to do.", "Try one feature or command in a safe space.", "Explain the result in your own words before trying a second change."],
    video: [
      { title: "Choose a real task", narration: "Start with something you actually want to do. A specific goal makes an unfamiliar tool less overwhelming." },
      { title: "Try one change", narration: "Use a safe copy or practice space. Change one thing, then pause long enough to notice the result." },
      { title: "Capture what you learned", narration: "Write the steps in your own words. A tiny personal guide makes the next attempt easier." },
    ],
    reflection: "Which step could you now explain to someone else?",
  },
};

type PlanStage = "notice" | "practice" | "apply";

type LearningPlanStep = {
  title: string;
  detail: string;
  tag: string;
  duration: string;
  skill: string;
  method: LearningMethod;
  stage: PlanStage;
};

function inferGoalContext(skill: string, goal: string): string {
  const text = goal.toLowerCase();
  if (skill === "Communication") {
    if (/meeting|speak|speaking|voice|presentation|present|interview|public/.test(text)) return "speaking up in a real conversation";
    if (/write|writing|email|message|report|explain|clear/.test(text)) return "making an important message clear";
    if (/listen|listening|conflict|feedback|difficult/.test(text)) return "listening and responding thoughtfully";
  }
  if (skill === "Problem solving") {
    if (/decision|decide|choice|choose/.test(text)) return "making a decision with more confidence";
    if (/work|project|team|task|stuck|complex/.test(text)) return "moving a real task past an obstacle";
    if (/organ|plan|time|priorit|overwhelm/.test(text)) return "making a busy day more manageable";
  }
  if (skill === "Creativity") {
    if (/idea|brainstorm|create|design|innovat/.test(text)) return "making space for a new idea";
    if (/project|build|make|start/.test(text)) return "turning an idea into a first draft";
  }
  if (skill === "Leadership") {
    if (/team|people|colleague|group|collaborat/.test(text)) return "helping a team take its next step";
    if (/confiden|decision|speak|voice/.test(text)) return "helping a group hear a clear point of view";
  }
  if (skill === "Technical skills") {
    if (/code|coding|program|develop|software/.test(text)) return "learning a coding or software task";
    if (/data|spreadsheet|excel|number|analysis/.test(text)) return "working through a digital or data task";
    if (/slide|presentation|present|deck/.test(text)) return "building or sharing a presentation with digital tools";
    if (/tool|app|computer|digital|technology|tech/.test(text)) return "getting more comfortable with a digital tool";
  }
  return "the goal you described";
}

function buildLearningPlan(
  selectedSkills: string[],
  goal: string,
  confidence: Record<string, number>,
  selectedMethods: LearningMethod[],
  hours: number,
): LearningPlanStep[] {
  const chosenSkills = selectedSkills.length ? selectedSkills : [skills[0].name];
  const chosenMethods: LearningMethod[] = selectedMethods.length ? selectedMethods : ["Short lessons"];
  const stages: PlanStage[] = ["notice", "practice", "apply"];

  return stages.map((stage, index) => {
    const skillName = chosenSkills[index % chosenSkills.length];
    const guide = skillGuides[skillName] ?? skillGuides.Communication;
    const method = chosenMethods[index % chosenMethods.length];
    const confidenceLevel = confidence[skillName] ?? 2;
    const focus = inferGoalContext(skillName, goal);
    const baseActivity = stage === "notice"
      ? guide.reading[0]
      : stage === "practice"
        ? guide.practice[1]
        : guide.project[2];

    let detail = `${baseActivity} Keep the focus on ${focus}.`;
    switch (method) {
      case "Short lessons":
        detail = stage === "notice"
          ? `${guide.principle} Notice one moment related to ${focus}.`
          : stage === "practice"
            ? `${guide.example} Try the idea once, then notice what changes.`
            : `${baseActivity} Keep the focus on ${focus}.`;
        break;
      case "Hands-on projects":
        detail = `${guide.project[index]} Shape this small project around ${focus}.`;
        break;
      case "Reading":
        detail = `${guide.reading[index % guide.reading.length]} Then connect the idea to ${focus}.`;
        break;
      case "Videos":
        detail = `Walk through “${guide.video[index].title}”: ${guide.video[index].narration} Apply it to ${focus}.`;
        break;
      case "Guided practice":
        detail = `${guide.practice[index]} Use this as a low-pressure rehearsal for ${focus}.`;
        break;
    }

    const effortFrame = confidenceLevel <= 1
      ? "A gentle first try"
      : confidenceLevel >= 3
        ? "A stretch worth trying"
        : "A practical next step";
    const title = stage === "notice"
      ? `Notice what helps with ${skillName.toLowerCase()}`
      : stage === "practice"
        ? `Practice ${skillName.toLowerCase()} in a small moment`
        : `Use ${skillName.toLowerCase()} toward your goal`;
    const personalizedDetail = index === 0 && goal.trim()
      ? `With your goal in mind (“${goal.trim()}”), ${detail.charAt(0).toLowerCase()}${detail.slice(1)}`
      : detail;

    return {
      title,
      detail: `${effortFrame}. ${personalizedDetail}`,
      tag: `Week 0${index + 1} · ${skillName}`,
      duration: `${Math.min(90, Math.max(10, hours * 15))} min`,
      skill: skillName,
      method,
      stage,
    };
  });
}

function parseSavedProgress(raw: string | null): SavedProgress | null {
  try {
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) throw new Error("Saved progress is not an object.");
    const item = value as Record<string, unknown>;
    const isLearningMethod = (method: unknown): method is LearningMethod =>
      methods.some((candidate) => candidate.name === method);
    if (
      typeof item.step !== "number" || !Array.isArray(item.selectedSkills) ||
      typeof item.goal !== "string" || typeof item.confidence !== "object" || item.confidence === null ||
      !Array.isArray(item.selectedMethods) || typeof item.hours !== "number" ||
      typeof item.targetDate !== "string" || (item.savedPage !== "assessment" && item.savedPage !== "results") ||
      typeof item.started !== "boolean" || !Array.isArray(item.completedTasks) ||
      typeof item.activeLearningSkill !== "string" ||
      (item.activeLesson !== null && !isLearningMethod(item.activeLesson)) ||
      !Array.isArray(item.completedActivities) || typeof item.activityNotes !== "object" || item.activityNotes === null ||
      typeof item.projectChecks !== "object" || item.projectChecks === null ||
      typeof item.videoScenes !== "object" || item.videoScenes === null
    ) throw new Error("Saved progress has an unexpected format.");
    return {
      step: Math.min(2, Math.max(0, Math.floor(item.step))),
      selectedSkills: item.selectedSkills.filter((skill): skill is string => typeof skill === "string" && skills.some((candidate) => candidate.name === skill)),
      goal: item.goal,
      confidence: Object.fromEntries(Object.entries(item.confidence).filter((entry): entry is [string, number] => typeof entry[1] === "number")),
      selectedMethods: item.selectedMethods.filter(isLearningMethod),
      hours: Math.min(10, Math.max(1, Math.floor(item.hours))),
      targetDate: item.targetDate,
      savedPage: item.savedPage,
      started: item.started,
      completedTasks: item.completedTasks.filter((task): task is number => typeof task === "number" && Number.isInteger(task)),
      activeLearningSkill: skills.some((skill) => skill.name === item.activeLearningSkill) ? item.activeLearningSkill : skills[0].name,
      activeLesson: item.activeLesson,
      completedActivities: item.completedActivities.filter((activity): activity is string => typeof activity === "string"),
      activityNotes: Object.fromEntries(Object.entries(item.activityNotes).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
      projectChecks: Object.fromEntries(Object.entries(item.projectChecks).filter((entry): entry is [string, boolean[]] => Array.isArray(entry[1]) && entry[1].every((checked) => typeof checked === "boolean"))),
      videoScenes: Object.fromEntries(Object.entries(item.videoScenes).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isInteger(entry[1]))),
    };
  } catch (error) {
    console.warn("Unable to read SaikiScio progress from this browser.", error);
    return null;
  }
}

function readSavedProgress(): SavedProgress | null {
  try {
    return parseSavedProgress(window.localStorage.getItem(progressStorageKey));
  } catch (error) {
    console.warn("Unable to read SaikiScio progress from this browser.", error);
    return null;
  }
}

function readCookiePreferences(): CookiePreferences {
  try {
    const raw = window.localStorage.getItem(cookieStorageKey);
    if (!raw) return { analytics: false };
    const value: unknown = JSON.parse(raw);
    if (typeof value === "object" && value !== null && "analytics" in value && typeof value.analytics === "boolean") {
      return { analytics: value.analytics };
    }
    throw new Error("Cookie preferences have an unexpected format.");
  } catch (error) {
    console.warn("Unable to read SaikiScio cookie preferences from this browser.", error);
    return { analytics: false };
  }
}

function readLegacyDeviceId(): string | null {
  try {
    const value = window.localStorage.getItem("saikiscio-device-id-v1");
    return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      ? value
      : null;
  } catch (error) {
    console.warn("Unable to read legacy SaikiScio device progress identifier.", error);
    return null;
  }
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const drawings: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
    hands: <><path d="m8 12 2.5 2.5a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0-2.8-2.8l-2.2 2.2" /><path d="m3 11 4-4 4 4-4 4-4-4Z" /><path d="m14 6 2-2 4 4-2 2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /></>,
    back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
    leaf: <><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 8-8 8-16Z" /><path d="M4 21c2-5 6-8 11-11" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  };

  return <svg {...common}>{drawings[name]}</svg>;
}

function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [savedProgress, setSavedProgress] = useState(readSavedProgress);
  const [journeyTouched, setJourneyTouched] = useState(() => savedProgress !== null);
  const [page, setPage] = useState<"home" | "assessment" | "results">("home");
  const [step, setStep] = useState(savedProgress?.step ?? 0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(savedProgress?.selectedSkills.length ? savedProgress.selectedSkills : ["Communication"]);
  const [goal, setGoal] = useState(savedProgress?.goal ?? "");
  const [confidence, setConfidence] = useState<Record<string, number>>(savedProgress?.confidence ?? {});
  const [selectedMethods, setSelectedMethods] = useState<LearningMethod[]>(savedProgress?.selectedMethods.length ? savedProgress.selectedMethods : ["Hands-on projects", "Short lessons"]);
  const [hours, setHours] = useState(savedProgress?.hours ?? 3);
  const [targetDate, setTargetDate] = useState(savedProgress?.targetDate ?? "");
  const [savedPage, setSavedPage] = useState<JourneyPage>(savedProgress?.savedPage ?? "assessment");
  const [started, setStarted] = useState(savedProgress?.started ?? false);
  const [completedTasks, setCompletedTasks] = useState<number[]>(savedProgress?.completedTasks ?? []);
  const [activeLearningSkill, setActiveLearningSkill] = useState(savedProgress?.activeLearningSkill ?? "Communication");
  const [activeLesson, setActiveLesson] = useState<LearningMethod | null>(savedProgress?.activeLesson ?? null);
  const [completedActivities, setCompletedActivities] = useState<string[]>(savedProgress?.completedActivities ?? []);
  const [activityNotes, setActivityNotes] = useState<Record<string, string>>(savedProgress?.activityNotes ?? {});
  const [projectChecks, setProjectChecks] = useState<Record<string, boolean[]>>(savedProgress?.projectChecks ?? {});
  const [videoScenes, setVideoScenes] = useState<Record<string, number>>(savedProgress?.videoScenes ?? {});
  const [cookiePreferences, setCookiePreferences] = useState(readCookiePreferences);
  const [storageError, setStorageError] = useState("");
  const [databaseNotice, setDatabaseNotice] = useState("");
  const [accountRetry, setAccountRetry] = useState(0);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [accountSyncReady, setAccountSyncReady] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [activeSkillPreview, setActiveSkillPreview] = useState<string | null>("Communication");
  const [skillChallengeAnswers, setSkillChallengeAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const activeGuide = skillGuides[activeLearningSkill] ?? skillGuides.Communication;
  const plan = useMemo(
    () => buildLearningPlan(selectedSkills, goal, confidence, selectedMethods, hours),
    [selectedSkills, goal, confidence, selectedMethods, hours],
  );

  const applyProgress = (progress: SavedProgress) => {
    setSavedProgress(progress);
    setStep(progress.step);
    setSelectedSkills(progress.selectedSkills.length ? progress.selectedSkills : ["Communication"]);
    setGoal(progress.goal);
    setConfidence(progress.confidence);
    setSelectedMethods(progress.selectedMethods.length ? progress.selectedMethods : ["Hands-on projects", "Short lessons"]);
    setHours(progress.hours);
    setTargetDate(progress.targetDate);
    setSavedPage(progress.savedPage);
    setStarted(progress.started);
    setCompletedTasks(progress.completedTasks);
    setActiveLearningSkill(progress.activeLearningSkill);
    setActiveLesson(progress.activeLesson);
    setCompletedActivities(progress.completedActivities);
    setActivityNotes(progress.activityNotes);
    setProjectChecks(progress.projectChecks);
    setVideoScenes(progress.videoScenes);
    setJourneyTouched(true);
  };

  useEffect(() => {
    if (!journeyTouched) return;
    const progress: SavedProgress = {
      step,
      selectedSkills,
      goal,
      confidence,
      selectedMethods,
      hours,
      targetDate,
      savedPage,
      started,
      completedTasks,
      activeLearningSkill,
      activeLesson,
      completedActivities,
      activityNotes,
      projectChecks,
      videoScenes,
    };
    try {
      window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
      setSavedProgress(progress);
      setStorageError("");
    } catch (saveError) {
      console.error("Unable to save SaikiScio progress in this browser.", saveError);
      setStorageError("Your browser could not save this update. Check its storage settings or export your notes before leaving.");
    }
  }, [journeyTouched, step, selectedSkills, goal, confidence, selectedMethods, hours, targetDate, savedPage, started, completedTasks, activeLearningSkill, activeLesson, completedActivities, activityNotes, projectChecks, videoScenes]);

  useEffect(() => {
    let active = true;
    const initializeAccount = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) throw new Error(`Session check failed with status ${response.status}.`);
        const { user }: { user: AuthUser | null } = await response.json();
        if (!active) return;
        if (user) {
          const migrationResponse = await fetch("/api/progress/migrate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ legacyDeviceId: readLegacyDeviceId() }),
          });
          if (!migrationResponse.ok) throw new Error("Your account is signed in, but older saved progress could not be imported.");
          const progressResponse = await fetch("/api/progress");
          if (!progressResponse.ok) throw new Error(`Account progress request failed with status ${progressResponse.status}.`);
          const result: { progress: unknown } = await progressResponse.json();
          if (!active) return;
          if (result.progress !== null) {
            const restored = parseSavedProgress(JSON.stringify(result.progress));
            if (!restored) throw new Error("The saved account progress could not be read.");
            applyProgress(restored);
          } else if (savedProgress) {
            const importResponse = await fetch("/api/progress", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ progress: savedProgress }),
            });
            if (!importResponse.ok) throw new Error(`Browser progress import failed with status ${importResponse.status}.`);
          }
          if (!active) return;
          setCurrentUser(user);
        }
        setDatabaseNotice("");
      } catch (error) {
        console.warn("Unable to initialize SaikiScio account session.", error);
        if (active) {
          const detail = error instanceof TypeError
            ? "The local SaikiScio API is not responding. Keep “npm run dev:api” running, then retry."
            : error instanceof Error
              ? `Account sync could not start: ${error.message}`
              : "Account sync could not start because of an unexpected error.";
          setDatabaseNotice(`${detail} Your learning remains saved in this browser.`);
        }
      } finally {
        if (active) {
          setAuthInitialized(true);
          setAccountSyncReady(true);
        }
      }
    };
    void initializeAccount();
    return () => { active = false; };
  }, [accountRetry]);

  useEffect(() => {
    if (!accountSyncReady || !currentUser || !journeyTouched || !savedProgress) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ progress: savedProgress }),
      }).then((response) => {
        if (!response.ok) throw new Error(`Progress save failed with status ${response.status}.`);
        setDatabaseNotice("");
      }).catch((error: unknown) => {
        console.error("Unable to sync SaikiScio progress to PostgreSQL.", error);
        setDatabaseNotice("PostgreSQL could not save this update. Your progress is still saved in this browser.");
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [accountSyncReady, currentUser, journeyTouched, savedProgress]);

  useEffect(() => {
    try {
      window.localStorage.setItem(cookieStorageKey, JSON.stringify(cookiePreferences));
    } catch (saveError) {
      console.error("Unable to save SaikiScio cookie preferences in this browser.", saveError);
      setStorageError("Your browser could not save your preferences. Check its storage settings.");
    }
  }, [cookiePreferences]);

  const hasSavedProgress = savedProgress !== null;

  const retryAccountSync = async () => {
    setDatabaseNotice("Checking the local account service…");
    if (!currentUser) {
      setAccountSyncReady(false);
      setAccountRetry((current) => current + 1);
      return;
    }

    try {
      const healthResponse = await fetch("/api/health");
      if (!healthResponse.ok) throw new Error(`API health check failed with status ${healthResponse.status}.`);
      if (journeyTouched && savedProgress) {
        const progressResponse = await fetch("/api/progress", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ progress: savedProgress }),
        });
        if (!progressResponse.ok) throw new Error(`Progress save failed with status ${progressResponse.status}.`);
      }
      setDatabaseNotice("");
    } catch (retryError) {
      console.error("SaikiScio account sync retry failed.", retryError);
      const detail = retryError instanceof TypeError
        ? "The local SaikiScio API is not responding. Keep “npm run dev:api” running, then retry."
        : retryError instanceof Error
          ? retryError.message
          : "An unexpected error occurred.";
      setDatabaseNotice(`Account sync is still unavailable: ${detail} Your learning remains saved in this browser.`);
    }
  };

  const resumeJourney = () => {
    setPage(savedPage === "results" ? "results" : "assessment");
    setJourneyTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const beginAssessment = () => {
    setStep(0);
    setError("");
    setJourneyTouched(true);
    setSavedPage("assessment");
    setPage("assessment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSkill = (name: string) => {
    setSelectedSkills((current) =>
      current.includes(name)
        ? current.length > 1 ? current.filter((skill) => skill !== name) : current
        : [...current, name],
    );
    setError("");
  };

  const toggleMethod = (name: LearningMethod) => {
    setSelectedMethods((current) =>
      current.includes(name)
        ? current.filter((method) => method !== name)
        : [...current, name],
    );
    setError("");
  };

  const continueAssessment = () => {
    if (step === 0 && !goal.trim()) {
      setError("Add a goal or choose a suggested prompt to continue.");
      return;
    }
    if (step === 2 && selectedMethods.length === 0) {
      setError("Choose at least one way you like to learn.");
      return;
    }
    setError("");
    if (step < 2) setStep((current) => current + 1);
    else {
      setSavedPage("results");
      setPage("results");
      setStarted(false);
      setCompletedTasks([]);
    }
  };

  const editAssessment = () => {
    setSavedPage("assessment");
    setPage("assessment");
    setStep(0);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTask = (index: number) => {
    setCompletedTasks((current) =>
      current.includes(index) ? current.filter((task) => task !== index) : [...current, index],
    );
  };

  const toggleProjectCheck = (index: number) => {
    setProjectChecks((current) => {
      const checks = current[activeLearningSkill] ?? [false, false, false];
      const updated = [...checks];
      updated[index] = !updated[index];
      return { ...current, [activeLearningSkill]: updated };
    });
  };

  const toggleActivityComplete = (key: string) => {
    setCompletedActivities((current) =>
      current.includes(key) ? current.filter((activity) => activity !== key) : [...current, key],
    );
  };

  const clearLearningState = () => {
    setJourneyTouched(false);
    setSavedProgress(null);
    setStep(0);
    setSelectedSkills(["Communication"]);
    setGoal("");
    setConfidence({});
    setSelectedMethods(["Hands-on projects", "Short lessons"]);
    setHours(3);
    setTargetDate("");
    setSavedPage("assessment");
    setStarted(false);
    setCompletedTasks([]);
    setActiveLearningSkill("Communication");
    setActiveLesson(null);
    setCompletedActivities([]);
    setActivityNotes({});
    setProjectChecks({});
    setVideoScenes({});
    try {
      window.localStorage.removeItem(progressStorageKey);
      setStorageError("");
    } catch (removeError) {
      console.error("Unable to remove saved SaikiScio progress from this browser.", removeError);
      setStorageError("Your answers were cleared from this screen, but this browser could not remove the saved copy.");
    }
  };

  const startFresh = () => {
    setPage("home");
    clearLearningState();
    if (currentUser) {
      void fetch("/api/progress", { method: "DELETE" }).then((response) => {
        if (!response.ok) throw new Error(`Progress deletion failed with status ${response.status}.`);
        setDatabaseNotice("");
      }).catch((deleteError: unknown) => {
        console.error("Unable to remove saved SaikiScio progress from PostgreSQL.", deleteError);
        setDatabaseNotice("Saved learning was cleared from this browser, but the database copy could not be deleted.");
      });
    }
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");
    setAuthBusy(true);
    setAccountSyncReady(false);
    const isRegister = pathname === "/register";
    if (isRegister && authPassword !== authPasswordConfirm) {
      setAuthError("The passwords do not match.");
      setAuthBusy(false);
      setAccountSyncReady(true);
      return;
    }
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword, legacyDeviceId: readLegacyDeviceId() }),
      });
      const result: { user?: AuthUser; error?: string } = await response.json();
      if (!response.ok || !result.user) throw new Error(result.error ?? "Unable to complete sign in.");
      const user = result.user;
      const progressResponse = await fetch("/api/progress");
      if (!progressResponse.ok) throw new Error("Your account signed in, but its saved progress could not be loaded. Reload the page and try again.");
      const progressResult: { progress: unknown } = await progressResponse.json();
      if (progressResult.progress !== null) {
        const restored = parseSavedProgress(JSON.stringify(progressResult.progress));
        if (!restored) throw new Error("Your account's saved learning could not be read.");
        applyProgress(restored);
        setPage(restored.savedPage === "results" ? "results" : "assessment");
      } else if (savedProgress) {
        const saveResponse = await fetch("/api/progress", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ progress: savedProgress }),
        });
        if (!saveResponse.ok) throw new Error("Your account is ready, but existing browser progress could not be copied to it.");
        setAuthNotice("Your saved browser progress is now linked to your account.");
        setPage(savedProgress.savedPage === "results" ? "results" : "assessment");
      }
      setCurrentUser(user);
      setDatabaseNotice("");
      setAuthPassword("");
      setAuthPasswordConfirm("");
      setAuthInitialized(true);
      setAccountSyncReady(true);
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      console.error("SaikiScio authentication request failed.", submitError);
      setAuthError(submitError instanceof Error ? submitError.message : "Unable to complete sign in. Please try again.");
      setAccountSyncReady(true);
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      setCurrentUser(null);
      setDatabaseNotice("");
      setAccountSyncReady(false);
      clearLearningState();
      navigate("/");
    } catch (signOutError) {
      console.error("SaikiScio sign-out failed.", signOutError);
      setDatabaseNotice(signOutError instanceof Error ? signOutError.message : "Unable to sign out.");
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountMessage("");
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: accountPassword, newPassword: newAccountPassword }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to change your password.");
      setAccountPassword("");
      setNewAccountPassword("");
      setAccountMessage("Password changed. Other signed-in sessions have been signed out.");
    } catch (passwordError) {
      console.error("SaikiScio password change failed.", passwordError);
      setAccountMessage(passwordError instanceof Error ? passwordError.message : "Unable to change password.");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account and all saved learning progress? This cannot be undone.")) return;
    try {
      const response = await fetch("/api/auth/account", { method: "DELETE" });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete the account.");
      setCurrentUser(null);
      setAccountSyncReady(false);
      clearLearningState();
      setPage("home");
      navigate("/");
    } catch (deleteError) {
      console.error("SaikiScio account deletion failed.", deleteError);
      setAccountMessage(deleteError instanceof Error ? deleteError.message : "Unable to delete your account.");
    }
  };

  const legalPath = pathname === "/terms" || pathname === "/privacy" || pathname === "/cookies"
    ? pathname as LegalPath
    : null;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAccountPage = pathname === "/account";
  const authMode = pathname === "/register" ? "register" : "login";
  const legalTitle = legalPath === "/terms" ? "Terms of use" : legalPath === "/privacy" ? "Privacy notice" : "Cookie & storage settings";

  useEffect(() => {
    if (isAccountPage && authInitialized && !currentUser) navigate("/login", { replace: true });
  }, [isAccountPage, authInitialized, currentUser, navigate]);

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <nav className="nav-shell" aria-label="Main navigation">
          <button className="brand" onClick={() => { navigate("/"); setPage("home"); }} aria-label="SaikiScio home">
            <span className="brand-mark"><Icon name="leaf" size={19} /></span>
            <span>Saiki<span className="brand-period">Scio</span></span>
          </button>
          <div className="nav-links">
            <a href={page === "home" && pathname === "/" ? "#how-it-works" : "/#how-it-works"} onClick={(event) => {
              if (page !== "home" || pathname !== "/") {
                event.preventDefault();
                navigate("/");
                setPage("home");
                window.setTimeout(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }), 30);
              }
            }}>How it works</a>
            <a href={page === "home" && pathname === "/" ? "#skills" : "/#skills"} onClick={(event) => {
              if (page !== "home" || pathname !== "/") {
                event.preventDefault();
                navigate("/");
                setPage("home");
                window.setTimeout(() => document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" }), 30);
              }
            }}>Explore skills</a>
          </div>
          <div className="nav-account-actions">
            {currentUser ? <><Link className="nav-account-link" to="/account">My account</Link><button className="nav-account-link" onClick={() => void signOut()}>Sign out</button></> : <Link className="nav-account-link nav-signin-link" to="/login">Sign in</Link>}
            <button className="nav-cta" onClick={beginAssessment}>
              <span className="nav-cta-label">{page === "results" ? "Retake check-in" : "Start your check-in"}</span>
              <span className="nav-cta-compact">{page === "results" ? "Retake" : "Start"}</span>
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </nav>
      </header>

      {legalPath && <main className="legal-page section-shell">
        <div className="legal-page-top"><Link className="back-link" to="/"><Icon name="back" size={16} /> Back to SaikiScio</Link><span className="eyebrow">SAIKISCIO · UPDATED OCTOBER 8, 2026</span></div>
        <div className="legal-page-layout">
          <aside className="legal-sidebar"><span className="eyebrow">YOUR INFORMATION</span><h1>Clear, thoughtful<br /><span className="serif-italic">ground rules.</span></h1><nav aria-label="Legal pages"><Link className={legalPath === "/terms" ? "active" : ""} to="/terms">Terms of use</Link><Link className={legalPath === "/privacy" ? "active" : ""} to="/privacy">Privacy notice</Link><Link className={legalPath === "/cookies" ? "active" : ""} to="/cookies">Cookies &amp; storage</Link></nav><p>We aim to explain what this learning demo does in plain language. Review these details before creating an account.</p></aside>
          <article className="legal-document">
            <h1>{legalTitle}</h1>
            {legalPath === "/terms" && <div className="legal-copy">
              <p className="legal-lead">These terms explain how to use SaikiScio, a self-guided skill-practice website. By using the service, you agree to these terms.</p>
              <h2>1. Who may use SaikiScio</h2><p>You must be able to form a binding agreement under the laws where you live. If you are under the age of majority, use the service only with a parent or guardian's permission. Do not create an account for someone else without their permission.</p>
              <h2>2. Your account and password</h2><p>Provide a valid email address, keep your password confidential, and use a unique password. You are responsible for activity under your account and for telling the site operator if you suspect unauthorized access. There is no email-based password recovery in this prototype; do not use a password you cannot afford to lose.</p>
              <h2>3. Learning content and appropriate use</h2><p>SaikiScio provides general educational prompts, examples, and practice activities. They are not professional, clinical, legal, financial, or employment advice and do not guarantee a particular result. Use your own judgment, adapt activities to your circumstances, and stop if an exercise is uncomfortable or unsafe.</p><p>Do not use the service unlawfully, interfere with its operation, probe or bypass security, upload malicious content, or attempt to access another person's account or information.</p>
              <h2>4. Your content and saved progress</h2><p>You retain responsibility for the goals, notes, and other information you submit. You give SaikiScio permission to store and process that information only to provide account, progress-saving, and learning-plan features. Avoid entering highly sensitive personal information. You may clear learning progress or request account deletion using the account controls; account deletion removes the account and associated saved progress.</p>
              <h2>5. Availability and changes</h2><p>This prototype may change, be interrupted, or be discontinued. Keep a copy of anything important to you. Features that depend on the local development server or database are not a hosted backup service.</p>
              <h2>6. Disclaimers and liability</h2><p>To the extent permitted by law, the service is provided “as is” without guarantees that it will always be available, error-free, or suitable for a particular purpose. Nothing in these terms limits rights or remedies that cannot legally be limited in your jurisdiction.</p>
              <h2>7. Contact and governing terms</h2><p>The publisher must add a real support contact, legal entity, governing-law details, and any jurisdiction-specific provisions before public launch. These draft terms are not legal advice and are not ready to establish a production service agreement.</p>
              <p className="legal-draft-note">Publisher review required: complete the contact and jurisdiction information and have these draft terms reviewed for the intended audience before public deployment.</p>
            </div>}
            {legalPath === "/privacy" && <div className="legal-copy">
              <p className="legal-lead">This notice describes what SaikiScio collects, why it is used, and the controls available to you. It applies to the current account-enabled prototype.</p>
              <h2>1. Information we process</h2><p><strong>Account information:</strong> your normalized email address, a securely hashed password, account timestamps, and hashed session tokens.</p><p><strong>Learning information:</strong> selected skills, goal text, confidence ratings, learning format preferences, weekly time, optional target date, lesson notes, checklist states, and completion progress.</p><p><strong>Technical information:</strong> session cookie and basic request information needed to operate the local Node API and prevent abuse. The prototype does not intentionally collect analytics or advertising identifiers.</p>
              <h2>2. How information is used</h2><p>We use account details to register and authenticate you, learning data to build and save a plan, session data to keep you signed in, and limited request information to protect and troubleshoot the service. The current plan generator uses local rules; it does not send your answers to an AI provider.</p>
              <h2>3. Storage, security, and sharing</h2><p>For local development, account and learning records are stored in PostgreSQL on the computer running the API. The browser also keeps a local copy of learning progress and cookie preferences. Passwords are hashed with scrypt; session identifiers are random, stored hashed in the database, and delivered in an HttpOnly, SameSite cookie. These controls reduce risk but do not make a development environment production-ready.</p><p>There is no analytics, advertising, or third-party AI integration in this version. The database/API operator can access records on the host computer. Do not expose this unauthenticated-development deployment to the public internet.</p>
              <h2>4. Retention and your controls</h2><p>Account data remains in PostgreSQL until you delete your account or the database operator removes it. Use Account → Delete account to delete the account and associated saved progress. Sign out to invalidate your current session. Clearing browser storage removes this browser's local copy but does not delete the account's database record.</p>
              <h2>5. Your choices and rights</h2><p>Depending on where you live, you may have rights to access, correct, delete, restrict, or receive a copy of personal information. This prototype has no automated export or formal request workflow. A production operator must provide a contact and process for requests and explain any applicable legal basis and retention limits.</p>
              <h2>6. Children, international use, and changes</h2><p>This prototype is not designed to collect information from children. It has no configured production data region, processor contracts, or international transfer mechanism. The operator should assess these matters and update this notice before public use. We may update this notice when the service changes.</p>
              <p className="legal-draft-note">Publisher review required: add the responsible organization and privacy contact, verify server logging and hosting practices, retention periods, data region, age policy, and legally required disclosures before launch.</p>
            </div>}
            {legalPath === "/cookies" && <div className="legal-copy">
              <p className="legal-lead">Manage browser storage and sign-in cookies. Essential storage is needed to keep your account signed in and remember your learning.</p>
              <h2>Essential account session</h2><p>When you sign in, SaikiScio sets a random, HttpOnly, SameSite session cookie. The cookie is used only to authenticate requests to your account. It expires after seven days or when you sign out. It is required for sign-in and cannot be disabled while using an account.</p>
              <h2>Learning storage</h2><p>Learning progress and your preferences are stored in this browser. When signed in, progress is also stored in the SaikiScio PostgreSQL database. Clearing browser storage removes the local copy, but not account data saved in the database.</p>
              <h2>Optional analytics</h2><p>No analytics or advertising tools are installed. Your analytics choice below is remembered, but turning it on will not enable tracking unless an analytics service is added in a future version.</p>
              <label className="preference-row preference-toggle legal-preference"><span><strong>Optional analytics preference</strong><small>Save your choice on this browser. Analytics are not currently active.</small></span><input type="checkbox" checked={cookiePreferences.analytics} onChange={(event) => setCookiePreferences({ analytics: event.target.checked })} /></label>
              <p className="cookie-save-message" role="status">Your preference is saved automatically on this device.</p>
              <h2>Clear this browser's saved learning</h2><p>Use the clear-progress control on your plan to remove local learning progress and, while signed in, its account copy. To only clear this browser's copy, use your browser's site-data settings; that does not delete your account.</p>
              <p className="legal-draft-note">This page describes the current prototype. Hosting providers may process technical logs. Review actual deployment behavior and local cookie laws before public launch.</p>
            </div>}
          </article>
        </div>
      </main>}

      {isAuthPage && <main className="auth-page section-shell">
        <Link className="back-link" to="/"><Icon name="back" size={16} /> Back to SaikiScio</Link>
        <div className="auth-card">
          <span className="eyebrow">{authMode === "register" ? "A LITTLE ROOM TO GROW" : "WELCOME BACK"}</span>
          <h1>{authMode === "register" ? <>Make your<br /><span className="serif-italic">account.</span></> : <>Pick up where<br /><span className="serif-italic">you left off.</span></>}</h1>
          <p>{authMode === "register" ? "Create an account to keep your learning plan and notes with you when you return." : "Sign in to return to your saved skills, plan, and learning notes."}</p>
          {!authInitialized && <p className="auth-loading">Checking your sign-in…</p>}
          <form className="auth-form" onSubmit={(event) => void submitAuth(event)}>
            <label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" />
            <label htmlFor="auth-password">Password</label><input id="auth-password" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} minLength={6} maxLength={128} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 6 characters" />
            {authMode === "register" && <><label htmlFor="auth-password-confirm">Confirm password</label><input id="auth-password-confirm" type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={authPasswordConfirm} onChange={(event) => setAuthPasswordConfirm(event.target.value)} placeholder="Type your password again" /><div className="terms-consent"><input id="terms-consent" aria-label="I agree to the Terms of use and have read the Privacy notice" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required /><div><label htmlFor="terms-consent">I agree to the</label> <Link to="/terms">Terms of use</Link> <span>and have read the</span> <Link to="/privacy">Privacy notice</Link>.</div></div></>}
            <span className="password-guidance">Use 6 or more characters. This local prototype cannot send password-reset emails.</span>
            {authError && <p className="form-error" role="alert">{authError}</p>}
            {authNotice && <p className="auth-success" role="status">{authNotice}</p>}
            <button className="button-primary auth-submit" disabled={authBusy || !authInitialized}>{authBusy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"} <Icon name="arrow" size={16} /></button>
          </form>
          <p className="auth-switch">{authMode === "register" ? "Already have an account?" : "New to SaikiScio?"} <Link to={authMode === "register" ? "/login" : "/register"}>{authMode === "register" ? "Sign in" : "Create an account"}</Link></p>
          <p className="auth-privacy-note">By continuing, you agree to our <Link to="/terms">Terms</Link> and acknowledge the <Link to="/privacy">Privacy notice</Link>.</p>
        </div>
      </main>}

      {isAccountPage && currentUser && <main className="account-page section-shell">
        <Link className="back-link" to="/"><Icon name="back" size={16} /> Back to learning</Link>
        <div className="account-heading"><span className="eyebrow">YOUR SAIkISCIO ACCOUNT</span><h1>Account <span className="serif-italic">settings.</span></h1><p>Manage your sign-in and the learning data saved to your account.</p></div>
        <section className="account-card"><span className="eyebrow">ACCOUNT EMAIL</span><h2>{currentUser.email}</h2><p>Your email is used to sign in. Email changes and email verification are not available in this prototype.</p></section>
        <section className="account-card"><span className="eyebrow">PASSWORD &amp; SECURITY</span><h2>Change your password</h2><p>Choose a unique password with at least 6 characters. Changing it signs out any other active sessions.</p><form className="account-form" onSubmit={(event) => void changePassword(event)}><label htmlFor="current-password">Current password</label><input id="current-password" type="password" autoComplete="current-password" required value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} /><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={newAccountPassword} onChange={(event) => setNewAccountPassword(event.target.value)} /><button className="button-primary">Update password <Icon name="check" size={15} /></button></form></section>
        <section className="account-card account-danger"><span className="eyebrow">PERMANENT ACTION</span><h2>Delete your account</h2><p>This permanently deletes your account, sign-in sessions, and saved learning progress from the SaikiScio database. Browser copies on your devices must be cleared separately.</p><button className="button-danger" onClick={() => void deleteAccount()}>Delete my account</button></section>
        {accountMessage && <p className="account-message" role="status">{accountMessage}</p>}
      </main>}

      {!legalPath && !isAuthPage && !isAccountPage && <>
      {databaseNotice && <div className="storage-notice" role="status"><span>{databaseNotice}</span><button type="button" onClick={() => void retryAccountSync()}>Retry account sync</button></div>}
      {storageError && <div className="storage-notice storage-warning" role="status">{storageError}</div>}

      {page === "home" && (
        <main>
          <section className="hero section-shell">
            <div className="hero-copy">
              <div className="eyebrow"> A little progress goes a long way</div>
              <h1>Make room<br />to <span className="serif-italic">grow.</span></h1>
              <p className="hero-description">Build the skills that make life feel a little more possible. Your next step starts with what matters to you.</p>
              <div className="hero-actions">
                <button className="button-primary" onClick={beginAssessment}>Find your next skill <Icon name="arrow" size={17} /></button>
                <span className="time-note"><Icon name="clock" size={15} /> Just 2 minutes to begin</span>
              </div>
              {hasSavedProgress && <div className="saved-progress-card"><div><strong>{currentUser ? "Your learning is saved to your account." : "Your learning is saved on this device."}</strong><span>{savedPage === "results" ? `${completedActivities.length} lessons tried · ${completedTasks.length} plan steps complete` : `Check-in saved at step ${step + 1} of 3`}</span><button className="saved-progress-clear" onClick={startFresh}>Forget saved progress</button></div><button className="button-quiet" onClick={resumeJourney}>{savedPage === "results" ? "Return to my learning" : "Continue my check-in"} <Icon name="arrow" size={15} /></button></div>}
              <div className="social-proof">
                <div className="avatar-stack" aria-hidden="true"><span>J</span><span>M</span><span>A</span><span>+</span></div>
                <p><strong>Small steps, real momentum.</strong><br />A more human way to keep learning.</p>
              </div>
            </div>

            <div className="hero-art" aria-label="Illustration of a personalized weekly learning plan">
              <div className="sun-shape" />
              <div className="art-note note-top"><span className="note-dot" /> Made for your kind of growth</div>
              <div className="plan-card">
                <div className="plan-card-top">
                  <div><span className="card-kicker">YOUR WEEKLY GROWTH</span><h2>A little, often.</h2></div>
                  <span className="week-pill">Week 01 <Icon name="chevron" size={12} /></span>
                </div>
                <div className="focus-row">
                  <span className="focus-icon"><Icon name="target" size={17} /></span>
                  <span><small>YOUR FOCUS</small><strong>Speak with confidence</strong></span>
                  <span className="focus-check"><Icon name="check" size={13} /></span>
                </div>
                <div className="sample-task">
                  <div className="task-top"><span>01 / NOTICE</span><span>10 min</span></div>
                  <p>Find one moment to share<br />an idea in your own words.</p>
                  <div className="task-footer"><span className="tiny-spark"><Icon name="spark" size={13} /></span> A small practice, just for you</div>
                </div>
                <div className="week-dots"><span className="dot-filled" /><span /><span /><span /><span className="dot-label">one good step at a time</span></div>
              </div>
              <div className="art-note note-bottom"><span className="flower-mark">✳</span><span>Progress<br />looks different<br />for everyone.</span></div>
              <span className="orbit orbit-one" /><span className="orbit orbit-two" />
            </div>
          </section>

          <div className="ticker" aria-label="Skills you can grow">
            <div className="ticker-track">
              {["Clear communication", "Creative thinking", "Everyday leadership", "Digital confidence", "Problem solving", "Clear communication", "Creative thinking"].map((item, index) => (
                <span key={`${item}-${index}`}><i />{item}</span>
              ))}
            </div>
          </div>

          <section className="how-section section-shell" id="how-it-works">
            <div className="section-heading">
              <div><span className="eyebrow">A path that fits you</span><h2>Grow at your<br /><span className="serif-italic">own pace.</span></h2></div>
              <p>No pressure to have it all figured out. We’ll help you find a starting point, shape a plan around your life, and build on every little win.</p>
            </div>
            <div className="steps-grid">
              {[
                { n: "01", title: "Get curious", text: "Tell us what you’d love to get better at and where you’re starting from.", icon: "target" as IconName, color: "peach" },
                { n: "02", title: "Make it yours", text: "Get a learning plan shaped around your goals, time, and style.", icon: "spark" as IconName, color: "lilac" },
                { n: "03", title: "Try a small step", text: "Practice in ways that feel useful. Notice the progress as you go.", icon: "chart" as IconName, color: "mint" },
                { n: "04", title: "Keep growing", text: "Reflect on what’s working and let your next chapter take shape.", icon: "leaf" as IconName, color: "yellow" },
              ].map((item) => (
                <article className="step-card" key={item.n}>
                  <div className={`step-icon ${item.color}`}><Icon name={item.icon} size={20} /></div>
                  <span className="step-number">{item.n}</span>
                  <h3>{item.title}</h3><p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="skills-section" id="skills">
            <div className="section-shell skills-inner">
              <div className="skills-intro"><span className="eyebrow">Your next chapter</span><h2>What would you<br />like to <span className="serif-italic">grow?</span></h2><p>Choose a skill for a quick, no-pressure scenario. Explore an idea, then take it into your own learning plan.</p><button className="text-link" onClick={beginAssessment}>Find my starting point <Icon name="arrow" size={16} /></button></div>
              <div className="skill-list">
                {skills.map((skill) => {
                  const challenge = skillChallenges[skill.name];
                  const expanded = activeSkillPreview === skill.name;
                  const selectedAnswer = skillChallengeAnswers[skill.name];
                  const challengeId = `skill-challenge-${skill.name.toLowerCase().replace(/ /g, "-")}`;
                  return <article className={`skill-explorer ${expanded ? "expanded" : ""}`} key={skill.name}>
                    <button type="button" className="skill-row" aria-expanded={expanded} aria-controls={challengeId} onClick={() => setActiveSkillPreview(expanded ? null : skill.name)}>
                      <span className={`skill-symbol ${skill.tint}`}>{skill.icon}</span><span className="skill-copy"><strong>{skill.name}</strong><small>{skill.description}</small></span><span className="skill-try-label">{expanded ? "Challenge open" : "Try a challenge"}</span><span className="skill-arrow"><Icon name={expanded ? "chevron" : "arrow"} size={16} /></span>
                    </button>
                    {expanded && <div className="skill-challenge" id={challengeId} role="region" aria-label={`${skill.name} quick challenge`}>
                      <span className="skill-challenge-kicker">A QUICK, NO-SCORE CHALLENGE</span>
                      <p className="skill-challenge-question">{challenge.scenario}</p>
                      <div className="skill-challenge-options" role="group" aria-label={`Choose an approach for ${skill.name}`}>
                        {challenge.choices.map((choice, index) => <button type="button" key={choice.label} className={`skill-challenge-option ${selectedAnswer === index ? "chosen" : ""}`} aria-pressed={selectedAnswer === index} onClick={() => setSkillChallengeAnswers((current) => ({ ...current, [skill.name]: index }))}>
                          <span>{String.fromCharCode(65 + index)}</span>{choice.label}
                        </button>)}
                      </div>
                      {selectedAnswer !== undefined ? <div className="skill-challenge-feedback" role="status"><span className="skill-feedback-icon"><Icon name="spark" size={16} /></span><p><strong>One idea to take with you</strong>{challenge.choices[selectedAnswer].insight}</p></div> : <p className="skill-challenge-hint">Pick the approach you’d try. There’s no score—each choice is a chance to think it through.</p>}
                      <button type="button" className="button-primary skill-challenge-cta" onClick={() => {
                        setSelectedSkills([skill.name]);
                        setGoal(`I’d like to ${challenge.goal}.`);
                        beginAssessment();
                      }}>Build a plan for {skill.name} <Icon name="arrow" size={15} /></button>
                    </div>}
                  </article>;
                })}
              </div>
            </div>
          </section>

          <section className="closing-cta section-shell">
            <div className="closing-flower">✳</div><span className="eyebrow">A good place to begin</span><h2>You don’t have to<br />have it <span className="serif-italic">all figured out.</span></h2><p>Just bring a little curiosity. We’ll take it from there.</p><button className="button-primary" onClick={beginAssessment}>Find your next skill <Icon name="arrow" size={17} /></button>
          </section>
        </main>
      )}

      {page === "assessment" && (
        <main className="assessment-page section-shell">
          <button className="back-link" onClick={() => setPage("home")}><Icon name="back" size={16} /> Back to home</button>
          <div className="assessment-layout">
            <aside className="assessment-aside">
              <span className="eyebrow">Your personal check-in</span>
              <h1>A few little<br />questions. <span className="serif-italic">Big potential.</span></h1>
              <p>No scores, no pressure. Just a chance to think about where you are and where you’d like to go.</p>
              <div className="step-list" aria-label="Assessment progress">
                {steps.map((label, index) => (
                  <div className={`step-list-item ${index === step ? "active" : ""} ${index < step ? "complete" : ""}`} key={label}>
                    <span>{index < step ? <Icon name="check" size={14} /> : `0${index + 1}`}</span>{label}
                  </div>
                ))}
              </div>
              <p className="assessment-save-status"><Icon name="leaf" size={14} /> {currentUser && accountSyncReady && !databaseNotice ? "Your answers save in this browser and your account." : databaseNotice ? "Your answers save in this browser; account sync is unavailable." : "Your answers save on this device as you go."}</p>
              <div className="aside-quote"><span>“</span><p>You’re allowed to start small. Small is still a start.</p><i>— A gentle reminder</i></div>
            </aside>
            <section className="assessment-card" aria-labelledby="assessment-title">
              <div className="progress-meta"><span>STEP 0{step + 1} <i>OF 03</i></span><span>{Math.round(((step + 1) / 3) * 100)}% there</span></div>
              <div className="progress-track"><span style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
              {step === 0 && (
                <div className="assessment-content">
                  <span className="question-label">FIRST, THE FUN PART</span>
                  <h2 id="assessment-title">What would you like to get a little better at?</h2>
                  <p className="question-hint">Choose whatever feels most useful right now. You can pick more than one.</p>
                  <div className="assessment-skills">
                    {skills.map((skill) => (
                      <button type="button" key={skill.name} aria-pressed={selectedSkills.includes(skill.name)} className={`assessment-skill ${selectedSkills.includes(skill.name) ? "selected" : ""}`} onClick={() => toggleSkill(skill.name)}>
                        <span className={`skill-symbol ${skill.tint}`}>{skill.icon}</span><span><strong>{skill.name}</strong><small>{skill.description}</small></span><span className="select-indicator"><Icon name="check" size={13} /></span>
                      </button>
                    ))}
                  </div>
                  <label className="field-label" htmlFor="goal">What would you love to do with this skill?</label>
                  <textarea id="goal" value={goal} onChange={(event) => { setGoal(event.target.value); setError(""); }} placeholder="For example: feel more at ease speaking up in meetings…" rows={3} maxLength={240} />
                  <div className="field-footer"><span>It can be a big dream or a small everyday thing.</span><span>{goal.length}/240</span></div>
                </div>
              )}
              {step === 1 && (
                <div className="assessment-content">
                  <span className="question-label">YOUR STARTING POINT</span>
                  <h2 id="assessment-title">How does it feel right now?</h2>
                  <p className="question-hint">There’s no right answer. This just helps us find a comfortable first step.</p>
                  <div className="confidence-list">
                    {selectedSkills.map((name) => {
                      const level = confidence[name] ?? 2;
                      return <div className="confidence-item" key={name}>
                        <div className="confidence-title"><span className={`skill-symbol ${skills.find((skill) => skill.name === name)?.tint ?? "peach"}`}>{skills.find((skill) => skill.name === name)?.icon}</span><strong>{name}</strong></div>
                        <div className="confidence-options" role="group" aria-label={`Current comfort with ${name}`}>
                          {["Just starting", "Finding my feet", "Pretty comfortable", "Ready to stretch"].map((label, index) => (
                            <button key={label} aria-pressed={level === index} className={level === index ? "chosen" : ""} onClick={() => setConfidence((current) => ({ ...current, [name]: index }))}><span>{index + 1}</span>{label}</button>
                          ))}
                        </div>
                        <div className="confidence-track"><span style={{ width: `${(level + 1) * 25}%` }} /></div>
                      </div>;
                    })}
                  </div>
                  <div className="gentle-note"><Icon name="spark" size={17} /><span>Your starting point isn’t a limit. It just helps us make your plan feel right for you.</span></div>
                </div>
              )}
              {step === 2 && (
                <div className="assessment-content">
                  <span className="question-label">YOUR KIND OF LEARNING</span>
                  <h2 id="assessment-title">How do you like to learn?</h2>
                  <p className="question-hint">Pick a few that sound good. We’ll mix them into your plan.</p>
                  <div className="method-grid">
                    {methods.map((method) => (
                      <button className={`method-option ${selectedMethods.includes(method.name) ? "selected" : ""}`} key={method.name} aria-pressed={selectedMethods.includes(method.name)} onClick={() => toggleMethod(method.name)}>
                        <span className="method-icon"><Icon name={method.icon} size={19} /></span><strong>{method.name}</strong><small>{method.note}</small><span className="select-indicator"><Icon name="check" size={13} /></span>
                      </button>
                    ))}
                  </div>
                  <div className="schedule-fields">
                    <div className="hours-field"><label className="field-label" htmlFor="hours">A little time each week</label><div className="hours-control"><input id="hours" type="range" min="1" max="10" value={hours} onChange={(event) => setHours(Number(event.target.value))} /><output htmlFor="hours"><strong>{hours}</strong> {hours === 1 ? "hour" : "hours"}<span> / week</span></output></div><div className="range-labels"><span>1 hour</span><span>10 hours</span></div></div>
                    <div className="date-field"><label className="field-label" htmlFor="target-date">A date to work toward <span>(optional)</span></label><input id="target-date" type="date" value={targetDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setTargetDate(event.target.value)} /></div>
                  </div>
                </div>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="assessment-actions">
                {step > 0 ? <button className="button-quiet" onClick={() => { setStep((current) => current - 1); setError(""); }}><Icon name="back" size={15} /> Go back</button> : <span className="privacy-note"><Icon name="leaf" size={14} /> Just for you, no pressure.</span>}
                <button className="button-primary" onClick={continueAssessment}>{step === 2 ? "Make my plan" : "Keep going"} <Icon name="arrow" size={16} /></button>
              </div>
            </section>
          </div>
        </main>
      )}

      {page === "results" && (
        <main className="results-page section-shell" id="plan">
          <div className="results-topline"><button className="back-link" onClick={() => setPage("home")}><Icon name="back" size={16} /> Home</button><button className="edit-link" onClick={editAssessment}>Adjust my answers <Icon name="arrow" size={15} /></button></div>
          <section className="results-hero">
            <div className="results-copy"><span className="eyebrow">YOUR PERSONAL GROWTH PLAN</span><h1>A good next step<br />for <span className="serif-italic">you.</span></h1><p className="results-summary">{goal || "You’re ready to make space for something new."}</p><div className="results-tags"><span><Icon name="clock" size={14} /> {hours} {hours === 1 ? "hour" : "hours"} a week</span><span><Icon name="spark" size={14} /> {selectedMethods.length} ways to learn</span>{targetDate && <span><Icon name="target" size={14} /> By {new Date(`${targetDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}</div></div>
            <div className="results-bloom"><div className="bloom-center"><Icon name="leaf" size={32} /></div><span className="bloom-petal petal-one" /><span className="bloom-petal petal-two" /><span className="bloom-petal petal-three" /><span className="bloom-petal petal-four" /><span className="bloom-petal petal-five" /><span className="bloom-label">GROWING<br />YOUR WAY</span></div>
          </section>
          <section className="plan-section">
            <div className="plan-heading"><div><span className="eyebrow">A plan shaped by your answers</span><h2>Your first few <span className="serif-italic">steps.</span></h2><p className="plan-personalization">Built around {selectedSkills.join(" + ")}, your goal, starting confidence, and the ways you like to learn.</p></div><span className="plan-duration"><Icon name="clock" size={15} /> A gentle 3-week start</span></div>
            {started && <div className="plan-progress"><div><strong>You’re on your way.</strong><span>{completedTasks.length} of {plan.length} steps complete</span></div><div className="plan-progress-track"><span style={{ width: `${(completedTasks.length / plan.length) * 100}%` }} /></div></div>}
            <div className="plan-steps">
              {plan.map((item, index) => {
                const complete = completedTasks.includes(index);
                return <article className={`plan-step ${complete ? "task-complete" : ""}`} key={item.title}>
                  <div className="timeline"><span className={complete ? "timeline-done" : ""}>{complete ? <Icon name="check" size={15} /> : `0${index + 1}`}</span>{index < plan.length - 1 && <i />}</div>
                  <div className="plan-step-body"><div className="plan-step-meta"><span>{item.tag}</span><span><Icon name="clock" size={13} /> {item.duration}</span><span><Icon name="book" size={13} /> {item.method}</span></div><h3>{item.title}</h3><p>{item.detail}</p>{started && <button className={`task-toggle ${complete ? "done" : ""}`} onClick={() => toggleTask(index)}>{complete ? <><Icon name="check" size={14} /> Done — nice work</> : <>Mark this step complete <Icon name="arrow" size={14} /></>}</button>}</div>
                  <span className={`plan-step-icon ${["peach", "lilac", "mint"][index]}`}><Icon name={index === 0 ? "spark" : index === 1 ? "target" : "chart"} size={19} /></span>
                </article>;
              })}
            </div>
            <div className="plan-bottom"><div className="method-note"><span className="method-note-icon"><Icon name="spark" size={18} /></span><div><strong>Made for how you learn</strong><p>{selectedMethods.join(" · ")}</p></div></div>{!started ? <button className="button-primary" onClick={() => setStarted(true)}>Start my plan <Icon name="arrow" size={16} /></button> : <span className="started-message"><Icon name="check" size={16} /> Your plan is underway</span>}</div>
            {!currentUser && <div className="account-save-callout"><div><strong>Want to pick this up on another device?</strong><span>Create an account to sync your learning plan and notes to PostgreSQL.</span></div><Link className="button-quiet" to="/register">Create free account <Icon name="arrow" size={14} /></Link></div>}
          </section>
          <section className="learning-studio" aria-labelledby="learning-title">
            <div className="learning-heading">
              <div><span className="eyebrow">Learn it by doing it</span><h2 id="learning-title">Your little <span className="serif-italic">learning studio.</span></h2><p>Choose a format, try a real exercise, and keep your notes here. Every lesson is ready to use—no sign-up or outside videos needed.</p></div>
              <div className="learning-skill-picker" role="group" aria-label="Choose a skill to practice">
                {selectedSkills.map((name) => <button type="button" key={name} aria-pressed={activeLearningSkill === name} className={activeLearningSkill === name ? "chosen" : ""} onClick={() => { setActiveLearningSkill(name); setActiveLesson(null); }}>{name}</button>)}
              </div>
            </div>
            <div className="learning-format-grid">
              {methods.map((method) => {
                const key = `${activeLearningSkill}:${method.name}`;
                const isPreferred = selectedMethods.includes(method.name);
                return <button type="button" key={method.name} className={`learning-format ${activeLesson === method.name ? "active" : ""}`} aria-pressed={activeLesson === method.name} onClick={() => setActiveLesson(method.name)}>
                  <span className="learning-format-icon"><Icon name={method.icon} size={19} /></span><span className="learning-format-copy"><strong>{method.name}</strong><small>{method.note}</small></span>
                  {completedActivities.includes(key) && <span className="learning-done"><Icon name="check" size={13} /> Tried</span>}
                  {isPreferred && <span className="preferred-label">Your pick</span>}
                </button>;
              })}
            </div>
            {activeLesson && (() => {
              const activityKey = `${activeLearningSkill}:${activeLesson}`;
              const done = completedActivities.includes(activityKey);
              const projectProgress = projectChecks[activeLearningSkill] ?? [false, false, false];
              const sceneIndex = videoScenes[activeLearningSkill] ?? 0;
              return <article className="lesson-panel" aria-live="polite">
                <div className="lesson-panel-heading"><div><span className="eyebrow">{activeLearningSkill} · {activeLesson}</span><h3>{activeLesson === "Short lessons" ? "One useful idea, in two minutes" : activeLesson === "Hands-on projects" ? "Make a small thing that matters" : activeLesson === "Reading" ? "A field guide for your next step" : activeLesson === "Videos" ? "A watch-style walkthrough" : "Practice with a gentle prompt"}</h3></div><button className="lesson-close" onClick={() => setActiveLesson(null)} aria-label="Close lesson">×</button></div>
                <div className="lesson-content">
                  {activeLesson === "Short lessons" && <div className="lesson-columns"><div className="lesson-callout"><span className="lesson-step-label">THE IDEA</span><p>{activeGuide.principle}</p></div><div><span className="lesson-step-label">SEE IT IN ACTION</span><p>{activeGuide.example}</p><span className="lesson-step-label">YOUR TWO-MINUTE TRY</span><p>{activeGuide.challenge}</p></div></div>}
                  {activeLesson === "Hands-on projects" && <div className="project-activity"><p className="lesson-intro">{activeGuide.challenge} Work through these small steps in order; your checklist stays saved on this device.</p>{activeGuide.project.map((task, index) => <label className="project-check" key={task}><input type="checkbox" checked={projectProgress[index] ?? false} onChange={() => toggleProjectCheck(index)} /><span className="project-check-number">0{index + 1}</span><span>{task}</span></label>)}</div>}
                  {activeLesson === "Reading" && <div className="reading-activity"><p className="reading-lead">{activeGuide.principle}</p>{activeGuide.reading.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="reading-prompt"><strong>Pause &amp; notice</strong><span>{activeGuide.reflection}</span></div></div>}
                  {activeLesson === "Videos" && <div className="video-activity"><div className="video-screen"><span className="video-scene-count">SCENE 0{sceneIndex + 1} / 0{activeGuide.video.length}</span><span className="video-play-mark"><Icon name="video" size={27} /></span><h4>{activeGuide.video[sceneIndex]?.title}</h4><p>{activeGuide.video[sceneIndex]?.narration}</p><span className="video-caption">SaikiScio mini lesson · text-led walkthrough</span></div><div className="video-controls"><span>Read the scene, then move at your own pace.</span><button className="button-quiet" onClick={() => setVideoScenes((current) => ({ ...current, [activeLearningSkill]: (current[activeLearningSkill] ?? 0) >= activeGuide.video.length - 1 ? 0 : (current[activeLearningSkill] ?? 0) + 1 }))}>{sceneIndex >= activeGuide.video.length - 1 ? "Replay walkthrough" : "Next scene"} <Icon name="arrow" size={14} /></button></div></div>}
                  {activeLesson === "Guided practice" && <div className="guided-activity"><div className="guided-prompt"><span className="lesson-step-label">YOUR GENTLE PROMPT</span><p>{activeGuide.challenge}</p></div><ol>{activeGuide.practice.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol><label className="field-label" htmlFor={`reflection-${activeLearningSkill}`}>A note to your future self</label><textarea id={`reflection-${activeLearningSkill}`} value={activityNotes[activeLearningSkill] ?? ""} maxLength={500} rows={3} placeholder={activeGuide.reflection} onChange={(event) => setActivityNotes((current) => ({ ...current, [activeLearningSkill]: event.target.value }))} /><div className="field-footer"><span>Your note is saved in this browser as you type.</span><span>{(activityNotes[activeLearningSkill] ?? "").length}/500</span></div></div>}
                </div>
                <div className="lesson-footer"><span className="lesson-save-note"><Icon name="leaf" size={14} /> {currentUser ? "Your lesson and progress save to your account." : "Your lesson and progress save on this device."}</span><button className={`task-toggle ${done ? "done" : ""}`} onClick={() => toggleActivityComplete(activityKey)}>{done ? <><Icon name="check" size={14} /> Lesson tried — nice work</> : <>Mark lesson tried <Icon name="arrow" size={14} /></>}</button></div>
              </article>;
            })()}
            <p className="learning-source-note">Original SaikiScio learning materials for practice. Video lessons are written, scene-by-scene walkthroughs rather than streamed videos.</p>
          </section>
          <div className="results-footer-note"><Icon name="leaf" size={16} /> Your path can change as you do. Come back and make it yours.</div>
          <div className="results-reset"><button className="text-link" onClick={startFresh}>Clear this saved learning and start over</button></div>
        </main>
      )}

      <footer className="site-footer"><div className="footer-inner"><button className="brand footer-brand" onClick={() => { navigate("/"); setPage("home"); }} aria-label="SaikiScio home"><span className="brand-mark"><Icon name="leaf" size={17} /></span><span>Saiki<span className="brand-period">Scio</span></span></button><span>Make room to grow, one small step at a time.</span><nav className="legal-links" aria-label="Legal and privacy"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/cookies">Manage cookies</Link></nav></div></footer>
      </>}
    </div>
  );
}

export default App;
