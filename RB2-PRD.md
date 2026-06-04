# Product Requirements Document

**Feature Name:** Report Builder V2.0
**Product Manager:** — Denzyl
**Product Owner:** — Isaac
**Target Release:** — 30 Jun 2026

---

## Executive Summary

Report Builder V2.0 is a document-first report template editor that replaces the coordinate-based drag-and-drop approach of V1.0 with a rich text document canvas.

Solution creators write report templates like a document — headings, paragraphs, tables, lists — and insert workflow variables (form answers, approvals) directly into the template as inline chips within text or as standalone question-answer blocks. The builder supports multi-response variables, multi-field compound variables, approval blocks, and remarks and image attachments per question. Templates can be previewed with sample data and exported as PDF.

---

## Problem Statement

### Problem
Solution creators need a way to build report templates that accurately reflect workflow outputs — including complex, multi-answer questions, multi-field compound questions, approval decisions, and tabular collection data — without relying on developers.

### Current State (V1.0)
Report Builder V1.0 uses an X/Y coordinate drag-and-drop layout where creators position text and variable blocks on a fixed canvas. While functional for simple reports, the coordinate model does not scale. Producing readable, document-like reports requires manual positioning, there is no native document structure, and there is no way to represent questions with multiple responses or sub-fields.

### Pain Points

- The coordinate-based canvas is difficult to use for document-style reports.
- There is no concept of document structure — headings, paragraphs, and lists cannot be composed naturally.
- Variables can only be placed as static positioned blocks; embedding a value inline within a sentence is not possible.
- No support for multi-response variables (questions with multiple answers).
- No support for multi-field (compound) questions with sub-questions.
- No support for remarks or image evidence attached to individual questions.
- The preview does not accurately reflect the generated output.
- No in-builder PDF export.

---

## Proposed Solution

Report Builder V2.0 provides the main editor framework for creating report templates linked to workflow outputs. This PRD defines the document editor canvas, variable insertion and display, block layouts per question type, remarks and image support, approval blocks, and report export. The detailed configuration of how variables are sourced from a workflow will be covered in the Workflow Builder PRD.

[RB2-FR1] Rich Text Editor Canvas
[RB2-FR2] Variable Insertion (@ Menu)
[RB2-FR3] Execution & System Variables
[RB2-FR4] Inline Variable Display
[RB2-FR5] Block Variable Display & Width Control
[RB2-FR6] Multi-Response Variable Support
[RB2-FR7] Multi-Field Variable Support
[RB2-FR8] Multi-Field + Multi-Response Table View
[RB2-FR9] Remarks & Image Support
[RB2-FR10] Approval Variable Blocks
[RB2-FR11] Block Handle (Add & Drag)
[RB2-FR12] Pageless / A4 Page Mode
[RB2-FR13] Report Preview
[RB2-FR14] Report Export (PDF)
[RB2-FR15] Template Persistence (Save / Load JSON)

### Question Types

The following question types are supported across the form variable system. Each type has a distinct editor placeholder, inline chip representation, and block layout.

**Text & Numeric**
- short_text — single-line text answer
- long_text — multi-line text answer
- number — numeric value

**Selection**
- radio — single choice from a list of options (radio button style)
- single_select — single choice from a dropdown
- multi_select — multiple choices from a list; answers render as chips
- toggle — binary yes / no switch

**Scale**
- rating — star rating (0–5)
- slider — numeric value along a range (0–100)

**Date & Time**
- date — calendar date
- datetime — calendar date and time

**Media & Files**
- image_upload — one or more uploaded images
- file_upload — uploaded file attachment
- signature — drawn signature
- sketch — freehand sketch or drawing

**Location**
- location — GPS coordinates or address

**Approval** *(special type — see RB2-FR10)*
- approval — a structured approval decision (approved or rejected) with person, date, signature or remarks, and optional images


---

## [RB2-FR1] Rich Text Editor Canvas

### Purpose
Replace the coordinate-based V1.0 canvas with a document editor that lets creators write report templates as structured rich text.

### Expected Behaviour

**Text formatting**
- Headings H1, H2, H3
- Inline bold, italic, underline, strikethrough
- Bullet lists and numbered lists
- Blockquotes
- Code blocks
- Horizontal rule / divider
- Native table (rows and columns)

