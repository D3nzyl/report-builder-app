import type { JSONContent } from "@tiptap/core";
import type { FormAnswers, QuestionType, FormQuestion, ApprovalAnswer } from "./types";

// ─── Utilities ────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Inline content → HTML ────────────────────────────────────────────────────

function applyMarks(text: string, marks: JSONContent["marks"]): string {
  if (!marks?.length) return text;
  let r = text;
  for (const m of marks) {
    switch (m.type) {
      case "bold":      r = `<strong>${r}</strong>`; break;
      case "italic":    r = `<em>${r}</em>`; break;
      case "underline": r = `<u>${r}</u>`; break;
      case "strike":    r = `<s>${r}</s>`; break;
      case "code":      r = `<code style="background:#f3f4f6;border-radius:3px;padding:1px 5px;font-size:.875em;font-family:monospace">${r}</code>`; break;
      case "link":      r = `<a href="${esc(m.attrs?.href ?? "")}" style="color:#3b82f6;text-decoration:underline">${r}</a>`; break;
    }
  }
  return r;
}

function inlineToHtml(nodes: JSONContent[], answers: FormAnswers): string {
  return (nodes ?? []).map(n => {
    if (n.type === "text") return applyMarks(esc(n.text ?? ""), n.marks);
    if (n.type === "hardBreak") return "<br>";
    if (n.type === "questionVariableInline") {
      const { variableKey, questionType, displayType } = n.attrs ?? {};
      const raw = answers[variableKey as string];

      if (questionType === "image_upload") {
        const url = String(Array.isArray(raw) ? raw[0] : (raw ?? ""));
        if (!url) return `<span style="color:#9ca3af;font-size:.875em;">No image</span>`;
        return `<img src="${esc(url)}" alt="" style="max-width:100%;border-radius:6px;display:block;margin:4px 0;" />`;
      }

      if (displayType === "inline_remarks_image") {
        const span = Math.min(12, Math.max(4, (n.attrs?.colSpan ?? 4) as number));
        const w = `${Math.round((span / 12) * 100)}%`;
        let data: { images?: string[] } | null = null;
        try { data = JSON.parse(raw as string); } catch { /* fall through */ }
        const images = data?.images ?? [];
        const inner = images.length
          ? images.map(src => `<img src="${esc(src)}" alt="" style="max-width:100%;border-radius:6px;display:block;margin:4px 0;" />`).join("")
          : `<span style="color:#9ca3af;font-size:.875em;">No images</span>`;
        return `<span style="display:inline-block;width:${w};vertical-align:top;padding:0 3px;box-sizing:border-box;">${inner}</span>`;
      }

      const val = formatScalar(raw, questionType);
      return `<span style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:1px 6px;font-size:.875em;color:#374151">${esc(val)}</span>`;
    }
    if (n.content) return inlineToHtml(n.content, answers);
    return "";
  }).join("");
}

// ─── Scalar value formatter ───────────────────────────────────────────────────

function formatScalar(value: string | string[] | undefined, type: QuestionType): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (type === "toggle") return value === "true" || value === "yes" || value === "1" ? "Yes" : "No";
  return String(value);
}

// ─── Answer → styled HTML for a block ────────────────────────────────────────

