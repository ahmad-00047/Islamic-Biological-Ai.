import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowUp,
  BookOpen,
  Bookmark,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  GraduationCap,
  Headphones,
  LockKeyhole,
  Menu,
  Mic,
  MoonStar,
  Play,
  Search,
  Sparkles,
  Volume2,
  X,
  FileCheck2,
  ImagePlus,
  Trash2,
  Share2,
} from "lucide-react";
import { curriculum } from "@/content/curriculum";

type Mode = "Tutor" | "Syllabus" | "Study" | "Islam" | "Results" | "Tools" | "Pro Library";
type Message = { role: "user" | "assistant"; text: string; source?: string };

type Chapter = { title: string; detail: string; progress: number; locked?: boolean; summary?: string; objectives?: string[]; keyPoints?: string[]; practical?: string; quiz?: { question: string; options: string[]; answer: number; explanation: string }[] };

const chapters: Record<string, Chapter[]> = {
  "Class 9": [
    { title: "The Science of Biology", detail: "Branches, careers, biological method and levels of organization", progress: 72 },
    { title: "Biodiversity", detail: "Classification, kingdoms and conservation", progress: 34 },
    { title: "Cell Biology", detail: "Cell structure, organelles and transport", progress: 18 },
    { title: "Molecules of Life", detail: "Carbohydrates, lipids, proteins and nucleic acids", progress: 0 },
  ],
  "Class 10": [
    { title: "Gaseous Exchange", detail: "Breathing, lungs and gas transport", progress: 48 },
    { title: "Nutrition", detail: "Digestion, absorption and balanced diet", progress: 10 },
    { title: "Transport", detail: "Blood, heart, vessels and plants", progress: 0 },
    { title: "Coordination & Control", detail: "Nervous and hormonal coordination", progress: 0 },
  ],
  "Class 11": [
    { title: "Cell Structure & Function", detail: "Membranes, enzymes and cellular organization", progress: 21 },
    { title: "Bioenergetics", detail: "ATP, respiration and photosynthesis", progress: 0 },
    { title: "Biological Molecules", detail: "Chemistry that supports living systems", progress: 0 },
    { title: "Enzymes", detail: "Specificity, factors and applications", progress: 0 },
  ],
  "Class 12": [
    { title: "Homeostasis", detail: "Feedback, osmoregulation and excretion", progress: 0 },
    { title: "Coordination & Control", detail: "Nervous system, hormones and responses", progress: 0 },
    { title: "Reproduction", detail: "Human development, health and responsible relationships", progress: 0, locked: true },
    { title: "Genetics & Evolution", detail: "Inheritance, variation and natural selection", progress: 0 },
  ],
};