**Document structure**
- Content flows top-to-bottom in document order
- Variable blocks and inline variables sit naturally within the text flow
- No manual positioning required

**Standard editing interactions**
- Keyboard shortcuts for common formatting
- Formatting toolbar at the top of the editor
- Bubble menu appears on text selection for quick formatting
- `/` command menu for block insertion
- `@` mention menu for variable insertion (see RB2-FR2)
- Block handle on hover for drag-reorder and inline block insertion (see RB2-FR11)

### / Slash Command Menu

**Trigger:** typing `/` at the beginning of a line (or as the only content on a line)

**Structure:**
```
┌──────────────────────────────────┐
│ BLOCKS                           │
│ [H1] Heading 1   [H2] Heading 2  │
│ [H3] Heading 3   [¶]  Paragraph  │
│ [•]  Bullet      [1.] Numbered   │
│ ["]  Quote       [<>] Code Block │
│ [—]  Divider     [⊞]  Table      │
└──────────────────────────────────┘
```

**Behaviour:**
- Filters as the creator types more characters after `/`
- Each item is an icon + label in a 2-column grid
- Selecting an item deletes the `/query` text and inserts the chosen block
- If no items match the query the menu closes
- Escape dismisses without inserting
- Arrow keys and Enter for keyboard navigation

---

## [RB2-FR2] Variable Insertion (@ Menu)

### Purpose
Let creators insert any workflow variable into the template without leaving the keyboard. Variables are organised into three categories — Form, Approval, and Execution — accessible via tabs in the @ menu.

### Expected Behaviour

**Triggering**
- Typing `@` anywhere in the editor opens the @ menu
- The menu filters as the creator continues typing after `@`
- Pressing Escape dismisses without inserting

**Tabs**
- The @ menu has three tabs: **Form**, **Approval**, and **Execution**
- **Form** — all form question variables (answers submitted by respondents)
- **Approval** — all approval-type variables (decisions, signatures, remarks)
- **Execution** — workflow execution metadata and form block submission metadata (see RB2-FR3)

**Inserting a variable**
- Selecting a variable inserts it as an inline chip by default
- Exception: Multi Field variables and Approval variables always insert as a block

**Keyboard navigation**
- Arrow Up / Down to navigate, Enter to confirm, Escape to dismiss

### @ Mention Menu Design

**Trigger:** typing `@` anywhere in the editor

**Structure:**
```
┌──────────────────────────────────┐
│  Form | Approval | Execution     │  ← tab bar
├──────────────────────────────────┤
│  [icon]  Variable Label          │
│  [icon]  Variable Label          │
│  ...                             │
└──────────────────────────────────┘
```

**Row anatomy:**
- Question-type icon + variable label
- Execution tab rows use an orange highlight to distinguish from Form (blue) and Approval
- Row highlights on hover and keyboard selection
- Click or Enter inserts the variable

**Positioning:** appears below the cursor; flips above if insufficient space below

---

## [RB2-FR3] Execution & System Variables

### Purpose
Define the set of system-generated variables that describe the workflow execution and form block submissions. These are not user-answered questions — they are operational metadata automatically captured by the platform when a workflow runs.

### Variable Groups

**Execution-level** — one set per workflow run
- Execution ID — unique identifier for this execution
- Started By — the user who triggered the workflow execution
- Started At — date and time the execution was started
- Project — the project this execution is associated with
- Workflow Title — the name of the workflow template
- Execution Status — current state of the execution (e.g. In Progress, Completed)

**Form block submission metadata** — one set per form node in the workflow
- {Form Block Name} — Submitted By — the user who submitted that form block
- {Form Block Name} — Submitted At — the date and time that form block was submitted
- Each form node in the workflow produces its own pair of Submitted By / Submitted At variables, named after the block (e.g. "Site Inspection Form — Submitted By")

### Placement in @ Menu
- All execution and form block metadata variables appear under the **Execution** tab in the @ menu
- They are not mixed into the Form tab, which is reserved for question answers only

### In Preview and Export
- All system variables are replaced with their values at the time of report generation
- In the prototype, sample values are used (e.g. "EX-2026-05-001", "Denzyl Chua")

---

## [RB2-FR4] Inline Variable Display

### Purpose
Allow variables to appear embedded within sentences or paragraphs, rendering their answer value inline alongside surrounding text.

### Expected Behaviour

