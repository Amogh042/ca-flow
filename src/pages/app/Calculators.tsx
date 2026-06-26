import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, Search, Receipt, Landmark, TrendingDown, BarChart3, Briefcase, ShieldCheck, DollarSign, Building2, LineChart, FileText } from "lucide-react";
import { CalcCard, CalcMeta } from "@/components/calc/CalcCard";

const categoryMeta: Record<string, { title: string; subtitle: string; calcs: CalcMeta[] }> = {
  tax: {
    title: "Tax Calculators",
    subtitle: "27 Indian tax tools",
    calcs: [
      { slug: "income-tax", name: "Income Tax Slab", desc: "Old vs New regime, all FYs", icon: Receipt },
      { slug: "tds", name: "TDS Calculator", desc: "Section-wise rates, surcharge", icon: Receipt },
      { slug: "advance-tax", name: "Advance Tax", desc: "Quarter-wise obligation", icon: Receipt },
      { slug: "hra", name: "HRA Exemption", desc: "Metro vs non-metro calculation", icon: Receipt },
      { slug: "stcg", name: "Capital Gains STCG", desc: "Short term with exemptions", icon: TrendingDown },
      { slug: "ltcg", name: "Capital Gains LTCG", desc: "Indexation + 10% flat", icon: TrendingDown },
      { slug: "80c-planner", name: "80C/80D Planner", desc: "Deduction optimizer", icon: Receipt },
      { slug: "capital-gains-property", name: "Capital Gains Property", desc: "With indexation benefit", icon: Building2 },
      { slug: "dividend-tax", name: "Dividend Tax", desc: "Domestic + foreign", icon: DollarSign },
      { slug: "leave-encashment", name: "Leave Encashment Tax", desc: "Exemption under 10(10AA)", icon: Briefcase },
      { slug: "huf-tax", name: "HUF Tax Calculator", desc: "HUF vs individual comparison", icon: Receipt },
      { slug: "form-16", name: "Form 16 Computation", desc: "Part B salary tax computation", icon: FileText },
      { slug: "tds-salary", name: "TDS on Salary (192)", desc: "Monthly TDS projection", icon: Receipt },
      { slug: "income-tax-notice", name: "IT Notice Interest", desc: "Section 234 interest calc", icon: Receipt },
      { slug: "tax-planning", name: "Tax Planning Optimizer", desc: "Regime comparison + actions", icon: Receipt },
      { slug: "tds-26as", name: "TDS 26AS Reconciliation", desc: "Match TDS with tax liability", icon: FileText },
      { slug: "crypto-tax", name: "Crypto & VDA Tax", desc: "30% gain + 1% TDS", icon: DollarSign },
      { slug: "marginal-relief", name: "Marginal Relief", desc: "Surcharge threshold relief", icon: Receipt },
      { slug: "presumptive-tax", name: "Presumptive Tax (44AD)", desc: "44AD / 44ADA / 44AE", icon: Receipt },
      { slug: "employees-stock", name: "ESOP Tax Calculator", desc: "Perquisite + capital gains", icon: DollarSign },
      { slug: "foreign-income", name: "Foreign Income & DTAA", desc: "Tax credit computation", icon: Receipt },
      { slug: "tds-property", name: "TDS on Property (194IA)", desc: "Property purchase TDS", icon: Building2 },
      { slug: "nri-tax", name: "NRI Income Tax", desc: "Indian-source income for NRI", icon: Receipt },
      { slug: "itr-form-selector", name: "ITR Form Selector", desc: "Filing guide + checklist", icon: FileText },
      { slug: "rebate-87a", name: "Section 87A Rebate", desc: "Rebate + marginal relief", icon: Receipt },
      { slug: "interest-income", name: "Interest Income Tax", desc: "Source-wise with exemptions", icon: DollarSign },
      { slug: "ltcg-mutual-fund", name: "Mutual Fund Capital Gains", desc: "LTCG/STCG post-budget 2024", icon: LineChart },
    ],
  },
  loans: {
    title: "Loans & EMI",
    subtitle: "9 calculators for borrowers and lenders",
    calcs: [
      { slug: "emi", name: "EMI Calculator", desc: "Monthly instalment + amortisation", icon: Landmark },
      { slug: "home-loan", name: "Home Loan EMI", desc: "With prepayment scenarios", icon: Building2 },
      { slug: "car-loan", name: "Car Loan EMI", desc: "Tenure comparison + total cost", icon: Landmark },
      { slug: "personal-loan", name: "Personal Loan", desc: "Effective APR + amortisation", icon: Landmark },
      { slug: "loan-eligibility", name: "Loan Eligibility", desc: "Based on income & FOIR", icon: Landmark },
      { slug: "balance-transfer", name: "Balance Transfer", desc: "Refinancing savings calculator", icon: Landmark },
      { slug: "prepayment", name: "Prepayment Savings", desc: "Reduced tenure vs reduced EMI", icon: Landmark },
      { slug: "emi-moratorium", name: "EMI Moratorium Impact", desc: "Interest-only vs full deferment", icon: Landmark },
      { slug: "home-loan-tax", name: "Home Loan Tax Benefit", desc: "Section 24 / 80C / 80EEA", icon: Building2 },
    ],
  },
  depreciation: {
    title: "Depreciation",
    subtitle: "5 depreciation methods",
    calcs: [
      { slug: "wdv", name: "WDV Method", desc: "Written down value depreciation", icon: TrendingDown },
      { slug: "slm", name: "Straight Line", desc: "Equal annual depreciation", icon: TrendingDown },
      { slug: "depreciation-it", name: "IT Act Depreciation", desc: "Block-rate with half-year rule", icon: TrendingDown },
      { slug: "depreciation-syd", name: "Sum of Years Digits", desc: "Accelerated depreciation", icon: TrendingDown },
      { slug: "depreciation-comparison", name: "Depreciation Comparison", desc: "SLM vs WDV vs SYD vs DDB", icon: TrendingDown },
    ],
  },
  ratios: {
    title: "Financial Ratios",
    subtitle: "12 ratio tools from your statements",
    calcs: [
      { slug: "current-ratio", name: "Financial Ratios Dashboard", desc: "20+ ratios from P&L + Balance Sheet", icon: BarChart3 },
      { slug: "debt-equity", name: "Debt to Equity & Leverage", desc: "6 solvency ratios with health flags", icon: BarChart3 },
      { slug: "roe", name: "ROE — DuPont Analysis", desc: "Margin, efficiency & leverage", icon: BarChart3 },
      { slug: "break-even", name: "Break-even Calculator", desc: "Contribution margin & scenarios", icon: BarChart3 },
      { slug: "net-worth", name: "Personal Net Worth", desc: "Assets vs liabilities tracker", icon: BarChart3 },
      { slug: "working-capital", name: "Working Capital Analysis", desc: "Liquidity ratios & CCC", icon: BarChart3 },
      { slug: "profitability-ratios", name: "Profitability Ratios", desc: "Margins, ROA, ROE, ROCE", icon: BarChart3 },
      { slug: "cash-flow", name: "Cash Flow Statement", desc: "Operating, investing, financing", icon: BarChart3 },
      { slug: "budget-variance", name: "Budget vs Actual", desc: "Variance analysis with flags", icon: BarChart3 },
      { slug: "partnership-profit", name: "Partnership Profit Sharing", desc: "Salary, interest & ratio split", icon: BarChart3 },
      { slug: "receivables-aging", name: "Receivables Aging", desc: "Debtor buckets & provisioning", icon: BarChart3 },
      { slug: "balance-sheet-analysis", name: "Balance Sheet Analyser", desc: "Financial strength score", icon: BarChart3 },
    ],
  },
  payroll: {
    title: "Payroll & HR",
    subtitle: "11 payroll calculations",
    calcs: [
      { slug: "salary", name: "Salary Breakup", desc: "CTC to take-home breakdown", icon: Briefcase },
      { slug: "gratuity", name: "Gratuity", desc: "As per Payment of Gratuity Act", icon: Briefcase },
      { slug: "pf", name: "PF Calculator", desc: "Employee + employer share", icon: Briefcase },
      { slug: "esi", name: "ESI Calculator", desc: "Employee State Insurance", icon: Briefcase },
      { slug: "leave-encashment", name: "Leave Encashment", desc: "Tax-exempt amount", icon: Briefcase },
      { slug: "gratuity-eligibility", name: "Gratuity Eligibility", desc: "Detailed computation & 4-year rule", icon: Briefcase },
      { slug: "salary-hike", name: "Salary Hike & CTC Revision", desc: "Current vs revised comparison", icon: Briefcase },
      { slug: "salary-restructure", name: "Salary Restructuring", desc: "Tax optimization via components", icon: Briefcase },
      { slug: "retrenchment-compensation", name: "Retrenchment Compensation", desc: "VRS / closure computation", icon: Briefcase },
      { slug: "pf-withdrawal", name: "PF Withdrawal Tax", desc: "TDS on EPF withdrawal", icon: Briefcase },
      { slug: "professional-tax", name: "Professional Tax", desc: "State-wise PT slabs", icon: Briefcase },
    ],
  },
  audit: {
    title: "Audit Tools",
    subtitle: "3 standards-aligned tools",
    calcs: [
      { slug: "materiality", name: "Materiality", desc: "Planning materiality + tolerable misstatement", icon: ShieldCheck },
      { slug: "sample-size", name: "Sample Size", desc: "Statistical sampling", icon: ShieldCheck },
      { slug: "audit-checklist", name: "Audit Checklist Score", desc: "20-point readiness assessment", icon: ShieldCheck },
    ],
  },
  valuation: {
    title: "Valuation",
    subtitle: "8 valuation models",
    calcs: [
      { slug: "dcf", name: "DCF", desc: "Discounted cash flow valuation", icon: DollarSign },
      { slug: "wacc", name: "WACC", desc: "Weighted average cost of capital", icon: DollarSign },
      { slug: "npv", name: "NPV Calculator", desc: "Discounted cash flow analysis", icon: DollarSign },
      { slug: "irr", name: "IRR Calculator", desc: "IRR and MIRR with NPV profile", icon: DollarSign },
      { slug: "payback", name: "Payback Period", desc: "Simple and discounted payback", icon: DollarSign },
      { slug: "bond-valuation", name: "Bond Valuation", desc: "Present value pricing & yield", icon: DollarSign },
      { slug: "equity-valuation", name: "Equity Valuation", desc: "DDM & P/E multi-method", icon: DollarSign },
      { slug: "startup-valuation", name: "Startup Valuation", desc: "Revenue, Berkus & VC method", icon: DollarSign },
    ],
  },
  realestate: {
    title: "Real Estate",
    subtitle: "4 property calculators",
    calcs: [
      { slug: "rental-yield", name: "Rental Yield", desc: "Gross & net yield", icon: Building2 },
      { slug: "stamp-duty", name: "Stamp Duty", desc: "State-wise rates", icon: Building2 },
      { slug: "rent-vs-buy", name: "Rent vs Buy Analysis", desc: "Ownership economics comparison", icon: Building2 },
      { slug: "capital-gains-property", name: "Property Capital Gains", desc: "LTCG/STCG with indexation", icon: Building2 },
    ],
  },
  investment: {
    title: "Investment",
    subtitle: "10 investment planners",
    calcs: [
      { slug: "sip", name: "SIP Calculator", desc: "Future value of monthly investment", icon: LineChart },
      { slug: "lumpsum", name: "Lumpsum", desc: "One-time investment growth", icon: LineChart },
      { slug: "ppf", name: "PPF Calculator", desc: "15-year tax-free returns", icon: LineChart },
      { slug: "compound-interest", name: "Compound Interest", desc: "Growth with frequency options", icon: LineChart },
      { slug: "mis-calculator", name: "Post Office MIS", desc: "Monthly income scheme", icon: LineChart },
      { slug: "sukanya-samriddhi", name: "Sukanya Samriddhi", desc: "21-year girl child scheme", icon: LineChart },
      { slug: "nps-calculator", name: "NPS Calculator", desc: "Retirement corpus & pension", icon: LineChart },
      { slug: "senior-citizen-fd", name: "Senior Citizen FD", desc: "FD comparison with TDS", icon: LineChart },
      { slug: "gold-returns", name: "Gold Returns", desc: "Physical vs SGB vs ETF", icon: LineChart },
      { slug: "ltcg-mutual-fund", name: "Mutual Fund Gains", desc: "Aggregate LTCG/STCG/debt", icon: LineChart },
    ],
  },
  gst: {
    title: "GST",
    subtitle: "9 indirect tax tools",
    calcs: [
      { slug: "gst", name: "GST Calculator", desc: "Forward & reverse, all slabs", icon: FileText },
      { slug: "gst-late-fee", name: "GST Late Fee", desc: "GSTR-1/3B/9 late fee + interest", icon: FileText },
      { slug: "itc-reconciliation", name: "ITC Reconciliation", desc: "GSTR-2B vs 3B vs reversed", icon: FileText },
      { slug: "gst-composition", name: "GST Composition Scheme", desc: "Composition vs regular GST", icon: FileText },
      { slug: "export-under-gst", name: "GST on Exports", desc: "Zero-rated + LUT + refund", icon: FileText },
      { slug: "invoice-gst", name: "GST Invoice Calculator", desc: "Intra/inter-state invoice", icon: FileText },
      { slug: "gst-annual-return", name: "GSTR-9 Annual Return", desc: "Outward tax + ITC reconciliation", icon: FileText },
      { slug: "advance-ruling", name: "GST Liability Estimator", desc: "Transaction-wise GST + RCM", icon: FileText },
      { slug: "customs-duty", name: "Import Customs Duty", desc: "BCD + SWS + IGST landed cost", icon: FileText },
    ],
  },
};

export default function Calculators() {
  const { category = "tax" } = useParams();
  const [query, setQuery] = useState("");

  const meta = categoryMeta[category] ?? { title: "Calculators", subtitle: "Coming soon", calcs: [] };

  const filtered = meta.calcs.filter((c) => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-xs text-secondary">
        <Link to="/dashboard" className="hover:text-[var(--text-primary)]">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--text-primary)]">{meta.title}</span>
      </nav>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
        <p className="mt-1 text-secondary text-sm">{meta.subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in category..."
            className="glass-input w-full h-9 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => <CalcCard key={c.slug} calc={c} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-secondary text-sm">No calculators match your filter.</div>
      )}
    </div>
  );
}
