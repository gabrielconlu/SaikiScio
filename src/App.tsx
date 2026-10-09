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
type AuthUser = { id: string; email: string };
type DemoEmailMessage = { id: string; to: string; subject: string; purpose: string; link: string; createdAt: string };
type LegalPath = "/terms" | "/privacy" | "/cookies" | "/support";
type GeneratedRoadmap = {
  summary: string;
  actionItems: { title: string; instructions: string }[];
  milestones: { stage: string; measurableOutcome: string }[];
  practiceRoutine: {
    frequency: string;
    sessionsPerWeek: number;
    totalMinutes: number;
    segments: { activity: string; minutes: number; instructions: string }[];
  };
};

type RoadmapInputs = {
  skill: string;
  explanation: string;
  weeklyHours: number;
};

type WeeklyQuestRecord = { completed: string[]; notes: Record<string, string> };
type ScenarioAnswer = { opening: number; followup: number | null };

type SkillPlan = {
  skill: string;
  step: number;
  generatedRoadmap: GeneratedRoadmap | null;
  generatedRoadmapInputs: RoadmapInputs | null;
  goal: string;
  confidence: Record<string, number>;
  selectedMethods: LearningMethod[];
  hours: number;
  targetDate: string;
  savedPage: JourneyPage;
  started: boolean;
  completedTasks: number[];
  roadmapPracticeNotes: Record<string, string>;
  completedMilestones: number[];
  completedRoutineSegments: number[];
  weeklyQuestHistory: Record<string, WeeklyQuestRecord>;
};

type SavedProgress = {
  step: number;
  selectedSkills: string[];
  skillPlans: Record<string, SkillPlan>;
  generatedRoadmap: GeneratedRoadmap | null;
  generatedRoadmapInputs: RoadmapInputs | null;
  goal: string;
  confidence: Record<string, number>;
  selectedMethods: LearningMethod[];
  hours: number;
  targetDate: string;
  savedPage: JourneyPage;
  started: boolean;
  completedTasks: number[];
  roadmapPracticeNotes: Record<string, string>;
  completedMilestones: number[];
  completedRoutineSegments: number[];
  activeLearningSkill: string;
  activeLesson: LearningMethod | null;
  completedActivities: string[];
  activityNotes: Record<string, string>;
  projectChecks: Record<string, boolean[]>;
  videoScenes: Record<string, number>;
  skillChallengeAnswers: Record<string, ScenarioAnswer>;
  quizAnswers: Record<string, Record<string, number>>;
};

const progressStorageKey = "saikiscio-progress-v1";
const localApiUnavailableMessage = "The local account service is unreachable. Start both “npm run dev” (frontend and API proxy) and “npm run dev:api” (account API), then retry.";
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

const scenarioBranches: {
  setup: string;
  choices: { label: string; insight: string }[];
}[] = [
  {
    setup: "Your first move creates a useful opening. What would you do next to turn it into a small step forward?",
    choices: [
      { label: "Ask what would make the next step useful to the other person.", insight: "A small check-in keeps the next move relevant instead of assuming what someone needs." },
      { label: "Agree on one action that can be tried soon.", insight: "A concrete, low-pressure action turns a good moment into practice you can learn from." },
      { label: "Notice what helped, then try the approach again in another setting.", insight: "Reflecting on what worked helps you carry the skill into a new situation without expecting every moment to be identical." },
    ],
  },
  {
    setup: "The situation becomes less clear than you expected. How could you adjust without giving up on your first idea?",
    choices: [
      { label: "Pause and restate the main point in a simpler way.", insight: "A short reset can reduce confusion while keeping the useful idea intact." },
      { label: "Ask one specific question about what feels unclear.", insight: "A focused question helps reveal the real obstacle instead of adding more guesses." },
      { label: "Check which part is fact and which part is an assumption.", insight: "Separating evidence from assumptions gives you a steadier place to choose the next move." },
    ],
  },
  {
    setup: "Someone responds in an unexpected way. How could you stay curious and adapt your next move?",
    choices: [
      { label: "Listen, then summarize what you heard before replying.", insight: "A brief summary checks your understanding and shows the other person their response mattered." },
      { label: "Connect what changed back to the shared goal.", insight: "Returning to the goal can help you adapt without losing sight of what the group is trying to accomplish." },
      { label: "Choose one small experiment and see what it teaches you.", insight: "A reversible experiment makes uncertainty workable and gives you new evidence for the next attempt." },
    ],
  },
];

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

type WeeklyQuest = { id: string; title: string; instructions: string; reflectionPrompt: string };
type QuickQuizQuestion = { question: string; options: string[]; answerIndex: number; explanation: string };

function buildQuickQuiz(skill: string): QuickQuizQuestion[] {
  const guide = skillGuides[skill] ?? skillGuides.Communication;
  return [
    {
      question: `Which idea is a useful starting point for ${skill.toLowerCase()}?`,
      options: [guide.principle, "Wait until you feel completely ready before trying.", "Use one approach the same way in every situation."],
      answerIndex: 0,
      explanation: guide.principle,
    },
    {
      question: "What is a good way to put the lesson into practice?",
      options: ["Choose a high-stakes moment so you learn faster.", guide.challenge, "Avoid trying until you can predict the outcome."],
      answerIndex: 1,
      explanation: "A small, low-pressure attempt gives you useful experience without requiring a perfect result.",
    },
    {
      question: "After trying, what can help you keep learning?",
      options: ["Decide whether you are naturally good or bad at it.", "Move on without noticing what happened.", guide.reflection],
      answerIndex: 2,
      explanation: guide.reflection,
    },
  ];
}