const starterPrompts = [
  "Explain the cell for Class 9 in simple English",
  "What are the rights and responsibilities in marriage? Include sources",
  "Give me a short photosynthesis revision with 5 MCQs",
];

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1700);
    return () => window.clearTimeout(timer);
  }, [onDone]);
  return (
    <div className="splash-screen">
      <div className="splash-mark"><BookOpen size={29} /><span>✦</span></div>
      <h1>Islamic Biological AI</h1>
      <p className="splash-subtitle">by Deol Studio</p>
      <div className="splash-loader"><span /></div>
    </div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<Mode>("Tutor");
  const [className, setClassName] = useState("Class 9");
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [requestedChapter, setRequestedChapter] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ data: string; mime: string; name: string } | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Ask any Biology or Islamic learning question. I will answer directly in English by default, or in the language you use.", source: "IBAI learning guide" },
  ]);
  const [saved, setSaved] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  const currentChapters = useMemo(() => curriculum[className], [className]);
  const completed = currentChapters.filter((item) => item.progress > 0).length;

  const ask = async (text = query) => {
    const clean = text.trim();
    if (!clean || isThinking) return;
    setQuery("");
    setMessages((items) => [...items, { role: "user", text: clean }]);
    setIsThinking(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean || "Read this image and answer the question shown in it.", className, mode, history: messages.slice(-6), imageData: attachedImage?.data, imageMimeType: attachedImage?.mime }),
      });
      const data = await response.json();
      const cleanAnswer = String(data.answer || "I could not prepare an answer right now. Please try again.").replace(/^(w\.?\s*sal(aam|am)|w\.?\s*alaikum\s*sal(aam|am)|wa\s*alaikum\s*ass?alam|wal(a|i)kum\s*sal(aam|am)|assalam\s*o\s*alaikum|وعلیکم\s*السلام|السلام\s*علیکم|hello|hi|welcome)[!,.،۔:\- ]*/i, "").trim();
      setMessages((items) => [...items, { role: "assistant", text: cleanAnswer, source: data.source }]);
      setAttachedImage(null);
    } catch {
      setMessages((items) => [...items, { role: "assistant", text: "A connection issue occurred. Please send your question again.", source: "System" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((items) => [...items, { role: "assistant", text: "Voice input is not supported in this browser. Please type your question below.", source: "Voice help" }]);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-PK";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => setQuery(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-PK";
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const attachImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setMessages((items) => [...items, { role: "assistant", text: "Please choose an image smaller than 6 MB.", source: "Image help" }]);
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachedImage({ data: String(reader.result), mime: file.type || "image/jpeg", name: file.name });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const shareApp = async () => {
    const shareData = { title: "Islamic Biological AI", text: "Learn Biology and Islamic knowledge with Islamic Biological AI by Deol Studio.", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(window.location.href); setShareMessage("App link copied"); }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") setShareMessage("Copy the link from your browser address bar");
    }
    window.setTimeout(() => setShareMessage(""), 2500);
  };

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark"><BookOpen size={19} /></div><div><strong>Islamic Biological AI</strong><span>by Deol Studio</span></div></div>
        <div className="top-actions"><button className="icon-button" aria-label="Open syllabus" onClick={() => setMode("Syllabus")}><Search size={18} /></button><button className="share-button" onClick={shareApp} aria-label="Share Islamic Biological AI"><Share2 size={17} /><span>Share</span></button><button className="avatar" aria-label="Account">D</button>{shareMessage && <span className="share-toast">{shareMessage}</span>}</div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
          <div className="side-greeting"><span className="status-dot" />Study space <span className="language-pill">English</span></div><div className="sidebar-class"><span>Biology class</span><div>{Object.keys(chapters).map((item) => <button key={item} className={item === className ? "selected" : ""} onClick={() => { setClassName(item); setMode("Study"); setMobileNavOpen(false); }}>{item.replace("Class ", "")}</button>)}</div></div>
          <nav>{([ ["Tutor", BrainCircuit], ["Syllabus", GraduationCap], ["Study", BookOpen], ["Islam", MoonStar], ["Results", FileCheck2], ["Tools", FlaskConical], ["Pro Library", LockKeyhole] ] as const).map(([label, Icon]) => <button key={label} className={`nav-item ${mode === label ? "active" : ""}`} onClick={() => { setMode(label as Mode); setMobileNavOpen(false); }}><Icon size={18} /><span>{label}</span>{label === "Pro Library" && <span className="pro-dot">PRO</span>}</button>)}</nav>
          <div className="side-card"><Sparkles size={16} /><div><b>Smart answers</b><p>English by default; same language as your question.</p></div></div>
          <div className="side-footer">BISE Bahawalpur<br /><span>Academic year 2026–27</span></div>
        </aside>

        <main className="main-content">
          <div className="mobile-nav"><button className="icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen((open) => !open)}><Menu size={20} /></button><span>{mode}</span><span className="language-pill">English</span></div>
          {mode === "Tutor" && <>
            <section className="hero-row chatgpt-welcome"><div><p className="eyebrow teal">Islamic Biological AI · by Deol Studio</p><h1>How can I help<br /><em>you today?</em></h1><p className="hero-copy">Ask about Biology, Islamic knowledge, your syllabus or upload a question image.</p></div><div className="hero-orbit"><div className="orbit-core"><BrainCircuit size={28} /><span>AI</span></div><i /><i /><i /></div></section>
            <section className="chat-panel"><div className="panel-heading"><div><span className="live-label"><span />AI tutor online</span><h2>How can I help you today?</h2></div><button className="panel-menu">•••</button></div><div className="messages">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`message-row ${message.role}`}><div className={`message-avatar ${message.role}`}>{message.role === "assistant" ? <Sparkles size={15} /> : "You"}</div><div className="message-content"><div className="message-bubble">{message.text}</div>{message.role === "assistant" && <div className="message-meta">{message.source && <span className="source-chip"><Check size={12} /> {message.source}</span>}<button onClick={() => speak(message.text)} className="speak-button"><Volume2 size={13} /> {isSpeaking ? "Stop" : "Listen"}</button></div>}</div></div>)}{isThinking && <div className="message-row assistant"><div className="message-avatar assistant"><Sparkles size={15} /></div><div className="typing"><span /><span /><span /></div></div>}</div><div className="prompt-row">{starterPrompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}<ChevronRight size={14} /></button>)}</div><div className="image-attachment">{attachedImage && <div className="attachment-chip"><img src={attachedImage.data} alt="Selected question" /><span>{attachedImage.name}</span><button type="button" onClick={() => setAttachedImage(null)} aria-label="Remove image"><Trash2 size={14} /></button></div>}</div><div className="composer"><label className="image-button" aria-label="Upload question image" title="Upload a photo or screenshot"><ImagePlus size={18} /><input type="file" accept="image/*" onChange={attachImage} /></label><button onClick={toggleListening} className={`voice-button ${isListening ? "listening" : ""}`} aria-label="Voice input"><Mic size={19} /></button><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") ask(); }} placeholder={isListening ? "Listening... speak your question" : attachedImage ? "Ask about this image..." : "Type your question here..."} /><button onClick={() => ask()} disabled={(!query.trim() && !attachedImage) || isThinking} className="send-button"><ArrowUp size={18} /></button></div><div className="composer-note"><Headphones size={13} /> Voice input/output available · Educational guidance</div></section>
          </>}

          {mode === "Study" && <StudyView className={className} setClassName={setClassName} chapters={currentChapters} completed={completed} saved={saved} setSaved={setSaved} openChapter={requestedChapter} />}
          {mode === "Syllabus" && <SyllabusView className={className} setClassName={setClassName} onOpenStudy={(title) => { setRequestedChapter(title); setMode("Study"); }} />}
          {mode === "Islam" && <InfoView title="Islamic Knowledge" eyebrow="Quran • Hadith • Adab" icon={<MoonStar size={23} />} description="Explore Islamic questions with evidence and good manners. Sources and areas of scholarly difference should be clearly identified." cards={["Marriage and family rights", "Purification and daily worship", "Character and social responsibility", "How to understand the Quran"]} sources={["Quran — quran.com translation/reference", "Sahih al-Bukhari and Sahih Muslim — hadith reference", "Recognized Sunni scholarship — interpretation context"]} onAsk={(text) => { setMode("Tutor"); setTimeout(() => ask(text), 0); }} />}
          {mode === "Results" && <ResultsView />}
          {mode === "Tools" && <InfoView title="Study Tools" eyebrow="Practice • Progress • Recall" icon={<FlaskConical size={23} />} description="Use short quizzes, revision cards and saved notes to build a consistent study routine." cards={["Chapter quiz — 10 MCQs", "Flashcards — quick recall", "My notes and bookmarks", "Weekly progress check"]} onAsk={() => setMode("Study")} />}
          {mode === "Pro Library" && <ProView />}
        </main>
      </div>
    </div>
  );
}