function answerHtml(value: string | string[] | undefined, type: QuestionType): string {
  const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length);
  const gray = (t: string) => `<span style="color:#9ca3af;font-size:13px;">${t}</span>`;
  const plain = (s: string) => `<div style="color:#374151;font-size:13px;line-height:1.5;">${esc(s)}</div>`;

  switch (type) {
    case "short_text":
    case "long_text":
      if (empty) return gray("—");
      return `<div style="color:#374151;font-size:13px;line-height:1.5;white-space:pre-wrap;">${esc(Array.isArray(value) ? value.join("\n") : String(value))}</div>`;

    case "number":
      return empty ? gray("0") : plain(String(Array.isArray(value) ? value[0] : value));

    case "date":
    case "datetime":
      return empty ? gray("—") : plain(String(Array.isArray(value) ? value[0] : value));

    case "radio":
    case "single_select": {
      if (empty) return gray("No selection");
      const v = esc(String(Array.isArray(value) ? value[0] : value));
      return `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:999px;padding:2px 10px;font-size:12px;">${v}</span>`;
    }

    case "multi_select": {
      if (empty) return gray("No selections");
      const vals = Array.isArray(value) ? value : [String(value)];
      const chips = vals.map(v => `<span style="display:inline-block;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;border-radius:999px;padding:2px 10px;font-size:12px;">${esc(v)}</span>`).join(" ");
      return `<div style="display:flex;flex-wrap:wrap;gap:4px;">${chips}</div>`;
    }

    case "toggle": {
      const yes = !empty && (value === "true" || value === "yes" || value === "1");
      return `<span style="display:inline-block;background:${yes ? "#dcfce7" : "#f3f4f6"};color:${yes ? "#15803d" : "#6b7280"};border-radius:999px;padding:2px 10px;font-size:12px;font-weight:500;">${yes ? "Yes" : "No"}</span>`;
    }

    case "rating": {
      if (empty) return `<span style="color:#d1d5db;font-size:18px;letter-spacing:2px;">☆☆☆☆☆</span>`;
      const n = Math.min(5, Math.max(0, parseInt(String(Array.isArray(value) ? value[0] : value), 10)));
      return `<span style="color:#f59e0b;font-size:18px;letter-spacing:2px;">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`;
    }

    case "slider":
      return empty ? gray("—") : plain(String(Array.isArray(value) ? value[0] : value));

    case "image_upload": {
      const url = String(Array.isArray(value) ? value[0] : (value ?? ""));
      if (!url) return `<div style="border:2px dashed #e5e7eb;border-radius:6px;padding:20px;text-align:center;color:#9ca3af;font-size:12px;">No image</div>`;
      return `<img src="${esc(url)}" alt="" style="max-width:100%;border-radius:6px;" />`;
    }

    case "file_upload": {
      const url = String(Array.isArray(value) ? value[0] : (value ?? ""));
      if (!url) return `<div style="border:2px dashed #e5e7eb;border-radius:6px;padding:16px;text-align:center;color:#9ca3af;font-size:12px;">No file</div>`;
      return `<div style="color:#3b82f6;font-size:13px;">📎 ${esc(url)}</div>`;
    }

    case "signature":
      return empty
        ? `<div style="border-bottom:2px dashed #d1d5db;margin-top:32px;padding-top:4px;display:flex;justify-content:flex-end;"><span style="color:#9ca3af;font-size:11px;">Sign here</span></div>`
        : plain("Signature provided");

    case "sketch":
      return empty
        ? `<div style="border:2px dashed #e5e7eb;border-radius:6px;padding:24px;text-align:center;color:#9ca3af;font-size:12px;">No sketch</div>`
        : plain("Sketch provided");

    case "location": {
      const coords = String(Array.isArray(value) ? value[0] : (value ?? ""));
      if (!coords) return `<div style="border:2px dashed #e5e7eb;border-radius:6px;padding:16px;text-align:center;color:#9ca3af;font-size:12px;">No location</div>`;
      return `<div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
        <svg width="100%" height="64" viewBox="0 0 300 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <rect width="300" height="64" fill="#e8edf2"/>
          <rect x="0" y="24" width="300" height="8" fill="#f5f6f7"/>
          <rect x="100" y="0" width="8" height="64" fill="#f5f6f7"/>
          <rect x="200" y="0" width="6" height="64" fill="#f5f6f7"/>
          <rect x="12" y="6" width="80" height="12" rx="2" fill="#dce2e9"/>
          <rect x="112" y="6" width="60" height="12" rx="2" fill="#dce2e9"/>
          <rect x="210" y="6" width="70" height="12" rx="2" fill="#dce2e9"/>
          <rect x="12" y="36" width="80" height="10" rx="2" fill="#dce2e9"/>
          <rect x="112" y="36" width="60" height="10" rx="2" fill="#dce2e9"/>
          <ellipse cx="152" cy="30" rx="4" ry="2" fill="rgba(0,0,0,0.15)"/>
          <path d="M152 12C148 12 145 15 145 19C145 25 152 30 152 30C152 30 159 25 159 19C159 15 156 12 152 12Z" fill="#ef4444"/>
          <circle cx="152" cy="19" r="3" fill="white" opacity="0.9"/>
        </svg>
        <div style="padding:4px 10px;font-size:11px;color:#6b7280;background:white;">📍 ${esc(coords)}</div>
      </div>`;
    }

    default:
      return empty ? gray("—") : plain(formatScalar(value, type));
  }
}

// ─── Approval block HTML ──────────────────────────────────────────────────────

const APPROVAL_ROW_H = 72;

