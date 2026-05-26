import type { FormQuestion, FormAnswers, ApprovalAnswer } from "./types";

const approvedSample: ApprovalAnswer = {
  decision: "approved",
  person: "Isaac Tan",
  date: "22 May 2026",
  signature: "",
};

const rejectedSample: ApprovalAnswer = {
  decision: "rejected",
  person: "Sarah Lim",
  date: "21 May 2026",
  remarks: "Missing safety officer endorsement. Please resubmit after obtaining the required sign-off.",
  images: [],
};

export const sampleQuestions: FormQuestion[] = [
  { id: "q_project_name",       label: "Project Name",         variableKey: "project_name",       type: "short_text" },
  { id: "q_safety_remarks",     label: "Safety Remarks",       variableKey: "safety_remarks",     type: "long_text" },
  { id: "q_worker_count",       label: "Worker Count",         variableKey: "worker_count",       type: "number" },
  { id: "q_risk_level",         label: "Risk Level",           variableKey: "risk_level",         type: "radio" },
  { id: "q_site_rating",        label: "Site Rating",          variableKey: "site_rating",        type: "rating" },
  { id: "q_ppe_compliant",      label: "PPE Compliant",        variableKey: "ppe_compliant",      type: "toggle" },
  { id: "q_work_type",          label: "Work Type",            variableKey: "work_type",          type: "single_select" },
  { id: "q_ppe_items",          label: "PPE Items Observed",   variableKey: "ppe_items",          type: "multi_select" },
  { id: "q_completion_pct",     label: "Completion %",         variableKey: "completion_pct",     type: "slider" },
  { id: "q_inspection_date",    label: "Inspection Date",      variableKey: "inspection_date",    type: "date" },
  { id: "q_inspection_time",    label: "Inspection Date & Time", variableKey: "inspection_time",  type: "datetime" },
  { id: "q_report_file",        label: "Report File",          variableKey: "report_file",        type: "file_upload" },
  { id: "q_supervisor_sig",     label: "Supervisor Signature", variableKey: "supervisor_sig",     type: "signature" },
  { id: "q_site_sketch",        label: "Site Sketch",          variableKey: "site_sketch",        type: "sketch" },
  { id: "q_site_location",      label: "Site Location",        variableKey: "site_location",      type: "location" },
  { id: "q_ptw_approval",       label: "Permit to Work Approval", variableKey: "ptw_approval",       type: "approval", category: "approval" },
  { id: "q_supervisor_approval", label: "Supervisor Approval",   variableKey: "supervisor_approval", type: "approval", category: "approval" },
  { id: "q_photo_evidence",     label: "Photo Evidence",       variableKey: "photo_evidence",     type: "image_upload" },
  {
    id: "q_attendance",
    label: "Attendance",
    variableKey: "attendance",
    type: "short_text",
    multiField: true,
    multiResponse: true,
    subFields: [
      { id: "sf_att_name",        label: "Name",        variableKey: "att_name",        type: "short_text" },
      { id: "sf_att_id",          label: "ID",          variableKey: "att_id",          type: "short_text" },
      { id: "sf_att_temperature", label: "Temperature", variableKey: "att_temperature", type: "number" },
      { id: "sf_att_fit",         label: "Fit",         variableKey: "att_fit",         type: "toggle" },
      { id: "sf_att_signature",   label: "Signature",   variableKey: "att_signature",   type: "signature" },
    ],
  },
];

export const sampleAnswers: FormAnswers = {
  project_name:    "Gim Tian Site A",
  safety_remarks:  "All workers were wearing PPE during the inspection.",
  worker_count:    "12",
  risk_level:      "Medium",
  site_rating:     "4",
  ppe_compliant:   "true",
  work_type:       "Electrical",
  ppe_items:       ["Helmet", "Safety Vest", "Safety Shoes"],
  completion_pct:  "65",
  inspection_date: "22 May 2026",
  inspection_time: "22 May 2026 09:30",
  report_file:     "",
  supervisor_sig:  "",
  site_sketch:     "",
  site_location:   "1.3521, 103.8198",
  photo_evidence:  "",
  att_name:        ["John Tan", "Sarah Lim", "Raj Kumar"],
  att_id:          ["W001", "W002", "W003"],
  att_temperature: ["36.5", "36.8", "37.1"],
  att_fit:         ["true", "true", "false"],
  att_signature:      ["", "", ""],
  ptw_approval:       JSON.stringify(approvedSample),
  supervisor_approval: JSON.stringify(rejectedSample),
};