**Chip appearance**
- An inline variable renders as a styled chip showing the variable label
- The chip has a subtle background and border to distinguish it from plain text
- When selected (part of a text selection), the chip highlights in blue
- The chip is non-editable but selectable and deletable
- Long variable names are truncated with `…` at a maximum chip width; hovering the chip shows a tooltip with the full question label

**Display type**
- An inline variable can display one of three values via the 3-dot menu:
  - **Answer** — shows the answer value (default)
  - **Remarks** — shows the remarks text for that answer; chip label shows `{label} · remarks`
  - **Remarks Image** — shows the remarks image for that answer; chip label shows `{label} · image`
- Remarks and Remarks Image options are only available if the question has "Allow Remarks" enabled (see RB2-FR9)

**Switching to block**
- From the inline 3-dot menu, the creator can switch the variable to block display (see RB2-FR5)

**In preview and export**
- The chip is replaced by the actual answer value, remarks text, or remarks image depending on the display type

**Constraints**
- Only non-multi-field variables can be inserted inline
- Approval variables always insert as blocks

### Inline Chip 3-Dot Menu Design

**Trigger:** hovering an inline chip reveals a `···` overlay on the right side of the chip

**Structure:**
```
┌──────────────────────┐
│ SHOW                 │
│ T   Answer        ✓  │
│ 💬  Remarks          │  ← only if Allow Remarks is on
│ 🖼  Remarks Image    │  ← only if Allow Remarks is on
├──────────────────────┤
│ LAYOUT               │
│ ≡   Switch to Block  │
├──────────────────────┤
│ 🗑  Delete           │
└──────────────────────┘
```

**Behaviour:**
- **Answer** — default; ✓ shown when active
- **Remarks** — shows remarks text; chip label updates to `{label} · remarks`
- **Remarks Image** — shows remarks image; chip label updates to `{label} · image`
- **Switch to Block** — converts the inline chip to a full question-answer block
- **Delete** — removes the chip from the document

---

## [RB2-FR5] Block Variable Display & Width Control

### Purpose
Allow variables to occupy a dedicated area in the report, displaying the question label and answer value as a standalone card. Creators control how wide each block is relative to the page.

### Expected Behaviour

**Block card**
- Renders as a card showing the variable label and a type-appropriate placeholder or value
- Visually distinct from paragraph content
- Multiple blocks on adjacent rows share horizontal space based on their configured widths
- Long variable names are truncated with `…` in the block header; hovering the label shows a tooltip with the full question label

**Width control**
- Each block spans between a minimum of 4 columns and a maximum of 12 columns (full width) on a 12-column grid
- A drag handle is visible on hover at the right edge of the block
- Dragging snaps to column divisions; guide lines appear during drag for alignment
- Width is saved per block
- Multi-response, multi-field, and approval blocks are always full width (resize disabled)

**Display mode switching**
- Via the block 3-dot menu, creators can switch between Block and Inline display
- Multi Field and Approval variables cannot be switched to inline

**Delete**
- Via the 3-dot menu or keyboard Delete

### Block 3-Dot Menu Design

**Trigger:** hovering a question variable block reveals a `···` button in the top-right corner

**Structure:**
```
┌──────────────────┐
│ DISPLAY AS       │
│ ≡  Block      ✓  │
│ T  Inline        │  ← hidden for multi-field and approval
├──────────────────┤
│ 🗑 Delete        │
└──────────────────┘
```

**Behaviour:**
- **Block** — current mode; ✓ shown; clicking is a no-op
- **Inline** — switches to an inline chip inside a new paragraph; hidden if Multi Field or Approval
- **Delete** — removes the block from the document

### Block Layout Anatomy

Every question variable block follows this structure:

```
┌──────────────────────────────────────────────┐
│  Question Label           [mode badge]  [···] │
│                                               │
│  [answer area — varies by type, see below]    │
│                                               │
│  ─────────────────────────────────────────    │  ← only when Allow Remarks is on
│  REMARKS                                      │
│  [text placeholder, 2 lines]                  │
│                                               │
│  IMAGE (optional)                             │
│  [image placeholder]                          │
└──────────────────────────────────────────────┘
```

The remarks + image section only appears when "Allow Remarks" is enabled on the question (see RB2-FR8).

### Answer Area by Question Type

