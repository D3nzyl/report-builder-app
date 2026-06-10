# Report Builder Integration Prompt

Paste the entire contents of this message as your prompt to the AI in your prod codebase.

---

## Prompt

I am integrating a report builder into this codebase to replace the existing pdfme-based report builder. I have a folder called `report-builder-export/` that I have already dropped into the project. It contains these files:

```
report-builder-export/
  lib/
    types.ts              ← All TypeScript interfaces (FormQuestion, FormAnswers, ApprovalAnswer, etc.)
    reportHtmlGenerator.ts ← Core render engine: JSONContent + answers → HTML string
    exportUtils.ts        ← Client-side PDF export via browser print window
    questionContext.ts    ← React context for sharing questions/answers through editor tree
    sampleData.ts         ← Sample questions and answers (design-time preview only)
    collectionData.ts     ← Collection (data table) types and a simple SQL executor
  components/
    editor/
      ReportEditor.tsx              ← Main editor component (TipTap-based, ~1900 lines)
      EditorToolbar.tsx             ← Editor formatting toolbar
      VariableTray.tsx              ← Right sidebar: variable cards, sub-field config
      VariableInlineView.tsx        ← Renders inline variable chips in the editor
      VariableBlockView.tsx         ← Renders block variable cards in the editor
      QuestionVariableInlineNode.ts ← TipTap node definition for inline variables
      QuestionVariableBlockNode.ts  ← TipTap node definition for block variables
      CollectionBlockNode.ts        ← TipTap node for SQL-based data table blocks
      CollectionBlockView.tsx       ← UI for collection query editor
      RowRepeatBlockNode.ts         ← TipTap node for repeating data row blocks
      RowRepeatBlockView.tsx        ← Renders row-repeat blocks from collection data
      DataRowBlockNode.ts           ← TipTap node for individual data rows
      DataRowBlockView.tsx          ← Renders a single data row card
      BlockHandle.tsx               ← Drag handle for block nodes
    preview/
      ReportPreview.tsx             ← Preview modal (phone/laptop frames, download PDF)
    ui/
      Tooltip.tsx                   ← Floating UI tooltip component
```

### What this system does

- `ReportEditor` is a rich-text editor where admins design a report template. They insert **variables** (via `@` mention) that get replaced with real data at render time.
- The editor saves a **JSON template** with this shape:
  ```ts
  {
    version: 1,
    pageMode: "pageless" | "page",
    content: JSONContent,        // TipTap doc (the layout)
    questions: FormQuestion[],   // Variable schema
    answers: FormAnswers,        // Design-time preview values only
  }
  ```
- At render time, `generateReportHtml(content, answers, questions, { pageless })` converts the template + real workflow data into a fully inline-styled HTML string ready for PDF generation.

### Variable categories

There are three categories of variables, all stored as `FormQuestion[]` and resolved via `FormAnswers` (a `Record<string, string | string[]>`):

1. **`"form"`** — Answers from form fields in the workflow execution
2. **`"approval"`** — Approval step results, stored as a JSON-stringified `ApprovalAnswer`:
   ```ts
   // Approved:
   { decision: "approved", person: string, date: string, signature?: string }
   // Rejected:
   { decision: "rejected", person: string, date: string, remarks?: string, images?: string[] }
   ```
3. **`"execution"`** — Workflow-level metadata (`system: true`): execution ID, started by, started at, project, workflow title, status, and per-form-block submitted_by / submitted_at

### Tasks to complete

**1. Install npm dependencies**

Add these packages if not already present:
```json
{
  "@floating-ui/dom": "^1.7.6",
  "@tiptap/extension-character-count": "^3.23.6",
  "@tiptap/extension-color": "^3.23.6",
  "@tiptap/extension-heading": "^3.23.6",
  "@tiptap/extension-highlight": "^3.23.6",
  "@tiptap/extension-horizontal-rule": "^3.23.6",
  "@tiptap/extension-image": "^3.23.6",
  "@tiptap/extension-placeholder": "^3.23.6",
  "@tiptap/extension-table": "^3.23.6",
  "@tiptap/extension-table-cell": "^3.23.6",
  "@tiptap/extension-table-header": "^3.23.6",
  "@tiptap/extension-table-row": "^3.23.6",
  "@tiptap/extension-text-align": "^3.23.6",
  "@tiptap/extension-text-style": "^3.23.6",
  "@tiptap/extension-typography": "^3.23.6",
  "@tiptap/extension-underline": "^3.23.6",
  "@tiptap/pm": "^3.23.6",
  "@tiptap/react": "^3.23.6",
  "@tiptap/starter-kit": "^3.23.6",
  "lucide-react": "^1.16.0",
  "marked": "^18.0.4"
}
```

