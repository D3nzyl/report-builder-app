# Product Requirements Document

| Field | Value |
|---|---|
| **Feature Name** | Report Builder V2.0 |
| **Feature Code** | RB2 |
| **Product Manager** | Denzyl |
| **Product Owner** | Isaac |
| **Target Release** | 30 Jun 2026 |
| **Status** | Draft |

---

## Executive Summary

Report Builder V2.0 is a redesigned, document-first report template editor that replaces the existing coordinate-based drag-and-drop approach with a rich text document canvas.

Solution creators write report templates like a document — using headings, paragraphs, tables, and lists — and insert workflow variables (form answers, approvals, metadata) directly into the template as either inline values within text or as standalone answer blocks. The builder supports multi-response and multi-field variable rendering, giving creators control over how compound answers appear in the generated report. Report templates can be previewed with sample data and exported as PDF or Markdown.

---

## Problem Statement

### Problem
Solution creators need a way to build report templates that accurately reflect workflow outputs — including complex, multi-answer questions and multi-field compound questions — without relying on developers.

### Current State (V1.0)
Report Builder V1.0 uses an X/Y coordinate drag-and-drop layout where creators position text and variable blocks on a fixed canvas.

While functional for simple reports, the coordinate model does not scale. It is difficult to produce readable, document-like reports because positioning and text flow must be managed manually. There is no native concept of document structure, and there is no way to represent questions that have multiple responses or sub-fields.

### Pain Points

- The coordinate-based canvas is difficult to use for document-style reports; aligning text and variables requires manual positioning.
- There is no concept of document structure — headings, paragraphs, and lists cannot be composed naturally.
- Variables can only be placed as static positioned blocks; there is no way to embed a variable value inline within a sentence.
- There is no support for multi-response variables, so questions where the respondent gives multiple answers cannot be represented in the report.
- There is no support for multi-field (compound) questions with sub-questions.
- The preview does not reflect the actual generated output accurately enough for creators to trust what they are building.
- There is no export to PDF from within the builder.

---

## Proposed Solution

Report Builder V2.0 replaces the coordinate canvas with a structured document editor. Creators write report templates as rich text documents and insert workflow variables at any point. The builder handles rendering, multi-response logic, table generation, and export automatically.

### Feature List

| Code | Feature |
|---|---|
| RB2-FR1 | Rich Text Editor Canvas |
| RB2-FR2 | Variable Insertion |
| RB2-FR3 | Inline Variable Display |
| RB2-FR4 | Block Variable Display & Width Control |
| RB2-FR5 | Multi-Response Variable Support |
| RB2-FR6 | Multi-Field Variable Support |
| RB2-FR7 | Multi-Field + Multi-Response Table View |
| RB2-FR8 | Table Column Management |
| RB2-FR9 | Report Preview |
| RB2-FR10 | Report Export (PDF & Markdown) |
| RB2-FR11 | Question & Variable Configuration |
| RB2-FR12 | Template Persistence (Save / Load JSON) |

### Exclusions

- Detailed form builder configuration (covered by Form Builder PRD)
- Workflow execution engine and runtime data fetching
- Multi-template versioning and approval flows
- Role-based template access control beyond basic workflow-level permissions
- Conditional sections (show/hide sections based on answer values)
- Image annotation or sketch rendering in the generated report

---

## [RB2-FR1] Rich Text Editor Canvas

### Purpose
Replace the coordinate-based V1.0 canvas with a document editor that lets creators write report templates as structured rich text. The canvas is the primary workspace for building the report layout.

### Expected Behaviour

**Text formatting**
- Headings (H1, H2, H3)
- Paragraphs with inline bold, italic, underline, strikethrough
- Bullet lists and numbered lists
- Blockquotes
- Code blocks
- Horizontal rules / dividers

**Document structure**
- Content flows top-to-bottom in document order
- Variable blocks and inline variables sit naturally within the text flow
- No manual positioning required

**Standard editing interactions**
- Keyboard shortcuts for common formatting
- Formatting toolbar at the top of the editor
- Context formatting menu on text selection for quick formatting actions
- `/` command menu for inserting block elements
- `@` mention menu for inserting variables (see RB2-FR2)

**Visual guidance**
- The canvas visually reflects the approximate proportions of an A4 page so creators have a sense of how the output will look while editing

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR2] Variable Insertion

### Purpose
Let creators insert workflow variables into the template without leaving the keyboard. Variables can be inserted as inline values embedded in text, or as standalone answer blocks.

### Expected Behaviour

**@ Menu**
- Triggered by typing `@` anywhere in the editor
- Shows a searchable list of all available variables
- The list filters as the creator continues typing
- Selecting a variable inserts it as an inline value by default, except for Multi Field variables which always insert as a block
- Pressing Escape dismisses the menu without inserting