function approvalHtml(raw: string | string[] | undefined, pageless = false): string {
  let data: ApprovalAnswer | null = null;
  try { data = JSON.parse(raw as string); } catch { /* fall through */ }

  if (!data) return `<div style="color:#9ca3af;font-size:13px;">—</div>`;

  const approved = data.decision === "approved";
  const personLabel = approved ? "Approved by" : "Rejected by";

  const fieldStyle = `border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;background:#f9fafb;flex:1;min-width:0;box-sizing:border-box;`;
  const labelStyle = "font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;";
  const valueStyle = "font-size:13px;color:#374151;";

  const signatureSvg = `<svg width="100%" height="100%" viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path d="M 40 52 C 55 30, 65 30, 75 45 C 85 60, 90 38, 105 40 C 120 42, 118 55, 130 50 C 142 45, 145 32, 158 35 C 171 38, 170 55, 182 52 C 194 49, 196 38, 210 40 C 224 42, 222 56, 235 52 C 242 50, 248 44, 256 46" fill="none" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="24" y1="64" x2="276" y2="64" stroke="#e5e7eb" stroke-width="1"/>
    <text x="150" y="76" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="#d1d5db">Signature</text>
  </svg>`;

  const thirdCell = approved
    ? `<div style="${fieldStyle}display:flex;flex-direction:column;">
        <div style="${labelStyle}">Signature</div>
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;overflow:hidden;min-height:0;">${signatureSvg}</div>
      </div>`
    : `<div style="${fieldStyle}overflow:hidden;">
        <div style="${labelStyle}">Remarks</div>
        <div style="${valueStyle}font-size:12px;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${esc(data.remarks || "—")}</div>
      </div>`;

  const imagesBlock = !approved && data.images?.length
    ? `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;background:#f9fafb;margin-top:8px;">
        <div style="${labelStyle}">Images <span style="font-weight:400;text-transform:none;">(optional)</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
          ${data.images.map(src => `<img src="${esc(src)}" alt="" style="max-width:180px;border-radius:4px;"/>`).join("")}
        </div>
      </div>`
    : "";

  if (pageless) {
    return `<div style="width:100%;display:flex;flex-direction:column;gap:8px;">
      <div style="${fieldStyle}">
        <div style="${labelStyle}">${personLabel}</div>
        <div style="${valueStyle}">${esc(data.person || "—")}</div>
      </div>
      <div style="${fieldStyle}">
        <div style="${labelStyle}">Date</div>
        <div style="${valueStyle}">${esc(data.date || "—")}</div>
      </div>
      ${thirdCell}
      ${imagesBlock}
    </div>`;
  }

  return `<div style="width:100%;">
    <div style="display:flex;align-items:stretch;gap:8px;width:100%;height:${APPROVAL_ROW_H}px;box-sizing:border-box;">
      <div style="${fieldStyle}">
        <div style="${labelStyle}">${personLabel}</div>
        <div style="${valueStyle}">${esc(data.person || "—")}</div>
      </div>
      <div style="${fieldStyle}">
        <div style="${labelStyle}">Date</div>
        <div style="${valueStyle}">${esc(data.date || "—")}</div>
      </div>
      ${thirdCell}
    </div>
    ${imagesBlock}
  </div>`;
}

// ─── Multi-response list HTML ─────────────────────────────────────────────────

function multiResponseListHtml(values: string[], type: QuestionType): string {
  if (!values.length) return `<span style="color:#9ca3af;font-size:13px;">—</span>`;
  const items = values.map((v, i) =>
    `<li style="margin-bottom:4px;color:#374151;font-size:13px;">${esc(String(i + 1))}. ${esc(v || "—")}</li>`
  ).join("");
  return `<ol style="margin:4px 0 0 16px;padding:0;">${items}</ol>`;
}

// ─── Multi-field block HTML ───────────────────────────────────────────────────

const DEFAULT_COL_W = 100;