function currentWeekKey(date = new Date()): string {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

function formatWeekKey(weekKey: string): string {
  const date = new Date(`${weekKey}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? weekKey
    : `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function weekSequence(weekKey: string): number {
  const date = Date.parse(`${weekKey}T00:00:00Z`);
  return Number.isNaN(date) ? 0 : Math.floor((date - Date.UTC(1970, 0, 5)) / (7 * 24 * 60 * 60 * 1000));
}

function buildWeeklyQuests(skill: string, goal: string, confidenceLevel: number, roadmap: GeneratedRoadmap | null, weekKey: string): WeeklyQuest[] {
  const guide = skillGuides[skill];
  const sequence = Math.max(0, weekSequence(weekKey));
  const phase = sequence % 4;
  const action = roadmap?.actionItems[sequence % Math.max(roadmap.actionItems.length, 1)];
  const routine = roadmap?.practiceRoutine.segments[sequence % Math.max(roadmap.practiceRoutine.segments.length, 1)];
  const milestone = roadmap?.milestones[sequence % Math.max(roadmap.milestones.length, 1)];
  const goalFocus = goal.trim()
    ? ` Connect it to your goal: “${goal.trim()}”.`
    : ` Choose one small situation where you could use ${skill.toLowerCase()}.`;
  const comfortGuidance = confidenceLevel <= 1
    ? " Keep it gentle: start by observing or rehearsing in a safe, low-pressure setting."
    : confidenceLevel >= 3
      ? " If it feels right, try a slightly more challenging situation and notice how you adapt."
      : " Keep the first attempt small enough to fit into an ordinary day.";
  const phaseNames = ["Spot it in real life", "Try a tiny experiment", "Use it toward your goal", "Reflect and level up"];
  const fallbackPractice = guide
    ? guide.practice[sequence % guide.practice.length]
    : `Choose one small, low-risk practice related to ${skill.toLowerCase()} and note what happened.`;
  const fallbackProject = guide
    ? guide.project[sequence % guide.project.length]
    : `Write down one useful idea about ${skill.toLowerCase()} that could help with your goal.`;
  return [
    {
      id: `notice-${sequence}`,
      title: phaseNames[phase],
      instructions: phase === 0
        ? `Notice one moment where ${skill.toLowerCase()} already shows up—or could help. What happened just before it?${goalFocus}`
        : phase === 1
          ? `Look for a moment that usually feels difficult and notice what makes it tricky before you act.${goalFocus}`
          : phase === 2
            ? `Notice one real situation connected to what you want to achieve, then name the skill that could move it forward.${goalFocus}`
            : `Look back at a recent attempt. Notice one thing that felt easier, clearer, or more useful than before.${goalFocus}`,
      reflectionPrompt: "What did you notice, and what might you try next?",
    },
    {
      id: `practice-${sequence}`,
      title: action ? `Roadmap practice: ${action.title}` : `Practice ${skill.toLowerCase()} in a small moment`,
      instructions: action
        ? `${action.instructions}${routine ? ` Try it with this routine: ${routine.activity} (${routine.minutes} minutes) — ${routine.instructions}` : ""}${goalFocus}`
        : `${fallbackPractice} ${goalFocus}${comfortGuidance}`,
      reflectionPrompt: "What did you actually try? What would you repeat or change?",
    },
    {
      id: `reflect-${sequence}`,
      title: milestone ? `Build toward: ${milestone.stage}` : phase === 3 ? "Celebrate one small improvement" : "Make the learning stick",
      instructions: milestone
        ? `${milestone.measurableOutcome}${goalFocus}`
        : `${fallbackProject} Then explain in your own words what you learned and how it connects to your next step.${goalFocus}${comfortGuidance}`,
      reflectionPrompt: milestone ? "What evidence shows you are moving toward this milestone?" : "What is one idea you want to remember for next week?",
    },
  ];
}

function parseSavedProgress(raw: string | null): SavedProgress | null {
  try {
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) throw new Error("Saved progress is not an object.");
    const item = value as Record<string, unknown>;
    const isLearningMethod = (method: unknown): method is LearningMethod =>
      methods.some((candidate) => candidate.name === method);
    const generatedRoadmap = item.generatedRoadmap == null
      ? null
      : parseGeneratedRoadmap(item.generatedRoadmap);
    const roadmapInputs = item.generatedRoadmapInputs;
    const generatedRoadmapInputs =
      typeof roadmapInputs === "object" &&
      roadmapInputs !== null &&
      !Array.isArray(roadmapInputs) &&
      typeof (roadmapInputs as Record<string, unknown>).skill === "string" &&
      typeof (roadmapInputs as Record<string, unknown>).explanation === "string" &&
      Number.isInteger((roadmapInputs as Record<string, unknown>).weeklyHours) &&
      ((roadmapInputs as Record<string, unknown>).weeklyHours as number) >= 1 &&
      ((roadmapInputs as Record<string, unknown>).weeklyHours as number) <= 10
        ? roadmapInputs as RoadmapInputs
        : null;
    if (
      typeof item.step !== "number" || !Array.isArray(item.selectedSkills) ||
      (item.generatedRoadmap != null && !generatedRoadmap) ||
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
      selectedSkills: item.selectedSkills.filter((skill): skill is string => typeof skill === "string" && skill.trim().length > 0 && skill.length <= 180).slice(0, 1),
      generatedRoadmap,
      generatedRoadmapInputs,
      goal: item.goal,
      confidence: Object.fromEntries(Object.entries(item.confidence).filter((entry): entry is [string, number] => typeof entry[1] === "number")),
      selectedMethods: item.selectedMethods.filter(isLearningMethod),
      hours: Math.min(10, Math.max(1, Math.floor(item.hours))),
      targetDate: item.targetDate,
      savedPage: item.savedPage,
      started: item.started,
      completedTasks: item.completedTasks.filter((task): task is number => typeof task === "number" && Number.isInteger(task)),
      roadmapPracticeNotes: typeof item.roadmapPracticeNotes === "object" && item.roadmapPracticeNotes !== null
        ? Object.fromEntries(Object.entries(item.roadmapPracticeNotes).filter((entry): entry is [string, string] => typeof entry[1] === "string").map(([key, note]) => [key, note.slice(0, 600)]))
        : {},
      completedMilestones: Array.isArray(item.completedMilestones)
        ? item.completedMilestones.filter((milestone): milestone is number => typeof milestone === "number" && Number.isInteger(milestone))
        : [],
      completedRoutineSegments: Array.isArray(item.completedRoutineSegments)
        ? item.completedRoutineSegments.filter((segment): segment is number => typeof segment === "number" && Number.isInteger(segment))
        : [],
      activeLearningSkill: typeof item.activeLearningSkill === "string" && item.activeLearningSkill.length <= 180 ? item.activeLearningSkill : skills[0].name,
      activeLesson: item.activeLesson,
      completedActivities: item.completedActivities.filter((activity): activity is string => typeof activity === "string"),
      activityNotes: Object.fromEntries(Object.entries(item.activityNotes).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
      projectChecks: Object.fromEntries(Object.entries(item.projectChecks).filter((entry): entry is [string, boolean[]] => Array.isArray(entry[1]) && entry[1].every((checked) => typeof checked === "boolean"))),
      videoScenes: Object.fromEntries(Object.entries(item.videoScenes).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isInteger(entry[1]))),
      skillChallengeAnswers: typeof item.skillChallengeAnswers === "object" && item.skillChallengeAnswers !== null && !Array.isArray(item.skillChallengeAnswers)
        ? Object.fromEntries(Object.entries(item.skillChallengeAnswers).filter((entry): entry is [string, ScenarioAnswer] =>
          typeof entry[1] === "object" && entry[1] !== null && !Array.isArray(entry[1]) &&
          Number.isInteger((entry[1] as Record<string, unknown>).opening) &&
          ((entry[1] as Record<string, unknown>).opening as number) >= 0 &&
          ((entry[1] as Record<string, unknown>).opening as number) <= 2 &&
          (((entry[1] as Record<string, unknown>).followup === null) ||
            (Number.isInteger((entry[1] as Record<string, unknown>).followup) &&
              ((entry[1] as Record<string, unknown>).followup as number) >= 0 &&
              ((entry[1] as Record<string, unknown>).followup as number) <= 2))))
        : {},
      quizAnswers: typeof item.quizAnswers === "object" && item.quizAnswers !== null && !Array.isArray(item.quizAnswers)
        ? Object.fromEntries(Object.entries(item.quizAnswers).filter((entry) => typeof entry[1] === "object" && entry[1] !== null && !Array.isArray(entry[1]))
          .map(([skill, answers]) => [skill, Object.fromEntries(Object.entries(answers as Record<string, unknown>).filter((answer): answer is [string, number] => Number.isInteger(answer[1]) && (answer[1] as number) >= 0 && (answer[1] as number) <= 3))]))
        : {},
      skillPlans: typeof item.skillPlans === "object" && item.skillPlans !== null && !Array.isArray(item.skillPlans)
        ? Object.fromEntries(Object.entries(item.skillPlans)
          .filter((entry) => isSkillPlan(entry[1]))
          .map(([key, plan]) => [key, {
            ...plan as SkillPlan,
            weeklyQuestHistory: isWeeklyQuestHistory((plan as SkillPlan).weeklyQuestHistory)
              ? (plan as SkillPlan).weeklyQuestHistory
              : {},
          }]))
        : {},
    };
  } catch (error) {
    console.warn("Unable to read SaikiScio progress from this browser.", error);
    return null;
  }
}

function isSkillPlan(value: unknown): value is SkillPlan {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const roadmap = item.generatedRoadmap == null ? null : parseGeneratedRoadmap(item.generatedRoadmap);
  const inputs = item.generatedRoadmapInputs;
  const inputObject = typeof inputs === "object" && inputs !== null && !Array.isArray(inputs)
    ? inputs as Record<string, unknown>
    : null;
  const weeklyHours = inputObject?.weeklyHours;
  const validInputs = inputs === null || (
    inputObject !== null &&
    typeof inputObject.skill === "string" &&
    typeof inputObject.explanation === "string" &&
    typeof weeklyHours === "number" &&
    weeklyHours >= 1 &&
    weeklyHours <= 10
  );
  return typeof item.skill === "string" && item.skill.trim().length > 0 && item.skill.length <= 180 &&
    typeof item.step === "number" && Number.isInteger(item.step) && item.step >= 0 && item.step <= 2 && Array.isArray(item.selectedMethods) &&
    item.selectedMethods.every((method) => methods.some((candidate) => candidate.name === method)) &&
    (item.generatedRoadmap == null || roadmap !== null) && validInputs &&
    typeof item.goal === "string" && typeof item.confidence === "object" && item.confidence !== null &&
    Object.values(item.confidence).every((level) => typeof level === "number") &&
    typeof item.hours === "number" && Number.isInteger(item.hours) && item.hours >= 1 && item.hours <= 10 && typeof item.targetDate === "string" &&
    (item.savedPage === "assessment" || item.savedPage === "results") &&
    typeof item.started === "boolean" && Array.isArray(item.completedTasks) &&
    item.completedTasks.every((index) => typeof index === "number" && Number.isInteger(index)) &&
    typeof item.roadmapPracticeNotes === "object" && item.roadmapPracticeNotes !== null &&
    Object.values(item.roadmapPracticeNotes).every((note) => typeof note === "string") &&
    Array.isArray(item.completedMilestones) && item.completedMilestones.every((index) => typeof index === "number" && Number.isInteger(index)) &&
    Array.isArray(item.completedRoutineSegments) && item.completedRoutineSegments.every((index) => typeof index === "number" && Number.isInteger(index)) &&
    (item.weeklyQuestHistory === undefined || isWeeklyQuestHistory(item.weeklyQuestHistory));
}

function isWeeklyQuestHistory(value: unknown): value is Record<string, WeeklyQuestRecord> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    Object.values(value).every((record) =>
      typeof record === "object" && record !== null && !Array.isArray(record) &&
      Array.isArray((record as Record<string, unknown>).completed) &&
      ((record as Record<string, unknown>).completed as unknown[]).every((id) => typeof id === "string") &&
      typeof (record as Record<string, unknown>).notes === "object" &&
      (record as Record<string, unknown>).notes !== null &&
      Object.values((record as Record<string, unknown>).notes as Record<string, unknown>).every((note) => typeof note === "string")
    );
}

function parseGeneratedRoadmap(value: unknown): GeneratedRoadmap | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const roadmap = value as Record<string, unknown>;
  const isText = (entry: unknown): entry is string =>
    typeof entry === "string" && entry.trim().length > 0 && entry.length <= 1200;
  const isTextPairList = (entry: unknown, first: string, second: string, min: number, max: number) =>
    Array.isArray(entry) &&
    entry.length >= min &&
    entry.length <= max &&
    entry.every((item) =>
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item) &&
      isText((item as Record<string, unknown>)[first]) &&
      isText((item as Record<string, unknown>)[second])
    );
  const routine = roadmap.practiceRoutine;
  if (
    !isText(roadmap.summary) ||
    !isTextPairList(roadmap.actionItems, "title", "instructions", 3, 4) ||
    !isTextPairList(roadmap.milestones, "stage", "measurableOutcome", 3, 3) ||
    typeof routine !== "object" ||
    routine === null ||
    Array.isArray(routine)
  ) return null;

  const routineRecord = routine as Record<string, unknown>;
  const segments = routineRecord.segments;
  if (
    !isText(routineRecord.frequency) ||
    !Number.isInteger(routineRecord.sessionsPerWeek) ||
    (routineRecord.sessionsPerWeek as number) < 1 ||
    (routineRecord.sessionsPerWeek as number) > 7 ||
    !Number.isInteger(routineRecord.totalMinutes) ||
    !Array.isArray(segments) ||
    segments.length < 2 ||
    segments.length > 4 ||
    !segments.every((segment) =>
      typeof segment === "object" &&
      segment !== null &&
      !Array.isArray(segment) &&
      isText((segment as Record<string, unknown>).activity) &&
      Number.isInteger((segment as Record<string, unknown>).minutes) &&
      ((segment as Record<string, unknown>).minutes as number) > 0 &&
      isText((segment as Record<string, unknown>).instructions)
    ) ||
    segments.reduce((sum, segment) => sum + (segment as { minutes: number }).minutes, 0) !== routineRecord.totalMinutes
  ) return null;

  return value as GeneratedRoadmap;
}

function roadmapMatchesInputs(roadmap: GeneratedRoadmap, inputs: RoadmapInputs): boolean {
  const ignoredTerms = new Set([
    "about", "after", "also", "become", "could", "from", "goal", "good", "have",
    "into", "just", "learn", "like", "make", "more", "much", "need", "practice",
    "skill", "some", "that", "their", "there", "these", "they", "this", "want",
    "what", "when", "where", "with", "would", "your",
  ]);
  const targets = `${inputs.skill} ${inputs.explanation}`
    .toLowerCase()
    .match(/[a-z0-9]{4,}/g)
    ?.filter((term) => !ignoredTerms.has(term)) ?? [];
  if (targets.length === 0) return true;

  const content = JSON.stringify(roadmap).toLowerCase();
  return targets.some((term) => content.includes(term));
}