**2. Fix import paths**

All files in `report-builder-export/` use imports like `@/lib/...` and `@/components/...`. Update these to match wherever you place the folder in the prod project. For example, if you place the folder at `src/features/report-builder/`, update the imports to `../lib/...` or use the correct path alias.

**3. Add `initialQuestions` and `initialAnswers` props to `ReportEditor`**

Currently `ReportEditor` loads from `sampleData.ts`. Add two optional props so the prod code can inject the real workflow question schema:

```ts
interface ReportEditorProps {
  initialQuestions?: FormQuestion[];   // Variable schema from the workflow
  initialAnswers?: FormAnswers;        // Design-time preview values
  onSave?: (template: ReportTemplate) => void;  // Called when user saves
}
```

In the component, change:
```ts
// Before:
const [questions, setQuestions] = useState<FormQuestion[]>(sampleQuestions);
const [answers, setAnswers] = useState<FormAnswers>(sampleAnswers);

// After:
const [questions, setQuestions] = useState<FormQuestion[]>(props.initialQuestions ?? sampleQuestions);
const [answers, setAnswers] = useState<FormAnswers>(props.initialAnswers ?? sampleAnswers);
```

Also wire the save button to call `props.onSave` with the template JSON.

**4. Build the workflow → FormQuestion adapter**

Create a function that converts your workflow's field definitions into `FormQuestion[]`. Critical: the `variableKey` in this list must exactly match the keys you put in `FormAnswers` at render time — this is the join key.

```ts
import type { FormQuestion } from "report-builder-export/lib/types";

function workflowToFormQuestions(workflow: YourWorkflow): FormQuestion[] {
  const questions: FormQuestion[] = [];

  // Execution-level variables (always include these)
  questions.push(
    { id: "ex_id",          label: "Execution ID",      variableKey: "ex_id",         type: "short_text",    category: "execution", system: true },
    { id: "ex_started_by",  label: "Started By",         variableKey: "ex_started_by", type: "short_text",    category: "execution", system: true },
    { id: "ex_started_at",  label: "Started At",         variableKey: "ex_started_at", type: "datetime",      category: "execution", system: true },
    { id: "ex_project",     label: "Project",            variableKey: "ex_project",    type: "short_text",    category: "execution", system: true },
    { id: "ex_workflow",    label: "Workflow Title",     variableKey: "ex_workflow",   type: "short_text",    category: "execution", system: true },
    { id: "ex_status",      label: "Execution Status",   variableKey: "ex_status",     type: "single_select", category: "execution", system: true },
  );

  // Per-form-block submission metadata
  for (const block of workflow.formBlocks) {
    questions.push(
      { id: `${block.id}_submitted_by`, label: `${block.title} — Submitted By`, variableKey: `${block.id}_submitted_by`, type: "short_text", category: "execution", system: true },
      { id: `${block.id}_submitted_at`, label: `${block.title} — Submitted At`, variableKey: `${block.id}_submitted_at`, type: "datetime",   category: "execution", system: true },
    );
  }

  // Form field questions
  for (const block of workflow.formBlocks) {
    for (const field of block.fields) {
      const q: FormQuestion = {
        id:          field.id,
        label:       field.label,
        variableKey: field.variableKey,   // must be stable snake_case slug
        type:        mapFieldType(field.type),
        category:    "form",
        blockName:   block.title,
        multiField:  field.type === "table",
        multiResponse: field.type === "table",
        subFields:   field.columns?.map(col => ({
          id: col.id, label: col.label, variableKey: col.variableKey, type: mapFieldType(col.type),
        })),
      };
      questions.push(q);
    }
  }

  // Approval step questions
  for (const step of workflow.approvalSteps) {
    questions.push({
      id:          step.id,
      label:       step.title,
      variableKey: step.variableKey,
      type:        "approval",
      category:    "approval",
    });
  }

  return questions;
}
```

**5. Build the execution → FormAnswers adapter**

Create a function that maps your workflow execution data to `FormAnswers`. This is called at render time (not design time).

