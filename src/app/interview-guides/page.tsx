import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, MessageSquare, Target } from "lucide-react";
import { staticMetadata } from "@/lib/seo";
import { breadcrumbs } from "@/lib/structured-data";
import { StructuredData } from "@/components/common/StructuredData";
import { GuideLibrary, PreparationChecklist } from "./GuideLibrary";
import { guides } from "./guides";
import "./interview-guides.css";

export const metadata = staticMetadata("/interview-guides");
const questionCount = guides.reduce((sum, guide) => sum + guide.questions.length, 0);
const steps = [
  { number: "01", title: "Understand the opportunity", text: "Read the job description. Pick the responsibilities, skills and problems the employer needs help with.", icon: Target },
  { number: "02", title: "Find your evidence", text: "Choose real examples that show how you work. Be specific about your contribution and the outcome.", icon: BookOpen },
  { number: "03", title: "Practise the conversation", text: "Say your answers out loud. Aim for a clear explanation, then leave room for follow-up questions.", icon: MessageSquare },
];
const star = [
  { letter: "S", title: "Situation", detail: "Set the scene. What was happening, and why did it matter?" },
  { letter: "T", title: "Task", detail: "Explain the goal and the responsibility you personally held." },
  { letter: "A", title: "Action", detail: "Describe the steps you took and the reasoning behind your choices." },
  { letter: "R", title: "Result", detail: "Share the outcome, what you learned and what you would improve." },
];
export default function InterviewGuidesPage() {
  return <div className="ig-page">
    <StructuredData data={breadcrumbs([{ name: "Interview guides", path: "/interview-guides" }])} />
    <header className="ig-intro">
      <div className="ig-container">
        <nav aria-label="Breadcrumb" className="ig-breadcrumb"><Link href="/">Home</Link><span>/</span><span>Interview guides</span></nav>
        <div className="ig-intro-row">
          <div><h1>Interview guides</h1><p>Practise questions by role, build clear answers and prepare for your next conversation.</p></div>
          <a className="ig-text-link" href="#preparation-checklist">Your preparation checklist <ArrowRight size={16} /></a>
        </div>
        <p className="ig-intro-meta">{guides.length} guide collections <span aria-hidden="true">·</span> {questionCount} practice questions <span aria-hidden="true">·</span> Free, no sign-up needed</p>
      </div>
    </header>
    <section id="guide-library" className="ig-library-section" aria-labelledby="library-title"><div className="ig-container ig-section">
      <div className="ig-section-heading"><div><span className="ig-kicker">THE GUIDE LIBRARY</span><h2 id="library-title">Find the questions that fit your next step.</h2></div><p>Choose a focus, explore the approach and practise with your own experience. These are preparation prompts, not an employer&apos;s exact question list.</p></div>
      <GuideLibrary />
    </div></section>
    <section className="ig-container ig-section" aria-labelledby="preparation-title">
      <div className="ig-section-heading"><div><span className="ig-kicker">PREPARE WITH PURPOSE</span><h2 id="preparation-title">Before the questions, build your foundation.</h2></div><p>You do not need a perfect script. You need to understand the role and explain what you can bring to it.</p></div>
      <div className="ig-steps">{steps.map(step => <article key={step.number}><div><span>{step.number}</span><step.icon size={23} aria-hidden="true" /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
    </section>
    <section id="star-method" className="ig-container ig-section ig-star-layout" aria-labelledby="star-title">
      <div><span className="ig-kicker">A FRAMEWORK, NOT A SCRIPT</span><h2 id="star-title">Give your answer<br />a little STAR quality.</h2><p>The Situation, Task, Action, Result framework helps organise answers to questions about past experience. Keep the context brief and make your own actions clear.</p><a className="ig-text-link" href="https://nationalcareers.service.gov.uk/careers-advice/interview-advice/the-star-method/" target="_blank" rel="noopener noreferrer">Read the National Careers Service guide <ArrowUpRight size={15} /></a><div className="ig-example-note"><CheckCircle2 size={19} /><p>Use real examples. If you do not have a measured result, explain the observable outcome and what you learned.</p></div></div>
      <div className="ig-star-cards">{star.map(item => <article key={item.letter}><span>{item.letter}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</div>
    </section>
    <section id="preparation-checklist" className="ig-checklist-section" aria-labelledby="checklist-title"><div className="ig-container ig-section ig-checklist-layout">
      <div><span className="ig-kicker">THE FINAL CHECK</span><h2 id="checklist-title">Feel ready.<br />Not rehearsed.</h2><p>Use this checklist before your next interview, whether you are meeting in person, joining a video call or speaking by phone.</p><div className="ig-ask-panel"><span>LEAVE SPACE FOR YOUR QUESTIONS</span><h3>Make it a two-way conversation.</h3><ul><li>What would success in the first three months look like?</li><li>What is the team&apos;s biggest priority right now?</li><li>How will you support someone learning this role?</li><li>What are the next steps in the process?</li></ul></div></div>
      <PreparationChecklist />
    </div></section>
    <section className="ig-container ig-next"><div><span className="ig-kicker">PUT YOUR PREPARATION TO WORK</span><h2>Your next chapter starts with a conversation.</h2><p>Explore current opportunities, or keep building your career toolkit.</p></div><div><Link className="ig-button" href="/jobs">Explore job openings <ArrowUpRight size={17} /></Link><Link className="ig-text-link" href="/blog">Read career insights <ArrowRight size={16} /></Link></div></section>
  </div>;
}
