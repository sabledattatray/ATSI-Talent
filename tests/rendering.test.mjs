import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import React, { Suspense } from "react";
import { renderToString } from "react-dom/server";

const nativeRequire = createRequire(import.meta.url);

test("homepage renders its hero, search and services while opportunities are suspended", () => {
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync("src/app/HomeClient.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const require = id => {
    if (id === "next/navigation") return { useRouter: () => ({ push() {} }) };
    if (id === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (id === "@/lib/ats-types") return { INDUSTRIES: ["Technology", "Healthcare"] };
    if (id.endsWith(".css")) return {};
    return nativeRequire(id);
  };
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})')(require, loadedModule, loadedModule.exports);
  const pending = new Promise(() => {});
  function PendingJobs() { throw pending; }
  const opportunities = React.createElement(Suspense, { fallback: React.createElement("p", { role: "status" }, "Loading jobs only") }, React.createElement(PendingJobs));
  const html = renderToString(React.createElement(loadedModule.exports.default, { opportunities }));
  assert.match(html, /Great people/);
  assert.match(html, /Find work that works for you/);
  assert.match(html, /Search jobs/);
  assert.match(html, /Less scattered work/);
  assert.match(html, /Loading jobs only/);
  assert.doesNotMatch(html, /Loading recruitment and career opportunities/);
});
