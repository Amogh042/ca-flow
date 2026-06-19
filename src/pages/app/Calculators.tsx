import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, Search, Receipt, Landmark, TrendingDown, BarChart3, Briefcase, ShieldCheck, DollarSign, Building2, LineChart, FileText } from "lucide-react";
import { CalcCard, CalcMeta } from "@/components/calc/CalcCard";
import { cn } from "@/lib/utils";

const categoryMeta: Record<string, { title: string; subtitle: string; calcs: CalcMeta[] }> = {
  tax: {
    title: "Tax Calculators",
    subtitle: "30 tools across 10 jurisdictions",
    calcs: [
      { slug: "income-tax", name: "Income Tax Slab", desc: "Old vs New regime, all FYs", flags: ["🇮🇳"], icon: Receipt },
      { slug: "tds", name: "TDS Calculator", desc: "Section-wise rates, surcharge", flags: ["🇮🇳"], icon: Receipt },
      { slug: "advance-tax", name: "Advance Tax", desc: "Quarter-wise obligation", flags: ["🇮🇳"], icon: Receipt },
      { slug: "hra", name: "HRA Exemption", desc: "Metro vs non-metro calculation", flags: ["🇮🇳"], icon: Receipt },
      { slug: "stcg", name: "Capital Gains STCG", desc: "Short term with exemptions", flags: ["🇮🇳"], icon: TrendingDown },
      { slug: "ltcg", name: "Capital Gains LTCG", desc: "Indexation + 10% flat", flags: ["🇮🇳"], icon: TrendingDown },
      { slug: "80c-planner", name: "80C/80D Planner", desc: "Deduction optimizer", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "uk-income-tax", name: "UK Income Tax", desc: "PAYE, NI, personal allowance", flags: ["🇬🇧"], pro: true, icon: Receipt },
      { slug: "us-federal-tax", name: "US Federal Tax", desc: "1040, brackets, FICA", flags: ["🇺🇸"], pro: true, icon: Receipt },
      { slug: "sg-income-tax", name: "Singapore Income Tax", desc: "Resident slab + CPF", flags: ["🇸🇬"], pro: true, icon: Receipt },
      { slug: "capital-gains-property", name: "Capital Gains Property", desc: "With indexation benefit", flags: ["🇮🇳"], pro: true, icon: Building2 },
      { slug: "dividend-tax", name: "Dividend Tax", desc: "Domestic + foreign", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "leave-encashment", name: "Leave Encashment Tax", desc: "Exemption under 10(10AA)", flags: ["🇮🇳"], pro: true, icon: Briefcase },
      { slug: "huf-tax", name: "HUF Tax Calculator", desc: "HUF vs individual comparison", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "form-16", name: "Form 16 Computation", desc: "Part B salary tax computation", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "tds-salary", name: "TDS on Salary (192)", desc: "Monthly TDS projection", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "income-tax-notice", name: "IT Notice Interest", desc: "Section 234 interest calc", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "tax-planning", name: "Tax Planning Optimizer", desc: "Regime comparison + actions", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "tds-26as", name: "TDS 26AS Reconciliation", desc: "Match TDS with tax liability", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "crypto-tax", name: "Crypto & VDA Tax", desc: "30% gain + 1% TDS", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "marginal-relief", name: "Marginal Relief", desc: "Surcharge threshold relief", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "presumptive-tax", name: "Presumptive Tax (44AD)", desc: "44AD / 44ADA / 44AE", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "employees-stock", name: "ESOP Tax Calculator", desc: "Perquisite + capital gains", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "foreign-income", name: "Foreign Income & DTAA", desc: "Tax credit computation", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "tds-property", name: "TDS on Property (194IA)", desc: "Property purchase TDS", flags: ["🇮🇳"], pro: true, icon: Building2 },
      { slug: "nri-tax", name: "NRI Income Tax", desc: "Indian-source income for NRI", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "itr-form-selector", name: "ITR Form Selector", desc: "Filing guide + checklist", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "rebate-87a", name: "Section 87A Rebate", desc: "Rebate + marginal relief", flags: ["🇮🇳"], pro: true, icon: Receipt },
      { slug: "interest-income", name: "Interest Income Tax", desc: "Source-wise with exemptions", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "ltcg-mutual-fund", name: "Mutual Fund Capital Gains", desc: "LTCG/STCG post-budget 2024", flags: ["🇮🇳"], pro: true, icon: LineChart },
    ],
  },
  loans: {
    title: "Loans & EMI",
    subtitle: "9 calculators for borrowers and lenders",
    calcs: [
      { slug: "emi", name: "EMI Calculator", desc: "Monthly instalment + amortisation", flags: ["🇮🇳", "🇬🇧", "🇺🇸"], icon: Landmark },
      { slug: "home-loan", name: "Home Loan EMI", desc: "With prepayment scenarios", flags: ["🇮🇳"], icon: Building2 },
      { slug: "car-loan", name: "Car Loan EMI", desc: "Tenure comparison + total cost", flags: ["🇮🇳"], icon: Landmark },
      { slug: "personal-loan", name: "Personal Loan", desc: "Effective APR + amortisation", flags: ["🇮🇳"], icon: Landmark },
      { slug: "loan-eligibility", name: "Loan Eligibility", desc: "Based on income & FOIR", flags: ["🇮🇳"], pro: true, icon: Landmark },
      { slug: "balance-transfer", name: "Balance Transfer", desc: "Refinancing savings calculator", flags: ["🇮🇳"], pro: true, icon: Landmark },
      { slug: "prepayment", name: "Prepayment Savings", desc: "Reduced tenure vs reduced EMI", flags: ["🇮🇳"], pro: true, icon: Landmark },
      { slug: "emi-moratorium", name: "EMI Moratorium Impact", desc: "Interest-only vs full deferment", flags: ["🇮🇳"], pro: true, icon: Landmark },
      { slug: "home-loan-tax", name: "Home Loan Tax Benefit", desc: "Section 24 / 80C / 80EEA", flags: ["🇮🇳"], pro: true, icon: Building2 },
    ],
  },
  depreciation: {
    title: "Depreciation",
    subtitle: "6 methods across regimes",
    calcs: [
      { slug: "wdv", name: "WDV Method", desc: "Written down value depreciation", flags: ["🇮🇳"], icon: TrendingDown },
      { slug: "slm", name: "Straight Line", desc: "Equal annual depreciation", flags: ["🇮🇳", "🇬🇧"], icon: TrendingDown },
      { slug: "depreciation-it", name: "IT Act Depreciation", desc: "Block-rate with half-year rule", flags: ["🇮🇳"], pro: true, icon: TrendingDown },
      { slug: "depreciation-syd", name: "Sum of Years Digits", desc: "Accelerated depreciation", flags: ["🇮🇳"], pro: true, icon: TrendingDown },
      { slug: "depreciation-comparison", name: "Depreciation Comparison", desc: "SLM vs WDV vs SYD vs DDB", flags: ["🇮🇳"], pro: true, icon: TrendingDown },
    ],
  },
  ratios: {
    title: "Financial Ratios",
    subtitle: "11 ratio tools from your statements",
    calcs: [
      { slug: "current-ratio", name: "Financial Ratios Dashboard", desc: "20+ ratios from P&L + Balance Sheet", flags: ["🇮🇳", "🇬🇧"], icon: BarChart3 },
      { slug: "debt-equity", name: "Debt to Equity & Leverage", desc: "6 solvency ratios with health flags", flags: ["🇮🇳"], icon: BarChart3 },
      { slug: "roe", name: "ROE — DuPont Analysis", desc: "Margin, efficiency & leverage", flags: ["🇮🇳"], icon: BarChart3 },
      { slug: "break-even", name: "Break-even Calculator", desc: "Contribution margin & scenarios", flags: ["🇮🇳"], icon: BarChart3 },
      { slug: "net-worth", name: "Personal Net Worth", desc: "Assets vs liabilities tracker", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
      { slug: "working-capital", name: "Working Capital Analysis", desc: "Liquidity ratios & CCC", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
      { slug: "profitability-ratios", name: "Profitability Ratios", desc: "Margins, ROA, ROE, ROCE", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
      { slug: "cash-flow", name: "Cash Flow Statement", desc: "Operating, investing, financing", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
      { slug: "budget-variance", name: "Budget vs Actual", desc: "Variance analysis with flags", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
      { slug: "partnership-profit", name: "Partnership Profit Sharing", desc: "Salary, interest & ratio split", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
      { slug: "receivables-aging", name: "Receivables Aging", desc: "Debtor buckets & provisioning", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
      { slug: "balance-sheet-analysis", name: "Balance Sheet Analyser", desc: "Financial strength score", flags: ["🇮🇳"], pro: true, icon: BarChart3 },
    ],
  },
  payroll: {
    title: "Payroll & HR",
    subtitle: "10 payroll calculations",
    calcs: [
      { slug: "salary", name: "Salary Breakup", desc: "CTC to take-home breakdown", flags: ["🇮🇳"], icon: Briefcase },
      { slug: "gratuity", name: "Gratuity", desc: "As per Payment of Gratuity Act", flags: ["🇮🇳"], icon: Briefcase },
      { slug: "pf", name: "PF Calculator", desc: "Employee + employer share", flags: ["🇮🇳"], icon: Briefcase },
      { slug: "esi", name: "ESI Calculator", desc: "Employee State Insurance", flags: ["🇮🇳"], icon: Briefcase },
      { slug: "leave-encashment", name: "Leave Encashment", desc: "Tax-exempt amount", flags: ["🇮🇳"], pro: true, icon: Briefcase },
      { slug: "gratuity-eligibility", name: "Gratuity Eligibility", desc: "Detailed computation & 4-year rule", flags: ["🇮🇳"], pro: true, icon: Briefcase },
      { slug: "salary-hike", name: "Salary Hike & CTC Revision", desc: "Current vs revised comparison", flags: ["🇮🇳"], pro: true, icon: Briefcase },
      { slug: "salary-restructure", name: "Salary Restructuring", desc: "Tax optimization via components", flags: ["🇮🇳"], pro: true, icon: Briefcase },
      { slug: "retrenchment-compensation", name: "Retrenchment Compensation", desc: "VRS / closure computation", flags: ["🇮🇳"], pro: true, icon: Briefcase },
      { slug: "pf-withdrawal", name: "PF Withdrawal Tax", desc: "TDS on EPF withdrawal", flags: ["🇮🇳"], pro: true, icon: Briefcase },
      { slug: "professional-tax", name: "Professional Tax", desc: "State-wise PT slabs", flags: ["🇮🇳"], pro: true, icon: Briefcase },
    ],
  },
  audit: {
    title: "Audit Tools",
    subtitle: "3 standards-aligned tools",
    calcs: [
      { slug: "materiality", name: "Materiality", desc: "Planning materiality + tolerable misstatement", flags: ["🇮🇳", "🇬🇧"], pro: true, icon: ShieldCheck },
      { slug: "sample-size", name: "Sample Size", desc: "Statistical sampling", flags: ["🇮🇳"], pro: true, icon: ShieldCheck },
      { slug: "audit-checklist", name: "Audit Checklist Score", desc: "20-point readiness assessment", flags: ["🇮🇳"], pro: true, icon: ShieldCheck },
    ],
  },
  valuation: {
    title: "Valuation",
    subtitle: "7 valuation models",
    calcs: [
      { slug: "dcf", name: "DCF", desc: "Discounted cash flow valuation", flags: ["🇮🇳", "🇺🇸"], pro: true, icon: DollarSign },
      { slug: "wacc", name: "WACC", desc: "Weighted average cost of capital", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "npv", name: "NPV Calculator", desc: "Discounted cash flow analysis", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "irr", name: "IRR Calculator", desc: "IRR and MIRR with NPV profile", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "payback", name: "Payback Period", desc: "Simple and discounted payback", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "bond-valuation", name: "Bond Valuation", desc: "Present value pricing & yield", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "equity-valuation", name: "Equity Valuation", desc: "DDM & P/E multi-method", flags: ["🇮🇳"], pro: true, icon: DollarSign },
      { slug: "startup-valuation", name: "Startup Valuation", desc: "Revenue, Berkus & VC method", flags: ["🇮🇳"], pro: true, icon: DollarSign },
    ],
  },
  realestate: {
    title: "Real Estate",
    subtitle: "4 property calculators",
    calcs: [
      { slug: "rental-yield", name: "Rental Yield", desc: "Gross & net yield", flags: ["🇮🇳"], icon: Building2 },
      { slug: "stamp-duty", name: "Stamp Duty", desc: "State-wise rates", flags: ["🇮🇳"], icon: Building2 },
      { slug: "rent-vs-buy", name: "Rent vs Buy Analysis", desc: "Ownership economics comparison", flags: ["🇮🇳"], pro: true, icon: Building2 },
      { slug: "capital-gains-property", name: "Property Capital Gains", desc: "LTCG/STCG with indexation", flags: ["🇮🇳"], pro: true, icon: Building2 },
    ],
  },
  investment: {
    title: "Investment",
    subtitle: "9 investment planners",
    calcs: [
      { slug: "sip", name: "SIP Calculator", desc: "Future value of monthly investment", flags: ["🇮🇳"], icon: LineChart },
      { slug: "lumpsum", name: "Lumpsum", desc: "One-time investment growth", flags: ["🇮🇳"], icon: LineChart },
      { slug: "ppf", name: "PPF Calculator", desc: "15-year tax-free returns", flags: ["🇮🇳"], icon: LineChart },
      { slug: "compound-interest", name: "Compound Interest", desc: "Growth with frequency options", flags: ["🇮🇳"], icon: LineChart },
      { slug: "mis-calculator", name: "Post Office MIS", desc: "Monthly income scheme", flags: ["🇮🇳"], pro: true, icon: LineChart },
      { slug: "sukanya-samriddhi", name: "Sukanya Samriddhi", desc: "21-year girl child scheme", flags: ["🇮🇳"], pro: true, icon: LineChart },
      { slug: "nps-calculator", name: "NPS Calculator", desc: "Retirement corpus & pension", flags: ["🇮🇳"], pro: true, icon: LineChart },
      { slug: "senior-citizen-fd", name: "Senior Citizen FD", desc: "FD comparison with TDS", flags: ["🇮🇳"], pro: true, icon: LineChart },
      { slug: "gold-returns", name: "Gold Returns", desc: "Physical vs SGB vs ETF", flags: ["🇮🇳"], pro: true, icon: LineChart },
      { slug: "ltcg-mutual-fund", name: "Mutual Fund Gains", desc: "Aggregate LTCG/STCG/debt", flags: ["🇮🇳"], pro: true, icon: LineChart },
    ],
  },
  gst: {
    title: "GST / VAT",
    subtitle: "10 indirect tax tools",
    calcs: [
      { slug: "gst", name: "GST Calculator", desc: "Forward & reverse, all slabs", flags: ["🇮🇳"], icon: FileText },
      { slug: "uk-vat", name: "UK VAT", desc: "Standard 20% + reduced rates", flags: ["🇬🇧"], pro: true, icon: FileText },
      { slug: "uae-vat", name: "UAE VAT", desc: "5% standard rate", flags: ["🇦🇪"], pro: true, icon: FileText },
      { slug: "gst-late-fee", name: "GST Late Fee", desc: "GSTR-1/3B/9 late fee + interest", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "itc-reconciliation", name: "ITC Reconciliation", desc: "GSTR-2B vs 3B vs reversed", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "gst-composition", name: "GST Composition Scheme", desc: "Composition vs regular GST", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "export-under-gst", name: "GST on Exports", desc: "Zero-rated + LUT + refund", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "invoice-gst", name: "GST Invoice Calculator", desc: "Intra/inter-state invoice", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "gst-annual-return", name: "GSTR-9 Annual Return", desc: "Outward tax + ITC reconciliation", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "advance-ruling", name: "GST Liability Estimator", desc: "Transaction-wise GST + RCM", flags: ["🇮🇳"], pro: true, icon: FileText },
      { slug: "customs-duty", name: "Import Customs Duty", desc: "BCD + SWS + IGST landed cost", flags: ["🇮🇳"], pro: true, icon: FileText },
    ],
  },
};

const filters = ["All", "India", "UK", "USA", "UAE"];
const flagMap: Record<string, string> = { India: "🇮🇳", UK: "🇬🇧", USA: "🇺🇸", UAE: "🇦🇪" };

export default function Calculators() {
  const { category = "tax" } = useParams();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const meta = categoryMeta[category] ?? { title: "Calculators", subtitle: "Coming soon", calcs: [] };

  const filtered = meta.calcs.filter((c) => {
    if (filter !== "All" && !c.flags.includes(flagMap[filter])) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-xs text-secondary">
        <Link to="/dashboard" className="hover:text-white">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white">{meta.title}</span>
      </nav>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
        <p className="mt-1 text-secondary text-sm">{meta.subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-pill text-xs font-medium border transition-all",
                filter === f
                  ? "bg-gradient-orange text-white border-transparent glow-orange"
                  : "bg-card border-white/10 text-secondary hover:border-primary/40 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="md:ml-auto relative w-full md:w-64">
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