function StudyView({ className, setClassName, chapters, completed, saved, setSaved, openChapter }: { className: string; setClassName: (v: string) => void; chapters: Chapter[]; completed: number; saved: string[]; setSaved: (v: string[]) => void; openChapter?: string | null }) {
  const [selected, setSelected] = useState<Chapter | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quiz, setQuiz] = useState<NonNullable<Chapter["quiz"]>>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const shuffleQuiz = (questions: NonNullable<Chapter["quiz"]>) => [...questions].sort(() => Math.random() - 0.5).map((item) => { const options = item.options.map((option, index) => ({ option, correct: index === item.answer })).sort(() => Math.random() - 0.5); return { ...item, options: options.map((entry) => entry.option), answer: options.findIndex((entry) => entry.correct) }; });
  const startDailyChallenge = async () => { setDailyLoading(true); try { const response = await fetch("/api/ai/daily-quiz", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), runId: `${Date.now()}-${Math.random().toString(36).slice(2)}`, className: "Classes 9–12" }) }); const data = await response.json(); if (!response.ok || !Array.isArray(data.questions) || data.questions.length < 100) throw new Error(data.error || "Daily quiz unavailable"); const dailyChapter: Chapter = { title: "Daily Biology Challenge", detail: "100 brand-new AI-generated MCQs from Classes 9–12", summary: "A new daily question bank generated for today. Questions are not copied from a publisher textbook.", objectives: ["Revise the complete Classes 9–12 Biology map", "Practise 100 fresh exam-style questions", "Identify topics for further study"], keyPoints: ["Use explanations after each answer to revise."], practical: "Record difficult question numbers and revisit their chapters.", progress: 0, quiz: data.questions }; setSelected(dailyChapter); setQuiz(shuffleQuiz(data.questions)); setQuizIndex(0); setQuizChoice(null); setQuizOpen(true); } catch { setQuizOpen(false); } finally { setDailyLoading(false); } };
  useEffect(() => { if (openChapter) { const chapter = chapters.find((item) => item.title === openChapter) ?? null; setSelected(chapter); setQuiz(chapter ? shuffleQuiz(chapter.quiz ?? []) : []); } }, [openChapter, chapters]);
 return <section className="study-view"><div className="page-heading"><div><p className="eyebrow teal">Original syllabus-aligned notes</p><h1>Study library</h1><p>BISE Bahawalpur · 2026–27 map · {chapters.length} chapters with 10 MCQs each</p></div><div className="study-actions"><button className="primary-button" onClick={startDailyChallenge} disabled={dailyLoading}><Play size={16} /> {dailyLoading ? "Generating today’s 100..." : "Daily 100 MCQs"}</button><button className="outline-button"><Search size={16} /> Find topic</button></div></div><div className="class-tabs">{Object.keys(curriculum).map((item) => <button key={item} className={item === className ? "selected" : ""} onClick={() => { setClassName(item); setSelected(null); setQuizOpen(false); }}>{item}</button>)}</div><div className="progress-banner"><div className="progress-icon"><GraduationCap size={22} /></div><div><b>{completed} of {chapters.length} chapters started</b><p>Every chapter has 10 shuffled MCQs; retry for a new order.</p></div><div className="progress-track"><span style={{ width: `${Math.round(chapters.reduce((sum, item) => sum + item.progress, 0) / chapters.length)}%` }} /></div></div><div className="chapter-grid">{chapters.map((chapter, index) => <article key={chapter.title} onClick={() => { setSelected(chapter); setQuiz(shuffleQuiz(chapter.quiz ?? [])); setQuizOpen(false); }} className={`chapter-card clickable ${chapter.locked ? "locked" : ""}`}><div className="chapter-number">{String(index + 1).padStart(2, "0")}</div><div className="chapter-main"><div className="chapter-top"><span>{chapter.locked ? <LockKeyhole size={14} /> : "Chapter"}</span><button onClick={(event) => { event.stopPropagation(); setSaved(saved.includes(chapter.title) ? saved.filter((item) => item !== chapter.title) : [...saved, chapter.title]); }} className={saved.includes(chapter.title) ? "bookmarked active" : "bookmarked"}><Bookmark size={16} /></button></div><h3>{chapter.title}</h3><p>{chapter.detail}</p><div className="card-bottom"><div className="mini-progress"><span style={{ width: `${chapter.progress}%` }} /></div><small>{chapter.progress}% complete</small><ChevronRight size={16} /></div></div></article>)}</div>{selected && <article className="lesson-panel"><div className="lesson-heading"><div><p className="eyebrow teal">{selected.locked ? "Age-appropriate guidance" : "Lesson notes"}</p><h2>{selected.title}</h2></div><button className="icon-button" onClick={() => setSelected(null)}><X size={18} /></button></div><p className="lesson-summary">{selected.summary ?? selected.detail}</p><div className="lesson-columns"><div><h4>Learning objectives</h4><ul>{(selected.objectives ?? []).map((item) => <li key={item}>{item}</li>)}</ul></div><div><h4>Key points</h4><ul>{(selected.keyPoints ?? []).map((item) => <li key={item}>{item}</li>)}</ul></div></div><div className="practical-note"><FlaskConical size={15} /><span><b>Practical / application:</b> {selected.practical ?? "Review the chapter with a labelled diagram and one real-life example."}</span></div><PracticePanel chapter={selected} />{!quizOpen ? <div className="quiz-preview"><div><p className="eyebrow teal">10-question quiz</p><b>{quiz[0]?.question ?? "Ready for a quick check?"}</b><p>{quiz[0]?.options.join(" · ")}</p><small>Ten shuffled questions with explanations. Start again for a new order.</small></div><button className="primary-button" onClick={() => { setQuiz(shuffleQuiz(selected.quiz ?? [])); setQuizOpen(true); setQuizIndex(0); setQuizChoice(null); }}><Play size={15} /> Start 10 MCQs</button></div> : <div className="quiz-box"><p className="eyebrow teal">Question {quizIndex + 1} of {quiz.length}</p><h3>{quiz[quizIndex]?.question}</h3><div className="quiz-options">{quiz[quizIndex]?.options.map((option, index) => <button key={option} className={quizChoice === index ? "chosen" : ""} onClick={() => setQuizChoice(index)}>{String.fromCharCode(65 + index)}. {option}</button>)}</div>{quizChoice !== null && <p className={quizChoice === quiz[quizIndex]?.answer ? "quiz-result correct" : "quiz-result"}>{quizChoice === quiz[quizIndex]?.answer ? "Correct — well done." : `Review: ${quiz[quizIndex]?.explanation}`}</p>}<button className="primary-button" disabled={quizChoice === null} onClick={() => { if (quizIndex + 1 < quiz.length) { setQuizIndex(quizIndex + 1); setQuizChoice(null); } else if (selected.title === "Daily Biology Challenge") { void startDailyChallenge(); } else { setQuiz(shuffleQuiz(selected.quiz ?? [])); setQuizIndex(0); setQuizChoice(null); setQuizOpen(true); } }}>{quizIndex + 1 < quiz.length ? "Next question" : "Start new quiz"}</button></div>}</article>}<div className="original-note"><CircleHelp size={17} /><p><b>Original learning material:</b> These notes, explanations and practice prompts are created for learning and are not a copied publisher textbook. Official board updates can be added to this editable map.</p></div></section>;
}

