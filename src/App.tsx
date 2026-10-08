import { useMemo, useState } from "react";

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
  const [page, setPage] = useState<"home" | "assessment" | "results">("home");
  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Communication"]);
  const [goal, setGoal] = useState("");
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [selectedMethods, setSelectedMethods] = useState<LearningMethod[]>(["Hands-on projects", "Short lessons"]);
  const [hours, setHours] = useState(3);
  const [targetDate, setTargetDate] = useState("");
  const [started, setStarted] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [error, setError] = useState("");

  const selectedSkill = skills.find((skill) => selectedSkills.includes(skill.name)) ?? skills[0];
  const plan = useMemo(() => {
    const skill = selectedSkill.name.toLowerCase();
    const chosenMethod = selectedMethods[0]?.toLowerCase() ?? "short lessons";
    return [
      { title: `Notice what great ${skill} looks like`, detail: `A 10-minute ${chosenMethod} to spot one technique you can try this week.`, tag: "Week 1", duration: "10 min" },
      { title: "Put one small idea into practice", detail: `Try it in a real moment, then jot down what felt different.`, tag: "Week 2", duration: `${Math.max(15, hours * 10)} min` },
      { title: "Reflect, refine, repeat", detail: "Celebrate what worked and choose one next step that feels right.", tag: "Week 3", duration: "15 min" },
    ];
  }, [hours, selectedMethods, selectedSkill.name]);

  const beginAssessment = () => {
    setStep(0);
    setError("");
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
      setPage("results");
      setStarted(false);
      setCompletedTasks([]);
    }
  };

  const editAssessment = () => {
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

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <nav className="nav-shell" aria-label="Main navigation">
          <button className="brand" onClick={() => setPage("home")} aria-label="SaikiScio home">
            <span className="brand-mark"><Icon name="leaf" size={19} /></span>
            <span>Saiki<span className="brand-period">Scio</span></span>
          </button>
          <div className="nav-links">
            <a href={page === "home" ? "#how-it-works" : "#plan"} onClick={(event) => {
              if (page !== "home") {
                event.preventDefault();
                setPage("home");
                window.setTimeout(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }), 30);
              }
            }}>How it works</a>
            <a href={page === "home" ? "#skills" : "#plan"} onClick={(event) => {
              if (page !== "home") {
                event.preventDefault();
                setPage("home");
                window.setTimeout(() => document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" }), 30);
              }
            }}>Explore skills</a>
          </div>
          <button className="nav-cta" onClick={beginAssessment}>
            {page === "results" ? "Retake check-in" : "Start your check-in"}
            <Icon name="arrow" size={15} />
          </button>
        </nav>
      </header>

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
              <div className="skills-intro"><span className="eyebrow">Your next chapter</span><h2>What would you<br />like to <span className="serif-italic">grow?</span></h2><p>There’s no wrong place to begin. Pick something that’s been on your mind lately.</p><button className="text-link" onClick={beginAssessment}>Find my starting point <Icon name="arrow" size={16} /></button></div>
              <div className="skill-list">
                {skills.map((skill) => (
                  <button className="skill-row" key={skill.name} onClick={() => {
                    setSelectedSkills([skill.name]);
                    setGoal(`I’d like to feel more confident with ${skill.name.toLowerCase()}.`);
                    beginAssessment();
                  }}>
                    <span className={`skill-symbol ${skill.tint}`}>{skill.icon}</span><span className="skill-copy"><strong>{skill.name}</strong><small>{skill.description}</small></span><span className="skill-arrow"><Icon name="arrow" size={16} /></span>
                  </button>
                ))}
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
            <div className="plan-heading"><div><span className="eyebrow">A plan that starts small</span><h2>Your first few <span className="serif-italic">steps.</span></h2></div><span className="plan-duration"><Icon name="clock" size={15} /> A gentle 3-week start</span></div>
            {started && <div className="plan-progress"><div><strong>You’re on your way.</strong><span>{completedTasks.length} of {plan.length} steps complete</span></div><div className="plan-progress-track"><span style={{ width: `${(completedTasks.length / plan.length) * 100}%` }} /></div></div>}
            <div className="plan-steps">
              {plan.map((item, index) => {
                const complete = completedTasks.includes(index);
                return <article className={`plan-step ${complete ? "task-complete" : ""}`} key={item.title}>
                  <div className="timeline"><span className={complete ? "timeline-done" : ""}>{complete ? <Icon name="check" size={15} /> : `0${index + 1}`}</span>{index < plan.length - 1 && <i />}</div>
                  <div className="plan-step-body"><div className="plan-step-meta"><span>{item.tag}</span><span><Icon name="clock" size={13} /> {item.duration}</span></div><h3>{item.title}</h3><p>{item.detail}</p>{started && <button className={`task-toggle ${complete ? "done" : ""}`} onClick={() => toggleTask(index)}>{complete ? <><Icon name="check" size={14} /> Done — nice work</> : <>Mark this step complete <Icon name="arrow" size={14} /></>}</button>}</div>
                  <span className={`plan-step-icon ${["peach", "lilac", "mint"][index]}`}><Icon name={index === 0 ? "spark" : index === 1 ? "target" : "chart"} size={19} /></span>
                </article>;
              })}
            </div>
            <div className="plan-bottom"><div className="method-note"><span className="method-note-icon"><Icon name="spark" size={18} /></span><div><strong>Made for how you learn</strong><p>{selectedMethods.join(" · ")}</p></div></div>{!started ? <button className="button-primary" onClick={() => setStarted(true)}>Start my plan <Icon name="arrow" size={16} /></button> : <span className="started-message"><Icon name="check" size={16} /> Your plan is underway</span>}</div>
          </section>
          <div className="results-footer-note"><Icon name="leaf" size={16} /> Your path can change as you do. Come back and make it yours.</div>
        </main>
      )}

      <footer className="site-footer"><div className="footer-inner"><button className="brand footer-brand" onClick={() => setPage("home")} aria-label="SaikiScio home"><span className="brand-mark"><Icon name="leaf" size={17} /></span><span>Saiki<span className="brand-period">Scio</span></span></button><span>Make room to grow, one small step at a time.</span></div></footer>
    </div>
  );
}

export default App;