- **short_text** — Single line text bar
- **long_text** — Three line text bars (last line 60% width)
- **number** — Large light "0" numeral
- **radio** — Three radio options: filled dot on first, empty on rest
- **rating** — Five grey star icons + "0 / 5" label
- **toggle** — Toggle switch (off state) + "No" label
- **single_select** — Single pill chip: "Selected option"
- **multi_select** — Three pill chips: "Option 1", "Option 2", "Option 3"
- **slider** — Track bar with thumb at 33%; min / max labels below
- **date** — DD / MM / YYYY segments in monospace
- **datetime** — DD / MM / YYYY · HH : MM in monospace
- **file_upload** — Dashed border box + upload icon + "File will appear here"
- **signature** — Bordered box with decorative SVG signature path + baseline
- **sketch** — Dashed border + dot-grid background + pencil icon
- **location** — Stylised map tile with road grid + red pin + coordinates badge
- **image_upload** — Dashed border box + image icon + "Image will appear here"

---

## [RB2-FR6] Multi-Response Variable Support

### Purpose
Support variables where the respondent has given multiple answers. Multi-response variables render each answer as a separate entry.

### Expected Behaviour

**Enabling**
- Any variable type can be set to Multi Response via the variable tray
- Multi Response can coexist with Multi Field

**Block preview (editor)**
- The block shows stacked placeholder rows to indicate multiple values will appear
- Always full width; resize is disabled

**In preview and export**
- Each response renders as a numbered list item within the block
- Exception: multi-select questions render options as chips regardless of Multi Response

### Multi-Response Block Layout

```
┌────────────────────────────────────────────┐
│  Question Label               multi-response│
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [answer placeholder — row 1]       │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │  ← 40% opacity
│  │  [answer placeholder — row 2]       │   │
│  └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

- Always full width; resize handle hidden

---

## [RB2-FR7] Multi-Field Variable Support

### Purpose
Support compound variables with named sub-questions. Multi-field variables group related sub-questions under one parent.

### Expected Behaviour

**Enabling**
- Set via the Multi Field toggle on the parent variable in the variable tray
- Sub-fields can be added once enabled; each has a label and a question type

**Sub-field rules**
- Each sub-field can independently have Multi Response enabled
- Sub-fields cannot be inserted individually — only the parent variable is insertable
- Nested multi-field (sub-field of a sub-field) is not supported

**Block preview — Multi Field only (no Multi Response)**
- Renders as stacked sub-field cards, each showing the sub-field label and a type-appropriate placeholder

**Block preview — Multi Field + Multi Response**
- Renders as a table (see RB2-FR8)

### Multi-Field Block Layout (no Multi Response)

```
┌────────────────────────────────────────────┐
│  Question Label                  multi-field│
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Sub-field 1 label                  │   │
│  │  [sub-field answer placeholder]     │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Sub-field 2 label                  │   │
│  │  [sub-field answer placeholder]     │   │
│  └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

## [RB2-FR8] Multi-Field + Multi-Response Table View

### Purpose
When a variable has both Multi Field and Multi Response active, render it as a table where columns are sub-fields and rows are response instances. Creators can control column header labels, relative widths, and display order directly in the editor.

### Expected Behaviour

**Table structure**
- Columns correspond to visible sub-fields in the configured order
- Rows correspond to response instances
- Column headers show the sub-field label (renameable inline)
- Always full width

**Sub-field with Multi Response inside a table**
- A sub-field with Multi Response enabled renders its cell as a bulleted list of values

**Column header editing**
- Clicking a column header opens an inline text input
- The header can be renamed independently of the underlying sub-field label

**Column width resizing**
- A resize handle sits on the right border of each column header except the last
- Dragging resizes only the two adjacent columns; all others remain unchanged
- Each column has a minimum width; the last column has no handle
- Widths are stored proportionally so the table fills the available width at any screen or page size

**In preview and export**
- Table renders with actual answer data, respecting configured column order, headers, and widths

### Table Layout

```
┌────────────────────────────────────────────────────────────┐
│  Question Label                                            │
│                                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Sub 1    │ Sub 2    │ Sub 3    │ Sub 4    │  ← headers (renameable, resizable)
│  ├──────────┼──────────┼──────────┼──────────┤            │
│  │ [value]  │ [value]  │ [value]  │ [value]  │  ← row 1 (full opacity)
│  ├──────────┼──────────┼──────────┼──────────┤            │
│  │ [value]  │ [value]  │ [value]  │ [value]  │  ← row 2 (40% opacity)
│  └──────────┴──────────┴──────────┴──────────┘            │
└────────────────────────────────────────────────────────────┘
```

