export type InterviewGuide = {
  id: string; title: string; label: string; description: string;
  questions: { question: string; approach: string; prompt: string }[];
};
export const guides: InterviewGuide[] = [
  {
    id: "behavioural", title: "HR & behavioural", label: "THE FOUNDATIONS",
    description: "Introduce yourself, explain your choices and turn experience into a clear story.",
    questions: [
      { question: "Tell me about yourself.", approach: "Connect your current work or studies, one relevant achievement and your reason for pursuing this role. Focus on the experience that helps the interviewer understand your fit rather than reciting every line of your CV.", prompt: "Practise a short introduction, then remove details that do not connect to this opportunity." },
      { question: "Tell me about a difficult stakeholder or disagreement.", approach: "Describe the shared goal and the source of disagreement without blaming anyone. Explain how you listened, checked assumptions and agreed on a next step. Finish with the outcome and what you would repeat or change.", prompt: "What did you personally say or do that helped move the work forward?" },
      { question: "Why are you interested in this role?", approach: "Link specific responsibilities in the job description to work you enjoy and skills you can demonstrate. Refer to something you have learned about the employer, then explain what you hope to contribute and develop.", prompt: "Name two responsibilities you can connect to a real example from your experience." },
    ],
  },
  {
    id: "data", title: "Data, MIS & analytics", label: "FROM DATA TO DECISIONS",
    description: "Talk through SQL, reporting, data quality and the business impact of your analysis.",
    questions: [
      { question: "How do you validate a report before sharing it?", approach: "Start with the metric definition, reporting period and source of truth. Explain checks for missing records, duplicates, joins, aggregation and refresh timing. Reconcile totals and review unusual movements with the business owner before publishing.", prompt: "Bring an example of a mismatch you caught and explain how you traced its cause." },
      { question: "A SQL join doubles your total. How do you investigate?", approach: "Check the intended grain of each table and whether the join keys are unique. Compare row counts before and after the join and test for many-to-many matches. Explain why you would fix the grain rather than hide the issue with DISTINCT.", prompt: "Sketch two small tables and show how a duplicate key changes the result." },
      { question: "Describe a dashboard that changed a business decision.", approach: "Explain who used it, the decision they needed to make and the measures you selected. Discuss how you checked accuracy and usability. Describe the resulting action; use measured impact only when you can substantiate it.", prompt: "What decision became easier, and how did you know the dashboard was useful?" },
    ],
  },
  {
    id: "engineering", title: "Software & engineering", label: "REASONING THAT SCALES",
    description: "Make your technical choices, debugging process and delivery trade-offs easy to follow.",
    questions: [
      { question: "Walk me through a system you built.", approach: "Begin with the user need, expected workload and constraints. Draw the main components and explain the flow of data. Discuss one trade-off, a failure mode, how you tested the system and what you would improve next.", prompt: "Which part did you own, and why was your design appropriate for its constraints?" },
      { question: "How would you investigate a slow API?", approach: "Clarify the affected endpoints and compare typical and tail latency. Use logs, metrics or traces to separate application, database and network time. Form a hypothesis, measure it, make a targeted change and check the result.", prompt: "Which measurement would you collect before changing the code?" },
      { question: "Tell me about a production issue you resolved.", approach: "Describe how you detected the issue, limited its impact and communicated with the team. Explain the evidence behind the root cause and the fix. Close with the tests, monitoring or process changes that helped prevent a repeat.", prompt: "Separate the immediate recovery from the longer-term prevention work." },
    ],
  },
  {
    id: "finance", title: "Finance & operations", label: "ACCURACY WITH OWNERSHIP",
    description: "Demonstrate sound judgement, reliable controls and thoughtful process improvement.",
    questions: [
      { question: "How do you investigate an unexpected variance?", approach: "Confirm the comparison period and definition first. Break the movement into plausible drivers such as volume, price, timing or classification. Reconcile to source records, document assumptions and explain the supported cause rather than guessing.", prompt: "How would you distinguish a timing difference from an operational change?" },
      { question: "How do you balance speed with accuracy?", approach: "Explain how you identify high-risk steps, set review criteria and automate repeatable checks. Describe when you would escalate an unresolved discrepancy instead of submitting an unverified figure to meet a deadline.", prompt: "Use a real example of a control that caught an error without slowing the entire process." },
      { question: "Describe a process you improved.", approach: "Outline the original bottleneck and how you measured it. Explain the change, who needed to agree and how you tested it. Discuss the outcome and any new controls needed to keep the process reliable.", prompt: "What evidence shows the new process was better, and what trade-offs remained?" },
    ],
  },
  {
    id: "commercial", title: "Sales & customer success", label: "TRUST BEFORE THE PITCH",
    description: "Show how you discover needs, handle objections and build useful customer relationships.",
    questions: [
      { question: "How do you understand a new customer's needs?", approach: "Explain how you research the account and ask about goals, processes, constraints and decision-making. Reflect the problem back before proposing a solution. Describe how you confirm what a successful outcome would mean.", prompt: "Prepare three discovery questions that invite detail rather than a yes-or-no answer." },
      { question: "How would you respond to a price objection?", approach: "Clarify whether the concern is budget, value, timing or comparison with another option. Connect the discussion to the customer's priorities and explain available trade-offs. Avoid promising a discount or capability you cannot deliver.", prompt: "What would you ask before deciding that price is the real obstacle?" },
      { question: "Tell me about a customer relationship that needed recovery.", approach: "Describe the expectation gap and how you took ownership. Explain how you listened, agreed on a realistic plan and kept the customer informed. Share the outcome honestly, including any limit to what you could resolve.", prompt: "Which commitment did you make, and how did you follow through?" },
    ],
  },
  {
    id: "early-career", title: "Freshers & career changers", label: "MAKE YOUR POTENTIAL VISIBLE",
    description: "Use projects, learning and transferable experience to explain what you can contribute.",
    questions: [
      { question: "What experience do you have if this is your first role?", approach: "Choose a relevant project, internship, volunteering experience or responsibility from your studies. Explain the goal, your contribution, how you checked the result and what you learned. Distinguish practice work from commercial experience.", prompt: "Which example best demonstrates one requirement in this job description?" },
      { question: "Why are you changing your career direction?", approach: "Explain what attracted you to the new field and how you tested that interest through learning or practical work. Connect transferable skills to the role and acknowledge the areas you are still developing.", prompt: "Show one concrete step you have already taken towards the transition." },
      { question: "How do you learn something unfamiliar?", approach: "Describe how you break the problem down, find reliable material and practise on a small example. Explain when you ask for help, how you check your understanding and how you apply feedback.", prompt: "Bring an example of something you learned and then used independently." },
    ],
  },
];
export const checklist = [
  "I can explain the role's main responsibilities in my own words.",
  "I have three honest examples of work, projects or learning to discuss.",
  "I have checked my CV, portfolio and the details in my application.",
  "I have practised my introduction and one answer out loud.",
  "I have confirmed the time zone, location or video link and any adjustments I need.",
  "I have prepared questions about expectations, the team and the next steps.",
];