function multiFieldHtml(question: FormQuestion, answers: FormAnswers, label: string): string {
  const allSubFields = question.subFields ?? [];
  if (!allSubFields.length) return `<div style="color:#9ca3af;font-size:13px;">—</div>`;

  if (question.multiResponse) {
    // Resolve visible columns in editor order
    const visibleKeys = question.columnOrder ?? allSubFields.map(sf => sf.variableKey);
    const subFields = visibleKeys
      .map(key => allSubFields.find(sf => sf.variableKey === key))
      .filter((sf): sf is NonNullable<typeof sf> => !!sf);

    if (!subFields.length) return `<div style="color:#9ca3af;font-size:13px;">—</div>`;

    const columnWidths = question.columnWidths ?? {};
    const thStyle = "border:1px solid #d1d5db;padding:6px 10px;font-weight:600;background:#f9fafb;text-align:left;vertical-align:top;font-size:12px;overflow:hidden;";
    const tdStyle = "border:1px solid #d1d5db;padding:6px 10px;text-align:left;vertical-align:top;font-size:12px;color:#374151;overflow:hidden;";

    // Convert px widths to % so the table always fills its container
    const rawWidths = subFields.map(sf => columnWidths[sf.variableKey] ?? DEFAULT_COL_W);
    const totalW = rawWidths.reduce((s, w) => s + w, 0);
    const colgroup = `<colgroup>${subFields.map((sf, i) =>
      `<col style="width:${((rawWidths[i] / totalW) * 100).toFixed(2)}%">`
    ).join("")}</colgroup>`;

    const headers = subFields.map(sf => {
      const h = question.columnHeaders?.[sf.variableKey] ?? sf.label;
      return `<th style="${thStyle}">${esc(h)}</th>`;
    }).join("");

    const maxRows = Math.max(1, ...subFields.map(sf => {
      const v = answers[sf.variableKey];
      return Array.isArray(v) ? v.length : 1;
    }));

    const rows = Array.from({ length: maxRows }, (_, rowIdx) =>
      `<tr>${subFields.map(sf => {
        const v = answers[sf.variableKey];
        if (sf.multiResponse) {
          const items = Array.isArray(v) ? v : (v ? [v] : []);
          const cell = items.length
            ? items.map(item => `• ${esc(item)}`).join("<br>")
            : `<span style="color:#9ca3af;">—</span>`;
          return `<td style="${tdStyle}">${cell}</td>`;
        }
        const cellVal = Array.isArray(v) ? v[rowIdx] ?? v[0] : v;
        return `<td style="${tdStyle}">${cellVal ? esc(String(cellVal)) : '<span style="color:#9ca3af;">—</span>'}</td>`;
      }).join("")}</tr>`
    ).join("");

    return `<div style="margin-top:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;"><table style="border-collapse:collapse;table-layout:fixed;width:100%;min-width:360px;font-size:12px;">${colgroup}<thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // Stacked sub-field blocks
  return allSubFields.map(sf => {
    const v = answers[sf.variableKey];
    const sfLabel = `<div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">${esc(sf.label)}</div>`;
    let sfValue: string;
    if (sf.multiResponse && Array.isArray(v) && v.length > 1) {
      sfValue = multiResponseListHtml(v, sf.type);
    } else {
      sfValue = answerHtml(v, sf.type);
    }
    return `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;margin-bottom:6px;background:white;">${sfLabel}${sfValue}</div>`;
  }).join("");
}

// ─── Block nodes → HTML ───────────────────────────────────────────────────────