---

## [RB2-FR9] Remarks & Image Support

### Purpose
Allow solution creators to mark individual form questions as supporting remarks, so that respondents can attach a text note and up to one image as evidence alongside their answer. The report template can then display these remarks as block sections or as inline references.

### Expected Behaviour

**Enabling remarks on a question**
- Each question in the variable tray has an "Allow Remarks" toggle
- When enabled, the block view of that question renders a Remarks section and an Image section below the answer
- When enabled, the inline 3-dot menu for that variable exposes two extra display options: Remarks and Remarks Image

**Block display with remarks**
- Below the answer area, a horizontal divider separates the answer from a "Remarks" sub-section
- The Remarks sub-section shows a multi-line text placeholder
- Below remarks, an "Image (optional)" section shows a dashed image placeholder
- Applies to all non-approval question types

**Inline display options (when Allow Remarks is on)**
- From the inline chip 3-dot menu, the creator can choose:
  - **Answer** — displays the answer value (default)
  - **Remarks** — displays the remarks text; chip shows `{label} · remarks`
  - **Remarks Image** — displays the remarks image; chip shows `{label} · image`

**Constraints**
- Approval blocks do not support remarks (they have their own remarks field by design)
- Each question supports at most one remarks image

### Block with Remarks Layout (Example: short_text)