```ts
import type { FormAnswers, ApprovalAnswer } from "report-builder-export/lib/types";

function executionToFormAnswers(execution: YourExecution): FormAnswers {
  const answers: FormAnswers = {};

  // Execution-level metadata
  answers["ex_id"]         = execution.id;
  answers["ex_started_by"] = execution.startedBy.name;
  answers["ex_started_at"] = formatDateTime(execution.startedAt);
  answers["ex_project"]    = execution.project.name;
  answers["ex_workflow"]   = execution.workflow.title;
  answers["ex_status"]     = execution.status;

  // Per-form-block submission metadata
  for (const submission of execution.formSubmissions) {
    answers[`${submission.blockId}_submitted_by`] = submission.submittedBy.name;
    answers[`${submission.blockId}_submitted_at`] = formatDateTime(submission.submittedAt);

    // Scalar and multi-select form answers
    for (const [key, value] of Object.entries(submission.answers)) {
      answers[key] = value; // string or string[]
    }

    // Table (multi-field) answers — sub-fields each get their own key as string[]
    for (const tableField of submission.tableAnswers) {
      for (const col of tableField.columns) {
        answers[col.variableKey] = tableField.rows.map(row => String(row[col.variableKey] ?? ""));
      }
    }
  }

  // Approval step answers — must be JSON.stringify(ApprovalAnswer)
  for (const step of execution.approvalSteps) {
    const approval: ApprovalAnswer = step.approved
      ? { decision: "approved", person: step.approvedBy.name, date: formatDate(step.approvedAt), signature: step.signatureUrl ?? "" }
      : { decision: "rejected", person: step.rejectedBy.name, date: formatDate(step.rejectedAt), remarks: step.reason, images: step.attachmentUrls ?? [] };
    answers[step.variableKey] = JSON.stringify(approval);
  }

  return answers;
}
```

**6. Render the report**

```ts
import { generateReportHtml } from "report-builder-export/lib/reportHtmlGenerator";
import { exportPdfFromHtml }   from "report-builder-export/lib/exportUtils";

async function generateReport(templateId: string, executionId: string) {
  // Load from your DB
  const template  = await db.reportTemplates.findOne({ id: templateId });
  const execution = await db.executions.findOne({ id: executionId });

  const answers   = executionToFormAnswers(execution);
  const html      = generateReportHtml(
    template.content,
    answers,
    template.questions,
    { pageless: template.pageMode === "pageless" }
  );

  // Client-side: open browser print dialog
  await exportPdfFromHtml(html);

  // OR server-side: pass html to Puppeteer / headless Chrome for PDF bytes
}
```

**7. Store templates in the DB**

Add a `report_templates` table (or equivalent) with columns:
- `id` — UUID primary key
- `workflow_id` — FK to workflows
- `name` — display name
- `content` — JSONB (the TipTap doc)
- `questions` — JSONB (FormQuestion[])
- `page_mode` — enum: "pageless" | "page"
- `created_at`, `updated_at`

Do **not** store `answers` in the DB — those are execution-time data, never template data.

**8. Embed the editor in your admin UI**

```tsx
import { ReportEditor } from "report-builder-export/components/editor/ReportEditor";

// In your workflow configuration page:
<ReportEditor
  initialQuestions={workflowToFormQuestions(workflow)}
  initialAnswers={buildPreviewAnswers(workflow)}   // fake/sample data for design-time preview
  onSave={async (template) => {
    await db.reportTemplates.upsert({
      workflowId: workflow.id,
      content:    template.content,
      questions:  template.questions,
      pageMode:   template.pageMode,
    });
  }}
/>
```

### Key invariant

The `variableKey` on each `FormQuestion` in `template.questions` must exactly match the key in `FormAnswers` at render time. These are set at design time (when the admin builds the template) and must remain stable. If your field IDs change, the variable nodes in the template will silently render as `—`. Treat `variableKey` as an immutable slug.

### Type reference

```ts
// All from report-builder-export/lib/types.ts

type QuestionType = "short_text" | "long_text" | "number" | "radio" | "rating" | "toggle"
  | "single_select" | "multi_select" | "slider" | "date" | "datetime" | "file_upload"
  | "signature" | "sketch" | "location" | "image_upload" | "approval";

type VariableCategory = "form" | "approval" | "execution";

type DisplayType = "inline_value" | "inline_remarks" | "inline_remarks_image" | "question_answer_block";

interface FormQuestion {
  id: string;
  label: string;
  variableKey: string;
  type: QuestionType;
  alias?: string;
  category?: VariableCategory;
  system?: boolean;
  blockName?: string;
  multiResponse?: boolean;
  multiField?: boolean;
  subFields?: SubField[];
  allowRemarks?: boolean;
  columnHeaders?: Record<string, string>;
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
}

interface ApprovalAnswer {
  decision: "approved" | "rejected";
  person: string;
  date: string;
  signature?: string;
  remarks?: string;
  images?: string[];
}

type FormAnswers = Record<string, string | string[]>;
```