**Slash Command Menu**
- Triggered by typing `/` at the start of a line
- Shows formatting and block options alongside a variable block option
- Selecting the variable block option opens the variable picker and inserts a block

**Keyboard navigation**
- Arrow keys to navigate the menu, Enter to select, Escape to dismiss

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR3] Inline Variable Display

### Purpose
Allow variables to appear embedded within sentences or paragraphs, rendering their answer value inline alongside surrounding text.

### Expected Behaviour

- An inline variable appears as a styled chip inside a paragraph showing the variable label or alias
- In the editor, the chip is non-editable but selectable and deletable
- In the preview and export, the chip is replaced with the actual answer value
- Only simple (non-multi-field) variables can be inserted inline
- A creator can switch an inline variable to block display and vice versa via the variable's action menu

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR4] Block Variable Display & Width Control

### Purpose
Allow variables to occupy their own dedicated area in the report, displaying both the question label and the answer value as a standalone card. Creators can control how wide each block is relative to the page.

### Expected Behaviour

**Block card**
- Renders as a card showing the variable label and its answer placeholder or value
- The card is visually distinct from paragraph content
- Multiple block variables on the same row share the horizontal space

**Width control**
- Each block can be resized between a minimum width and full page width
- A drag handle is visible on hover at the right edge of the block
- Dragging snaps to column divisions so blocks align neatly
- Guide lines are visible during drag to assist with alignment
- Width is saved per block

**Display mode**
- Via the block action menu, creators can switch between block display and inline display
- Multi Field variables are always block; the inline option is hidden for them

**Delete**
- Block can be deleted via the action menu or keyboard

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR5] Multi-Response Variable Support

### Purpose
Support variables where the respondent has given multiple answers (e.g. a recurring inspection item answered multiple times). Multi-response variables render each answer as a separate entry.

### Expected Behaviour

**Enabling Multi Response**
- Any variable type can be set to Multi Response
- Multi Response is independent of Multi Field — both can be active on the same variable

**Editor preview**
- A multi-response block shows placeholder rows to indicate multiple values will appear
- The block takes up the full page width and cannot be resized narrower

**In preview and export**
- Each response renders as a numbered list item within the block
- Exception: a multi-select question always renders its selected options as chips, not as a numbered list, even when Multi Response is enabled

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR6] Multi-Field Variable Support

### Purpose
Support compound variables with sub-questions. Multi-field variables group related sub-questions under one parent variable, which the creator inserts as a single block.

### Expected Behaviour

**Enabling Multi Field**
- Set via a toggle on the parent variable in the variable configuration panel
- Once enabled, sub-fields can be added to the parent variable

**Sub-field definition**
- Each sub-field has a label and a type (all question types supported)
- Each sub-field can independently have Multi Response enabled
- Only the parent variable is available for insertion — sub-fields cannot be inserted individually
- Multi Field within a Multi Field is not supported (no nesting)

**Editor preview (Multi Field only, no Multi Response)**
- Renders as a stacked list of sub-field cards, each showing the sub-field label and a type-appropriate placeholder

**Editor preview (Multi Field + Multi Response)**
- Renders as a table (see RB2-FR7)

**In preview and export**
- Multi Field without Multi Response: renders as grouped sub-field answer sections
- Multi Field with Multi Response: renders as a table (see RB2-FR7)

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR7] Multi-Field + Multi-Response Table View

### Purpose
When a variable has both Multi Field and Multi Response enabled, render it as a table where columns are sub-fields and rows are response instances.

### Expected Behaviour

**Table structure**
- Columns correspond to each visible sub-field (in the configured order)
- Rows correspond to each response instance
- Column headers show the sub-field label (which can be renamed — see RB2-FR8)

**Editor preview**
- Shows placeholder rows to indicate a multi-row table
- The table always fills the full width of the block

**Sub-field with Multi Response within a table**
- If a sub-field also has Multi Response enabled, its cell displays a list of values within the table cell

**In preview and export**
- Table renders with actual answer data
- Each row is one response instance
- Sub-field Multi Response cells render as a bulleted list within the cell

**Width**
- Table blocks always occupy full page width

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR8] Table Column Management

### Purpose
Give creators control over which columns appear in a multi-field + multi-response table, their display order, header labels, and relative widths.

### Expected Behaviour

**Column header editing**
- Clicking a column header in the editor opens an inline text input
- The creator can rename the column header independently of the underlying sub-field label
- Saving the header does not affect the sub-field definition