function blockToHtml(node: JSONContent, answers: FormAnswers, questions: FormQuestion[], pageless = false): string {
  switch (node.type) {
    case "heading": {
      const lvl = node.attrs?.level ?? 1;
      const content = inlineToHtml(node.content ?? [], answers);
      const s: Record<number, string> = {
        1: "font-size:26px;font-weight:700;margin:20px 0 8px;color:#111827;",
        2: "font-size:19px;font-weight:700;margin:18px 0 6px;color:#111827;",
        3: "font-size:15px;font-weight:600;margin:14px 0 4px;color:#1f2937;",
      };
      return `<h${lvl} style="width:100%;box-sizing:border-box;${s[lvl] ?? s[3]}">${content}</h${lvl}>`;
    }

    case "paragraph": {
      const content = inlineToHtml(node.content ?? [], answers);
      return `<p style="width:100%;box-sizing:border-box;margin:4px 0;line-height:1.65;color:#374151;">${content || "&nbsp;"}</p>`;
    }

    case "bulletList": {
      const items = (node.content ?? []).map(item => {
        const body = (item.content ?? []).map(n => blockToHtml(n, answers, questions, pageless)).join("");
        return `<li style="margin-bottom:3px;">${body}</li>`;
      }).join("");
      return `<ul style="width:100%;box-sizing:border-box;margin:6px 0 6px 20px;padding:0;color:#374151;">${items}</ul>`;
    }

    case "orderedList": {
      const items = (node.content ?? []).map(item => {
        const body = (item.content ?? []).map(n => blockToHtml(n, answers, questions, pageless)).join("");
        return `<li style="margin-bottom:3px;">${body}</li>`;
      }).join("");
      return `<ol style="width:100%;box-sizing:border-box;margin:6px 0 6px 20px;padding:0;color:#374151;">${items}</ol>`;
    }

    case "blockquote": {
      const inner = (node.content ?? []).map(n => blockToHtml(n, answers, questions, pageless)).join("");
      return `<blockquote style="width:100%;box-sizing:border-box;border-left:3px solid #d1d5db;margin:8px 0;padding:4px 0 4px 12px;color:#6b7280;">${inner}</blockquote>`;
    }

    case "codeBlock": {
      const code = (node.content ?? []).map(n => n.text ?? "").join("");
      return `<pre style="width:100%;box-sizing:border-box;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;padding:12px;font-size:12px;font-family:monospace;overflow-x:auto;margin:6px 0;"><code>${esc(code)}</code></pre>`;
    }

    case "horizontalRule":
      return `<hr style="width:100%;border:none;border-top:1px solid #e5e7eb;margin:14px 0;" />`;

    case "image": {
      const { src, alt } = node.attrs ?? {};
      return `<div style="width:100%;margin:6px 0;"><img src="${esc(src ?? "")}" alt="${esc(alt ?? "")}" style="max-width:100%;border-radius:6px;" /></div>`;
    }

    case "table": {
      const rows = (node.content ?? []).map(row => {
        const isHead = row.content?.[0]?.type === "tableHeader";
        const cells = (row.content ?? []).map(cell => {
          const cellContent = (cell.content ?? []).map(n => blockToHtml(n, answers, questions)).join("");
          const tag = isHead ? "th" : "td";
          const s = isHead
            ? "border:1px solid #d1d5db;padding:6px 10px;font-weight:600;background:#f9fafb;text-align:left;vertical-align:top;"
            : "border:1px solid #d1d5db;padding:6px 10px;text-align:left;vertical-align:top;";
          return `<${tag} style="${s}">${cellContent}</${tag}>`;
        }).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<div style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:8px 0;"><table style="border-collapse:collapse;min-width:100%;font-size:13px;">${rows}</table></div>`;
    }

    case "questionVariableBlock": {
      const { label = "", variableKey, questionType, colSpan = 12, questionId } = node.attrs ?? {};
      const question = questions.find(q => q.id === questionId || q.variableKey === variableKey);
      const isApproval = (questionType as string) === "approval";

      let valueHtml: string;
      if (isApproval) {
        valueHtml = approvalHtml(answers[variableKey as string], pageless);
      } else if (question?.multiField && (question.subFields?.length ?? 0) > 0) {
        valueHtml = multiFieldHtml(question, answers, label as string);
      } else if (question?.multiResponse) {
        const value = answers[variableKey as string];
        valueHtml = Array.isArray(value) && value.length > 1
          ? multiResponseListHtml(value, questionType as QuestionType)
          : answerHtml(value, questionType as QuestionType);
      } else {
        valueHtml = answerHtml(answers[variableKey as string], questionType as QuestionType);
      }

      const widthPct = pageless ? "100%" : (isApproval ? "100%" : `${Math.round((colSpan / 12) * 100)}%`);
      const marginBottom = pageless ? "margin-bottom:12px;" : "";

      return `<div style="width:${widthPct};box-sizing:border-box;padding:3px;vertical-align:top;${marginBottom}">
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;background:white;height:100%;box-sizing:border-box;">
    <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">${esc(label as string)}</div>
    ${valueHtml}
  </div>
</div>`;
    }

    default:
      if (node.content) return node.content.map(n => blockToHtml(n, answers, questions, pageless)).join("");
      return "";
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateReportHtml(
  editorJson: JSONContent,
  answers: FormAnswers,
  questions: FormQuestion[] = [],
  options: { pageless?: boolean } = {}
): string {
  if (!editorJson?.content) return "";
  const body = editorJson.content
    .map(n => blockToHtml(n, answers, questions, options.pageless))
    .join("\n");
  if (options.pageless) {
    return `<div style="display:block;">${body}</div>`;
  }
  return `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;">${body}</div>`;
}