function PracticePanel({ chapter }: { chapter: Chapter }) {
  const [mode, setMode] = useState<"short" | "long">("short");
  const [revealed, setRevealed] = useState<number | null>(null);
  const points = chapter.keyPoints ?? [];
  const questions = (chapter.objectives ?? []).slice(0, 5).map((objective, index) => ({ question: mode === "short" ? `Short question: Explain ${objective.toLowerCase()}.` : `Long question: Discuss ${objective.toLowerCase()} with relevant biological examples and applications.`, answer: points[index % Math.max(points.length, 1)] ?? chapter.summary ?? chapter.detail }));
  return <div className="practice-panel"><div className="practice-tabs"><button className={mode === "short" ? "selected" : ""} onClick={() => { setMode("short"); setRevealed(null); }}>Short questions</button><button className={mode === "long" ? "selected" : ""} onClick={() => { setMode("long"); setRevealed(null); }}>Long questions</button></div><p className="practice-help">Write your answer first, then reveal the original study answer and key marking point.</p>{questions.map((item, index) => <div className="practice-question" key={`${mode}-${index}`}><b>{index + 1}. {item.question}</b><button className="reveal-button" onClick={() => setRevealed(revealed === index ? null : index)}>{revealed === index ? "Hide answer" : "Show answer"}</button>{revealed === index && <div className="practice-answer"><strong>Answer / marking point:</strong> {item.answer}</div>}</div>)}</div>;
}

