import type { JSONContent } from "@tiptap/core";
import type { FormAnswers, QuestionType, FormQuestion } from "./types";

function formatAnswerValue(
  value: string | string[] | undefined,
  questionType: QuestionType
): string {
  if (value === undefined || value === null || value === "") return "-";
  if (questionType === "multi_select" && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }
  if (questionType === "image_upload" || questionType === "file_upload") {
    return typeof value === "string" && value ? value : "-";
  }
  if (questionType === "toggle") {
    const v = Array.isArray(value) ? value[0] : value;
    return v === "true" || v === "yes" || v === "1" ? "Yes" : "No";
  }
  if (questionType === "rating") {
    const v = Array.isArray(value) ? value[0] : value;
    const n = parseInt(v, 10);
    if (!isNaN(n)) return `${"★".repeat(n)}${"☆".repeat(Math.max(0, 5 - n))} (${n}/5)`;
  }
  if (questionType === "signature") {
    const v = Array.isArray(value) ? value[0] : value;
    return v ? "[Signature provided]" : "-";
  }
  if (questionType === "sketch") {
    const v = Array.isArray(value) ? value[0] : value;
    return v ? "[Sketch provided]" : "-";
  }
  if (questionType === "location") {
    const v = Array.isArray(value) ? value[0] : value;
    return v || "-";
  }
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function formatInlineImageValue(label: string, value: string | string[] | undefined): string {
  const url = Array.isArray(value) ? value[0] : value;
  if (!url) return "-";
  return `![${label}](${url})`;
}

function resolveInlineValue(
  variableKey: string,
  label: string,
  questionType: QuestionType,
  answers: FormAnswers
): string {
  const value = answers[variableKey];
  if (questionType === "image_upload" || questionType === "file_upload") {
    return formatInlineImageValue(label, value);
  }
  return formatAnswerValue(value, questionType);
}

function resolveBlockValue(
  variableKey: string,
  label: string,
  questionType: QuestionType,
  answers: FormAnswers
): string {
  const value = answers[variableKey];
  if (questionType === "image_upload" || questionType === "file_upload") {
    const url = Array.isArray(value) ? value[0] : value;
    if (!url) return `**${label}:** -`;
    return `**${label}:** ![${label}](${url})`;
  }
  return `**${label}:** ${formatAnswerValue(value, questionType)}`;
}

type MarkNode = JSONContent;

function markText(text: string, marks: MarkNode["marks"]): string {
  if (!marks || marks.length === 0) return text;
  let result = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold": result = `**${result}**`; break;
      case "italic": result = `*${result}*`; break;
      case "strike": result = `~~${result}~~`; break;
      case "code": result = `\`${result}\``; break;
      case "link": result = `[${result}](${mark.attrs?.href ?? ""})`; break;
    }
  }
  return result;
}

function inlineToMarkdown(node: MarkNode, answers: FormAnswers): string {
  if (node.type === "text") return markText(node.text ?? "", node.marks);
  if (node.type === "hardBreak") return "  \n";
  if (node.type === "questionVariableInline") {
    const { variableKey, label, questionType, displayType } = node.attrs ?? {};

    if (displayType === "inline_remarks_image") {
      const raw = answers[variableKey];
      let data: { images?: string[] } | null = null;
      try { data = JSON.parse(raw as string); } catch { /* fall through */ }
      const images = data?.images ?? [];
      if (!images.length) return "-";
      return images.map((src, i) => `![${label} ${i + 1}](${src})`).join("\n");
    }

    return resolveInlineValue(variableKey, label, questionType, answers);
  }
  if (node.content) return node.content.map((n) => inlineToMarkdown(n, answers)).join("");
  return "";
}

