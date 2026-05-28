export type QuestionType =
  | "short_text"
  | "long_text"
  | "number"
  | "radio"
  | "rating"
  | "toggle"
  | "single_select"
  | "multi_select"
  | "slider"
  | "date"
  | "datetime"
  | "file_upload"
  | "signature"
  | "sketch"
  | "location"
  | "image_upload"
  | "approval";

export type VariableCategory = "form" | "approval" | "execution";

export interface ApprovalAnswer {
  decision: "approved" | "rejected";
  person: string;
  date: string;
  signature?: string;
  remarks?: string;
  images?: string[];
}

export type DisplayType = "inline_value" | "inline_remarks" | "inline_remarks_image" | "question_answer_block";

export interface SubField {
  id: string;
  label: string;
  variableKey: string;
  type: QuestionType;
  multiResponse?: boolean;
}

export interface FormQuestion {
  id: string;
  label: string;
  variableKey: string;
  type: QuestionType;
  alias?: string;
  category?: VariableCategory; // default "form"
  system?: boolean;            // system-generated metadata, not a user question
  multiResponse?: boolean;
  multiField?: boolean;
  subFields?: SubField[];
  allowRemarks?: boolean;
  columnHeaders?: Record<string, string>;
  columnOrder?: string[];         // ordered visible sub-field variableKeys; undefined = all in original order
  columnWidths?: Record<string, number>; // sub-field variableKey → pixel width
}

export interface FormAnswers {
  [variableKey: string]: string | string[];
}

export type CollectionCellValue = string | number | boolean;

export interface CollectionColumn {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
}

export type CollectionRow = Record<string, CollectionCellValue>;

export interface Collection {
  id: string;
  name: string;
  variableKey: string; // used as table name in SQL
  columns: CollectionColumn[];
  rows: CollectionRow[];
}

export interface VariableNodeAttrs {
  questionId: string;
  variableKey: string;
  label: string;
  questionType: QuestionType;
  displayType: DisplayType;
}