**Column width resizing**
- A drag handle sits on the right border of each column header, except the last column
- Dragging moves only the border between two adjacent columns — one grows and the other shrinks by the same amount
- No other columns are affected by the drag
- Each column has a minimum width to remain legible
- The last column has no resize handle because the table always fills the full page width

**Proportional widths**
- Column widths are stored as proportional values so the table always fills the available width without scrolling, regardless of page size or screen resolution

**In preview and export**
- Column header labels, column order, and column width proportions match exactly what is configured in the editor

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR9] Report Preview

### Purpose
Allow creators to see how the report will look with sample answer data before exporting, without leaving the builder.

### Expected Behaviour

**Opening preview**
- A Preview button in the toolbar opens a preview overlay
- The preview reflects the editor content and variable configuration at the time it is opened
- Changes made after opening are not reflected until the preview is closed and reopened

**Preview rendering**
- Renders the template as an A4-proportioned page with all variables replaced by their sample answers
- All formatting, variable blocks, inline values, and tables are rendered as they would appear in the exported report
- Multi-response blocks render as numbered lists
- Multi-field table blocks render as full tables with the configured widths and headers

**Sample answers**
- Preview uses the sample answers configured per variable
- A label in the preview indicates that sample answers are being used

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR10] Report Export (PDF & Markdown)

### Purpose
Allow creators to export the rendered report template as a PDF or Markdown file.

### Expected Behaviour

**PDF Export**
- Accessible from an Export button in the toolbar
- Generates a PDF from the rendered report at A4 dimensions with standard margins
- All formatting, variable values, and table layouts are preserved
- A loading state is shown during generation

**Markdown Export**
- Generates a Markdown file with all variables resolved to their sample answer values
- Rich text formatting is converted to standard Markdown
- Multi-field + multi-response blocks render as Markdown tables
- Column order from the editor is respected in the exported table

**General**
- Both exports use the current sample answers at the time of export
- The exported file is downloaded to the user's device

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR11] Question & Variable Configuration

### Purpose
Allow creators to define, edit, and manage the full set of variables available in the report template, including their types, sample answers, display settings, and multi-response / multi-field configuration.

### Expected Behaviour

**Variable settings (per variable)**
- Label (editable)
- Type — all question types supported: short text, long text, number, date, date & time, radio, single select, multi select, toggle, rating, slider, image upload, file upload, signature, sketch, location
- Alias — optional display name used when the variable is inserted into the template
- Sample answer — used in preview and export
- Multi Response toggle
- Multi Field toggle

**Sub-field management (when Multi Field is active)**
- Add sub-field: requires label and type
- Remove sub-field
- Each sub-field has: label, type, optional Multi Response toggle
- The same full type list applies to sub-fields as to top-level variables

**Adding new variables**
- Creators can add new variables manually, for example when the workflow is not yet finalised
- New variable requires a label and type

### Lo-Fi Notes
- Not Applicable

---

## [RB2-FR12] Template Persistence (Save / Load JSON)

### Purpose
Allow report templates to be saved and restored, supporting draft saving, template management, and integration with the Workflow Builder.

### Expected Behaviour

**Save**
- The current report template can be saved, preserving the full document content, all variable definitions, column configuration, and sample answers

**Load**
- A previously saved template can be loaded back into the builder, fully restoring the document and all variable configuration
- Loading prompts for confirmation if there are unsaved changes in the current session

**Validation on load**
- The system checks that the loaded template is valid and contains the required structure
- If the template is invalid or from an unsupported version, a clear error is shown and the load does not proceed
- Variable references in the document that cannot be matched to a variable definition are flagged as unresolved but preserved

**Integration with Workflow Builder**
- When the Report Builder is accessed from Workflow Builder V2.0 (via WB2-FR9), templates are saved against the workflow rather than as standalone files
- Standalone save/load remains available for testing and migration

### Lo-Fi Notes
- Not Applicable

---

## Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Editor should feel responsive for typical report templates (up to ~50 variable blocks) |
| Export | PDF export should complete within a reasonable time for a standard A4 report |
| Compatibility | Must work in Chrome, Safari, and Edge (latest 2 versions) |
| Accessibility | Keyboard navigation for all menus and variable insertion flows |
| Responsiveness | Builder is a desktop-only tool |

---

## Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Should sample answers be seeded from real workflow submission data, or always manually entered by the creator? | Denzyl / Isaac | Open |
| 2 | How are report templates linked to a specific workflow version — does a template lock to a specific version, or always track the latest? | Isaac | Open |
| 3 | Should conditional section rendering (show/hide sections based on answer values) be in scope for V2.0 or deferred? | Denzyl | Open |
| 4 | For PDF export, is client-side generation sufficient or is server-side rendering required for print fidelity? | Engineering | Open |