```
┌────────────────────────────────────────────┐
│  Question Label                       [···] │
│                                             │
│  [single line text placeholder]             │
│                                             │
│  ──────────────────────────────────         │
│  REMARKS                                    │
│  [text line 1 ────────────────────]         │
│  [text line 2 ──────────── ]                │
│                                             │
│  IMAGE (optional)                           │
│  ┌───────────────────────────────────────┐  │
│  │  [🖼]  Image will appear here         │  │
│  └───────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## [RB2-FR10] Approval Variable Blocks

### Purpose
Render approval decisions (approved or rejected) as structured blocks with a fixed layout that shows all relevant approval metadata.

### Expected Behaviour

**Approved state layout**
- Three equal-width columns in a fixed-height row:
  - Column 1: "Approved by" — shows person's name
  - Column 2: "Date" — shows approval date
  - Column 3: "Signature" — shows signature canvas

**Rejected state layout**
- Three equal-width columns in a fixed-height row:
  - Column 1: "Rejected by" — shows person's name
  - Column 2: "Date" — shows rejection date
  - Column 3: "Remarks" — shows rejection remarks text
- Below the row: an "Images (optional)" section

**Always full width; resize disabled**

**Approval variables are always inserted as blocks; inline insertion is not available**

### Approval Block Layouts

**Approved:**
```
┌────────────────────────────────────────────────────────────┐
│  Question Label                                            │
│                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │ APPROVED BY      │  │ DATE             │  │SIGNATURE │ │
│  │ Isaac Tan        │  │ 22 May 2026      │  │ [sig SVG]│ │
│  └──────────────────┘  └──────────────────┘  └──────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Rejected:**
```
┌────────────────────────────────────────────────────────────┐
│  Question Label                                            │
│                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │ REJECTED BY      │  │ DATE             │  │REMARKS   │ │
│  │ Sarah Lim        │  │ 21 May 2026      │  │[text…]   │ │
│  └──────────────────┘  └──────────────────┘  └──────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ IMAGES (optional)  [image placeholder]               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---


## [RB2-FR11] Block Handle (Add & Drag)

### Purpose
Give creators a way to add new blocks adjacent to any existing block and to reorder blocks by dragging, without using the keyboard.

### Expected Behaviour

**Visibility**
- The block handle appears to the left of any block when the cursor hovers that block
- It fades out when the cursor moves away

**+ button**
- Opens the Add Block menu (see design below)
- The new block is inserted immediately below the hovered block

**Drag grip**
- A grip icon sits next to the + button
- Dragging the grip moves the block to a new position in the document
- Cursor changes to `grab` on hover and `grabbing` during drag

### + Add Block Menu Design

**Trigger:** clicking the `+` button in the block handle

**Structure:**
```
┌──────────────────────────────────┐
│ BLOCKS                           │
│ [H1] Heading 1   [H2] Heading 2  │
│ [H3] Heading 3   [¶]  Paragraph  │
│ [•]  Bullet      [1.] Numbered   │
│ ["]  Quote       [<>] Code Block │
│ [—]  Divider     [⊞]  Table      │
└──────────────────────────────────┘
```

- Same block list as the / slash menu
- Inserts immediately after the hovered block
- Closes after selection or outside click

---

## [RB2-FR12] Pageless / A4 Page Mode

### Purpose
Let creators choose between a pageless scrolling canvas and a paginated A4 canvas.

### Expected Behaviour

**Pageless mode**
- Content flows without page breaks in a single scrollable canvas
- Maximum width matches A4 proportions for visual reference
- Default mode

**A4 Page mode**
- Canvas renders as discrete A4-sized pages (794 × 1122 px)
- Each page is a separate editor instance
- Content that overflows a page automatically creates a new page
- Page number shown in the bottom-right corner of each page
- Background is light grey to visually separate pages

**Switching**
- Mode toggled from the toolbar; switching does not lose document content

---

## [RB2-FR13] Report Preview

### Purpose
Let solution creators see how the end user will experience the report once their form answers are submitted. The preview simulates the end-user report viewer — not an A4 export view.

### Expected Behaviour

**Opening preview**
- A Preview button in the toolbar opens a full-screen overlay
- All variables in the template are replaced with their configured sample answers
- Closing and reopening reflects any changes made to the template since the last open

**Device toggle**
- The preview has a toggle to switch between **Phone** and **Laptop** views
- Phone view renders the report inside an iOS-style phone mockup (9:19.5 aspect ratio)
- Laptop view renders the report inside a macOS-style browser window mockup
- Both views use a pageless, full-width layout — no A4 page framing

**Pageless layout**
- All question blocks render stacked full-width regardless of their configured column widths in the editor
- Approval blocks stack their fields vertically for readability on small screens
- Tables scroll horizontally if they overflow the available width

**Download button**
- A Download PDF button is visible inside the preview UI (within the phone nav bar or browser toolbar)
- This simulates the download action available to the end user in the live viewer
- Clicking it generates a PDF at A4 dimensions using the same sample answers

**Phone view design**
```
┌─────────────────────────────┐
│  9:41          ▌▌▌  🔋      │  ← status bar
│  ─────────────────────────  │
│  ←     Report         [⬇]  │  ← app nav bar with download button
│  ─────────────────────────  │
│                             │
│  [scrollable report         │
│   content — full width,     │
│   pageless]                 │
│                             │
│  ────────────               │  ← home indicator
└─────────────────────────────┘
```

**Laptop view design**
```
┌─────────────────────────────────────────────┐
│  🔴 🟡 🟢   [ app.example.com/report/... ]  [⬇ Download PDF] │
│  ───────────────────────────────────────── │
│                                             │
│  [scrollable report content — max-width     │
│   centered, pageless]                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## [RB2-FR14] Report Export (PDF)

### Purpose
Let creators export the rendered report as a PDF.

### Expected Behaviour

- Generates a PDF at A4 dimensions with standard margins
- All formatting, variable values, tables, and block layouts are preserved
- Loading state shown during generation
- Uses sample answers at the time of export
- File downloads to the user's device

---

## [RB2-FR15] Template Persistence (Save / Load JSON)

### Purpose
Allow report templates to be saved and restored.

### Expected Behaviour

**Save**
- Persists the full document content, all variable definitions, column configuration, column headers, column widths, and sample answers

**Load**
- Restores the document and all variable configuration exactly
- Prompts for confirmation if there are unsaved changes

**Validation on load**
- Invalid or unsupported templates show a clear error; loading does not proceed
- Variable references that cannot be matched to a definition are flagged as unresolved but preserved

**Integration**
- When accessed from Workflow Builder V2.0 (WB2-FR9), templates save against the workflow
- Standalone save/load remains available for testing
---

## Exclusions

- Detailed form builder configuration (covered by Form Builder PRD)
- Workflow execution engine and runtime data fetching
- Multi-template versioning and approval flows
- Role-based template access control beyond workflow-level permissions
- Conditional sections (show/hide based on answer values)
- Image annotation or sketch rendering in the generated report
- Collections and SQL data blocks
- Variable tray / sidebar (prototype-only demo, not a shipped feature)
