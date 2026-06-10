export function downloadMarkdown(markdown: string, filename = "report-preview.md") {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PRINT_STYLES = `
  @page { size: A4; margin: 15mm 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }
  h1 { font-size: 22pt; margin: 0 0 12pt; color: #111; }
  h2 { font-size: 16pt; margin: 18pt 0 8pt; color: #222; }
  h3 { font-size: 13pt; margin: 14pt 0 6pt; color: #333; }
  p  { margin: 0 0 10pt; }
  ul, ol { margin: 0 0 10pt 18pt; padding: 0; }
  li { margin-bottom: 4pt; }
  blockquote { border-left: 3px solid #d1d5db; margin: 0 0 10pt 0; padding: 4pt 0 4pt 12pt; color: #555; }
  code { background: #f3f4f6; border-radius: 3px; padding: 1pt 4pt; font-size: 9.5pt; font-family: 'Consolas', monospace; }
  pre  { background: #f3f4f6; border-radius: 4px; padding: 10pt; font-size: 9.5pt; margin: 0 0 10pt; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 0 0 10pt; font-size: 10pt; }
  th, td { border: 1px solid #d1d5db; padding: 5pt 8pt; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 14pt 0; }
  strong { font-weight: 700; }
  em { font-style: italic; }
`;

export async function exportPdfFromHtml(html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }
  printWindow.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.65; color: #1a1a1a; }
    ${PRINT_STYLES}
  </style>
</head>
<body>${html}</body>
</html>`);
  printWindow.document.close();
  setTimeout(() => { printWindow.focus(); printWindow.print(); }, 600);
}

export async function exportPdf(markdown: string) {
  const { marked } = await import("marked");
  const html = await marked.parse(markdown);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${PRINT_STYLES}</style>
</head>
<body>${html}</body>
</html>`);
  printWindow.document.close();

  // setTimeout is more reliable than onload after document.write
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 600);
}
