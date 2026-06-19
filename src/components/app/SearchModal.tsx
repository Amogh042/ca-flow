import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Receipt, Landmark, TrendingDown, BarChart3, Briefcase, ShieldCheck, DollarSign, Building2, LineChart, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type CalcEntry = {
  slug: string;
  name: string;
  desc: string;
  category: string;
  categoryLabel: string;
  icon: React.ElementType;
  pro?: boolean;
};

const ALL_CALCS: CalcEntry[] = [
  // Tax
  { slug: "income-tax", name: "Income Tax Slab", desc: "Old vs New regime, all FYs", category: "tax", categoryLabel: "Tax", icon: Receipt },
  { slug: "tds", name: "TDS Calculator", desc: "Section-wise rates, surcharge", category: "tax", categoryLabel: "Tax", icon: Receipt },
  { slug: "advance-tax", name: "Advance Tax", desc: "Quarter-wise obligation", category: "tax", categoryLabel: "Tax", icon: Receipt },
  { slug: "hra", name: "HRA Exemption", desc: "Metro vs non-metro calculation", category: "tax", categoryLabel: "Tax", icon: Receipt },
  { slug: "stcg", name: "Capital Gains STCG", desc: "Short term with exemptions", category: "tax", categoryLabel: "Tax", icon: TrendingDown },
  { slug: "ltcg", name: "Capital Gains LTCG", desc: "Indexation + 10% flat", category: "tax", categoryLabel: "Tax", icon: TrendingDown },
  { slug: "80c-planner", name: "80C/80D Planner", desc: "Deduction optimizer", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "uk-income-tax", name: "UK Income Tax", desc: "PAYE, NI, personal allowance", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "us-federal-tax", name: "US Federal Tax", desc: "1040, brackets, FICA", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "sg-income-tax", name: "Singapore Income Tax", desc: "Resident slab + CPF", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "capital-gains-property", name: "Capital Gains Property", desc: "With indexation benefit", category: "tax", categoryLabel: "Tax", icon: Building2, pro: true },
  { slug: "dividend-tax", name: "Dividend Tax", desc: "Domestic + foreign", category: "tax", categoryLabel: "Tax", icon: DollarSign, pro: true },
  { slug: "leave-encashment", name: "Leave Encashment Tax", desc: "Exemption under 10(10AA)", category: "tax", categoryLabel: "Tax", icon: Briefcase, pro: true },
  { slug: "huf-tax", name: "HUF Tax Calculator", desc: "HUF vs individual comparison", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "form-16", name: "Form 16 Computation", desc: "Part B salary tax computation", category: "tax", categoryLabel: "Tax", icon: FileText, pro: true },
  { slug: "tds-salary", name: "TDS on Salary (192)", desc: "Monthly TDS projection", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "income-tax-notice", name: "IT Notice Interest", desc: "Section 234 interest calc", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "tax-planning", name: "Tax Planning Optimizer", desc: "Regime comparison + actions", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "tds-26as", name: "TDS 26AS Reconciliation", desc: "Match TDS with tax liability", category: "tax", categoryLabel: "Tax", icon: FileText, pro: true },
  { slug: "crypto-tax", name: "Crypto & VDA Tax", desc: "30% gain + 1% TDS", category: "tax", categoryLabel: "Tax", icon: DollarSign, pro: true },
  { slug: "marginal-relief", name: "Marginal Relief", desc: "Surcharge threshold relief", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "presumptive-tax", name: "Presumptive Tax (44AD)", desc: "44AD / 44ADA / 44AE", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "employees-stock", name: "ESOP Tax Calculator", desc: "Perquisite + capital gains", category: "tax", categoryLabel: "Tax", icon: DollarSign, pro: true },
  { slug: "foreign-income", name: "Foreign Income & DTAA", desc: "Tax credit computation", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "tds-property", name: "TDS on Property (194IA)", desc: "Property purchase TDS", category: "tax", categoryLabel: "Tax", icon: Building2, pro: true },
  { slug: "nri-tax", name: "NRI Income Tax", desc: "Indian-source income for NRI", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "itr-form-selector", name: "ITR Form Selector", desc: "Filing guide + checklist", category: "tax", categoryLabel: "Tax", icon: FileText, pro: true },
  { slug: "rebate-87a", name: "Section 87A Rebate", desc: "Rebate + marginal relief", category: "tax", categoryLabel: "Tax", icon: Receipt, pro: true },
  { slug: "interest-income", name: "Interest Income Tax", desc: "Source-wise with exemptions", category: "tax", categoryLabel: "Tax", icon: DollarSign, pro: true },
  { slug: "ltcg-mutual-fund", name: "Mutual Fund Capital Gains", desc: "LTCG/STCG post-budget 2024", category: "tax", categoryLabel: "Tax", icon: LineChart, pro: true },
  // Loans
  { slug: "emi", name: "EMI Calculator", desc: "Monthly instalment + amortisation", category: "loans", categoryLabel: "Loans & EMI", icon: Landmark },
  { slug: "home-loan", name: "Home Loan EMI", desc: "With prepayment scenarios", category: "loans", categoryLabel: "Loans & EMI", icon: Building2 },
  { slug: "car-loan", name: "Car Loan EMI", desc: "Tenure comparison + total cost", category: "loans", categoryLabel: "Loans & EMI", icon: Landmark },
  { slug: "personal-loan", name: "Personal Loan", desc: "Effective APR + amortisation", category: "loans", categoryLabel: "Loans & EMI", icon: Landmark },
  { slug: "loan-eligibility", name: "Loan Eligibility", desc: "Based on income & FOIR", category: "loans", categoryLabel: "Loans & EMI", icon: Landmark, pro: true },
  { slug: "balance-transfer", name: "Balance Transfer", desc: "Refinancing savings calculator", category: "loans", categoryLabel: "Loans & EMI", icon: Landmark, pro: true },
  { slug: "prepayment", name: "Prepayment Savings", desc: "Reduced tenure vs reduced EMI", category: "loans", categoryLabel: "Loans & EMI", icon: Landmark, pro: true },
  { slug: "emi-moratorium", name: "EMI Moratorium Impact", desc: "Interest-only vs full deferment", category: "loans", categoryLabel: "Loans & EMI", icon: Landmark, pro: true },
  { slug: "home-loan-tax", name: "Home Loan Tax Benefit", desc: "Section 24 / 80C / 80EEA", category: "loans", categoryLabel: "Loans & EMI", icon: Building2, pro: true },
  // Depreciation
  { slug: "wdv", name: "WDV Method", desc: "Written down value depreciation", category: "depreciation", categoryLabel: "Depreciation", icon: TrendingDown },
  { slug: "slm", name: "Straight Line Depreciation", desc: "Equal annual depreciation", category: "depreciation", categoryLabel: "Depreciation", icon: TrendingDown },
  { slug: "depreciation-it", name: "IT Act Depreciation", desc: "Block-rate with half-year rule", category: "depreciation", categoryLabel: "Depreciation", icon: TrendingDown, pro: true },
  { slug: "depreciation-syd", name: "Sum of Years Digits", desc: "Accelerated depreciation", category: "depreciation", categoryLabel: "Depreciation", icon: TrendingDown, pro: true },
  { slug: "depreciation-comparison", name: "Depreciation Comparison", desc: "SLM vs WDV vs SYD vs DDB", category: "depreciation", categoryLabel: "Depreciation", icon: TrendingDown, pro: true },
  // Ratios
  { slug: "current-ratio", name: "Financial Ratios Dashboard", desc: "20+ ratios from P&L + Balance Sheet", category: "ratios", categoryLabel: "Ratios", icon: BarChart3 },
  { slug: "debt-equity", name: "Debt to Equity & Leverage", desc: "6 solvency ratios with health flags", category: "ratios", categoryLabel: "Ratios", icon: BarChart3 },
  { slug: "roe", name: "ROE — DuPont Analysis", desc: "Margin, efficiency & leverage", category: "ratios", categoryLabel: "Ratios", icon: BarChart3 },
  { slug: "break-even", name: "Break-even Calculator", desc: "Contribution margin & scenarios", category: "ratios", categoryLabel: "Ratios", icon: BarChart3 },
  { slug: "net-worth", name: "Personal Net Worth", desc: "Assets vs liabilities tracker", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  { slug: "working-capital", name: "Working Capital Analysis", desc: "Liquidity ratios & CCC", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  { slug: "profitability-ratios", name: "Profitability Ratios", desc: "Margins, ROA, ROE, ROCE", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  { slug: "cash-flow", name: "Cash Flow Statement", desc: "Operating, investing, financing", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  { slug: "budget-variance", name: "Budget vs Actual", desc: "Variance analysis with flags", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  { slug: "partnership-profit", name: "Partnership Profit Sharing", desc: "Salary, interest & ratio split", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  { slug: "receivables-aging", name: "Receivables Aging", desc: "Debtor buckets & provisioning", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  { slug: "balance-sheet-analysis", name: "Balance Sheet Analyser", desc: "Financial strength score", category: "ratios", categoryLabel: "Ratios", icon: BarChart3, pro: true },
  // Payroll
  { slug: "salary", name: "Salary Breakup", desc: "CTC to take-home breakdown", category: "payroll", categoryLabel: "Payroll", icon: Briefcase },
  { slug: "gratuity", name: "Gratuity", desc: "As per Payment of Gratuity Act", category: "payroll", categoryLabel: "Payroll", icon: Briefcase },
  { slug: "pf", name: "PF Calculator", desc: "Employee + employer share", category: "payroll", categoryLabel: "Payroll", icon: Briefcase },
  { slug: "esi", name: "ESI Calculator", desc: "Employee State Insurance", category: "payroll", categoryLabel: "Payroll", icon: Briefcase },
  { slug: "gratuity-eligibility", name: "Gratuity Eligibility", desc: "Detailed computation & 4-year rule", category: "payroll", categoryLabel: "Payroll", icon: Briefcase, pro: true },
  { slug: "salary-hike", name: "Salary Hike & CTC Revision", desc: "Current vs revised comparison", category: "payroll", categoryLabel: "Payroll", icon: Briefcase, pro: true },
  { slug: "salary-restructure", name: "Salary Restructuring", desc: "Tax optimization via components", category: "payroll", categoryLabel: "Payroll", icon: Briefcase, pro: true },
  { slug: "retrenchment-compensation", name: "Retrenchment Compensation", desc: "VRS / closure computation", category: "payroll", categoryLabel: "Payroll", icon: Briefcase, pro: true },
  { slug: "pf-withdrawal", name: "PF Withdrawal Tax", desc: "TDS on EPF withdrawal", category: "payroll", categoryLabel: "Payroll", icon: Briefcase, pro: true },
  { slug: "professional-tax", name: "Professional Tax", desc: "State-wise PT slabs", category: "payroll", categoryLabel: "Payroll", icon: Briefcase, pro: true },
  // Audit
  { slug: "materiality", name: "Materiality", desc: "Planning materiality + tolerable misstatement", category: "audit", categoryLabel: "Audit", icon: ShieldCheck, pro: true },
  { slug: "sample-size", name: "Sample Size", desc: "Statistical sampling", category: "audit", categoryLabel: "Audit", icon: ShieldCheck, pro: true },
  { slug: "audit-checklist", name: "Audit Checklist Score", desc: "20-point readiness assessment", category: "audit", categoryLabel: "Audit", icon: ShieldCheck, pro: true },
  // Valuation
  { slug: "dcf", name: "DCF Valuation", desc: "Discounted cash flow valuation", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  { slug: "wacc", name: "WACC Calculator", desc: "Weighted average cost of capital", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  { slug: "npv", name: "NPV Calculator", desc: "Discounted cash flow analysis", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  { slug: "irr", name: "IRR Calculator", desc: "IRR and MIRR with NPV profile", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  { slug: "payback", name: "Payback Period", desc: "Simple and discounted payback", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  { slug: "bond-valuation", name: "Bond Valuation", desc: "Present value pricing & yield", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  { slug: "equity-valuation", name: "Equity Valuation", desc: "DDM & P/E multi-method", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  { slug: "startup-valuation", name: "Startup Valuation", desc: "Revenue, Berkus & VC method", category: "valuation", categoryLabel: "Valuation", icon: DollarSign, pro: true },
  // Real Estate
  { slug: "rental-yield", name: "Rental Yield", desc: "Gross & net yield", category: "realestate", categoryLabel: "Real Estate", icon: Building2 },
  { slug: "stamp-duty", name: "Stamp Duty", desc: "State-wise rates", category: "realestate", categoryLabel: "Real Estate", icon: Building2 },
  { slug: "rent-vs-buy", name: "Rent vs Buy Analysis", desc: "Ownership economics comparison", category: "realestate", categoryLabel: "Real Estate", icon: Building2, pro: true },
  { slug: "capital-gains-property", name: "Property Capital Gains", desc: "LTCG/STCG with indexation", category: "realestate", categoryLabel: "Real Estate", icon: Building2, pro: true },
  // Investment
  { slug: "sip", name: "SIP Calculator", desc: "Future value of monthly investment", category: "investment", categoryLabel: "Investment", icon: LineChart },
  { slug: "lumpsum", name: "Lumpsum Investment", desc: "One-time investment growth", category: "investment", categoryLabel: "Investment", icon: LineChart },
  { slug: "ppf", name: "PPF Calculator", desc: "15-year tax-free returns", category: "investment", categoryLabel: "Investment", icon: LineChart },
  { slug: "compound-interest", name: "Compound Interest", desc: "Growth with frequency options", category: "investment", categoryLabel: "Investment", icon: LineChart },
  { slug: "mis-calculator", name: "Post Office MIS", desc: "Monthly income scheme", category: "investment", categoryLabel: "Investment", icon: LineChart, pro: true },
  { slug: "sukanya-samriddhi", name: "Sukanya Samriddhi", desc: "21-year girl child scheme", category: "investment", categoryLabel: "Investment", icon: LineChart, pro: true },
  { slug: "nps-calculator", name: "NPS Calculator", desc: "Retirement corpus & pension", category: "investment", categoryLabel: "Investment", icon: LineChart, pro: true },
  { slug: "senior-citizen-fd", name: "Senior Citizen FD", desc: "FD comparison with TDS", category: "investment", categoryLabel: "Investment", icon: LineChart, pro: true },
  { slug: "gold-returns", name: "Gold Returns", desc: "Physical vs SGB vs ETF", category: "investment", categoryLabel: "Investment", icon: LineChart, pro: true },
  // GST
  { slug: "gst", name: "GST Calculator", desc: "Forward & reverse, all slabs", category: "gst", categoryLabel: "GST / VAT", icon: FileText },
  { slug: "uk-vat", name: "UK VAT", desc: "Standard 20% + reduced rates", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "uae-vat", name: "UAE VAT", desc: "5% standard rate", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "gst-late-fee", name: "GST Late Fee", desc: "GSTR-1/3B/9 late fee + interest", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "itc-reconciliation", name: "ITC Reconciliation", desc: "GSTR-2B vs 3B vs reversed", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "gst-composition", name: "GST Composition Scheme", desc: "Composition vs regular GST", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "export-under-gst", name: "GST on Exports", desc: "Zero-rated + LUT + refund", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "invoice-gst", name: "GST Invoice Calculator", desc: "Intra/inter-state invoice", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "gst-annual-return", name: "GSTR-9 Annual Return", desc: "Outward tax + ITC reconciliation", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "advance-ruling", name: "GST Liability Estimator", desc: "Transaction-wise GST + RCM", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
  { slug: "customs-duty", name: "Import Customs Duty", desc: "BCD + SWS + IGST landed cost", category: "gst", categoryLabel: "GST / VAT", icon: FileText, pro: true },
];

const categoryColors: Record<string, string> = {
  tax: "text-orange-400 bg-orange-400/10",
  loans: "text-blue-400 bg-blue-400/10",
  depreciation: "text-purple-400 bg-purple-400/10",
  ratios: "text-green-400 bg-green-400/10",
  payroll: "text-yellow-400 bg-yellow-400/10",
  audit: "text-red-400 bg-red-400/10",
  valuation: "text-cyan-400 bg-cyan-400/10",
  realestate: "text-pink-400 bg-pink-400/10",
  investment: "text-emerald-400 bg-emerald-400/10",
  gst: "text-indigo-400 bg-indigo-400/10",
};

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  const words = q.split(" ").filter(Boolean);
  return words.every((w) => t.includes(w));
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = query.trim()
    ? ALL_CALCS.filter(
        (c) =>
          fuzzyMatch(c.name, query) ||
          fuzzyMatch(c.desc, query) ||
          fuzzyMatch(c.categoryLabel, query)
      ).slice(0, 8)
    : ALL_CALCS.slice(0, 8);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const go = useCallback(
    (calc: CalcEntry) => {
      navigate(`/calculator/${calc.slug}`);
      onClose();
    },
    [navigate, onClose]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[selected]) go(results[selected]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, results, selected, go, onClose]);

  useEffect(() => {
    const item = listRef.current?.children[selected] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(18,18,18,0.98)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.07]">
          <Search className="h-5 w-5 shrink-0 text-white/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 100+ calculators..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-white/30 text-white/90"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center px-2 py-1 rounded-md text-[10px] font-medium border border-white/10 text-white/30">ESC</kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/30">No calculators found for "{query}"</div>
          ) : (
            results.map((calc, i) => {
              const Icon = calc.icon;
              const colorParts = (categoryColors[calc.category] ?? "text-orange-400 bg-orange-400/10").split(" ");
              return (
                <button
                  key={calc.slug + i}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => go(calc)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    selected === i ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  )}
                >
                  <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0", colorParts[1])}>
                    <Icon className={cn("h-4 w-4", colorParts[0])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate text-white/90">{calc.name}</span>
                      {calc.pro && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-400/20 shrink-0">PRO</span>
                      )}
                    </div>
                    <div className="text-xs truncate mt-0.5 text-white/40">{calc.desc}</div>
                  </div>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 hidden sm:block", categoryColors[calc.category] ?? "text-orange-400 bg-orange-400/10")}>
                    {calc.categoryLabel}
                  </span>
                  {selected === i && (
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/30 shrink-0">↵</kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.07] flex items-center gap-4 text-[10px] text-white/25">
          <span><kbd className="px-1 rounded border border-white/10">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 rounded border border-white/10">↵</kbd> open</span>
          <span><kbd className="px-1 rounded border border-white/10">esc</kbd> close</span>
          <span className="ml-auto">{ALL_CALCS.length} calculators indexed</span>
        </div>
      </div>
    </div>
  );
}
