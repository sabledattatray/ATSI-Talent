"use client";
import { useState } from "react";
import { ArrowUpRight, Check, ChevronDown, RotateCcw, Search } from "lucide-react";
import { guides, checklist } from "./guides";

export function GuideLibrary() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visible = guides.filter(guide => category === "all" || guide.id === category).map(guide => ({
    ...guide,
    questions: guide.questions.filter(item => !term || [guide.title, item.question, item.approach, item.prompt].join(" ").toLowerCase().includes(term)),
  })).filter(guide => guide.questions.length);
  const count = visible.reduce((sum, guide) => sum + guide.questions.length, 0);
  return <>
    <div className="ig-library-tools">
      <div className="ig-filters" role="group" aria-label="Filter guides by role">
        {[{ id: "all", title: "All guides" }, ...guides].map(guide => <button type="button" key={guide.id} aria-pressed={category === guide.id} onClick={() => setCategory(guide.id)}>{guide.title}</button>)}
      </div>
      <label className="ig-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search interview questions</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search questions or skills…" /></label>
    </div>
    <p className="ig-result-count" role="status">{count} practice {count === 1 ? "question" : "questions"}{term ? " matching your search" : " · open any question to explore the approach"}</p>
    <div className="ig-guide-grid">
      {visible.map(guide => <article className="ig-guide-card" key={guide.id}>
        <div className="ig-guide-heading"><span className="ig-kicker">{guide.label}</span><span className="ig-card-arrow" aria-hidden="true"><ArrowUpRight size={19} /></span></div>
        <h3>{guide.title}</h3><p>{guide.description}</p>
        <div className="ig-questions">{guide.questions.map(item => <details key={item.question}>
          <summary>{item.question}<ChevronDown size={16} aria-hidden="true" /></summary>
          <div className="ig-answer"><span>HOW TO APPROACH IT</span><p>{item.approach}</p><div><strong>Make it yours</strong><p>{item.prompt}</p></div></div>
        </details>)}</div>
      </article>)}
    </div>
    {!visible.length && <div className="ig-no-results"><h3>No questions match that search.</h3><p>Try a broader skill or switch to all guides.</p><button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>Reset filters <RotateCcw size={15} /></button></div>}
  </>;
}

export function PreparationChecklist() {
  const [completed, setCompleted] = useState<number[]>([]);
  return <div className="ig-checklist">
    <div className="ig-checklist-top"><span>Your preparation checklist</span><span aria-live="polite">{completed.length} / {checklist.length}</span></div>
    <progress max={checklist.length} value={completed.length} aria-label="Interview preparation progress" />
    <div className="ig-check-items">{checklist.map((item, index) => <label key={item}>
      <input type="checkbox" checked={completed.includes(index)} onChange={event => setCompleted(current => event.target.checked ? [...current, index] : current.filter(value => value !== index))} />
      <span>{item}</span>
    </label>)}</div>
    <div className="ig-checklist-bottom"><span><Check size={14} aria-hidden="true" />For your current page session</span><button type="button" onClick={() => setCompleted([])} disabled={!completed.length}>Reset</button></div>
  </div>;
}
