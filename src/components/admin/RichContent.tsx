import { richColor, richFontSize } from "@/lib/admin/text-style";
import type { CSSProperties, ReactNode } from "react";
import type { RichNode } from "@/lib/admin/types";
const safeLink = (v: unknown) => typeof v === "string" && /^https?:\/\/[^\s]+$/i.test(v) ? v : undefined;
export function RichContent({ document }: { document: RichNode }) {
  function render(node: RichNode, key: number): ReactNode {
    const a = node.attrs || {}; const children = node.content?.map(render);
    const style: CSSProperties = ["left", "center", "right", "justify"].includes(String(a.textAlign)) ? { textAlign: a.textAlign as CSSProperties["textAlign"] } : {};
    switch (node.type) {
      case "doc": return <div key={key} className="cms-prose">{children}</div>;
      case "text": { let text: ReactNode = node.text; for (const [i, m] of (node.marks || []).entries()) { const k = `${key}-${i}`; if (m.type === "textStyle") text = <span key={k} style={{ color: richColor(m.attrs?.color), fontSize: richFontSize(m.attrs?.fontSize) }}>{text}</span>; if (m.type === "bold") text = <strong key={k}>{text}</strong>; if (m.type === "italic") text = <em key={k}>{text}</em>; if (m.type === "underline") text = <u key={k}>{text}</u>; if (m.type === "strike") text = <s key={k}>{text}</s>; if (m.type === "code") text = <code key={k}>{text}</code>; if (m.type === "highlight") text = <mark key={k}>{text}</mark>; if (m.type === "link") text = <a key={k} href={safeLink(m.attrs?.href)} rel="noopener noreferrer">{text}</a>; } return <span key={key}>{text}</span>; }
      // The surrounding article or job page supplies the document H1.
      case "heading": return a.level === 3 ? <h3 key={key} style={style}>{children}</h3> : <h2 key={key} style={style}>{children}</h2>;
      case "paragraph": return <p key={key} style={style}>{children || <br />}</p>;
      case "bulletList": return <ul key={key}>{children}</ul>;
      case "orderedList": return <ol key={key}>{children}</ol>;
      case "listItem": return <li key={key}>{children}</li>;
      case "blockquote": return <blockquote key={key}>{children}</blockquote>;
      case "codeBlock": return <pre key={key}><code>{children}</code></pre>;
      case "hardBreak": return <br key={key} />;
      case "horizontalRule": return <hr key={key} />;
      // User-supplied HTML is never injected into the page.
      // eslint-disable-next-line @next/next/no-img-element
      case "image": return typeof a.src === "string" && /^\/api\/media\/[a-f0-9-]+$/.test(a.src) ? <figure key={key}><img src={a.src} alt={String(a.alt || "")} loading="lazy" /><figcaption>{String(a.title || "")}</figcaption></figure> : null;
      case "table": return <div key={key} className="cms-table-wrap"><table><tbody>{children}</tbody></table></div>;
      case "tableRow": return <tr key={key}>{children}</tr>;
      case "tableHeader": return <th key={key}>{children}</th>;
      case "tableCell": return <td key={key}>{children}</td>;
      default: return null;
    }
  }
  return render(document, 0);
}
