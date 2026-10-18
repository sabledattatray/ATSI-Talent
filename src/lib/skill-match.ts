const aliases: Record<string, string> = {
  js: "javascript", ts: "typescript", nodejs: "node.js", "node js": "node.js",
  reactjs: "react", "react.js": "react", postgres: "postgresql",
  "microsoft excel": "excel", powerbi: "power bi", "amazon web services": "aws",
};
function key(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return aliases[normalized] || normalized;
}
function skills(value: string) {
  const result = new Map<string, string>();
  for (const label of value.split(/[,;\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean)) {
    const canonical = key(label);
    if (!result.has(canonical)) result.set(canonical, label);
  }
  return result;
}
// Compare explicitly listed skills; substrings confuse Java/JavaScript and C/C++.
export function matchSkills(required: string, candidate: string) {
  const requirements = skills(required), supplied = skills(candidate);
  const matched = [...requirements].filter(([canonical]) => supplied.has(canonical)).map(([,label]) => label);
  return { required: [...requirements.values()], matched, score: requirements.size ? Math.round(matched.length / requirements.size * 100) : 0 };
}