function blockToMarkdown(node: MarkNode, answers: FormAnswers, questions: FormQuestion[], depth = 0): string {
  const indent = "  ".repeat(depth);

  switch (node.type) {
    case "paragraph": {
      const text = (node.content ?? []).map((n) => inlineToMarkdown(n, answers)).join("");
      return text ? `${text}\n\n` : "\n";
    }
    case "heading": {
      const level = node.attrs?.level ?? 1;
      const prefix = "#".repeat(level);
      const text = (node.content ?? []).map((n) => inlineToMarkdown(n, answers)).join("");
      return `${prefix} ${text}\n\n`;
    }
    case "bulletList": {
      const items = (node.content ?? [])
        .map((item) => {
          const body = (item.content ?? [])
            .map((child) => blockToMarkdown(child, answers, questions, depth + 1).trimEnd())
            .join("\n");
          return `${indent}- ${body.trimStart()}`;
        })
        .join("\n");
      return `${items}\n\n`;
    }
    case "orderedList": {
      const items = (node.content ?? [])
        .map((item, i) => {
          const body = (item.content ?? [])
            .map((child) => blockToMarkdown(child, answers, questions, depth + 1).trimEnd())
            .join("\n");
          return `${indent}${i + 1}. ${body.trimStart()}`;
        })
        .join("\n");
      return `${items}\n\n`;
    }
    case "blockquote": {
      const inner = (node.content ?? [])
        .map((n) => blockToMarkdown(n, answers, questions))
        .join("")
        .trimEnd();
      const quoted = inner.split("\n").map((l) => `> ${l}`).join("\n");
      return `${quoted}\n\n`;
    }
    case "codeBlock": {
      const lang = node.attrs?.language ?? "";
      const code = (node.content ?? []).map((n) => n.text ?? "").join("");
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }
    case "horizontalRule":
      return `---\n\n`;
    case "image": {
      const { src, alt } = node.attrs ?? {};
      return `![${alt ?? ""}](${src ?? ""})\n\n`;
    }
    case "table": {
      const rows = node.content ?? [];
      const mdRows = rows.map((row) => {
        const cells = (row.content ?? []).map((cell) => {
          const text = (cell.content ?? [])
            .map((n) => blockToMarkdown(n, answers, questions).trimEnd())
            .join(" ");
          return text.replace(/\n/g, " ").trim();
        });
        return `| ${cells.join(" | ")} |`;
      });
      if (mdRows.length > 0) {
        const colCount = (rows[0]?.content ?? []).length;
        const separator = `| ${Array(colCount).fill("---").join(" | ")} |`;
        mdRows.splice(1, 0, separator);
      }
      return mdRows.join("\n") + "\n\n";
    }
    case "questionVariableBlock": {
      const { variableKey, label, questionType, questionId } = node.attrs ?? {};
      const question = questions.find(q => q.id === questionId || q.variableKey === variableKey);

      // Approval variable
      if (questionType === "approval") {
        let data: { decision?: string; person?: string; date?: string; signature?: string; remarks?: string; images?: string[] } | null = null;
        try { data = JSON.parse(answers[variableKey] as string); } catch { /* fall through */ }
        if (!data) return `**${label}:** —\n\n`;
        const approved = data.decision === "approved";
        let result = `**${label}**\n\n`;
        result += `**Decision:** ${approved ? "✓ Approved" : "✕ Rejected"}\n`;
        result += `**${approved ? "Approved" : "Rejected"} by:** ${data.person || "—"}\n`;
        result += `**Date:** ${data.date || "—"}\n`;
        if (!approved && data.remarks) result += `**Remarks:** ${data.remarks}\n`;
        return result + "\n";
      }

      // Multi-field question
      if (question?.multiField && (question.subFields?.length ?? 0) > 0) {
        const subFields = question.subFields!;
        let result = `**${label}**\n\n`;

        if (question.multiResponse) {
          // Render as a markdown table — respect columnOrder for visible columns in order
          const allSubFields = question.subFields!;
          const visibleKeys = question.columnOrder ?? allSubFields.map(sf => sf.variableKey);
          const visibleSubFields = visibleKeys
            .map(key => allSubFields.find(sf => sf.variableKey === key))
            .filter((sf): sf is NonNullable<typeof sf> => !!sf);
          const headers = visibleSubFields.map(sf => question.columnHeaders?.[sf.variableKey] ?? sf.label);
          result += `| ${headers.join(" | ")} |\n`;
          result += `| ${headers.map(() => "---").join(" | ")} |\n`;
          result += `| ${visibleSubFields.map(sf => {
            const v = answers[sf.variableKey];
            if (sf.multiResponse && Array.isArray(v) && v.length > 0) {
              return v.map(item => `• ${item}`).join(" / ");
            }
            return formatAnswerValue(v, sf.type);
          }).join(" | ")} |\n\n`;
        } else {
          subFields.forEach(sf => {
            const v = answers[sf.variableKey];
            if (sf.multiResponse && Array.isArray(v) && v.length > 0) {
              result += `- **${sf.label}:**\n`;
              v.forEach((item, i) => { result += `  ${i + 1}. ${item || "-"}\n`; });
            } else {
              result += `- **${sf.label}:** ${formatAnswerValue(v, sf.type)}\n`;
            }
          });
          result += "\n";
        }
        return result;
      }

      // Multi-response (single-field)
      if (question?.multiResponse) {
        const value = answers[variableKey];
        if (Array.isArray(value) && value.length > 1) {
          let result = `**${label}:**\n`;
          value.forEach((v, i) => { result += `${i + 1}. ${formatAnswerValue(v, questionType) || "-"}\n`; });
          return result + "\n";
        }
      }

      return `${resolveBlockValue(variableKey, label, questionType, answers)}\n\n`;
    }
    default: {
      if (node.content) return node.content.map((n) => blockToMarkdown(n, answers, questions)).join("");
      return "";
    }
  }
}

export function generateReportMarkdown(
  editorJson: JSONContent,
  answers: FormAnswers,
  questions: FormQuestion[] = []
): string {
  if (!editorJson || editorJson.type !== "doc" || !editorJson.content) return "";
  const parts = editorJson.content.map((node) => blockToMarkdown(node, answers, questions));
  return parts.join("").trimEnd();
}