function chaptersMap() { return { "Class 9": [], "Class 10": [], "Class 11": [], "Class 12": [] }; }

function SyllabusView({ className, setClassName, onOpenStudy }: { className: string; setClassName: (value: string) => void; onOpenStudy: (title: string) => void }) {
  const units = curriculum[className] ?? [];
  return <section className="study-view"><div className="page-heading"><div><p className="eyebrow teal">BISE Bahawalpur · Academic year 2026–27</p><h1>Biology syllabus</h1><p>Class-wise chapter outline with learning focus. Tap any chapter to open its original notes, objectives, practical guidance and quizzes.</p></div><button className="outline-button" onClick={() => window.print()}><FileCheck2 size={16} /> Print syllabus</button></div><div className="class-tabs">{Object.keys(curriculum).map((item) => <button key={item} className={item === className ? "selected" : ""} onClick={() => setClassName(item)}>{item}</button>)}</div><div className="progress-banner"><div className="progress-icon"><GraduationCap size={22} /></div><div><b>{className} · {units.length} Biology units</b><p>Tap a chapter below to open the complete lesson view.</p></div></div><div className="syllabus-list">{units.map((unit, index) => <button className="syllabus-row" key={unit.title} onClick={() => onOpenStudy(unit.title)}><span className="syllabus-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{unit.title}</h3><p>{unit.detail}</p><small>{unit.objectives?.length ?? 0} objectives · {unit.quiz?.length ?? 0} quick-check questions · Open lesson →</small></div><ChevronRight size={18} /></button>)}</div><div className="original-note"><CircleHelp size={17} /><p><b>Curriculum note:</b> This is an original syllabus-aligned study map, not a scanned or copied publisher textbook. Board notifications can change; verify the latest official notice before examinations.</p></div></section>;
}

function ResultsView() {
  const [exam, setExam] = useState("SSC Part-I (9th)");
  const [year, setYear] = useState("2026");
  const [roll, setRoll] = useState("");
  const [identity, setIdentity] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [link, label] = exam === "SSC Part-I (9th)" ? ["https://results.bisebwp.pk/indexSSC_PI.aspx", "SSC Part-I"] : exam === "SSC Part-II (10th)" ? ["https://results.bisebwp.pk/indexSSC_PII.aspx", "SSC Part-II"] : exam === "HSSC Part-I (1st Year)" ? ["https://results.bisebwp.pk/indexHSSC_PI.aspx", "HSSC Part-I"] : ["https://results.bisebwp.pk/indexHSSC_PII.aspx", "HSSC Part-II"];
  return <section className="results-view"><div className="feature-icon"><FileCheck2 size={23} /></div><p className="eyebrow teal">Verified board access</p><h1>Check your result.</h1><p className="info-description">Use the official BISE Bahawalpur result portal. Enter your roll number there to securely verify the original result.</p><div className="result-form"><label>Exam type<select value={exam} onChange={(event) => setExam(event.target.value)}><option>SSC Part-I (9th)</option><option>SSC Part-II (10th)</option><option>HSSC Part-I (1st Year)</option><option>HSSC Part-II (2nd Year)</option></select></label><label>Year<select value={year} onChange={(event) => setYear(event.target.value)}><option>2026</option><option>2025</option><option>2024</option></select></label><label className="roll-field">Roll number<input value={roll} onChange={(event) => setRoll(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Enter roll number" /></label><label className="roll-field">Bay-Form/CNIC (if asked)<input value={identity} onChange={(event) => setIdentity(event.target.value)} inputMode="numeric" placeholder="Optional — not saved" /></label><button className="primary-button" disabled={!roll} onClick={() => { setSubmitted(true); window.open(link, "_blank", "noopener,noreferrer"); }}><Search size={17} /> Open official result</button></div>{submitted && <div className="result-note success"><Check size={17} /><p>The {label} official BISE Bahawalpur page opened in a new tab. Board security/CAPTCHA is not bypassed; enter required details on the official page.</p></div>}<div className="result-note"><CircleHelp size={17} /><p><b>Original result:</b> The app does not create demo marks or grades. Results are verified only through the official BISE portal. Roll number and Bay-Form/CNIC are not permanently saved.</p></div><a className="official-link" href="https://results.bisebwp.pk/" target="_blank" rel="noreferrer">Visit results.bisebwp.pk <ChevronRight size={15} /></a></section>;
}
function InfoView({ title, eyebrow, icon, description, cards, sources = [], onAsk }: { title: string; eyebrow: string; icon: ReactNode; description: string; cards: string[]; sources?: string[]; onAsk: (text: string) => void }) { return <section className="info-view"><div className="feature-icon">{icon}</div><p className="eyebrow teal">{eyebrow}</p><h1>{title}</h1><p className="info-description">{description}</p><div className="info-cards">{cards.map((card, index) => <button key={card} onClick={() => onAsk(card)}><span>0{index + 1}</span><b>{card}</b><ChevronRight size={17} /></button>)}</div>{sources.length > 0 && <div className="source-list"><p className="eyebrow teal">Reference shelf</p>{sources.map((source) => <div key={source}><Check size={14} /> <span>{source}</span></div>)}</div>}<button className="primary-button" onClick={() => onAsk("Mujhe is topic ko detail mein samjhao")}>Ask AI tutor <ArrowUp size={17} /></button></section>; }
function ProView() { return <section className="pro-view"><div className="pro-badge"><LockKeyhole size={19} /> PRO LIBRARY</div><h1>Deep study, unlocked.</h1><p>Premium original study packs, exam practice and advanced revision tools will be available here. Payment is not connected yet.</p><div className="pro-grid">{["Complete chapter workbooks", "Board-style paper practice", "Smart revision planner", "Detailed practical guides"].map((item) => <div className="pro-card" key={item}><LockKeyhole size={17} /><b>{item}</b><span>Locked · Pro</span></div>)}</div><button className="primary-button"><Sparkles size={17} /> Unlock Pro <ArrowUp size={17} /></button><small>Secure payment integration will be connected before charging users.</small></section>; }
