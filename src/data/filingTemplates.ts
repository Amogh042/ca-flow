export type FilingFrequency = "monthly" | "quarterly" | "yearly";

export interface FilingTemplate {
  name: string;
  type: string;
  frequency: FilingFrequency;
  dayOfMonth: number;
  quarterMonths?: number[];
  yearMonth?: number;
  appliesTo: string[];
  entityTypes?: string[];
}

export const filingTemplates: FilingTemplate[] = [
  {
    name: "GSTR-1",
    type: "GST Return",
    frequency: "monthly",
    dayOfMonth: 11,
    appliesTo: ["gstin"],
  },
  {
    name: "GSTR-3B",
    type: "GST Return",
    frequency: "monthly",
    dayOfMonth: 20,
    appliesTo: ["gstin"],
  },
  {
    name: "GSTR-9",
    type: "GST Return",
    frequency: "yearly",
    dayOfMonth: 31,
    yearMonth: 12,
    appliesTo: ["gstin"],
  },
  {
    name: "GSTR-9C",
    type: "GST Return",
    frequency: "yearly",
    dayOfMonth: 31,
    yearMonth: 12,
    appliesTo: ["gstin"],
    entityTypes: ["Private Limited", "LLP"],
  },
  {
    name: "TDS Return",
    type: "TDS Return",
    frequency: "quarterly",
    dayOfMonth: 31,
    quarterMonths: [7, 10, 1, 5],
    appliesTo: ["tan"],
  },
  {
    name: "Advance Tax",
    type: "Advance Tax",
    frequency: "quarterly",
    dayOfMonth: 15,
    quarterMonths: [6, 9, 12, 3],
    appliesTo: ["pan"],
  },
  {
    name: "ITR",
    type: "ITR",
    frequency: "yearly",
    dayOfMonth: 31,
    yearMonth: 7,
    appliesTo: ["pan"],
    entityTypes: ["Individual", "Partnership"],
  },
  {
    name: "ITR (Company)",
    type: "ITR",
    frequency: "yearly",
    dayOfMonth: 31,
    yearMonth: 10,
    appliesTo: ["pan"],
    entityTypes: ["Private Limited", "LLP"],
  },
  {
    name: "Tax Audit Report",
    type: "Tax Audit",
    frequency: "yearly",
    dayOfMonth: 30,
    yearMonth: 9,
    appliesTo: ["pan"],
    entityTypes: ["Private Limited", "LLP"],
  },
  {
    name: "ROC Annual Return",
    type: "ROC Filing",
    frequency: "yearly",
    dayOfMonth: 30,
    yearMonth: 11,
    appliesTo: [],
    entityTypes: ["Private Limited"],
  },
  {
    name: "Professional Tax Return",
    type: "PT Return",
    frequency: "monthly",
    dayOfMonth: 15,
    appliesTo: [],
    entityTypes: ["Private Limited", "LLP"],
  },
];