function readSavedProgress(): SavedProgress | null {
  try {
    return parseSavedProgress(window.localStorage.getItem(progressStorageKey));
  } catch (error) {
    console.warn("Unable to read SaikiScio progress from this browser.", error);
    return null;
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
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [savedProgress, setSavedProgress] = useState(readSavedProgress);
  const [skillPlanLibrary, setSkillPlanLibrary] = useState<Record<string, SkillPlan>>(() => savedProgress?.skillPlans ?? {});
  const [journeyTouched, setJourneyTouched] = useState(() => savedProgress !== null);
  const [page, setPage] = useState<"home" | "assessment" | "results">("home");
  const [step, setStep] = useState(savedProgress?.step ?? 0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(savedProgress?.selectedSkills.length ? savedProgress.selectedSkills : ["Communication"]);
  const [customSkillDraft, setCustomSkillDraft] = useState("");
  const [generatedRoadmap, setGeneratedRoadmap] = useState<GeneratedRoadmap | null>(savedProgress?.generatedRoadmap ?? null);
  const [generatedRoadmapInputs, setGeneratedRoadmapInputs] = useState<RoadmapInputs | null>(savedProgress?.generatedRoadmapInputs ?? null);
  const [roadmapError, setRoadmapError] = useState("");
  const [roadmapBusy, setRoadmapBusy] = useState(false);
  const [goal, setGoal] = useState(savedProgress?.goal ?? "");
  const [confidence, setConfidence] = useState<Record<string, number>>(savedProgress?.confidence ?? {});
  const [selectedMethods, setSelectedMethods] = useState<LearningMethod[]>(savedProgress?.selectedMethods.length ? savedProgress.selectedMethods : ["Hands-on projects", "Short lessons"]);
  const [hours, setHours] = useState(savedProgress?.hours ?? 3);
  const [targetDate, setTargetDate] = useState(savedProgress?.targetDate ?? "");
  const [savedPage, setSavedPage] = useState<JourneyPage>(savedProgress?.savedPage ?? "assessment");
  const [started, setStarted] = useState(savedProgress?.started ?? false);
  const [completedTasks, setCompletedTasks] = useState<number[]>(savedProgress?.completedTasks ?? []);
  const [roadmapPracticeNotes, setRoadmapPracticeNotes] = useState<Record<string, string>>(savedProgress?.roadmapPracticeNotes ?? {});
  const [completedMilestones, setCompletedMilestones] = useState<number[]>(savedProgress?.completedMilestones ?? []);
  const [completedRoutineSegments, setCompletedRoutineSegments] = useState<number[]>(savedProgress?.completedRoutineSegments ?? []);
  const [weeklyQuestHistory, setWeeklyQuestHistory] = useState<Record<string, WeeklyQuestRecord>>(
    () => savedProgress?.skillPlans[savedProgress.selectedSkills[0]?.toLocaleLowerCase() ?? ""]?.weeklyQuestHistory ?? {},
  );
  const [activeRoadmapPractice, setActiveRoadmapPractice] = useState<number | null>(null);
  const [activeLearningSkill, setActiveLearningSkill] = useState(savedProgress?.activeLearningSkill ?? "Communication");
  const [activeLesson, setActiveLesson] = useState<LearningMethod | null>(savedProgress?.activeLesson ?? null);
  const [completedActivities, setCompletedActivities] = useState<string[]>(savedProgress?.completedActivities ?? []);
  const [activityNotes, setActivityNotes] = useState<Record<string, string>>(savedProgress?.activityNotes ?? {});
  const [projectChecks, setProjectChecks] = useState<Record<string, boolean[]>>(savedProgress?.projectChecks ?? {});
  const [videoScenes, setVideoScenes] = useState<Record<string, number>>(savedProgress?.videoScenes ?? {});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<string, number>>>(savedProgress?.quizAnswers ?? {});
  const [cookieNotice, setCookieNotice] = useState("");
  const [supportNotice, setSupportNotice] = useState("");
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
  const [emailPreviewAvailable, setEmailPreviewAvailable] = useState(false);
  const [emailFlowsAvailable, setEmailFlowsAvailable] = useState(false);
  const [demoEmails, setDemoEmails] = useState<DemoEmailMessage[]>([]);
  const [demoEmailError, setDemoEmailError] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [activeSkillPreview, setActiveSkillPreview] = useState<string | null>("Communication");
  const [skillChallengeAnswers, setSkillChallengeAnswers] = useState<Record<string, ScenarioAnswer>>(savedProgress?.skillChallengeAnswers ?? {});
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [newPlanSkill, setNewPlanSkill] = useState("");
  const [error, setError] = useState("");

  const activeGuide = skillGuides[activeLearningSkill] ?? skillGuides.Communication;
  const plan = useMemo(
    () => buildLearningPlan(selectedSkills, goal, confidence, selectedMethods, hours),
    [selectedSkills, goal, confidence, selectedMethods, hours],
  );
  const currentRoadmapInputs: RoadmapInputs = {
    skill: selectedSkills[0] ?? "Communication",
    explanation: goal,
    weeklyHours: hours,
  };
  const visibleRoadmap =
    generatedRoadmap &&
    generatedRoadmapInputs?.skill === currentRoadmapInputs.skill &&
    generatedRoadmapInputs.explanation === currentRoadmapInputs.explanation &&
    generatedRoadmapInputs.weeklyHours === currentRoadmapInputs.weeklyHours &&
    roadmapMatchesInputs(generatedRoadmap, currentRoadmapInputs)
      ? generatedRoadmap
      : null;
  const activeSkillName = currentRoadmapInputs.skill;
  const captureActiveSkillPlan = (): SkillPlan => ({
    skill: activeSkillName,
    step,
    generatedRoadmap,
    generatedRoadmapInputs,
    goal,
    confidence,
    selectedMethods,
    hours,
    targetDate,
    savedPage,
    started,
    completedTasks,
    roadmapPracticeNotes,
    completedMilestones,
    completedRoutineSegments,
    weeklyQuestHistory,
  });
  const availableSkillPlans = {
    ...skillPlanLibrary,
    [activeSkillName.toLocaleLowerCase()]: captureActiveSkillPlan(),
  };
  const activeWeekKey = currentWeekKey();
  const activeWeekRecord = weeklyQuestHistory[activeWeekKey] ?? { completed: [], notes: {} };
  const weeklyQuests = buildWeeklyQuests(activeSkillName, goal, confidence[activeSkillName] ?? 2, visibleRoadmap, activeWeekKey);
  const quickQuiz = buildQuickQuiz(activeLearningSkill);
  const activeQuizAnswers = quizAnswers[activeLearningSkill] ?? {};
  const completedWeeklyQuestCount = weeklyQuests.filter((quest) => activeWeekRecord.completed.includes(quest.id)).length;
  const nextRoadmapActionIndex = visibleRoadmap?.actionItems.findIndex((_, index) => !completedTasks.includes(index)) ?? -1;
  const nextRoutineSegmentIndex = visibleRoadmap?.practiceRoutine.segments.findIndex((_, index) => !completedRoutineSegments.includes(index)) ?? -1;
  const roadmapCheckpointCount = visibleRoadmap
    ? visibleRoadmap.actionItems.length + visibleRoadmap.milestones.length + visibleRoadmap.practiceRoutine.segments.length
    : 0;
  const completedRoadmapCheckpointCount = visibleRoadmap
    ? completedTasks.filter((index) => index >= 0 && index < visibleRoadmap.actionItems.length).length +
      completedMilestones.filter((index) => index >= 0 && index < visibleRoadmap.milestones.length).length +
      completedRoutineSegments.filter((index) => index >= 0 && index < visibleRoadmap.practiceRoutine.segments.length).length
    : 0;
  const roadmapProgressPercent = roadmapCheckpointCount > 0
    ? Math.round((completedRoadmapCheckpointCount / roadmapCheckpointCount) * 100)
    : 0;

  const applyProgress = (progress: SavedProgress) => {
    setSavedProgress(progress);
    setSkillPlanLibrary(progress.skillPlans);
    setStep(progress.step);
    setSelectedSkills(progress.selectedSkills.length ? progress.selectedSkills.slice(0, 1) : ["Communication"]);
    setGeneratedRoadmap(progress.generatedRoadmap);
    setGeneratedRoadmapInputs(progress.generatedRoadmapInputs);
    setGoal(progress.goal);
    setConfidence(progress.confidence);
    setSelectedMethods(progress.selectedMethods.length ? progress.selectedMethods : ["Hands-on projects", "Short lessons"]);
    setHours(progress.hours);
    setTargetDate(progress.targetDate);
    setSavedPage(progress.savedPage);
    setStarted(progress.started);
    setCompletedTasks(progress.completedTasks);
    setRoadmapPracticeNotes(progress.roadmapPracticeNotes);
    setCompletedMilestones(progress.completedMilestones);
    setCompletedRoutineSegments(progress.completedRoutineSegments);
    setWeeklyQuestHistory(progress.skillPlans[progress.selectedSkills[0]?.toLocaleLowerCase() ?? ""]?.weeklyQuestHistory ?? {});
    setActiveLearningSkill(progress.activeLearningSkill);
    setActiveLesson(progress.activeLesson);
    setCompletedActivities(progress.completedActivities);
    setActivityNotes(progress.activityNotes);
    setProjectChecks(progress.projectChecks);
    setVideoScenes(progress.videoScenes);
    setQuizAnswers(progress.quizAnswers);
    setSkillChallengeAnswers(progress.skillChallengeAnswers);
    setJourneyTouched(true);
  };

  useEffect(() => {
    if (!journeyTouched) return;
    const progress: SavedProgress = {
      step,
      selectedSkills,
      skillPlans: {
        ...skillPlanLibrary,
        [activeSkillName.toLocaleLowerCase()]: captureActiveSkillPlan(),
      },
      generatedRoadmap,
      generatedRoadmapInputs,
      goal,
      confidence,
      selectedMethods,
      hours,
      targetDate,
      savedPage,
      started,
      completedTasks,
      roadmapPracticeNotes,
      completedMilestones,
      completedRoutineSegments,
      activeLearningSkill,
      activeLesson,
      completedActivities,
      activityNotes,
      projectChecks,
      videoScenes,
      skillChallengeAnswers,
      quizAnswers,
    };
    try {
      window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
      setSavedProgress(progress);
      setStorageError("");
    } catch (saveError) {
      console.error("Unable to save SaikiScio progress in this browser.", saveError);
      setStorageError("Your browser could not save this update. Check its storage settings or export your notes before leaving.");
    }
  }, [journeyTouched, skillPlanLibrary, step, selectedSkills, generatedRoadmap, generatedRoadmapInputs, goal, confidence, selectedMethods, hours, targetDate, savedPage, started, completedTasks, roadmapPracticeNotes, completedMilestones, completedRoutineSegments, weeklyQuestHistory, activeLearningSkill, activeLesson, completedActivities, activityNotes, projectChecks, videoScenes, skillChallengeAnswers, quizAnswers]);

  useEffect(() => {
    let active = true;
    const initializeAccount = async () => {
      try {
        const configResponse = await fetch("/api/auth/config");
        if (!configResponse.ok) throw new Error(`Authentication configuration request failed with status ${configResponse.status}.`);
        const config: { demoEmailPreviewAvailable?: boolean; emailVerificationAvailable?: boolean; passwordRecoveryAvailable?: boolean } = await configResponse.json();
        if (active) {
          const emailFlowsEnabled = Boolean(config.emailVerificationAvailable && config.passwordRecoveryAvailable);
          setEmailFlowsAvailable(emailFlowsEnabled);
          setEmailPreviewAvailable(Boolean(config.demoEmailPreviewAvailable));
        }
      } catch (configError) {
        console.warn("Unable to load SaikiScio email feature availability.", configError);
      }
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
            ? localApiUnavailableMessage
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
        const detail = error instanceof TypeError
          ? localApiUnavailableMessage
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred.";
        setDatabaseNotice(`Account sync could not save this update: ${detail} Your progress is still saved in this browser.`);
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [accountSyncReady, currentUser, journeyTouched, savedProgress]);

  const hasSavedProgress = savedProgress !== null;

  const applySkillPlan = (skillPlan: SkillPlan) => {
    setSelectedSkills([skillPlan.skill]);
    setActiveLearningSkill(skillPlan.skill);
    setStep(skillPlan.step);
    setGeneratedRoadmap(skillPlan.generatedRoadmap);
    setGeneratedRoadmapInputs(skillPlan.generatedRoadmapInputs);
    setGoal(skillPlan.goal);
    setConfidence(skillPlan.confidence);
    setSelectedMethods(skillPlan.selectedMethods.length ? skillPlan.selectedMethods : ["Hands-on projects", "Short lessons"]);
    setHours(skillPlan.hours);
    setTargetDate(skillPlan.targetDate);
    setSavedPage(skillPlan.savedPage);
    setStarted(skillPlan.started);
    setCompletedTasks(skillPlan.completedTasks);
    setRoadmapPracticeNotes(skillPlan.roadmapPracticeNotes);
    setCompletedMilestones(skillPlan.completedMilestones);
    setCompletedRoutineSegments(skillPlan.completedRoutineSegments);
    setWeeklyQuestHistory(skillPlan.weeklyQuestHistory);
    setPage(skillPlan.savedPage);
    setJourneyTouched(true);
    setPlanPickerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const switchSkillPlan = (skillPlan: SkillPlan) => {
    if (skillPlan.skill.toLocaleLowerCase() === activeSkillName.toLocaleLowerCase()) return;
    setSkillPlanLibrary((current) => ({
      ...current,
      [activeSkillName.toLocaleLowerCase()]: captureActiveSkillPlan(),
    }));
    applySkillPlan(skillPlan);
  };

  const startSkillPlan = (rawSkill: string, initialGoal = "") => {
    const name = rawSkill.trim().replace(/\s+/g, " ");
    if (!name || name.length > 180) {
      setError("Enter a skill under 180 characters.");
      return;
    }
    const existingPlan = skillPlanLibrary[name.toLocaleLowerCase()];
    if (existingPlan) {
      if (name.toLocaleLowerCase() === activeSkillName.toLocaleLowerCase()) {
        setPlanPickerOpen(false);
        return;
      }
      switchSkillPlan(existingPlan);
      return;
    }

    const current = captureActiveSkillPlan();
    setSkillPlanLibrary((plans) => ({
      ...plans,
      [activeSkillName.toLocaleLowerCase()]: current,
    }));
    setSelectedSkills([name]);
    setActiveLearningSkill(name);
    setStep(0);
    setGeneratedRoadmap(null);
    setGeneratedRoadmapInputs(null);
    setGoal(initialGoal);
    setSelectedMethods(["Hands-on projects", "Short lessons"]);
    setHours(3);
    setTargetDate("");
    setSavedPage("assessment");
    setStarted(false);
    setCompletedTasks([]);
    setRoadmapPracticeNotes({});
    setCompletedMilestones([]);
    setCompletedRoutineSegments([]);
    setWeeklyQuestHistory({});
    setRoadmapError("");
    setError("");
    setPage("assessment");
    setJourneyTouched(true);
    setPlanPickerOpen(false);
    setNewPlanSkill("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        ? localApiUnavailableMessage
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
    setRoadmapError("");
    setJourneyTouched(true);
    setSavedPage("assessment");
    setPage("assessment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSkill = (name: string) => {
    if (name.toLocaleLowerCase() !== activeSkillName.toLocaleLowerCase()) startSkillPlan(name);
    setError("");
  };

  const addCustomSkill = () => {
    const name = customSkillDraft.trim().replace(/\s+/g, " ");
    if (!name) {
      setError("Enter a skill or area you want to learn.");
      return;
    }
    if (name.length > 180) {
      setError("Keep the skill name under 180 characters.");
      return;
    }
    setCustomSkillDraft("");
    startSkillPlan(name);
  };

  const toggleMethod = (name: LearningMethod) => {
    setSelectedMethods((current) =>
      current.includes(name)
        ? current.filter((method) => method !== name)
        : [...current, name],
    );
    setError("");
  };

  const generatePersonalizedRoadmap = async () => {
    const inputs: RoadmapInputs = {
      skill: selectedSkills[0] ?? "Communication",
      explanation: goal,
      weeklyHours: hours,
    };
    setRoadmapBusy(true);
    setRoadmapError("");
    setGeneratedRoadmap(null);
    setGeneratedRoadmapInputs(null);
    try {
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const result: { roadmap?: unknown; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? `Roadmap request failed with status ${response.status}.`);
      const roadmap = parseGeneratedRoadmap(result.roadmap);
      if (!roadmap) throw new Error("The AI service returned an incomplete roadmap. Please try again.");
      if (!roadmapMatchesInputs(roadmap, inputs)) {
        throw new Error("The AI service returned a roadmap that does not match your skill or goal. Please try again.");
      }
      setCompletedTasks([]);
      setRoadmapPracticeNotes({});
      setCompletedMilestones([]);
      setCompletedRoutineSegments([]);
      setActiveRoadmapPractice(null);
      setStarted(false);
      setGeneratedRoadmap(roadmap);
      setGeneratedRoadmapInputs(inputs);
      return true;
    } catch (generationError) {
      console.error("SaikiScio AI roadmap generation failed.", generationError);
      setRoadmapError(generationError instanceof Error ? generationError.message : "Unable to generate a roadmap. Please try again.");
      return false;
    } finally {
      setRoadmapBusy(false);
    }
  };

  const continueAssessment = async () => {
    if (step === 0 && selectedSkills.length === 0) {
      setError("Choose a skill or add any skill you want to learn.");
      return;
    }
    if (step === 2 && selectedMethods.length === 0) {
      setError("Choose at least one way you like to learn.");
      return;
    }
    setError("");
    if (step < 2) setStep((current) => current + 1);
    else {
      setStarted(false);
      setCompletedTasks([]);
      setRoadmapPracticeNotes({});
      setCompletedMilestones([]);
      setCompletedRoutineSegments([]);
      setActiveRoadmapPractice(null);
      await generatePersonalizedRoadmap();
      setSavedPage("results");
      setPage("results");
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

  const toggleMilestone = (index: number) => {
    setCompletedMilestones((current) =>
      current.includes(index) ? current.filter((milestone) => milestone !== index) : [...current, index],
    );
  };

  const toggleRoutineSegment = (index: number) => {
    setStarted(true);
    setCompletedRoutineSegments((current) =>
      current.includes(index) ? current.filter((segment) => segment !== index) : [...current, index],
    );
  };

  const focusRoadmapStep = (targetId: string, actionIndex: number | null = null) => {
    setStarted(true);
    if (actionIndex !== null) setActiveRoadmapPractice(actionIndex);
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
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
    setSkillPlanLibrary({});
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
    setRoadmapPracticeNotes({});
    setCompletedMilestones([]);
    setCompletedRoutineSegments([]);
    setGeneratedRoadmap(null);
    setGeneratedRoadmapInputs(null);
    setActiveLearningSkill("Communication");
    setActiveLesson(null);
    setCompletedActivities([]);
    setActivityNotes({});
    setProjectChecks({});
    setVideoScenes({});
    setQuizAnswers({});
    setSkillChallengeAnswers({});
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
      const result: { user?: AuthUser; status?: string; emailPreviewAvailable?: boolean; emailVerificationRequired?: boolean; error?: string } = await response.json();
      if (isRegister && response.ok && result.status === "verification-required") {
        setEmailPreviewAvailable(result.emailPreviewAvailable ?? false);
        setAuthPassword("");
        setAuthPasswordConfirm("");
        setAuthNotice("Account created. Verify your email before signing in.");
        setAccountSyncReady(true);
        return;
      }
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
      if (isRegister && result.emailVerificationRequired === false) {
        setAccountMessage("Account created and signed in. No verification email was sent, and password recovery is unavailable in this deployment. Keep your password safe.");
      }
      setDatabaseNotice("");
      setAuthPassword("");
      setAuthPasswordConfirm("");
      setAuthInitialized(true);
      setAccountSyncReady(true);
      navigate(isRegister && result.emailVerificationRequired === false ? "/account" : "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      console.error("SaikiScio authentication request failed.", submitError);
      setAuthError(submitError instanceof Error ? submitError.message : "Unable to complete sign in. Please try again.");
      setAccountSyncReady(true);
    } finally {
      setAuthBusy(false);
    }
  };

  const submitEmailFlow = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");
    setAuthBusy(true);
    const token = new URLSearchParams(search).get("token");
    let endpoint = "";
    let payload: Record<string, string> = {};

    if (pathname === "/verify-email" && token) {
      endpoint = "/api/auth/verify-email";
      payload = { token };
    } else if (pathname === "/reset-password") {
      if (!token) {
        setAuthError("This reset link is missing its token. Request a new link and try again.");
        setAuthBusy(false);
        return;
      }
      if (newAccountPassword !== authPasswordConfirm) {
        setAuthError("The passwords do not match.");
        setAuthBusy(false);
        return;
      }
      endpoint = "/api/auth/password-reset/confirm";
      payload = { token, password: newAccountPassword };
    } else {
      endpoint = pathname === "/forgot-password"
        ? "/api/auth/password-reset/request"
        : "/api/auth/verification/resend";
      payload = { email: authEmail };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { status?: string; emailPreviewAvailable?: boolean; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to complete this request.");
      setEmailPreviewAvailable(result.emailPreviewAvailable ?? false);
      if (pathname === "/verify-email" && token) {
        setAuthNotice("Email verified. You can now sign in.");
        setNewAccountPassword("");
        setAuthPasswordConfirm("");
        navigate("/login");
      } else if (pathname === "/reset-password") {
        setAuthNotice("Password updated. Sign in with your new password.");
        setNewAccountPassword("");
        setAuthPasswordConfirm("");
        navigate("/login");
      } else {
        setAuthNotice(pathname === "/forgot-password"
          ? "If a verified account uses that address, a password-reset link is in the local demo inbox."
          : "If that address belongs to an unverified account, a verification link is in the local demo inbox.");
      }
    } catch (flowError) {
      console.error("SaikiScio email verification or recovery request failed.", flowError);
      setAuthError(flowError instanceof Error ? flowError.message : "Unable to complete this request. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const loadDemoEmailPreview = async () => {
    setDemoEmailError("");
    try {
      const response = await fetch("/api/dev/mail-preview");
      const result: { messages?: DemoEmailMessage[]; error?: string } = await response.json();
      if (!response.ok || !result.messages) throw new Error(result.error ?? "The local demo inbox is unavailable.");
      setDemoEmails(result.messages);
    } catch (previewError) {
      console.error("Unable to load the local SaikiScio demo inbox.", previewError);
      setDemoEmailError(previewError instanceof Error ? previewError.message : "The local demo inbox is unavailable.");
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

  const legalPath = pathname === "/terms" || pathname === "/privacy" || pathname === "/cookies" || pathname === "/support"
    ? pathname as LegalPath
    : null;
  const isAuthPage = [
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/dev-mail",
  ].includes(pathname);
  const isAccountPage = pathname === "/account";
  const authMode = pathname === "/register" ? "register" : "login";
  const emailFlowToken = new URLSearchParams(search).get("token");
  const legalTitle = legalPath === "/terms" ? "Terms of use"
    : legalPath === "/privacy" ? "Privacy notice"
      : legalPath === "/cookies" ? "Cookie & storage settings"
        : "Support";
  const builtInLearningSkills = selectedSkills.filter((name) => Object.prototype.hasOwnProperty.call(skillGuides, name));

  useEffect(() => {
    if (isAccountPage && authInitialized && !currentUser) navigate("/login", { replace: true });
  }, [isAccountPage, authInitialized, currentUser, navigate]);

  useEffect(() => {
    if (pathname === "/dev-mail" && emailPreviewAvailable) void loadDemoEmailPreview();
  }, [pathname, emailPreviewAvailable]);

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
        <div className="legal-page-top"><Link className="back-link" to="/"><Icon name="back" size={16} /> Back to SaikiScio</Link><span className="eyebrow">SAIKISCIO · LEGAL &amp; SUPPORT</span></div>
        <div className="legal-page-layout">
          <aside className="legal-sidebar"><span className="eyebrow">YOUR INFORMATION</span><h1>Clear, thoughtful<br /><span className="serif-italic">ground rules.</span></h1><nav aria-label="Legal and support pages"><Link className={legalPath === "/terms" ? "active" : ""} to="/terms">Terms of use</Link><Link className={legalPath === "/privacy" ? "active" : ""} to="/privacy">Privacy notice</Link><Link className={legalPath === "/cookies" ? "active" : ""} to="/cookies">Cookies &amp; storage</Link><Link className={legalPath === "/support" ? "active" : ""} to="/support">Support</Link></nav><p>These pages explain how SaikiScio works and how to manage your information.</p></aside>
          <article className="legal-document">
            <h1>{legalTitle}</h1>
            {legalPath === "/terms" && <div className="legal-copy">
              <p className="legal-lead">These terms explain how to use SaikiScio, an educational skill-practice website independently operated by its creator in the Philippines. The site is available to learners in the Philippines and other countries.</p>
              <h2>1. Who may use SaikiScio</h2><p>SaikiScio is an educational site for learners of any age. Children should use the site with a parent or guardian's guidance and permission, and a parent or guardian should supervise any account creation and information submitted. Do not create an account for someone else without their permission.</p>
              <h2>2. Your account and password</h2><p>Provide an email address you can access, keep your password confidential, and use a unique password. Production accounts can be created and used without email verification; no verification or password-recovery email is sent. Password recovery is unavailable in the current deployment, so keep your password safe. The local portfolio demo previews one-time verification and recovery links without sending email. You are responsible for activity under your account and should contact support if you suspect unauthorized access.</p>
              <h2>3. Learning content and appropriate use</h2><p>SaikiScio provides general educational prompts, examples, and practice activities. When configured, Google AI Studio may generate learning roadmaps from the skill, explanation, and weekly availability you submit. AI-generated content can be inaccurate or incomplete; review it and use your own judgment. The content is not professional, clinical, legal, financial, or employment advice and does not guarantee a particular result. Adapt activities to your circumstances, and stop if an exercise is uncomfortable or unsafe.</p><p>Do not use the service unlawfully, interfere with its operation, probe or bypass security, upload malicious content, or attempt to access another person's account or information.</p>
              <h2>4. Your content and saved progress</h2><p>You remain responsible for the goals, notes, and other information you submit. You authorize SaikiScio to store and process that information to provide and maintain account, progress-saving, and learning-plan features, as described in the Privacy notice. Avoid entering passwords, financial information, health information, or other sensitive personal data in learning prompts. You may clear this browser's copy or delete your account and associated account progress using the account controls. Clearing browser data alone does not delete server-side account data.</p>
              <h2>5. Ownership and permission to use the service</h2><p>SaikiScio's name, design, software, and original learning materials are owned by their respective rights holders. Subject to these terms, you may use the website for personal, non-commercial learning. Do not copy, redistribute, or commercially exploit site materials except where applicable law permits or the rights holder gives permission. AI-generated material may not be unique and should be independently reviewed.</p>
              <h2>6. Availability and changes</h2><p>Features may change, be interrupted, or be discontinued. No backup or uninterrupted availability is promised. Keep a separate copy of information important to you. These terms may change as the service changes. Notice or consent will be provided for material changes where required by law.</p>
              <h2>7. Disclaimers and liability</h2><p>To the extent permitted by law, the service is provided “as is” without guarantees that it will always be available, error-free, or suitable for a particular purpose. Nothing in these terms limits rights or remedies that cannot legally be limited in your jurisdiction.</p>
              <h2>8. Contact and governing law</h2><p>SaikiScio is independently operated by its creator in the Philippines. For support or questions about these terms, email <a href="mailto:gabbyconlu@gmail.com">gabbyconlu@gmail.com</a>. Philippine law governs these terms, subject to consumer protections and other rights that cannot be excluded under the laws that apply to you.</p>
            </div>}
            {legalPath === "/privacy" && <div className="legal-copy">
              <p className="legal-lead">This notice explains what personal information SaikiScio processes, why it is used, and the controls available to you. SaikiScio is independently operated by its creator in the Philippines and is available to learners in the Philippines and other countries.</p>
              <h2>1. Information processed</h2><p><strong>Account information:</strong> email address, a password hash (not the original password), email-verification status, account timestamps, and hashes of sign-in and one-time verification/recovery tokens.</p><p><strong>Learning information:</strong> selected skills, goal and explanation text, confidence ratings, learning-format preferences, weekly availability, optional target date, roadmap, lesson notes, checklist states, and completion progress.</p><p><strong>Browser-stored information:</strong> learning progress is stored in local storage on this device. This is browser storage, not a cookie, and it may remain after you close the browser until you clear it.</p><p><strong>Technical information:</strong> the essential sign-in cookie and technical request information processed by the hosting and database providers to deliver, secure, and troubleshoot the service. The local portfolio demo keeps temporary email-preview links in API memory; it does not send email. The current app has no analytics or advertising integration.</p>
              <h2>2. Purposes and AI processing</h2><p>Account data is used to register and authenticate you; learning information is used to create, display, and save your learning plan; and technical information is used to operate and protect the service. If you request an AI roadmap, your target skill, explanation, and weekly availability are sent from the server to Google AI Studio. Do not put passwords or sensitive personal information in a prompt. Google's handling of submitted information is governed by its applicable terms and data policies.</p>
              <h2>3. Hosting, storage, and service providers</h2><p>The live website and API are hosted through Vercel. Account records and saved progress are stored in a hosted PostgreSQL database connected to the project; the database provider and its storage region are not known to the project operator. Google AI Studio processes roadmap requests when that feature is used. The website also requests fonts from Google Fonts, which may receive technical connection information such as your IP address and browser details. These providers process information under their own terms and privacy practices; their processing or storage may take place outside the Philippines.</p><p>Passwords are hashed using scrypt. Session tokens are randomly generated, stored as hashes in PostgreSQL, and sent in an HttpOnly, SameSite=Strict cookie that is Secure in production. Production accounts can be registered and used without email verification. Email is not sent by the current deployment, so email-based password recovery is unavailable. The local portfolio demo can preview temporary verification and recovery links in memory.</p>
              <h2>4. Retention and deletion</h2><p>Account and learning records are kept until you delete your account. When you request account deletion using Account → Delete account, the account and associated saved learning in the application database are deleted within seven days. Sign out invalidates your session. Clearing local browser data removes only that device's copy and does not delete the account copy. Backup copies and operational or security logs may remain for periods controlled by the hosting, database, or other service providers; their retention periods are not known to the project operator.</p>
              <h2>5. Your choices and privacy requests</h2><p>You can review or change learning information in the app, clear this device's saved learning, sign out, or delete your account. Depending on where you live, you may have additional rights to access, correct, delete, restrict, or receive a copy of personal information, or to complain to a regulator. For support or a privacy request, email <a href="mailto:gabbyconlu@gmail.com">gabbyconlu@gmail.com</a>.</p>
              <h2>6. Children, international use, and updates</h2><p>SaikiScio is an educational site for learners of any age and is available in the Philippines and other countries. Children should use the site with a parent or guardian's guidance and permission. Parents or guardians should supervise a child's account and information submitted. Privacy rights and requirements differ by location. If the service's data practices change, this notice will be updated.</p>
            </div>}
            {legalPath === "/cookies" && <div className="legal-copy">
              <p className="legal-lead">SaikiScio currently uses one essential sign-in cookie and browser local storage for learning progress. The app does not currently include analytics or marketing tools, or set analytics, advertising, or preference cookies. Hosting and service providers may process technical request data as described in the Privacy notice.</p>
              <h2>Essential sign-in cookie</h2><p><strong>Name:</strong> <code>saikiscio_session</code>. <strong>Purpose:</strong> authenticate your account requests and keep you signed in. <strong>Duration:</strong> up to seven days, or until you sign out. It is HttpOnly and SameSite=Strict; it is marked Secure in production. It is necessary for account sign-in and cannot be switched off while signed in. Use the sign-out control to end the session and remove this cookie.</p>
              {currentUser && <button className="button-quiet cookie-signout" type="button" onClick={() => void signOut()}>Sign out and clear this session</button>}
              <h2>Learning data in this browser</h2><p>SaikiScio saves your check-in answers, roadmap, practice notes, and progress in this browser's local storage so you can return to them. This is not a cookie. If you are signed in, a copy is also saved to the configured PostgreSQL account database. Clearing this browser's copy does not delete the account copy.</p>
              <button className="button-quiet cookie-clear" type="button" onClick={() => {
                clearLearningState();
                setPage("home");
                setCookieNotice("This browser's saved learning was cleared. If you have an account, its separate saved copy remains.");
              }}>Clear this browser's saved learning</button>
              {cookieNotice && <p className="cookie-save-message" role="status">{cookieNotice}</p>}
              <h2>Other cookies and third-party requests</h2><p>No analytics or advertising cookies are set by the current app. Google Fonts is requested to display the site's typography and may receive technical connection information; this page does not treat that request as a cookie preference. AI roadmap requests send the skill, explanation, and weekly time to Google AI Studio as described in the Privacy notice. If analytics, advertising, or marketing tools are added later, this notice and any required consent controls should be reviewed and updated before those tools are enabled.</p>
              <p>For help with these settings, email <a href="mailto:gabbyconlu@gmail.com">gabbyconlu@gmail.com</a>.</p>
            </div>}
            {legalPath === "/support" && <div className="legal-copy support-copy">
              <p className="legal-updated">SaikiScio support</p>
              <p className="legal-lead">For questions or help with SaikiScio, contact the project by email. No response time is promised.</p>
              <h2>Email support</h2>
              <p><a className="support-email-link" href="mailto:gabbyconlu@gmail.com">gabbyconlu@gmail.com</a></p>
              <div className="support-actions">
                <a className="button-primary support-email-button" href="mailto:gabbyconlu@gmail.com">Open your email app</a>
                <button className="button-quiet cookie-clear" type="button" onClick={() => {
                  void navigator.clipboard.writeText("gabbyconlu@gmail.com").then(() => {
                    setSupportNotice("Support email copied to your clipboard.");
                  }).catch((copyError: unknown) => {
                    console.error("Unable to copy the SaikiScio support email.", copyError);
                    setSupportNotice("Could not copy automatically. Select and copy the email address above.");
                  });
                }}>Copy email address</button>
              </div>
              {supportNotice && <p className="cookie-save-message" role="status">{supportNotice}</p>}
              <p>When asking for help, describe what you were doing and include any error message. Do not email passwords, verification links, reset links, API keys, or other secrets.</p>
            </div>}
          </article>
        </div>
      </main>}

      {isAuthPage && <main className="auth-page section-shell">
        <Link className="back-link" to="/"><Icon name="back" size={16} /> Back to SaikiScio</Link>
        {pathname === "/dev-mail" && emailPreviewAvailable ? <div className="auth-card demo-mail-card">
          <span className="eyebrow">LOCAL PORTFOLIO DEMO</span>
          <h1>Demo <span className="serif-italic">inbox.</span></h1>
          <p>This local-only inbox previews verification and password-reset links. It does not send email. Messages are temporary and disappear when the API server restarts.</p>
          <button className="button-quiet" type="button" onClick={() => void loadDemoEmailPreview()}>Refresh inbox</button>
          {demoEmailError && <p className="form-error" role="alert">{demoEmailError} This inbox is only available while running the local API.</p>}
          {!demoEmailError && demoEmails.length === 0 && <p className="auth-loading">No demo emails yet. Create an account or request a password reset to preview a link here.</p>}
          <div className="demo-mail-list">{demoEmails.map((message) => <article className="demo-mail-item" key={message.id}>
            <span className="eyebrow">{message.purpose === "verify-email" ? "EMAIL VERIFICATION" : "PASSWORD RESET"}</span>
            <h2>{message.subject}</h2>
            <p>To: {message.to}</p>
            <Link className="button-primary" to={message.link}>Open demo link <Icon name="arrow" size={15} /></Link>
            <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
          </article>)}</div>
          <p className="auth-privacy-note">Demo links contain one-time tokens. Do not expose this local inbox on a public deployment.</p>
        </div> : pathname === "/dev-mail" ? <div className="auth-card">
          <span className="eyebrow">ACCOUNT HELP</span><h1>Email <span className="serif-italic">unavailable.</span></h1>
          <p>This deployment does not send email, so its local demo inbox is not available.</p>
          <p className="auth-switch"><Link to="/support">Contact support</Link> · <Link to="/login">Back to sign in</Link></p>
        </div> : <div className="auth-card">
          <span className="eyebrow">{pathname === "/register" ? "A LITTLE ROOM TO GROW" : pathname === "/login" ? "WELCOME BACK" : "ACCOUNT HELP"}</span>
          <h1>{pathname === "/register" ? <>Make your<br /><span className="serif-italic">account.</span></>
            : pathname === "/login" ? <>Pick up where<br /><span className="serif-italic">you left off.</span></>
              : pathname === "/verify-email" ? <>Verify your<br /><span className="serif-italic">email.</span></>
                : pathname === "/forgot-password" ? <>Find your<br /><span className="serif-italic">way back.</span></>
                  : <>Choose a new<br /><span className="serif-italic">password.</span></>}</h1>
          <p>{pathname === "/register" ? "Create an account to keep your learning plan and notes with you when you return."
            : pathname === "/login" ? "Sign in to return to your saved skills, plan, and learning notes."
              : pathname === "/verify-email" ? emailFlowToken ? "Confirm that you own this email address before signing in." : "Enter the address you registered with to create another verification link."
                : pathname === "/forgot-password" ? "Enter your account email to request a password-reset link."
                  : "Choose a new password for your SaikiScio account."}</p>
          {pathname === "/login" && !authInitialized && <p className="auth-loading">Checking your sign-in…</p>}
          {authError && <p className="form-error" role="alert">{authError}</p>}
          {authNotice && <p className="auth-success" role="status">{authNotice}</p>}
          {authNotice && emailPreviewAvailable && <p className="demo-inbox-link"><Link to="/dev-mail">Open the local demo inbox <Icon name="arrow" size={14} /></Link></p>}

          {(pathname === "/login" || pathname === "/register") && <form className="auth-form" onSubmit={(event) => void submitAuth(event)}>
            <label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" />
            <label htmlFor="auth-password">Password</label><input id="auth-password" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} minLength={6} maxLength={128} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 6 characters" />
            {authMode === "register" && <><label htmlFor="auth-password-confirm">Confirm password</label><input id="auth-password-confirm" type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={authPasswordConfirm} onChange={(event) => setAuthPasswordConfirm(event.target.value)} placeholder="Type your password again" /><div className="terms-consent"><input id="terms-consent" aria-label="I agree to the Terms of use and have read the Privacy notice" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required /><div><label htmlFor="terms-consent">I agree to the</label> <Link to="/terms">Terms of use</Link> <span>and have read the</span> <Link to="/privacy">Privacy notice</Link>.</div></div></>}
            {authMode === "register" && <span className="password-guidance">{emailPreviewAvailable
              ? "Use 6 or more characters. Verification links appear in a local-only demo inbox; no email is sent."
              : "Use 6 or more characters. No verification email or password recovery is available in this deployment; use an email you can access and keep your password safe."}</span>}
            <button className="button-primary auth-submit" disabled={authBusy || (pathname === "/login" && !authInitialized)}>{authBusy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"} <Icon name="arrow" size={16} /></button>
          </form>}

          {(pathname === "/verify-email" || pathname === "/forgot-password" || pathname === "/reset-password") && !emailFlowsAvailable && <div className="auth-unavailable" role="status">
            <p>Email verification and password recovery are not configured for this deployment. You can create and use an account, but a forgotten password cannot currently be reset.</p>
            <p><Link to="/support">Contact support</Link> or <Link to="/login">return to sign in</Link>.</p>
          </div>}

          {pathname === "/verify-email" && emailFlowsAvailable && <form className="auth-form" onSubmit={(event) => void submitEmailFlow(event)}>
            {!emailFlowToken && <><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></>}
            <button className="button-primary auth-submit" disabled={authBusy}>{authBusy ? "Please wait…" : emailFlowToken ? "Verify email" : "Create verification link"} <Icon name="arrow" size={16} /></button>
          </form>}

          {pathname === "/forgot-password" && emailFlowsAvailable && <form className="auth-form" onSubmit={(event) => void submitEmailFlow(event)}>
            <label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" />
            <button className="button-primary auth-submit" disabled={authBusy}>{authBusy ? "Please wait…" : "Create reset link"} <Icon name="arrow" size={16} /></button>
          </form>}

          {pathname === "/reset-password" && emailFlowsAvailable && <form className="auth-form" onSubmit={(event) => void submitEmailFlow(event)}>
            <label htmlFor="reset-password">New password</label><input id="reset-password" type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={newAccountPassword} onChange={(event) => setNewAccountPassword(event.target.value)} placeholder="At least 6 characters" />
            <label htmlFor="reset-password-confirm">Confirm new password</label><input id="reset-password-confirm" type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={authPasswordConfirm} onChange={(event) => setAuthPasswordConfirm(event.target.value)} placeholder="Type your password again" />
            <button className="button-primary auth-submit" disabled={authBusy || !emailFlowToken}>{authBusy ? "Please wait…" : "Save new password"} <Icon name="arrow" size={16} /></button>
          </form>}

          {pathname !== "/register" && pathname !== "/login" && <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>}
          {pathname === "/login" && <p className="auth-switch">New to SaikiScio? <Link to="/register">Create an account</Link></p>}
          {pathname === "/register" && <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>}
          {(pathname === "/login" || pathname === "/register") && <p className="auth-privacy-note">By continuing, you agree to our <Link to="/terms">Terms</Link> and acknowledge the <Link to="/privacy">Privacy notice</Link>.</p>}
        </div>}
      </main>}

      {isAccountPage && currentUser && <main className="account-page section-shell">
        <Link className="back-link" to="/"><Icon name="back" size={16} /> Back to learning</Link>
        <div className="account-heading"><span className="eyebrow">YOUR SAIkISCIO ACCOUNT</span><h1>Account <span className="serif-italic">settings.</span></h1><p>Manage your sign-in and the learning data saved to your account.</p></div>
        <section className="account-card"><span className="eyebrow">ACCOUNT EMAIL</span><h2>{currentUser.email}</h2><p>Your email is used to sign in. Email verification and password recovery are not configured in the deployed portfolio version; keep your password safe.</p></section>
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
              {hasSavedProgress && <div className="saved-progress-card"><div><strong>{currentUser ? "Your learning is saved to your account." : "Your learning is saved on this device."}</strong><span>{savedPage === "results" ? `${completedActivities.length} lessons tried · ${completedTasks.length} plan steps complete` : `Check-in saved at step ${step + 1} of 3`}</span><button className="saved-progress-clear" onClick={startFresh}>Forget saved progress</button></div><button className="button-primary saved-progress-return" onClick={resumeJourney}>Return to my learning <Icon name="arrow" size={15} /></button></div>}
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
                  const challengeAnswers = skillChallengeAnswers[skill.name];
                  const selectedAnswer = challengeAnswers?.opening;
                  const selectedFollowup = challengeAnswers?.followup;
                  const challengeId = `skill-challenge-${skill.name.toLowerCase().replace(/ /g, "-")}`;
                  return <article className={`skill-explorer ${expanded ? "expanded" : ""}`} key={skill.name}>
                    <button type="button" className="skill-row" aria-expanded={expanded} aria-controls={challengeId} onClick={() => setActiveSkillPreview(expanded ? null : skill.name)}>
                      <span className={`skill-symbol ${skill.tint}`}>{skill.icon}</span><span className="skill-copy"><strong>{skill.name}</strong><small>{skill.description}</small></span><span className="skill-try-label">{expanded ? "Challenge open" : "Try a challenge"}</span><span className="skill-arrow"><Icon name={expanded ? "chevron" : "arrow"} size={16} /></span>
                    </button>
                    {expanded && <div className="skill-challenge" id={challengeId} role="region" aria-label={`${skill.name} quick challenge`}>
                      <span className="skill-challenge-kicker">A QUICK, NO-SCORE CHALLENGE</span>
                      <p className="skill-challenge-question">{challenge.scenario}</p>
                      <div className="skill-challenge-options" role="group" aria-label={`Choose an approach for ${skill.name}`}>
                        {challenge.choices.map((choice, index) => <button type="button" key={choice.label} className={`skill-challenge-option ${selectedAnswer === index ? "chosen" : ""}`} aria-pressed={selectedAnswer === index} onClick={() => setSkillChallengeAnswers((current) => ({ ...current, [skill.name]: { opening: index, followup: null } }))}>
                          <span>{String.fromCharCode(65 + index)}</span>{choice.label}
                        </button>)}
                      </div>
                      {selectedAnswer !== undefined ? <>
                        <div className="skill-challenge-feedback" role="status"><span className="skill-feedback-icon"><Icon name="spark" size={16} /></span><p><strong>Why this can help</strong>{challenge.choices[selectedAnswer].insight}</p></div>
                        <div className="scenario-next-turn">
                          <span className="skill-challenge-kicker">THE SITUATION CHANGES</span>
                          <p className="skill-challenge-question">{scenarioBranches[selectedAnswer].setup}</p>
                          <div className="skill-challenge-options" role="group" aria-label={`Choose what to do next for ${skill.name}`}>
                            {scenarioBranches[selectedAnswer].choices.map((choice, index) => <button type="button" key={choice.label} className={`skill-challenge-option ${selectedFollowup === index ? "chosen" : ""}`} aria-pressed={selectedFollowup === index} onClick={() => setSkillChallengeAnswers((current) => ({ ...current, [skill.name]: { opening: selectedAnswer, followup: index } }))}>
                              <span>{String.fromCharCode(65 + index)}</span>{choice.label}
                            </button>)}
                          </div>
                          {selectedFollowup !== null && selectedFollowup !== undefined && <div className="skill-challenge-feedback" role="status"><span className="skill-feedback-icon"><Icon name="spark" size={16} /></span><p><strong>Take this idea with you</strong>{scenarioBranches[selectedAnswer].choices[selectedFollowup].insight}</p></div>}
                        </div>
                      </> : <p className="skill-challenge-hint">Pick an approach to see what happens next. There is no score—each choice is a chance to think it through.</p>}
                      <button type="button" className="button-primary skill-challenge-cta" onClick={() => {
                        startSkillPlan(skill.name, `I’d like to ${challenge.goal}.`);
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
                  <p className="question-hint">Choose one skill to focus this plan. You can create and switch between separate plans whenever you like.</p>
                  <div className="assessment-skills">
                    {skills.map((skill) => (
                      <button type="button" key={skill.name} aria-pressed={selectedSkills.includes(skill.name)} className={`assessment-skill ${selectedSkills.includes(skill.name) ? "selected" : ""}`} onClick={() => toggleSkill(skill.name)}>
                        <span className={`skill-symbol ${skill.tint}`}>{skill.icon}</span><span><strong>{skill.name}</strong><small>{skill.description}</small></span><span className="select-indicator"><Icon name="check" size={13} /></span>
                      </button>
                    ))}
                  </div>
                  <label className="field-label" htmlFor="custom-skill">Or enter any skill you want to learn</label>
                  <div className="custom-skill-entry">
                    <input id="custom-skill" value={customSkillDraft} maxLength={180} onChange={(event) => setCustomSkillDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomSkill(); } }} placeholder="For example: guitar, pottery, or Python" />
                    <button type="button" className="button-quiet" onClick={addCustomSkill}>Use this skill</button>
                  </div>
                  {selectedSkills.some((name) => !Object.prototype.hasOwnProperty.call(skillGuides, name)) && <p className="custom-skill-selected">Your roadmap will focus on: <strong>{selectedSkills[0]}</strong></p>}
                  <label className="field-label" htmlFor="goal">What would you love to do with this skill?</label>
                  <textarea id="goal" value={goal} onChange={(event) => { setGoal(event.target.value); setError(""); }} placeholder="Tell us what you can do now, what you want to achieve, and any challenges or context that could shape your practice…" rows={4} maxLength={1200} />
                  <div className="field-footer"><span>A few specific details help your coach make a more useful roadmap. You can leave this blank.</span><span>{goal.length}/1200</span></div>
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
                <button className="button-primary" onClick={() => void continueAssessment()} disabled={roadmapBusy}>{roadmapBusy ? "Creating your roadmap…" : step === 2 ? "Make my plan" : "Keep going"} {!roadmapBusy && <Icon name="arrow" size={16} />}</button>
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
          <section className="weekly-quests" aria-labelledby="weekly-quests-title">
            <div className="weekly-quests-heading">
              <div><span className="eyebrow">YOUR WEEKLY SPOTLIGHT</span><h2 id="weekly-quests-title">Your mini-quests for this week</h2><p>Fresh, practical missions for {activeSkillName.toLowerCase()}{visibleRoadmap ? ", shaped by your AI roadmap" : goal.trim() ? " and tailored to the goal you shared" : ""}. Complete them at your own pace; new quests arrive every Monday.</p></div>
              <div className="quest-week-badge" aria-label="Weekly quest cycle, 1 of 7"><Icon name="target" size={16} />1/7</div>
            </div>
            <div className="quest-progress" aria-label="Weekly quest progress">
              <div><strong>{completedWeeklyQuestCount === weeklyQuests.length ? "All this week’s quests complete—wonderful work!" : `${completedWeeklyQuestCount} of ${weeklyQuests.length} quests complete`}</strong><span>{Math.round((completedWeeklyQuestCount / weeklyQuests.length) * 100)}% of this week’s practice</span></div>
              <div className="roadmap-overview-track" role="progressbar" aria-label="This week's quest progress" aria-valuemin={0} aria-valuemax={weeklyQuests.length} aria-valuenow={completedWeeklyQuestCount}><span style={{ width: `${Math.round((completedWeeklyQuestCount / weeklyQuests.length) * 100)}%` }} /></div>
            </div>
            <div className="quest-list">
              {weeklyQuests.map((quest, index) => {
                const complete = activeWeekRecord.completed.includes(quest.id);
                const note = activeWeekRecord.notes[quest.id] ?? "";
                return <article className={`quest-card ${complete ? "complete" : ""}`} key={quest.id}>
                  <span className="quest-number">{complete ? <Icon name="check" size={15} /> : `0${index + 1}`}</span>
                  <div className="quest-card-content"><span className="lesson-step-label">QUEST 0{index + 1} · ABOUT {Math.max(5, Math.round(hours * 3))} MIN</span><h3>{quest.title}</h3><p>{quest.instructions}</p>
                    <label className="field-label" htmlFor={`quest-note-${quest.id}`}>{quest.reflectionPrompt}</label>
                    <textarea id={`quest-note-${quest.id}`} rows={2} maxLength={500} value={note} placeholder="A few words is enough; this reflection stays with this week's quest." onChange={(event) => setWeeklyQuestHistory((current) => {
                      const record = current[activeWeekKey] ?? { completed: [], notes: {} };
                      return { ...current, [activeWeekKey]: { ...record, notes: { ...record.notes, [quest.id]: event.target.value } } };
                    })} />
                    <button type="button" className={`quest-complete-button ${complete ? "done" : ""}`} aria-pressed={complete} onClick={() => setWeeklyQuestHistory((current) => {
                      const record = current[activeWeekKey] ?? { completed: [], notes: {} };
                      const completed = record.completed.includes(quest.id)
                        ? record.completed.filter((id) => id !== quest.id)
                        : [...record.completed, quest.id];
                      return { ...current, [activeWeekKey]: { ...record, completed } };
                    })}>{complete ? <><Icon name="check" size={14} /> Completed — undo</> : <>Complete this quest <Icon name="arrow" size={14} /></>}</button>
                  </div>
                </article>;
              })}
            </div>
            {Object.entries(weeklyQuestHistory)
              .filter(([weekKey, record]) => weekKey !== activeWeekKey && (record.completed.length > 0 || Object.keys(record.notes).length > 0))
              .sort(([first], [second]) => second.localeCompare(first)).length > 0 && <details className="quest-history">
                <summary>See past quest weeks ({Object.entries(weeklyQuestHistory).filter(([weekKey, record]) => weekKey !== activeWeekKey && (record.completed.length > 0 || Object.keys(record.notes).length > 0)).length})</summary>
                <ul>{Object.entries(weeklyQuestHistory)
                  .filter(([weekKey, record]) => weekKey !== activeWeekKey && (record.completed.length > 0 || Object.keys(record.notes).length > 0))
                  .sort(([first], [second]) => second.localeCompare(first))
                  .map(([weekKey, record]) => <li key={weekKey}><strong>{formatWeekKey(weekKey)}</strong><span>{record.completed.length} quests completed{Object.keys(record.notes).length > 0 ? ` · ${Object.keys(record.notes).length} reflections saved` : ""}</span></li>)}</ul>
              </details>}
          </section>
          <section className="skill-plans-panel" aria-label="Your saved skill plans">
            <div className="skill-plans-heading"><div><span className="eyebrow">ONE FOCUS AT A TIME</span><h2>Your skill plans</h2><p>Each plan keeps its own answers, roadmap, notes, and progress. Switch focus whenever you want.</p></div><button type="button" className="button-quiet" aria-expanded={planPickerOpen} onClick={() => setPlanPickerOpen((open) => !open)}>{planPickerOpen ? "Close" : "Start another skill"} <Icon name={planPickerOpen ? "chevron" : "arrow"} size={14} /></button></div>
            <div className="skill-plan-list" role="group" aria-label="Switch between saved plans">
              {Object.entries(availableSkillPlans).map(([key, skillPlan]) => <button type="button" key={key} className={`skill-plan-tab ${key === activeSkillName.toLocaleLowerCase() ? "active" : ""}`} aria-pressed={key === activeSkillName.toLocaleLowerCase()} onClick={() => switchSkillPlan(skillPlan)}>
                <strong>{skillPlan.skill}</strong><span>{skillPlan.savedPage === "results" && skillPlan.generatedRoadmap ? "Roadmap saved" : "Check-in saved"}</span>
              </button>)}
            </div>
            {planPickerOpen && <div className="new-skill-plan">
              <span className="lesson-step-label">CHOOSE A SKILL FOR A SEPARATE PLAN</span>
              <div className="new-skill-options">{skills.map((skill) => <button type="button" key={skill.name} onClick={() => startSkillPlan(skill.name)}>{skill.name}</button>)}</div>
              <label className="field-label" htmlFor="new-plan-skill">Or create a custom skill plan</label>
              <div className="custom-skill-entry"><input id="new-plan-skill" value={newPlanSkill} maxLength={180} onChange={(event) => setNewPlanSkill(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); startSkillPlan(newPlanSkill); } }} placeholder="For example: guitar, pottery, or Python" /><button type="button" className="button-quiet" onClick={() => startSkillPlan(newPlanSkill)} disabled={!newPlanSkill.trim()}>Create plan</button></div>
            </div>}
          </section>
          <section className="plan-section">
            {visibleRoadmap ? (
              <div className="roadmap-sections">
                <article className="roadmap-section">
                  <span className="eyebrow">YOUR AI-PERSONALIZED ROADMAP · {activeSkillName.toUpperCase()}</span>
                  <h2>1. Summary &amp; Focus Area</h2>
                  <p className="roadmap-summary">{visibleRoadmap.summary}</p>
                  <div className="roadmap-overview" aria-label="Roadmap progress">
                    <div className="roadmap-overview-heading">
                      <div><span className="lesson-step-label">YOUR MOMENTUM</span><strong>{roadmapProgressPercent === 100 ? "You completed every roadmap checkpoint." : roadmapProgressPercent > 0 ? "Every small step is moving you forward." : "Your plan is ready when you are."}</strong></div>
                      <span>{roadmapProgressPercent}%</span>
                    </div>
                    <div className="roadmap-overview-track" role="progressbar" aria-label="Overall roadmap progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={roadmapProgressPercent}><span style={{ width: `${roadmapProgressPercent}%` }} /></div>
                    <p>{completedRoadmapCheckpointCount} of {roadmapCheckpointCount} actions, milestones, and practice steps checked off. Your progress and notes save as you go.</p>
                    <div className="roadmap-next-step">
                      <span className="roadmap-next-icon"><Icon name={roadmapProgressPercent === 100 ? "spark" : "target"} size={18} /></span>
                      <div><span className="lesson-step-label">{roadmapProgressPercent === 100 ? "A MOMENT TO CELEBRATE" : "YOUR NEXT SMALL STEP"}</span>
                        <strong>{roadmapProgressPercent === 100
                          ? "You made it through this roadmap."
                          : nextRoadmapActionIndex >= 0
                            ? visibleRoadmap.actionItems[nextRoadmapActionIndex].title
                            : nextRoutineSegmentIndex >= 0
                              ? visibleRoadmap.practiceRoutine.segments[nextRoutineSegmentIndex].activity
                              : "Mark a milestone when you reach it."}</strong>
                      </div>
                      {roadmapProgressPercent < 100 && <button type="button" className="roadmap-next-button" onClick={() => {
                        if (nextRoadmapActionIndex >= 0) focusRoadmapStep(`roadmap-action-${nextRoadmapActionIndex}`, nextRoadmapActionIndex);
                        else if (nextRoutineSegmentIndex >= 0) focusRoadmapStep(`roadmap-routine-${nextRoutineSegmentIndex}`);
                        else focusRoadmapStep("roadmap-milestones");
                      }}>{nextRoadmapActionIndex >= 0 ? "Start this action" : nextRoutineSegmentIndex >= 0 ? "Open practice step" : "View milestones"} <Icon name="arrow" size={14} /></button>}
                    </div>
                  </div>
                </article>
                <article className="roadmap-section">
                  <h2>2. Core Action Items</h2>
                  <ol className="roadmap-action-list">
                    {visibleRoadmap.actionItems.map((item, index) => {
                      const complete = completedTasks.includes(index);
                      const practiceOpen = activeRoadmapPractice === index;
                      const note = roadmapPracticeNotes[String(index)] ?? "";
                      return <li id={`roadmap-action-${index}`} className={complete ? "roadmap-action-complete" : ""} key={`${item.title}-${index}`}>
                        <span className="roadmap-item-number">{complete ? <Icon name="check" size={14} /> : `0${index + 1}`}</span>
                        <div className="roadmap-action-content">
                          <h3>{item.title}</h3>
                          <p>{item.instructions}</p>
                          <button
                            type="button"
                            className="roadmap-practice-toggle"
                            aria-expanded={practiceOpen}
                            onClick={() => {
                              setStarted(true);
                              setActiveRoadmapPractice(practiceOpen ? null : index);
                            }}
                          >
                            {practiceOpen ? "Close practice" : note ? "Continue practice" : "Practice this action"}
                            <Icon name={practiceOpen ? "chevron" : "arrow"} size={14} />
                          </button>
                          {practiceOpen && <div className="roadmap-practice-panel">
                            <span className="lesson-step-label">YOUR NEXT SMALL STEP</span>
                            <p>{item.instructions}</p>
                            <label className="field-label" htmlFor={`roadmap-note-${index}`}>What did you try, or what will you try next?</label>
                            <textarea
                              id={`roadmap-note-${index}`}
                              value={note}
                              maxLength={600}
                              rows={3}
                              placeholder="Write a quick reflection or jot down your next step…"
                              onChange={(event) => setRoadmapPracticeNotes((current) => ({ ...current, [String(index)]: event.target.value }))}
                            />
                            <div className="roadmap-practice-footer">
                              <span>{note.length}/600 · Saved with your learning</span>
                              <button type="button" className={`task-toggle ${complete ? "done" : ""}`} onClick={() => { setStarted(true); toggleTask(index); }}>
                                {complete ? <><Icon name="check" size={14} /> Tried — undo</> : <>I tried this action <Icon name="arrow" size={14} /></>}
                              </button>
                            </div>
                          </div>}
                        </div>
                      </li>;
                    })}
                  </ol>
                </article>
                <article className="roadmap-section">
                  <h2>3. Key Milestones</h2>
                  <p className="roadmap-milestone-progress">{completedMilestones.length} of {visibleRoadmap.milestones.length} milestones reached</p>
                  <ol className="roadmap-milestones">
                    {visibleRoadmap.milestones.map((milestone, index) => {
                      const complete = completedMilestones.includes(index);
                      return <li className={complete ? "roadmap-milestone-complete" : ""} key={`${milestone.stage}-${index}`}>
                        <span>{complete ? <Icon name="check" size={13} /> : `0${index + 1}`} · {milestone.stage}</span>
                        <p>{milestone.measurableOutcome}</p>
                        <button type="button" className="roadmap-milestone-toggle" aria-pressed={complete} onClick={() => { setStarted(true); toggleMilestone(index); }}>
                          {complete ? "Reached — undo" : "Mark as reached"}
                        </button>
                      </li>;
                    })}
                  </ol>
                </article>
                <article className="roadmap-section" id="roadmap-routine">
                  <h2>4. Recommended Practice Routine</h2>
                  <p className="roadmap-frequency">{visibleRoadmap.practiceRoutine.frequency} · {visibleRoadmap.practiceRoutine.sessionsPerWeek} sessions × {visibleRoadmap.practiceRoutine.totalMinutes} minutes ({visibleRoadmap.practiceRoutine.sessionsPerWeek * visibleRoadmap.practiceRoutine.totalMinutes} minutes per week)</p>
                  <ol className="roadmap-routine">
                    {visibleRoadmap.practiceRoutine.segments.map((segment, index) => {
                      const complete = completedRoutineSegments.includes(index);
                      return <li id={`roadmap-routine-${index}`} className={complete ? "roadmap-routine-complete" : ""} key={`${segment.activity}-${index}`}>
                        <span>{segment.minutes} min</span><div><h3>{segment.activity}</h3><p>{segment.instructions}</p><button type="button" className="roadmap-routine-toggle" aria-pressed={complete} onClick={() => toggleRoutineSegment(index)}>{complete ? <><Icon name="check" size={13} /> Practice step done — undo</> : <>Mark this practice step done <Icon name="arrow" size={13} /></>}</button></div>
                      </li>;
                    })}
                  </ol>
                </article>
                <div className="roadmap-bottom">
                  {!started
                    ? <button className="button-primary" onClick={() => setStarted(true)}>Start my roadmap <Icon name="arrow" size={16} /></button>
                    : <><div className="plan-progress"><strong>{completedTasks.length} of {visibleRoadmap.actionItems.length} actions complete</strong><div className="plan-progress-track"><span style={{ width: `${(completedTasks.length / visibleRoadmap.actionItems.length) * 100}%` }} /></div></div><span className="started-message"><Icon name="check" size={16} /> Your roadmap is underway</span></>}
                  {!currentUser && <Link className="button-quiet" to="/register">Create an account to save across devices <Icon name="arrow" size={14} /></Link>}
                </div>
                <p className="roadmap-ai-note">AI-generated learning guidance can make mistakes. Review suggestions and adapt them to your circumstances.</p>
              </div>
            ) : (
              <>
            {generatedRoadmap && !roadmapError && <div className="roadmap-error" role="status"><div><strong>This roadmap does not match your current answers.</strong><p>The saved roadmap may be from an earlier check-in or unrelated request. Generate a fresh roadmap to match your current skill and goal.</p></div><button className="button-quiet" onClick={() => void generatePersonalizedRoadmap()} disabled={roadmapBusy}>{roadmapBusy ? "Creating roadmap…" : "Generate updated roadmap"}</button></div>}
            {roadmapError && builtInLearningSkills.length > 0 && <div className="roadmap-error" role="alert"><div><strong>Your AI roadmap could not be generated.</strong><p>{roadmapError}</p></div><button className="button-quiet" onClick={() => void generatePersonalizedRoadmap()} disabled={roadmapBusy}>{roadmapBusy ? "Trying again…" : "Try again"}</button></div>}
            {builtInLearningSkills.length === 0 && <div className="roadmap-unavailable"><div><h2>{roadmapError ? "Your AI roadmap couldn't be generated" : "Your custom-skill AI roadmap is ready to build"}</h2><p>{roadmapError || "Google AI Studio is configured. Create a tailored set of practical actions, measurable milestones, and a routine for your skill and goal."}</p></div><button className="button-quiet" onClick={() => void generatePersonalizedRoadmap()} disabled={roadmapBusy}>{roadmapBusy ? "Creating your roadmap…" : roadmapError ? "Try again" : "Build my AI roadmap"}</button></div>}
            {builtInLearningSkills.length > 0 && <>
            <div className="plan-heading"><div><span className="eyebrow">A plan shaped by your answers</span><h2>Your first few <span className="serif-italic">steps.</span></h2><p className="plan-personalization">Built around {activeSkillName}, your goal, starting confidence, and the ways you like to learn.</p></div><span className="plan-duration"><Icon name="clock" size={15} /> A gentle 3-week start</span></div>
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
            </>}
              </>
            )}
          </section>
          {builtInLearningSkills.length > 0 && <section className="learning-studio" aria-labelledby="learning-title">
            <div className="learning-heading">
              <div><span className="eyebrow">Learn it by doing it</span><h2 id="learning-title">Your little <span className="serif-italic">learning studio.</span></h2><p>Choose a format, try a real exercise, and keep your notes here. Every lesson is ready to use—no sign-up or outside videos needed.</p></div>
              <div className="learning-skill-picker" role="group" aria-label="Choose a skill to practice">
                {builtInLearningSkills.map((name) => <button type="button" key={name} aria-pressed={activeLearningSkill === name} className={activeLearningSkill === name ? "chosen" : ""} onClick={() => { setActiveLearningSkill(name); setActiveLesson(null); }}>{name}</button>)}
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
            <article className="quick-quiz" aria-labelledby="quick-quiz-title">
              <div className="quick-quiz-heading"><div><span className="eyebrow">RECALL IT, MAKE IT STICK</span><h3 id="quick-quiz-title">Quick lesson check</h3><p>No grades—use these questions to see what stayed with you.</p></div><span className="quiz-score">{Object.keys(activeQuizAnswers).length}/{quickQuiz.length} answered</span></div>
              <div className="quiz-questions">
                {quickQuiz.map((question, questionIndex) => {
                  const answer = activeQuizAnswers[String(questionIndex)];
                  return <fieldset className="quiz-question" key={`${activeLearningSkill}-${questionIndex}`}>
                    <legend><span>0{questionIndex + 1}</span>{question.question}</legend>
                    <div className="quiz-options">
                      {question.options.map((option, optionIndex) => <button type="button" key={option} className={`quiz-option ${answer === optionIndex ? "selected" : ""}`} aria-pressed={answer === optionIndex} onClick={() => setQuizAnswers((current) => ({
                        ...current,
                        [activeLearningSkill]: { ...(current[activeLearningSkill] ?? {}), [String(questionIndex)]: optionIndex },
                      }))}>{option}</button>)}
                    </div>
                    {answer !== undefined && <div className={`quiz-feedback ${answer === question.answerIndex ? "correct" : "try-again"}`} role="status"><strong>{answer === question.answerIndex ? "That’s it." : "Not quite—and that’s part of learning."}</strong><span>{question.explanation}</span></div>}
                  </fieldset>;
                })}
              </div>
              {Object.keys(activeQuizAnswers).length === quickQuiz.length && <p className="quiz-finish-note"><Icon name="spark" size={15} /> You made time to recall what you learned. That practice helps ideas stay with you.</p>}
            </article>
            <p className="learning-source-note">Original SaikiScio learning materials for practice. Video lessons are written, scene-by-scene walkthroughs rather than streamed videos.</p>
          </section>}
          <div className="results-footer-note"><Icon name="leaf" size={16} /> Your path can change as you do. Come back and make it yours.</div>
          <div className="results-reset"><button className="text-link" onClick={startFresh}>Clear this saved learning and start over</button></div>
        </main>
      )}

      <footer className="site-footer"><div className="footer-inner"><button className="brand footer-brand" onClick={() => { navigate("/"); setPage("home"); }} aria-label="SaikiScio home"><span className="brand-mark"><Icon name="leaf" size={17} /></span><span>Saiki<span className="brand-period">Scio</span></span></button><span>Make room to grow, one small step at a time.</span><nav className="legal-links" aria-label="Legal and privacy"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/cookies">Manage cookies</Link><Link to="/support">Support</Link></nav></div></footer>
      </>}
    </div>
  );
}

export default App;
