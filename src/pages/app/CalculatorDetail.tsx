import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Calculator, Check, ChevronRight, Lock, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useCreateCalculation } from "@/hooks/useCalculations";
import { useCreateActivity } from "@/hooks/useActivities";
import { usePlan } from "@/hooks/usePlan";

const FY = ["FY 2026-27", "FY 2025-26", "FY 2024-25", "FY 2023-24"];
const AGE = ["Below 60", "60-80", "Above 80"];

type CalcDataRef = MutableRefObject<{ inputs: Record<string, any>; outputs: Record<string, any> }>;
type CalculatorComponent = (props: { dataRef?: CalcDataRef }) => JSX.Element;

const CALC_REGISTRY: Record<string, CalculatorComponent> = {
  "income-tax": IncomeTaxCalc,
  emi: EMICalc,
  gst: GSTCalc,
  salary: SalaryCalc,
  sip: SIPCalc,
  gratuity: GratuityCalc,
  pf: PFCalc,
  hra: HRACalc,
  stcg: STCGCalc,
  wdv: WDVCalc,
  ltcg: LTCGCalc,
  "advance-tax": AdvanceTaxCalc,
  "current-ratio": FinancialRatiosCalc,
  "break-even": BreakEvenCalc,
  "compound-interest": CompoundInterestCalc,
  "loan-eligibility": LoanEligibilityCalc,
  "home-loan": HomeLoanCalc,
  "rental-yield": RentalYieldCalc,
  npv: NPVCalc,
  tds: TDSCalc,
  ppf: PPFCalc,
  slm: SLMCalc,
  materiality: MaterialityCalc,
  "stamp-duty": StampDutyCalc,
  wacc: WACCCalc,
  dcf: DCFCalc,
  "sample-size": SampleSizeCalc,
  "80c-planner": Section80CCalc,
  "balance-transfer": BalanceTransferCalc,
  "dividend-tax": DividendTaxCalc,
  roe: ROEDetailCalc,
  irr: IRRCalc,
  payback: PaybackCalc,
  lumpsum: LumpsumCalc,
  esi: ESICalc,
  "car-loan": CarLoanCalc,
  "personal-loan": PersonalLoanCalc,
  prepayment: PrepaymentCalc,
  "gst-late-fee": GSTLateFeeCalc,
  "itc-reconciliation": ITCReconciliationCalc,
  "debt-equity": DebtEquityCalc,
  "leave-encashment": LeaveEncashmentCalc,
  "capital-gains-property": CapitalGainsPropertyCalc,
  "depreciation-it": ITDepreciationCalc,
  "net-worth": NetWorthCalc,
  "working-capital": WorkingCapitalCalc,
  "bond-valuation": BondValuationCalc,
  "depreciation-syd": SYDCalc,
  "profitability-ratios": ProfitabilityRatiosCalc,
  "rent-vs-buy": RentVsBuyCalc,
  "huf-tax": HUFTaxCalc,
  "form-16": Form16Calc,
  "tds-salary": TDSSalaryCalc,
  "gst-composition": GSTCompositionCalc,
  "export-under-gst": ExportGSTCalc,
  "mis-calculator": MISCalc,
  "sukanya-samriddhi": SSYCalc,
  "nps-calculator": NPSCalc,
  "senior-citizen-fd": SCFDCalc,
  "gratuity-eligibility": GratuityEligibilityCalc,
  "cash-flow": CashFlowCalc,
  "budget-variance": BudgetVarianceCalc,
  "invoice-gst": InvoiceGSTCalc,
  "partnership-profit": PartnershipProfitCalc,
  "depreciation-comparison": DepreciationComparisonCalc,
  "equity-valuation": EquityValuationCalc,
  "emi-moratorium": EMIMoratoriumCalc,
  "income-tax-notice": IncomeTaxNoticeCalc,
  "startup-valuation": StartupValuationCalc,
  "tax-planning": TaxPlanningCalc,
  "receivables-aging": ReceivablesAgingCalc,
  "tds-26as": TDS26ASCalc,
  "salary-hike": SalaryHikeCalc,
  "gst-annual-return": GSTAnnualReturnCalc,
  "crypto-tax": CryptoTaxCalc,
  "marginal-relief": MarginalReliefCalc,
  "presumptive-tax": PresumptiveTaxCalc,
  "employees-stock": ESOPCalc,
  "foreign-income": ForeignIncomeCalc,
  "audit-checklist": AuditChecklistCalc,
  "gold-returns": GoldReturnsCalc,
  "retrenchment-compensation": RetrenchmentCalc,
  "tds-property": TDSPropertyCalc,
  "advance-ruling": AdvanceRulingCalc,
  "customs-duty": CustomsDutyCalc,
  "pf-withdrawal": PFWithdrawalCalc,
  "nri-tax": NRITaxCalc,
  "home-loan-tax": HomeLoanTaxCalc,
  "itr-form-selector": ITRFormSelectorCalc,
  "balance-sheet-analysis": BalanceSheetAnalysisCalc,
  "rebate-87a": Rebate87ACalc,
  "salary-restructure": SalaryRestructureCalc,
  "interest-income": InterestIncomeCalc,
  "ltcg-mutual-fund": LTCGMutualFundCalc,
  "professional-tax": ProfessionalTaxCalc,
};

const titleMap: Record<string, string> = {
  "income-tax": "Income Tax Calculator",
  emi: "EMI Calculator",
  gst: "GST Calculator",
  salary: "Salary Breakup Calculator",
  sip: "SIP Calculator",
  gratuity: "Gratuity Calculator",
  pf: "PF Calculator",
  hra: "HRA Exemption Calculator",
  stcg: "STCG Calculator",
  wdv: "WDV Depreciation Calculator",
  ltcg: "LTCG Calculator",
  "advance-tax": "Advance Tax Calculator",
  "current-ratio": "Financial Ratios Dashboard",
  "break-even": "Break-even Calculator",
  "compound-interest": "Compound Interest Calculator",
  "loan-eligibility": "Loan Eligibility Calculator",
  "home-loan": "Home Loan Calculator",
  "rental-yield": "Rental Yield Calculator",
  npv: "NPV Calculator",
  tds: "TDS Calculator",
  ppf: "PPF Calculator",
  slm: "Straight Line Depreciation",
  materiality: "Audit Materiality Calculator",
  "stamp-duty": "Stamp Duty Calculator",
  wacc: "WACC Calculator",
  dcf: "DCF Valuation",
  "sample-size": "Audit Sample Size Calculator",
  "80c-planner": "Section 80C / 80D Deduction Planner",
  "balance-transfer": "Loan Balance Transfer Calculator",
  "dividend-tax": "Dividend Tax Calculator",
  roe: "Return on Equity (ROE) — DuPont Analysis",
  irr: "IRR Calculator",
  payback: "Payback Period Calculator",
  lumpsum: "Lumpsum Investment Calculator",
  esi: "ESI (Employee State Insurance) Calculator",
  "car-loan": "Car Loan EMI Calculator",
  "personal-loan": "Personal Loan Calculator",
  prepayment: "Loan Prepayment Savings Calculator",
  "gst-late-fee": "GST Late Fee Calculator",
  "itc-reconciliation": "GST ITC Reconciliation",
  "debt-equity": "Debt to Equity & Leverage Ratios",
  "leave-encashment": "Leave Encashment Tax Calculator",
  "capital-gains-property": "Property Capital Gains Calculator",
  "depreciation-it": "Income Tax Act Depreciation",
  "net-worth": "Personal Net Worth Calculator",
  "working-capital": "Working Capital Analysis",
  "bond-valuation": "Bond Valuation Calculator",
  "depreciation-syd": "Sum of Years Digits Depreciation",
  "profitability-ratios": "Profitability Ratios Dashboard",
  "rent-vs-buy": "Rent vs Buy Analysis",
  "huf-tax": "HUF Tax Calculator",
  "form-16": "Form 16 / Salary Tax Computation",
  "tds-salary": "TDS on Salary Calculator (Section 192)",
  "gst-composition": "GST Composition Scheme Calculator",
  "export-under-gst": "GST on Exports Calculator",
  "mis-calculator": "Post Office MIS Calculator",
  "sukanya-samriddhi": "Sukanya Samriddhi Yojana Calculator",
  "nps-calculator": "NPS (National Pension System) Calculator",
  "senior-citizen-fd": "Senior Citizen FD & Savings Calculator",
  "gratuity-eligibility": "Gratuity Eligibility & Computation (Detailed)",
  "cash-flow": "Cash Flow Statement Analyser",
  "budget-variance": "Budget vs Actual Variance Analysis",
  "invoice-gst": "GST Invoice Calculator",
  "partnership-profit": "Partnership Profit Sharing Calculator",
  "depreciation-comparison": "Depreciation Methods Comparison",
  "equity-valuation": "Equity Valuation — DDM & P/E",
  "emi-moratorium": "EMI Moratorium Impact Calculator",
  "income-tax-notice": "Income Tax Notice Interest Calculator",
  "startup-valuation": "Startup Valuation Calculator",
  "tax-planning": "Tax Planning & Saving Optimizer",
  "receivables-aging": "Accounts Receivable Aging Analysis",
  "tds-26as": "TDS 26AS Reconciliation",
  "salary-hike": "Salary Hike & CTC Revision Calculator",
  "gst-annual-return": "GSTR-9 Annual Return Summary",
  "crypto-tax": "Crypto & VDA Tax Calculator (India)",
  "marginal-relief": "Marginal Relief & Surcharge Calculator",
  "presumptive-tax": "Presumptive Tax Calculator (44AD/44ADA/44AE)",
  "employees-stock": "ESOP Tax Calculator",
  "foreign-income": "Foreign Income & DTAA Calculator",
  "audit-checklist": "Statutory Audit Checklist Score",
  "gold-returns": "Gold Investment Returns Calculator",
  "retrenchment-compensation": "Retrenchment Compensation Calculator",
  "tds-property": "TDS on Property Purchase (Section 194IA)",
  "advance-ruling": "GST Liability Quick Estimator",
  "customs-duty": "Import Customs Duty Calculator",
  "pf-withdrawal": "PF Withdrawal Tax Calculator",
  "nri-tax": "NRI Income Tax Calculator",
  "home-loan-tax": "Home Loan Tax Benefit Calculator",
  "itr-form-selector": "ITR Form Selector & Filing Guide",
  "balance-sheet-analysis": "Balance Sheet Strength Analyser",
  "rebate-87a": "Section 87A Rebate Calculator",
  "salary-restructure": "Salary Restructuring Optimizer",
  "interest-income": "Interest Income Tax Calculator",
  "ltcg-mutual-fund": "Mutual Fund Capital Gains Calculator",
  "professional-tax": "Professional Tax Calculator (State-wise)",
};

const categoryMap: Record<string, string> = {
  "income-tax": "tax",
  emi: "loans",
  gst: "gst",
  salary: "payroll",
  sip: "investment",
  gratuity: "payroll",
  pf: "payroll",
  hra: "tax",
  stcg: "tax",
  wdv: "depreciation",
  ltcg: "tax",
  "advance-tax": "tax",
  "current-ratio": "ratios",
  "break-even": "ratios",
  "compound-interest": "investment",
  "loan-eligibility": "loans",
  "home-loan": "loans",
  "rental-yield": "realestate",
  npv: "valuation",
  tds: "tax",
  ppf: "investment",
  slm: "depreciation",
  materiality: "audit",
  "stamp-duty": "realestate",
  wacc: "valuation",
  dcf: "valuation",
  "sample-size": "audit",
  "80c-planner": "tax",
  "balance-transfer": "loans",
  "dividend-tax": "tax",
  roe: "ratios",
  irr: "valuation",
  payback: "valuation",
  lumpsum: "investment",
  esi: "payroll",
  "car-loan": "loans",
  "personal-loan": "loans",
  prepayment: "loans",
  "gst-late-fee": "gst",
  "itc-reconciliation": "gst",
  "debt-equity": "ratios",
  "leave-encashment": "tax",
  "capital-gains-property": "tax",
  "depreciation-it": "depreciation",
  "net-worth": "ratios",
  "working-capital": "ratios",
  "bond-valuation": "valuation",
  "depreciation-syd": "depreciation",
  "profitability-ratios": "ratios",
  "rent-vs-buy": "realestate",
  "huf-tax": "tax",
  "form-16": "tax",
  "tds-salary": "tax",
  "gst-composition": "gst",
  "export-under-gst": "gst",
  "mis-calculator": "investment",
  "sukanya-samriddhi": "investment",
  "nps-calculator": "investment",
  "senior-citizen-fd": "investment",
  "gratuity-eligibility": "payroll",
  "cash-flow": "ratios",
  "budget-variance": "ratios",
  "invoice-gst": "gst",
  "partnership-profit": "ratios",
  "depreciation-comparison": "depreciation",
  "equity-valuation": "valuation",
  "emi-moratorium": "loans",
  "income-tax-notice": "tax",
  "startup-valuation": "valuation",
  "tax-planning": "tax",
  "receivables-aging": "ratios",
  "tds-26as": "tax",
  "salary-hike": "payroll",
  "gst-annual-return": "gst",
  "crypto-tax": "tax",
  "marginal-relief": "tax",
  "presumptive-tax": "tax",
  "employees-stock": "tax",
  "foreign-income": "tax",
  "audit-checklist": "audit",
  "gold-returns": "investment",
  "retrenchment-compensation": "payroll",
  "tds-property": "tax",
  "advance-ruling": "gst",
  "customs-duty": "gst",
  "pf-withdrawal": "payroll",
  "nri-tax": "tax",
  "home-loan-tax": "loans",
  "itr-form-selector": "tax",
  "balance-sheet-analysis": "ratios",
  "rebate-87a": "tax",
  "salary-restructure": "payroll",
  "interest-income": "tax",
  "ltcg-mutual-fund": "investment",
  "professional-tax": "payroll",
};

const WDV_DEFAULT_RATES: Record<string, number> = {
  Buildings: 10,
  "Plant & Machinery": 15,
  Computers: 40,
  Furniture: 10,
  Vehicles: 30,
};

const CII_TABLE: Record<number, number> = {
  2001: 100,
  2005: 117,
  2010: 167,
  2015: 254,
  2020: 301,
  2021: 317,
  2022: 331,
  2023: 348,
  2024: 363,
  2025: 364,
};

const TDS_CONFIG = {
  "Professional/Technical fees (194J)": {
    section: "194J",
    threshold: 30000,
    residentRate: 10,
    nriRate: 20,
  },
  "Rent - Plant & Machinery (194I)": {
    section: "194I",
    threshold: 240000,
    residentRate: 2,
    nriRate: 30,
  },
  "Rent - Land/Building (194I)": {
    section: "194I",
    threshold: 240000,
    residentRate: 10,
    nriRate: 30,
  },
  "Contractor payment (194C)": {
    section: "194C",
    threshold: 30000,
    residentRate: 1,
    residentCompanyRate: 2,
    nriRate: 20,
  },
  "Commission/Brokerage (194H)": {
    section: "194H",
    threshold: 15000,
    residentRate: 5,
    nriRate: 20,
  },
  "Interest from banks (194A)": {
    section: "194A",
    threshold: 40000,
    residentRate: 10,
    nriRate: 30,
  },
  "Salary (192)": {
    section: "192",
    threshold: 0,
    residentRate: 0,
    nriRate: 30,
  },
  "Director remuneration (194J)": {
    section: "194J",
    threshold: 30000,
    residentRate: 10,
    nriRate: 20,
  },
} as const;

const STAMP_DUTY_RATES = {
  Maharashtra: { residential: 5, commercial: 6 },
  Karnataka: { residential: 5.6, commercial: 5.6 },
  Delhi: { residentialWomen: 4, residentialMen: 6, commercial: 6 },
  "Tamil Nadu": { residential: 7, commercial: 7 },
  Gujarat: { residential: 4.9, commercial: 4.9 },
  Telangana: { residential: 5, commercial: 5 },
  Rajasthan: { residential: 5, commercial: 6 },
} as const;

type TdsPaymentType = keyof typeof TDS_CONFIG;

type Slab = { min: number; max: number | null; rate: number; label: string };
type SlabRow = { slab: string; income: number; rate: number; tax: number };

const NEW_REGIME_SLABS: Slab[] = [
  { min: 0, max: 400000, rate: 0, label: "Up to ₹4L" },
  { min: 400000, max: 800000, rate: 5, label: "₹4L - ₹8L" },
  { min: 800000, max: 1200000, rate: 10, label: "₹8L - ₹12L" },
  { min: 1200000, max: 1600000, rate: 15, label: "₹12L - ₹16L" },
  { min: 1600000, max: 2000000, rate: 20, label: "₹16L - ₹20L" },
  { min: 2000000, max: 2400000, rate: 25, label: "₹20L - ₹24L" },
  { min: 2400000, max: null, rate: 30, label: "Above ₹24L" },
];

const OLD_REGIME_SLABS: Slab[] = [
  { min: 0, max: 250000, rate: 0, label: "Up to ₹2.5L" },
  { min: 250000, max: 500000, rate: 5, label: "₹2.5L - ₹5L" },
  { min: 500000, max: 1000000, rate: 20, label: "₹5L - ₹10L" },
  { min: 1000000, max: null, rate: 30, label: "Above ₹10L" },
];

function toNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatINR(value: number): string {
  return `₹ ${Math.max(0, value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatCurrency(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, value));
}

function formatGBP(value: number): string {
  return formatCurrency(value, "en-GB", "GBP");
}

function formatUSD(value: number): string {
  return formatCurrency(value, "en-US", "USD");
}

function formatSGD(value: number): string {
  return formatCurrency(value, "en-SG", "SGD");
}

function formatAED(value: number): string {
  return formatCurrency(value, "en-AE", "AED");
}

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatNum(value: number, digits = 2): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getCIIForYear(year: number): number {
  return CII_TABLE[year] ?? 0;
}

function calculateSlabTax(taxableIncome: number, slabs: Slab[]): { slabBreakdown: SlabRow[]; baseTax: number } {
  let baseTax = 0;
  const slabBreakdown = slabs.map((slab) => {
    const upper = slab.max ?? Number.POSITIVE_INFINITY;
    const taxedIncome = Math.max(0, Math.min(taxableIncome, upper) - slab.min);
    const tax = (taxedIncome * slab.rate) / 100;
    baseTax += tax;
    return {
      slab: slab.label,
      income: taxedIncome,
      rate: slab.rate,
      tax,
    };
  });
  return { slabBreakdown, baseTax };
}

function calculateEMIFromPrincipal(principal: number, annualRate: number, tenureMonths: number): number {
  const p = Math.max(0, principal);
  const n = Math.max(0, tenureMonths);
  const r = annualRate / 12 / 100;
  if (!p || !n) return 0;
  if (r === 0) return p / n;
  return (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);
}

function calculateLoanFromEMI(emi: number, annualRate: number, tenureMonths: number): number {
  const monthlyEmi = Math.max(0, emi);
  const n = Math.max(0, tenureMonths);
  const r = annualRate / 12 / 100;
  if (!monthlyEmi || !n) return 0;
  if (r === 0) return monthlyEmi * n;
  return monthlyEmi * (((1 + r) ** n - 1) / (r * (1 + r) ** n));
}

function SaveToClient({ calcSlug, calcName, dataRef }: { calcSlug: string; calcName: string; dataRef?: CalcDataRef }) {
  const clients = useClients().data ?? [];
  const createCalc = useCreateCalculation();
  const createAct = useCreateActivity();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const dropdownRef = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const el = dropdownRef[0];
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, dropdownRef]);

  function handleSave(clientId: string) {
    const clientName = clients.find((c) => c.id === clientId)?.name ?? "Client";
    const calcData = dataRef?.current ?? { inputs: {}, outputs: {} };
    createCalc.mutate({
      clientId,
      title: calcName,
      subtitle: calcSlug,
      savedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      owner: "",
      inputs: calcData.inputs,
      outputs: calcData.outputs,
    }, {
      onSuccess() {
        createAct.mutate({
          id: `act-${Date.now()}`,
          clientId,
          title: `Calculation saved`,
          detail: `${calcName} saved to ${clientName}`,
          actor: "",
          time: new Date().toISOString(),
          kind: "calculation",
        });
        setSaved(true);
        setOpen(false);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  }

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative inline-block w-auto" ref={(el) => { dropdownRef[0] = el; }}>
      <button
        onClick={() => { setOpen(!open); setSaved(false); setSearch(""); }}
        disabled={createCalc.status === "pending"}
        className="h-9 px-4 rounded-lg bg-gradient-orange text-white text-[13px] font-medium glow-orange hover:glow-orange-strong transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto"
      >
        <Save className="h-3.5 w-3.5" />
        {createCalc.status === "pending" ? "Saving…" : "Save to Client"}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full sm:w-64 rounded-lg border border-white/10 bg-[var(--drawer-bg,#1a1a2e)] shadow-xl z-50 overflow-hidden">
          {clients.length === 0 ? (
            <div className="p-3 text-sm text-secondary">
              No clients yet. <Link to="/clients" className="text-primary hover:underline">Add one</Link>
            </div>
          ) : (
            <>
              <div className="p-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full h-8 px-2.5 rounded-md bg-white/5 border border-white/10 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-secondary">No clients match</div>
                ) : (
                  filtered.slice(0, 50).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSave(c.id)}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-white/5 transition-colors truncate"
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {saved && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
          <Check className="h-3.5 w-3.5" /> Saved successfully
        </div>
      )}
    </div>
  );
}

export default function CalculatorDetail() {
  const { slug = "income-tax" } = useParams();
  const navigate = useNavigate();
  const { data: planData } = usePlan();
  const isFree = planData?.plan === "free";
  const CalcComponent = CALC_REGISTRY[slug];
  const title = titleMap[slug] ?? slug.replace(/-/g, " ");
  const category = categoryMap[slug] ?? "tax";
  const calcDataRef = useRef<{ inputs: Record<string, any>; outputs: Record<string, any> }>({ inputs: {}, outputs: {} });

  if (isFree) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-xs text-secondary">
          <Link to="/dashboard" className="hover:text-[var(--text-primary)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/calculators" className="hover:text-[var(--text-primary)]">Calculators</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--text-primary)] capitalize">{title}</span>
        </nav>
        <div className="card-surface p-12 text-center max-w-lg mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Calculator Locked</h2>
          <p className="mt-2 text-sm text-secondary leading-relaxed">
            Upgrade to <span className="text-primary font-semibold">Pro</span> or <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Firm</span> to unlock all {Object.keys(CALC_REGISTRY).length}+ calculators.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => navigate("/settings")} className="px-5 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all">
              Upgrade Now
            </button>
            <button onClick={() => navigate("/calculators")} className="px-5 h-10 rounded-pill border border-white/10 text-sm font-medium text-secondary hover:text-[var(--text-primary)] transition-colors">
              Back to Calculators
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-xs text-secondary">
        <Link to="/dashboard" className="hover:text-[var(--text-primary)]">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/calculators/${category}`} className="hover:text-[var(--text-primary)]">Calculators</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--text-primary)] capitalize">{title}</span>
      </nav>

      {CalcComponent && <SaveToClient calcSlug={slug} calcName={title} dataRef={calcDataRef} />}

      {CalcComponent ? <CalcComponent dataRef={calcDataRef} /> : <ComingSoonCard slug={slug} />}
    </div>
  );
}

function getSlabsForFYAndRegime(fy: string, regime: "new" | "old", age: string): Slab[] {
  if (regime === "new") {
    if (fy === "FY 2024-25" || fy === "FY 2023-24") {
      return [
        { min: 0, max: 300000, rate: 0, label: "Up to ₹3L" },
        { min: 300000, max: 700000, rate: 5, label: "₹3L - ₹7L" },
        { min: 700000, max: 1000000, rate: 10, label: "₹7L - ₹10L" },
        { min: 1000000, max: 1200000, rate: 15, label: "₹10L - ₹12L" },
        { min: 1200000, max: 1500000, rate: 20, label: "₹12L - ₹15L" },
        { min: 1500000, max: null, rate: 30, label: "Above ₹15L" },
      ];
    }
    return NEW_REGIME_SLABS;
  }
  if (age === "60-80") {
    return [
      { min: 0, max: 300000, rate: 0, label: "Up to ₹3L" },
      { min: 300000, max: 500000, rate: 5, label: "₹3L - ₹5L" },
      { min: 500000, max: 1000000, rate: 20, label: "₹5L - ₹10L" },
      { min: 1000000, max: null, rate: 30, label: "Above ₹10L" },
    ];
  }
  if (age === "Above 80") {
    return [
      { min: 0, max: 500000, rate: 0, label: "Up to ₹5L" },
      { min: 500000, max: 1000000, rate: 20, label: "₹5L - ₹10L" },
      { min: 1000000, max: null, rate: 30, label: "Above ₹10L" },
    ];
  }
  return OLD_REGIME_SLABS;
}

function computeIncomeTax(income: number, fy: string, regime: "new" | "old", age: string) {
  const stdDeduction = regime === "new" ? 75000 : 50000;
  const taxableIncome = Math.max(0, income - stdDeduction);
  const slabs = getSlabsForFYAndRegime(fy, regime, age);
  const { slabBreakdown, baseTax } = calculateSlabTax(taxableIncome, slabs);

  let rebate87a = 0;
  let marginalRelief = 0;
  let taxAfterRebate = baseTax;

  if (regime === "new") {
    if (fy === "FY 2025-26" || fy === "FY 2026-27") {
      if (taxableIncome <= 1200000) {
        rebate87a = Math.min(baseTax, 60000);
        taxAfterRebate = baseTax - rebate87a;
      } else if (taxableIncome <= 1275000) {
        const normalTax = baseTax;
        const excessOverThreshold = taxableIncome - 1200000;
        taxAfterRebate = Math.min(normalTax, excessOverThreshold);
        marginalRelief = normalTax - taxAfterRebate;
      }
    } else {
      if (taxableIncome <= 700000) {
        rebate87a = Math.min(baseTax, 25000);
        taxAfterRebate = baseTax - rebate87a;
      }
    }
  } else {
    if (taxableIncome <= 500000) {
      rebate87a = Math.min(baseTax, 12500);
      taxAfterRebate = baseTax - rebate87a;
    }
  }

  let surchargeRate = 0;
  if (regime === "new") {
    if (taxableIncome > 20000000) surchargeRate = 25;
    else if (taxableIncome > 10000000) surchargeRate = 15;
    else if (taxableIncome > 5000000) surchargeRate = 10;
  } else {
    if (taxableIncome > 50000000) surchargeRate = 37;
    else if (taxableIncome > 20000000) surchargeRate = 25;
    else if (taxableIncome > 10000000) surchargeRate = 15;
    else if (taxableIncome > 5000000) surchargeRate = 10;
  }
  const surcharge = (taxAfterRebate * surchargeRate) / 100;
  const cess = (taxAfterRebate + surcharge) * 0.04;
  const totalTax = taxAfterRebate + surcharge + cess;

  return {
    taxableIncome,
    stdDeduction,
    slabBreakdown,
    baseTax,
    rebate87a,
    marginalRelief,
    taxAfterRebate,
    surchargeRate,
    surcharge,
    cess,
    totalTax,
    effectiveRate: income > 0 ? (totalTax / income) * 100 : 0,
    monthlyTax: totalTax / 12,
    monthlyTakeHome: (income - totalTax) / 12,
  };
}

function IncomeTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [annualIncome, setAnnualIncome] = useState("");
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [age, setAge] = useState(AGE[0]);
  const [fy, setFy] = useState(FY[0]);
  const [calculatedAt, setCalculatedAt] = useState<string>("Never");
  const [result, setResult] = useState(() => computeIncomeTax(0, FY[0], "new", AGE[0]));

  useEffect(() => {
    setResult(computeIncomeTax(toNum(annualIncome), fy, regime, age));
  }, [annualIncome, regime, age, fy]);

  const incomeValue = toNum(annualIncome);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Annual Income": annualIncome, "Financial Year": fy, "Tax Regime": regime, "Age Group": age },
        outputs: { "Taxable Income": result.taxableIncome, "Std. Deduction": result.stdDeduction, "Tax Before Rebate": result.baseTax, "Section 87A Rebate": result.rebate87a, "Tax After Rebate": result.taxAfterRebate, "Surcharge": result.surcharge, "Health & Education Cess": result.cess, "Total Tax Payable": result.totalTax, "Effective Rate": result.effectiveRate + "%", "Monthly Tax": result.monthlyTax, "Monthly Take-Home": result.monthlyTakeHome },
      };
    }
  }, [annualIncome, fy, regime, age, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Annual Income": annualIncome, "Financial Year": fy, "Tax Regime": regime, "Age Group": age }, outputs: { "Taxable Income": result.taxableIncome, "Std. Deduction": result.stdDeduction, "Tax Before Rebate": result.baseTax, "Section 87A Rebate": result.rebate87a, "Tax After Rebate": result.taxAfterRebate, "Surcharge": result.surcharge, "Health & Education Cess": result.cess, "Total Tax Payable": result.totalTax, "Effective Rate": result.effectiveRate + "%", "Monthly Tax": result.monthlyTax, "Monthly Take-Home": result.monthlyTakeHome } }; }, [annualIncome, fy, regime, age, result]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income Tax Calculator</h1>
          <p className="mt-1 text-secondary text-sm">Slab-wise tax with Section 87A rebate for selected FY</p>
        </div>
        <div className="text-xs text-tertiary">
          Last calculated: <span className="text-secondary">{calculatedAt}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="space-y-4">
          <div className="card-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

            <Field label="Annual Income (Gross Salary)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">₹</span>
                <input
                  inputMode="numeric"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="glass-input w-full h-11 pl-8 pr-3 text-base font-medium"
                />
              </div>
            </Field>

            <Field label="Financial Year">
              <select
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                className="glass-select w-full h-11 px-3 rounded-[10px] text-sm focus:outline-none focus:border-[rgba(249,115,22,0.5)]"
              >
                {FY.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>

            <Field label="Tax Regime">
              <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
                {(["new", "old"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setRegime(item)}
                    className={cn(
                      "py-2 text-sm font-medium rounded-md transition-all capitalize",
                      regime === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                    )}
                  >
                    {item} Regime
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Age Group">
              <div className="flex gap-2">
                {AGE.map((item) => (
                  <button
                    key={item}
                    onClick={() => setAge(item)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-pill text-xs font-medium border transition-all",
                      age === item
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-card-elevated border-white/10 text-secondary hover:border-primary/30"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>

            <button
              onClick={() => setCalculatedAt(new Date().toLocaleTimeString("en-IN"))}
              className="w-full h-12 rounded-lg bg-gradient-orange text-white font-semibold glow-orange hover:glow-orange-strong transition-all"
            >
              Calculate Tax
            </button>

            <button
              onClick={() => {
                setAnnualIncome("");
                setCalculatedAt("Never");
              }}
              className="w-full text-xs text-tertiary hover:text-[var(--text-primary)] flex items-center justify-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {!incomeValue ? (
            <div className="card-surface p-10 text-center">
              <p className="text-sm text-secondary">Enter values above to see results</p>
            </div>
          ) : (<>
          <div className="card-surface p-6">
            <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Total Tax Payable</div>
            <div className="mt-2 text-4xl md:text-5xl font-bold text-gradient-orange">{formatINR(result.totalTax)}</div>
            <div className="mt-2 text-sm text-secondary">Effective Rate: <span className="text-[var(--text-primary)] font-medium">{formatPct(result.effectiveRate)}</span></div>
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Tax Computation</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Item</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Income</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Rate</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {result.slabBreakdown.map((row, index) => (
                    <tr key={row.slab} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.slab}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.income)}</td>
                      <td className="px-3 py-2 text-right text-tertiary">{row.rate}%</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.tax)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-5 py-2 text-secondary font-medium">Tax before rebate</td>
                    <td colSpan={2}></td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(result.baseTax)}</td>
                  </tr>
                  {result.rebate87a > 0 && (
                    <tr className="bg-emerald-500/[0.04]">
                      <td className="px-5 py-2 text-emerald-400 font-medium">Section 87A Rebate</td>
                      <td colSpan={2}></td>
                      <td className="px-5 py-2 text-right font-medium text-emerald-400">- {formatINR(result.rebate87a)}</td>
                    </tr>
                  )}
                  {result.marginalRelief > 0 && (
                    <tr className="bg-emerald-500/[0.04]">
                      <td className="px-5 py-2 text-emerald-400 font-medium">Marginal Relief</td>
                      <td colSpan={2}></td>
                      <td className="px-5 py-2 text-right font-medium text-emerald-400">- {formatINR(result.marginalRelief)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-5 py-2 text-secondary font-medium">Tax after rebate</td>
                    <td colSpan={2}></td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(result.taxAfterRebate)}</td>
                  </tr>
                  {result.surcharge > 0 && (
                    <tr>
                      <td className="px-5 py-2 text-secondary">Surcharge ({result.surchargeRate}%)</td>
                      <td colSpan={2}></td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(result.surcharge)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-5 py-2 text-secondary">Health & Education Cess</td>
                    <td colSpan={2} className="px-3 py-2 text-right text-tertiary">4%</td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(result.cess)}</td>
                  </tr>
                  <tr className="border-t border-primary/20 bg-primary/5">
                    <td className="px-5 py-2.5 font-bold">Total Tax Payable</td>
                    <td colSpan={2}></td>
                    <td className="px-5 py-2.5 text-right font-bold text-primary">{formatINR(result.totalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Monthly Tax" value={formatINR(result.monthlyTax)} />
            <MiniStat label="Take-home/mo" value={formatINR(result.monthlyTakeHome)} green />
            <MiniStat label="Taxable Income" value={formatINR(result.taxableIncome)} />
            <MiniStat label="Std. Deduction" value={formatINR(result.stdDeduction)} />
          </div>
          </>)}
        </div>
      </div>
    </>
  );
}

type EMIResult = {
  monthlyEMI: number;
  totalAmount: number;
  totalInterest: number;
  amortization: Array<{
    month: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
};

function EMICalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [result, setResult] = useState<EMIResult>({
    monthlyEMI: 0,
    totalAmount: 0,
    totalInterest: 0,
    amortization: [],
  });

  useEffect(() => {
    const p = toNum(principal);
    const n = Math.max(0, Math.floor(toNum(tenureMonths)));
    const annual = toNum(annualRate);
    const r = annual / 12 / 100;

    if (!p || !n) {
      setResult({ monthlyEMI: 0, totalAmount: 0, totalInterest: 0, amortization: [] });
      return;
    }

    const emi = r === 0
      ? p / n
      : (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);

    const totalAmount = emi * n;
    const totalInterest = totalAmount - p;

    let balance = p;
    const amortization: EMIResult["amortization"] = [];

    for (let month = 1; month <= Math.min(12, n); month += 1) {
      const interest = r === 0 ? 0 : balance * r;
      const principalPart = Math.min(balance, emi - interest);
      balance = Math.max(0, balance - principalPart);
      amortization.push({
        month,
        principal: principalPart,
        interest,
        balance,
      });
    }

    setResult({ monthlyEMI: emi, totalAmount, totalInterest, amortization });
  }, [principal, annualRate, tenureMonths]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Principal Amount": principal, "Annual Interest Rate": annualRate + "%", "Tenure (Months)": tenureMonths },
        outputs: { "Monthly EMI": result.monthlyEMI, "Total Interest": result.totalInterest, "Total Payment": result.totalAmount },
      };
    }
  }, [principal, annualRate, tenureMonths, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Principal Amount": principal, "Annual Interest Rate": annualRate + "%", "Tenure (Months)": tenureMonths }, outputs: { "Monthly EMI": result.monthlyEMI, "Total Interest": result.totalInterest, "Total Payment": result.totalAmount } }; }, [principal, annualRate, tenureMonths, result]);

  return (
    <CalculatorShell
      title="EMI Calculator"
      subtitle="Monthly instalment, total payment, and first 12-month amortisation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Principal" value={principal} onChange={setPrincipal} />
          <NumberInput label="Annual Interest Rate (%)" value={annualRate} onChange={setAnnualRate} />
          <NumberInput label="Tenure (Months)" value={tenureMonths} onChange={setTenureMonths} />
        </div>
      )}
      outputPanel={!toNum(principal) ? (
        <div className="card-surface p-10 text-center"><p className="text-sm text-secondary">Enter values above to see results</p></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="Monthly EMI" value={formatINR(result.monthlyEMI)} />
            <MiniStat label="Total Amount" value={formatINR(result.totalAmount)} />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Amortisation (First 12 Months)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Month</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Principal</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Interest</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.amortization.map((row, index) => (
                    <tr key={row.month} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.month}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.principal)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.interest)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function EmptyResults() {
  return <div className="card-surface p-10 text-center"><p className="text-sm text-secondary">Enter values above to see results</p></div>;
}

function GSTCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [amount, setAmount] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [result, setResult] = useState({
    taxableAmount: 0,
    gstAmount: 0,
    cgst: 0,
    sgst: 0,
    total: 0,
  });

  useEffect(() => {
    const value = toNum(amount);
    const rate = toNum(gstRate);

    if (direction === "add") {
      const gstAmount = (value * rate) / 100;
      const total = value + gstAmount;
      setResult({
        taxableAmount: value,
        gstAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        total,
      });
      return;
    }

    const taxableAmount = rate === 0 ? value : (value * 100) / (100 + rate);
    const gstAmount = value - taxableAmount;
    setResult({
      taxableAmount,
      gstAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      total: value,
    });
  }, [amount, gstRate, direction]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Amount": amount, "GST Rate": gstRate + "%", "Calculation Type": direction === "add" ? "Forward (Add GST)" : "Reverse (Remove GST)" },
        outputs: { "Taxable Amount": result.taxableAmount, "GST Amount": result.gstAmount, "CGST": result.cgst, "SGST": result.sgst, "Total": result.total },
      };
    }
  }, [amount, gstRate, direction, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Amount": amount, "GST Rate": gstRate + "%", "Calculation Type": direction === "add" ? "Forward (Add GST)" : "Reverse (Remove GST)" }, outputs: { "Taxable Amount": result.taxableAmount, "GST Amount": result.gstAmount, "CGST": result.cgst, "SGST": result.sgst, "Total": result.total } }; }, [amount, gstRate, direction, result]);

  return (
    <CalculatorShell
      title="GST Calculator"
      subtitle="Add or remove GST with CGST/SGST split"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Amount" value={amount} onChange={setAmount} />

          <Field label="GST Rate">
            <select
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              className="glass-select w-full h-11 px-3 rounded-[10px] text-sm focus:outline-none focus:border-[rgba(249,115,22,0.5)]"
            >
              {[0, 0.25, 3, 5, 12, 18, 28].map((rate) => (
                <option key={rate} value={rate}>{rate}%</option>
              ))}
            </select>
          </Field>

          <Field label="Direction">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["add", "remove"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setDirection(item)}
                  className={cn(
                    "py-2 text-sm font-medium rounded-md transition-all capitalize",
                    direction === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item} GST
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={!toNum(amount) ? <EmptyResults /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MiniStat label="Taxable Amount" value={formatINR(result.taxableAmount)} />
          <MiniStat label="GST Amount" value={formatINR(result.gstAmount)} />
          <MiniStat label="CGST" value={formatINR(result.cgst)} />
          <MiniStat label="SGST" value={formatINR(result.sgst)} />
          <div className="sm:col-span-2 card-surface p-6">
            <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Total</div>
            <div className="mt-2 text-4xl font-bold text-gradient-orange">{formatINR(result.total)}</div>
          </div>
        </div>
      )}
    />
  );
}

function SalaryCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [ctc, setCtc] = useState("");
  const [result, setResult] = useState({
    basic: 0,
    hra: 0,
    employeePF: 0,
    employerPF: 0,
    pt: 0,
    specialAllowance: 0,
    grossSalary: 0,
    takeHome: 0,
  });

  useEffect(() => {
    const ctcVal = toNum(ctc);
    const basic = 0.4 * ctcVal;
    const hra = 0.5 * basic;
    const employerPF = 0.12 * basic;
    const employeePF = Math.min(0.12 * basic, 1800 * 12);
    const pt = 200 * 12;
    const specialAllowance = ctcVal - basic - hra - employerPF;
    const grossSalary = basic + hra + specialAllowance;
    const takeHome = grossSalary - employeePF - pt;

    setResult({
      basic,
      hra,
      employeePF,
      employerPF,
      pt,
      specialAllowance,
      grossSalary,
      takeHome,
    });
  }, [ctc]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Annual CTC": ctc },
        outputs: { "Basic Salary": result.basic, "HRA": result.hra, "Special Allowance": result.specialAllowance, "Employee PF": result.employeePF, "Employer PF": result.employerPF, "Professional Tax": result.pt, "Gross Salary": result.grossSalary, "Annual Take-Home": result.takeHome },
      };
    }
  }, [ctc, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Annual CTC": ctc }, outputs: { "Basic Salary": result.basic, "HRA": result.hra, "Special Allowance": result.specialAllowance, "Employee PF": result.employeePF, "Employer PF": result.employerPF, "Professional Tax": result.pt, "Gross Salary": result.grossSalary, "Annual Take-Home": result.takeHome } }; }, [ctc, result]);

  return (
    <CalculatorShell
      title="Salary Breakup Calculator"
      subtitle="CTC to annual and monthly take-home"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Annual CTC" value={ctc} onChange={setCtc} />
        </div>
      )}
      outputPanel={!toNum(ctc) ? <EmptyResults /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Basic" value={formatINR(result.basic)} />
            <MiniStat label="HRA" value={formatINR(result.hra)} />
            <MiniStat label="Employer PF" value={formatINR(result.employerPF)} />
            <MiniStat label="Employee PF" value={formatINR(result.employeePF)} />
            <MiniStat label="Professional Tax" value={formatINR(result.pt)} />
            <MiniStat label="Special Allowance" value={formatINR(result.specialAllowance)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card-surface p-6">
              <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Gross Salary</div>
              <div className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{formatINR(result.grossSalary)}</div>
            </div>
            <div className="card-surface p-6">
              <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Take Home (Annual)</div>
              <div className="mt-2 text-3xl font-bold text-gradient-orange">{formatINR(result.takeHome)}</div>
              <div className="mt-2 text-xs text-secondary">Monthly: {formatINR(result.takeHome / 12)}</div>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function SIPCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState({
    futureValue: 0,
    totalInvested: 0,
    wealthGained: 0,
    returnPercent: 0,
  });

  useEffect(() => {
    const monthly = toNum(monthlyAmount);
    const annual = toNum(annualRate);
    const y = toNum(years);
    const n = Math.max(0, Math.floor(y * 12));
    const r = annual / 12 / 100;

    if (!monthly || !n) {
      setResult({ futureValue: 0, totalInvested: 0, wealthGained: 0, returnPercent: 0 });
      return;
    }

    const futureValue = r === 0
      ? monthly * n
      : monthly * (((1 + r) ** n - 1) / r) * (1 + r);
    const totalInvested = monthly * n;
    const wealthGained = futureValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (wealthGained / totalInvested) * 100 : 0;

    setResult({ futureValue, totalInvested, wealthGained, returnPercent });
  }, [monthlyAmount, annualRate, years]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Monthly Investment": monthlyAmount, "Expected Return Rate": annualRate + "%", "Investment Period": years + " years" },
        outputs: { "Total Invested": result.totalInvested, "Wealth Gained": result.wealthGained, "Future Value": result.futureValue, "Return %": result.returnPercent + "%" },
      };
    }
  }, [monthlyAmount, annualRate, years, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Monthly Investment": monthlyAmount, "Expected Return Rate": annualRate + "%", "Investment Period": years + " years" }, outputs: { "Total Invested": result.totalInvested, "Wealth Gained": result.wealthGained, "Future Value": result.futureValue, "Return %": result.returnPercent + "%" } }; }, [monthlyAmount, annualRate, years, result]);

  return (
    <CalculatorShell
      title="SIP Calculator"
      subtitle="Future value of monthly investments"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Monthly Investment" value={monthlyAmount} onChange={setMonthlyAmount} />
          <NumberInput label="Expected Annual Return (%)" value={annualRate} onChange={setAnnualRate} />
          <NumberInput label="Investment Duration (Years)" value={years} onChange={setYears} />
        </div>
      )}
      outputPanel={!toNum(monthlyAmount) ? <EmptyResults /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 card-surface p-6">
            <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Future Value</div>
            <div className="mt-2 text-4xl font-bold text-gradient-orange">{formatINR(result.futureValue)}</div>
          </div>
          <MiniStat label="Total Invested" value={formatINR(result.totalInvested)} />
          <MiniStat label="Wealth Gained" value={formatINR(result.wealthGained)} green />
          <MiniStat label="Return %" value={formatPct(result.returnPercent)} />
        </div>
      )}
    />
  );
}

function GratuityCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [basicSalary, setBasicSalary] = useState("");
  const [yearsOfService, setYearsOfService] = useState("");
  const [result, setResult] = useState({
    eligible: false,
    gratuityAmount: 0,
    taxFreeLimit: 2000000,
    taxableGratuity: 0,
  });

  useEffect(() => {
    const basic = toNum(basicSalary);
    const years = toNum(yearsOfService);
    const eligible = years >= 5;
    const computedGratuity = (basic * 15 * years) / 26;
    const gratuityAmount = eligible ? computedGratuity : 0;
    const taxFreeLimit = 2500000;
    const taxableGratuity = Math.max(0, gratuityAmount - taxFreeLimit);

    setResult({ eligible, gratuityAmount, taxFreeLimit, taxableGratuity });
  }, [basicSalary, yearsOfService]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Last Drawn Basic + DA": basicSalary, "Years of Service": yearsOfService },
        outputs: { "Eligible": result.eligible ? "Yes" : "No", "Gratuity Amount": result.gratuityAmount, "Tax-Free Limit": result.taxFreeLimit, "Taxable Gratuity": result.taxableGratuity },
      };
    }
  }, [basicSalary, yearsOfService, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Last Drawn Basic + DA": basicSalary, "Years of Service": yearsOfService }, outputs: { "Eligible": result.eligible ? "Yes" : "No", "Gratuity Amount": result.gratuityAmount, "Tax-Free Limit": result.taxFreeLimit, "Taxable Gratuity": result.taxableGratuity } }; }, [basicSalary, yearsOfService, result]);

  return (
    <CalculatorShell
      title="Gratuity Calculator"
      subtitle="Estimate gratuity based on last drawn basic salary"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Basic Salary (Monthly)" value={basicSalary} onChange={setBasicSalary} />
          <NumberInput label="Years of Service" value={yearsOfService} onChange={setYearsOfService} />
        </div>
      )}
      outputPanel={!toNum(basicSalary) ? <EmptyResults /> : (
        <div className="space-y-4">
          {!result.eligible && (
            <div className="card-surface p-4 border border-white/10">
              <div className="text-sm font-medium text-secondary">Not eligible (minimum 5 years required)</div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Gratuity Amount" value={formatINR(result.gratuityAmount)} />
            <MiniStat label="Tax-free Limit" value={formatINR(result.taxFreeLimit)} />
            <MiniStat label="Taxable Gratuity" value={formatINR(result.taxableGratuity)} />
          </div>
        </div>
      )}
    />
  );
}

function PFCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [basicSalary, setBasicSalary] = useState("");
  const [result, setResult] = useState({
    employeeContribution: 0,
    employerEPF: 0,
    employerEPS: 0,
    adminCharges: 0,
    totalMonthly: 0,
    annualCorpus: 0,
  });

  useEffect(() => {
    const basic = toNum(basicSalary);
    const employeeContribution = basic * 0.12;
    const epsBasic = Math.min(basic, 15000);
    const employerEPS = epsBasic * 0.0833;
    const employerEPF = basic * 0.12 - employerEPS;
    const adminCharges = basic * 0.005;
    const totalMonthly = employeeContribution + employerEPF + employerEPS + adminCharges;

    const monthlyInvested = employeeContribution + employerEPF + employerEPS;
    const annualRate = 8.25;
    const years = 30;
    const n = years * 12;
    const r = annualRate / 12 / 100;
    const annualCorpus = r === 0
      ? monthlyInvested * n
      : monthlyInvested * (((1 + r) ** n - 1) / r) * (1 + r);

    setResult({
      employeeContribution,
      employerEPF,
      employerEPS,
      adminCharges,
      totalMonthly,
      annualCorpus,
    });
  }, [basicSalary]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Basic Salary (Monthly)": basicSalary },
        outputs: { "Employee Contribution (12%)": result.employeeContribution, "Employer EPF": result.employerEPF, "Employer EPS": result.employerEPS, "Admin Charges": result.adminCharges, "Total Monthly": result.totalMonthly, "Annual Corpus": result.annualCorpus },
      };
    }
  }, [basicSalary, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Basic Salary (Monthly)": basicSalary }, outputs: { "Employee Contribution (12%)": result.employeeContribution, "Employer EPF": result.employerEPF, "Employer EPS": result.employerEPS, "Admin Charges": result.adminCharges, "Total Monthly": result.totalMonthly, "Annual Corpus": result.annualCorpus } }; }, [basicSalary, result]);

  return (
    <CalculatorShell
      title="PF Calculator"
      subtitle="Employee and employer PF contribution breakdown"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Basic Salary (Monthly)" value={basicSalary} onChange={setBasicSalary} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Employee Contribution" value={formatINR(result.employeeContribution)} />
            <MiniStat label="Employer EPF (3.67%)" value={formatINR(result.employerEPF)} />
            <MiniStat label="Employer EPS (8.33%)" value={formatINR(result.employerEPS)} />
            <MiniStat label="Admin Charges (0.5%)" value={formatINR(result.adminCharges)} />
            <MiniStat label="Total Monthly" value={formatINR(result.totalMonthly)} />
          </div>
          <div className="card-surface p-6">
            <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Estimated Corpus in 30 Years (8.25%)</div>
            <div className="mt-2 text-4xl font-bold text-gradient-orange">{formatINR(result.annualCorpus)}</div>
          </div>
        </div>
      )}
    />
  );
}

function HRACalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [basicSalary, setBasicSalary] = useState("");
  const [hraReceived, setHraReceived] = useState("");
  const [rentPaid, setRentPaid] = useState("");
  const [cityType, setCityType] = useState<"metro" | "non-metro">("metro");
  const [result, setResult] = useState({
    actualHRA: 0,
    rentMinusBasic: 0,
    salaryPercentLimit: 0,
    exemptionAmount: 0,
    taxableHRA: 0,
  });

  useEffect(() => {
    const basic = toNum(basicSalary);
    const hra = toNum(hraReceived);
    const rent = toNum(rentPaid);

    const actualHRA = hra;
    const rentMinusBasic = Math.max(0, rent - basic * 0.1);
    const salaryPercentLimit = cityType === "metro" ? basic * 0.5 : basic * 0.4;
    const exemptionAmount = Math.min(actualHRA, rentMinusBasic, salaryPercentLimit);
    const taxableHRA = Math.max(0, hra - exemptionAmount);

    setResult({
      actualHRA,
      rentMinusBasic,
      salaryPercentLimit,
      exemptionAmount,
      taxableHRA,
    });
  }, [basicSalary, hraReceived, rentPaid, cityType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Basic Salary (Annual)": basicSalary, "HRA Received (Annual)": hraReceived, "Rent Paid (Annual)": rentPaid, "City Type": cityType },
        outputs: { "Actual HRA Received": result.actualHRA, "Rent - 10% of Basic": result.rentMinusBasic, "50%/40% of Basic": result.salaryPercentLimit, "Exemption Amount": result.exemptionAmount, "Taxable HRA": result.taxableHRA },
      };
    }
  }, [basicSalary, hraReceived, rentPaid, cityType, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Basic Salary (Annual)": basicSalary, "HRA Received (Annual)": hraReceived, "Rent Paid (Annual)": rentPaid, "City Type": cityType }, outputs: { "Actual HRA Received": result.actualHRA, "Rent - 10% of Basic": result.rentMinusBasic, "50%/40% of Basic": result.salaryPercentLimit, "Exemption Amount": result.exemptionAmount, "Taxable HRA": result.taxableHRA } }; }, [basicSalary, hraReceived, rentPaid, cityType, result]);

  return (
    <CalculatorShell
      title="HRA Exemption Calculator"
      subtitle="Compute exemption under Section 10(13A)"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Basic Salary (Annual)" value={basicSalary} onChange={setBasicSalary} />
          <MoneyInput label="HRA Received (Annual)" value={hraReceived} onChange={setHraReceived} />
          <MoneyInput label="Rent Paid (Annual)" value={rentPaid} onChange={setRentPaid} />

          <Field label="City Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["metro", "non-metro"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setCityType(item)}
                  className={cn(
                    "py-2 text-sm font-medium rounded-md transition-all capitalize",
                    cityType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={!toNum(basicSalary) && !toNum(hraReceived) ? <EmptyResults /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="a) Actual HRA Received" value={formatINR(result.actualHRA)} />
            <MiniStat label="b) Rent Paid - 10% Basic" value={formatINR(result.rentMinusBasic)} />
            <MiniStat
              label={cityType === "metro" ? "c) 50% of Basic" : "c) 40% of Basic"}
              value={formatINR(result.salaryPercentLimit)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card-surface p-6">
              <div className="text-xs text-tertiary uppercase tracking-wide font-medium">HRA Exemption (Minimum of a/b/c)</div>
              <div className="mt-2 text-3xl font-bold text-gradient-orange">{formatINR(result.exemptionAmount)}</div>
            </div>
            <div className="card-surface p-6">
              <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Taxable HRA</div>
              <div className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{formatINR(result.taxableHRA)}</div>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function STCGCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("2025-01-01");
  const [saleDate, setSaleDate] = useState("2025-10-01");
  const [assetType, setAssetType] = useState<"equity" | "property" | "other">("equity");
  const [result, setResult] = useState({
    gainAmount: 0,
    holdingPeriod: 0,
    isSTCG: false,
    taxRate: 0,
    estimatedTax: 0,
  });

  useEffect(() => {
    const buy = toNum(purchasePrice);
    const sell = toNum(salePrice);
    const gainAmount = sell - buy;

    const buyDate = purchaseDate ? new Date(purchaseDate) : null;
    const sellDateObj = saleDate ? new Date(saleDate) : null;

    let holdingPeriod = 0;
    if (buyDate && sellDateObj && !Number.isNaN(buyDate.getTime()) && !Number.isNaN(sellDateObj.getTime())) {
      const yearDiff = sellDateObj.getFullYear() - buyDate.getFullYear();
      const monthDiff = sellDateObj.getMonth() - buyDate.getMonth();
      const dayAdjust = sellDateObj.getDate() < buyDate.getDate() ? -1 : 0;
      holdingPeriod = Math.max(0, yearDiff * 12 + monthDiff + dayAdjust);
    }

    const threshold = assetType === "equity" ? 12 : assetType === "property" ? 24 : Number.POSITIVE_INFINITY;
    const isSTCG = assetType === "other" ? true : holdingPeriod < threshold;

    const taxRate = isSTCG
      ? assetType === "equity"
        ? 20
        : 30
      : 0;
    const estimatedTax = Math.max(0, gainAmount) * (taxRate / 100);

    setResult({ gainAmount, holdingPeriod, isSTCG, taxRate, estimatedTax });
  }, [purchasePrice, salePrice, purchaseDate, saleDate, assetType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Purchase Price": purchasePrice, "Sale Price": salePrice, "Purchase Date": purchaseDate, "Sale Date": saleDate, "Asset Type": assetType },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Purchase Price": purchasePrice, "Sale Price": salePrice, "Purchase Date": purchaseDate, "Sale Date": saleDate, "Asset Type": assetType }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="STCG Calculator"
      subtitle="Estimate short-term capital gains tax based on asset and holding period"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} />
          <MoneyInput label="Sale Price" value={salePrice} onChange={setSalePrice} />

          <Field label="Purchase Date">
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            />
          </Field>

          <Field label="Sale Date">
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            />
          </Field>

          <Field label="Asset Type">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["equity", "property", "other"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setAssetType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all capitalize",
                    assetType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Gain Amount" value={formatINR(result.gainAmount)} />
            <MiniStat label="Holding Period (Months)" value={result.holdingPeriod.toLocaleString("en-IN")} />
            <MiniStat label="Tax Rate" value={result.isSTCG ? formatPct(result.taxRate) : "0.00%"} />
            <MiniStat label="Estimated Tax" value={formatINR(result.estimatedTax)} />
          </div>

          <div className="card-surface p-4 border border-white/10">
            <div className="text-sm text-secondary">
              {result.isSTCG
                ? assetType === "equity"
                  ? "Classified as STCG. Equity tax rate applied at 20%."
                  : "Classified as STCG. Tax estimated at assumed slab rate of 30%."
                : "Holding period exceeds STCG threshold for this asset type."}
            </div>
          </div>
        </div>
      )}
    />
  );
}

function WDVCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [assetName, setAssetName] = useState<keyof typeof WDV_DEFAULT_RATES>("Plant & Machinery");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [rate, setRate] = useState(String(WDV_DEFAULT_RATES["Plant & Machinery"]));
  const [years, setYears] = useState("");
  const [result, setResult] = useState({
    schedule: [] as Array<{ year: number; openingValue: number; depreciation: number; closingValue: number }>,
    totalDepreciation: 0,
  });

  useEffect(() => {
    setRate(String(WDV_DEFAULT_RATES[assetName]));
  }, [assetName]);

  useEffect(() => {
    const openingCost = toNum(purchaseCost);
    const depRate = toNum(rate);
    const totalYears = Math.max(0, Math.floor(toNum(years)));

    let openingValue = openingCost;
    let totalDepreciation = 0;
    const schedule: Array<{ year: number; openingValue: number; depreciation: number; closingValue: number }> = [];

    for (let year = 1; year <= totalYears; year += 1) {
      const depreciation = openingValue * (depRate / 100);
      const closingValue = openingValue * (1 - depRate / 100);
      totalDepreciation += depreciation;
      schedule.push({ year, openingValue, depreciation, closingValue });
      openingValue = closingValue;
    }

    setResult({ schedule, totalDepreciation });
  }, [purchaseCost, rate, years]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Asset Name": assetName, "Purchase Cost": purchaseCost, "Rate": rate, "Years": years },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Asset Name": assetName, "Purchase Cost": purchaseCost, "Rate": rate, "Years": years }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="WDV Depreciation Calculator"
      subtitle="Year-wise depreciation schedule using written down value method"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <Field label="Asset Type">
            <select
              value={assetName}
              onChange={(e) => setAssetName(e.target.value as keyof typeof WDV_DEFAULT_RATES)}
              className="glass-select w-full h-11 px-3 rounded-[10px] text-sm focus:outline-none focus:border-[rgba(249,115,22,0.5)]"
            >
              {Object.keys(WDV_DEFAULT_RATES).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>

          <MoneyInput label="Purchase Cost" value={purchaseCost} onChange={setPurchaseCost} />
          <NumberInput label="Rate (%)" value={rate} onChange={setRate} />
          <NumberInput label="Years" value={years} onChange={setYears} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Depreciation Schedule</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Opening Value</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Depreciation</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Closing Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.openingValue)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.depreciation)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.closingValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="text-xs text-tertiary uppercase tracking-wide font-medium">Total Depreciation</div>
            <div className="mt-2 text-3xl font-bold text-gradient-orange">{formatINR(result.totalDepreciation)}</div>
          </div>
        </div>
      )}
    />
  );
}

function LTCGCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [saleYear, setSaleYear] = useState("");
  const [assetType, setAssetType] = useState<"equity" | "property" | "other">("property");
  const [result, setResult] = useState({
    gainAmount: 0,
    indexedCost: 0,
    taxWithIndexation: 0,
    taxWithoutIndexation: 0,
    purchaseCII: 0,
    saleCII: 0,
  });

  useEffect(() => {
    const purchase = toNum(purchasePrice);
    const sale = toNum(salePrice);
    const pYear = Math.floor(toNum(purchaseYear));
    const sYear = Math.floor(toNum(saleYear));
    const purchaseCII = getCIIForYear(pYear);
    const saleCII = getCIIForYear(sYear);

    const indexedCost = assetType === "property" && purchaseCII > 0 && saleCII > 0
      ? purchase * (saleCII / purchaseCII)
      : purchase;

    const gainAmount = sale - indexedCost;
    let taxWithIndexation = 0;
    let taxWithoutIndexation = 0;

    if (assetType === "property") {
      taxWithIndexation = Math.max(0, gainAmount) * 0.2;
      taxWithoutIndexation = Math.max(0, sale - purchase) * 0.125;
    } else if (assetType === "equity") {
      const rawGain = sale - purchase;
      const taxableGain = Math.max(0, rawGain - 125000);
      taxWithoutIndexation = taxableGain * 0.125;
      taxWithIndexation = taxWithoutIndexation;
    } else {
      taxWithIndexation = Math.max(0, gainAmount) * 0.2;
      taxWithoutIndexation = Math.max(0, sale - purchase) * 0.125;
    }

    setResult({
      gainAmount,
      indexedCost,
      taxWithIndexation,
      taxWithoutIndexation,
      purchaseCII,
      saleCII,
    });
  }, [purchasePrice, salePrice, purchaseYear, saleYear, assetType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Purchase Price": purchasePrice, "Sale Price": salePrice, "Purchase Year": purchaseYear, "Sale Year": saleYear, "Asset Type": assetType },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Purchase Price": purchasePrice, "Sale Price": salePrice, "Purchase Year": purchaseYear, "Sale Year": saleYear, "Asset Type": assetType }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="LTCG Calculator"
      subtitle="Indexed and non-indexed capital gains tax estimates"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} />
          <MoneyInput label="Sale Price" value={salePrice} onChange={setSalePrice} />
          <NumberInput label="Purchase Year (e.g. 2021)" value={purchaseYear} onChange={setPurchaseYear} />
          <NumberInput label="Sale Year (e.g. 2024)" value={saleYear} onChange={setSaleYear} />

          <Field label="Asset Type">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["equity", "property", "other"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setAssetType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all capitalize",
                    assetType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          <div className="text-xs text-tertiary">
            CII used: Purchase {result.purchaseCII || "N/A"}, Sale {result.saleCII || "N/A"}
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Gain Amount" value={formatINR(result.gainAmount)} />
            <MiniStat label="Indexed Cost" value={formatINR(result.indexedCost)} />
            <MiniStat label="Tax With Indexation" value={formatINR(result.taxWithIndexation)} />
            <MiniStat label="Tax Without Indexation" value={formatINR(result.taxWithoutIndexation)} />
          </div>
        </div>
      )}
    />
  );
}

function AdvanceTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [estimatedAnnualIncome, setEstimatedAnnualIncome] = useState("");
  const [taxAlreadyDeducted, setTaxAlreadyDeducted] = useState("");
  const [result, setResult] = useState({
    totalTaxLiability: 0,
    netTaxAfterTDS: 0,
    schedule: [] as Array<{
      quarter: string;
      dueDate: string;
      percentage: number;
      amountDue: number;
      cumulative: number;
    }>,
  });

  useEffect(() => {
    const income = toNum(estimatedAnnualIncome);
    const tds = toNum(taxAlreadyDeducted);
    const totalTaxLiability = computeIncomeTax(income, "FY 2025-26", "new", "Below 60").totalTax;
    const netTaxAfterTDS = Math.max(0, totalTaxLiability - tds);

    const scheduleConfig = [
      { quarter: "Q1", dueDate: "Jun 15", percentage: 15 },
      { quarter: "Q2", dueDate: "Sep 15", percentage: 45 },
      { quarter: "Q3", dueDate: "Dec 15", percentage: 75 },
      { quarter: "Q4", dueDate: "Mar 15", percentage: 100 },
    ];

    let prevCumulative = 0;
    const schedule = netTaxAfterTDS > 10000
      ? scheduleConfig.map((item) => {
        const cumulative = netTaxAfterTDS * (item.percentage / 100);
        const amountDue = Math.max(0, cumulative - prevCumulative);
        prevCumulative = cumulative;
        return {
          ...item,
          amountDue,
          cumulative,
        };
      })
      : [];

    setResult({
      totalTaxLiability,
      netTaxAfterTDS,
      schedule,
    });
  }, [estimatedAnnualIncome, taxAlreadyDeducted]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Estimated Annual Income": estimatedAnnualIncome, "TDS Already Deducted": taxAlreadyDeducted },
        outputs: { "Total Tax Liability": result.totalTaxLiability, "Net Tax After TDS": result.netTaxAfterTDS },
      };
    }
  }, [estimatedAnnualIncome, taxAlreadyDeducted, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Estimated Annual Income": estimatedAnnualIncome, "TDS Already Deducted": taxAlreadyDeducted }, outputs: { "Total Tax Liability": result.totalTaxLiability, "Net Tax After TDS": result.netTaxAfterTDS } }; }, [estimatedAnnualIncome, taxAlreadyDeducted, result]);

  return (
    <CalculatorShell
      title="Advance Tax Calculator"
      subtitle="Quarterly advance tax schedule based on estimated liability"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Estimated Annual Income" value={estimatedAnnualIncome} onChange={setEstimatedAnnualIncome} />
          <MoneyInput label="Tax Already Deducted (TDS)" value={taxAlreadyDeducted} onChange={setTaxAlreadyDeducted} />
        </div>
      )}
      outputPanel={!toNum(estimatedAnnualIncome) ? <EmptyResults /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total Tax Liability" value={formatINR(result.totalTaxLiability)} />
            <MiniStat label="Net Tax After TDS" value={formatINR(result.netTaxAfterTDS)} />
          </div>

          {result.netTaxAfterTDS <= 10000 ? (
            <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
              Advance tax not applicable (net tax is not above ₹10,000).
            </div>
          ) : (
            <div className="card-surface p-5 overflow-hidden">
              <div className="text-sm font-semibold mb-3">Quarterly Advance Tax Schedule</div>
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-tertiary">
                      <th className="text-left font-medium px-5 py-2 bg-primary/10">Quarter</th>
                      <th className="text-left font-medium px-3 py-2 bg-primary/10">Due Date</th>
                      <th className="text-right font-medium px-3 py-2 bg-primary/10">Percentage</th>
                      <th className="text-right font-medium px-3 py-2 bg-primary/10">Amount Due</th>
                      <th className="text-right font-medium px-5 py-2 bg-primary/10">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row, index) => (
                      <tr key={row.quarter} className={index % 2 ? "bg-white/[0.02]" : ""}>
                        <td className="px-5 py-2 text-secondary">{row.quarter}</td>
                        <td className="px-3 py-2">{row.dueDate}</td>
                        <td className="px-3 py-2 text-right">{row.percentage}%</td>
                        <td className="px-3 py-2 text-right">{formatINR(row.amountDue)}</td>
                        <td className="px-5 py-2 text-right font-medium">{formatINR(row.cumulative)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}

function FinancialRatiosCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [currentAssets, setCurrentAssets] = useState("");
  const [currentLiabilities, setCurrentLiabilities] = useState("");
  const [inventory, setInventory] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [grossProfit, setGrossProfit] = useState("");
  const [netProfit, setNetProfit] = useState("");
  const [totalDebt, setTotalDebt] = useState("");
  const [totalEquity, setTotalEquity] = useState("");
  const [totalAssets, setTotalAssets] = useState("");
  const [ebit, setEbit] = useState("");
  const [interestExpense, setInterestExpense] = useState("");
  const [ratios, setRatios] = useState(
    [] as Array<{ name: string; value: number; healthy: boolean; isPercent?: boolean; suffix?: string }>
  );

  useEffect(() => {
    const ca = toNum(currentAssets);
    const cl = toNum(currentLiabilities);
    const inv = toNum(inventory);
    const rev = toNum(totalRevenue);
    const gross = toNum(grossProfit);
    const net = toNum(netProfit);
    const debt = toNum(totalDebt);
    const equity = toNum(totalEquity);
    const assets = toNum(totalAssets);
    const ebitVal = toNum(ebit);
    const interest = toNum(interestExpense);

    const currentRatio = cl > 0 ? ca / cl : 0;
    const quickRatio = cl > 0 ? (ca - inv) / cl : 0;
    const debtToEquity = equity > 0 ? debt / equity : 0;
    const netProfitMargin = rev > 0 ? (net / rev) * 100 : 0;
    const grossProfitMargin = rev > 0 ? (gross / rev) * 100 : 0;
    const roe = equity > 0 ? (net / equity) * 100 : 0;
    const roa = assets > 0 ? (net / assets) * 100 : 0;
    const interestCoverage = interest > 0 ? ebitVal / interest : 0;

    setRatios([
      { name: "Current Ratio", value: currentRatio, healthy: currentRatio > 2, suffix: "x" },
      { name: "Quick Ratio", value: quickRatio, healthy: quickRatio > 1, suffix: "x" },
      { name: "Debt to Equity", value: debtToEquity, healthy: debtToEquity < 2, suffix: "x" },
      { name: "Net Profit Margin", value: netProfitMargin, healthy: netProfitMargin > 10, isPercent: true },
      { name: "Gross Profit Margin", value: grossProfitMargin, healthy: grossProfitMargin > 20, isPercent: true },
      { name: "ROE", value: roe, healthy: roe > 15, isPercent: true },
      { name: "ROA", value: roa, healthy: roa > 5, isPercent: true },
      { name: "Interest Coverage", value: interestCoverage, healthy: interestCoverage > 3, suffix: "x" },
    ]);
  }, [
    currentAssets,
    currentLiabilities,
    inventory,
    totalRevenue,
    grossProfit,
    netProfit,
    totalDebt,
    totalEquity,
    totalAssets,
    ebit,
    interestExpense,
  ]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Current Assets": currentAssets, "Current Liabilities": currentLiabilities, "Inventory": inventory, "Total Revenue": totalRevenue, "Gross Profit": grossProfit, "Net Profit": netProfit, "Total Debt": totalDebt, "Total Equity": totalEquity, "Total Assets": totalAssets, "Ebit": ebit, "Interest Expense": interestExpense, "Ratios": ratios },
        outputs: {  },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Current Assets": currentAssets, "Current Liabilities": currentLiabilities, "Inventory": inventory, "Total Revenue": totalRevenue, "Gross Profit": grossProfit, "Net Profit": netProfit, "Total Debt": totalDebt, "Total Equity": totalEquity, "Total Assets": totalAssets, "Ebit": ebit, "Interest Expense": interestExpense, "Ratios": ratios }, outputs: {  } }; });

  return (
    <CalculatorShell
      title="Financial Ratios Dashboard"
      subtitle="Liquidity, leverage, profitability and coverage metrics"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Current Assets" value={currentAssets} onChange={setCurrentAssets} />
          <MoneyInput label="Current Liabilities" value={currentLiabilities} onChange={setCurrentLiabilities} />
          <MoneyInput label="Inventory" value={inventory} onChange={setInventory} />
          <MoneyInput label="Total Revenue" value={totalRevenue} onChange={setTotalRevenue} />
          <MoneyInput label="Gross Profit" value={grossProfit} onChange={setGrossProfit} />
          <MoneyInput label="Net Profit" value={netProfit} onChange={setNetProfit} />
          <MoneyInput label="Total Debt" value={totalDebt} onChange={setTotalDebt} />
          <MoneyInput label="Total Equity" value={totalEquity} onChange={setTotalEquity} />
          <MoneyInput label="Total Assets" value={totalAssets} onChange={setTotalAssets} />
          <MoneyInput label="EBIT" value={ebit} onChange={setEbit} />
          <MoneyInput label="Interest Expense" value={interestExpense} onChange={setInterestExpense} />
        </div>
      )}
      outputPanel={(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ratios.map((ratio) => (
            <div key={ratio.name} className="card-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-wide text-tertiary">{ratio.name}</div>
                <span className={cn(
                  "px-2 py-0.5 rounded-pill text-[10px] font-semibold border",
                  ratio.healthy
                    ? "text-success border-success/40 bg-success/10"
                    : "text-red-400 border-red-400/40 bg-red-400/10"
                )}>
                  {ratio.healthy ? "Healthy" : "Review"}
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                {ratio.isPercent ? `${formatNum(ratio.value)}%` : `${formatNum(ratio.value)}${ratio.suffix ?? ""}`}
              </div>
            </div>
          ))}
        </div>
      )}
    />
  );
}

function BreakEvenCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [fixedCosts, setFixedCosts] = useState("");
  const [variableCostPerUnit, setVariableCostPerUnit] = useState("");
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState("");
  const [result, setResult] = useState({
    contributionMargin: 0,
    breakEvenUnits: 0,
    breakEvenRevenue: 0,
    contributionMarginRatio: 0,
    scenarios: [] as Array<{ label: string; revenue: number; profit: number }> ,
  });

  useEffect(() => {
    const fixed = toNum(fixedCosts);
    const variable = toNum(variableCostPerUnit);
    const selling = toNum(sellingPricePerUnit);
    const contributionMargin = selling - variable;

    const breakEvenUnits = contributionMargin > 0 ? fixed / contributionMargin : 0;
    const breakEvenRevenue = breakEvenUnits * selling;
    const contributionMarginRatio = selling > 0 ? (contributionMargin / selling) * 100 : 0;

    const levels = [0, 25, 50, 75, 100];
    const scenarios = contributionMargin > 0
      ? levels.map((level) => {
        const units = breakEvenUnits * (1 + level / 100);
        const revenue = units * selling;
        const profit = units * contributionMargin - fixed;
        return {
          label: `${level}% above BEP`,
          revenue,
          profit,
        };
      })
      : levels.map((level) => ({
        label: `${level}% above BEP`,
        revenue: 0,
        profit: 0,
      }));

    setResult({
      contributionMargin,
      breakEvenUnits,
      breakEvenRevenue,
      contributionMarginRatio,
      scenarios,
    });
  }, [fixedCosts, variableCostPerUnit, sellingPricePerUnit]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Fixed Costs": fixedCosts, "Variable Cost Per Unit": variableCostPerUnit, "Selling Price Per Unit": sellingPricePerUnit },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Fixed Costs": fixedCosts, "Variable Cost Per Unit": variableCostPerUnit, "Selling Price Per Unit": sellingPricePerUnit }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Break-even Calculator"
      subtitle="Contribution margin and break-even planning"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Fixed Costs" value={fixedCosts} onChange={setFixedCosts} />
          <MoneyInput label="Variable Cost Per Unit" value={variableCostPerUnit} onChange={setVariableCostPerUnit} />
          <MoneyInput label="Selling Price Per Unit" value={sellingPricePerUnit} onChange={setSellingPricePerUnit} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Contribution Margin" value={formatINR(result.contributionMargin)} />
            <MiniStat label="Contribution Margin Ratio" value={formatPct(result.contributionMarginRatio)} />
            <MiniStat label="Break-even Units" value={formatNum(result.breakEvenUnits)} />
            <MiniStat label="Break-even Revenue" value={formatINR(result.breakEvenRevenue)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-xs text-secondary">
            Margin of Safety % = ((Actual Sales - Break-even Sales) / Actual Sales) * 100
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Scenario Table</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Scenario</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Revenue</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scenarios.map((row, index) => (
                    <tr key={row.label} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.label}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.revenue)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function CompoundInterestCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [years, setYears] = useState("");
  const [compoundingFrequency, setCompoundingFrequency] = useState<"annually" | "semi-annually" | "quarterly" | "monthly">("annually");
  const [result, setResult] = useState({
    finalAmount: 0,
    totalInterest: 0,
    simpleFinalAmount: 0,
    simpleInterest: 0,
    growthTable: [] as Array<{ year: number; amount: number; interestEarned: number }>,
  });

  useEffect(() => {
    const p = toNum(principal);
    const r = toNum(annualRate) / 100;
    const t = Math.max(0, Math.floor(toNum(years)));
    const freqMap = {
      annually: 1,
      "semi-annually": 2,
      quarterly: 4,
      monthly: 12,
    } as const;
    const n = freqMap[compoundingFrequency];

    const finalAmount = p * (1 + r / n) ** (n * t);
    const totalInterest = finalAmount - p;
    const simpleInterest = p * r * t;
    const simpleFinalAmount = p + simpleInterest;

    const growthTable = Array.from({ length: t }, (_, idx) => {
      const year = idx + 1;
      const amount = p * (1 + r / n) ** (n * year);
      return {
        year,
        amount,
        interestEarned: amount - p,
      };
    });

    setResult({
      finalAmount,
      totalInterest,
      simpleFinalAmount,
      simpleInterest,
      growthTable,
    });
  }, [principal, annualRate, years, compoundingFrequency]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Principal": principal, "Annual Rate": annualRate + "%", "Period": years + " years", "Compounding": compoundingFrequency },
        outputs: { "Final Amount (CI)": result.finalAmount, "Total Interest (CI)": result.totalInterest, "Final Amount (SI)": result.simpleFinalAmount, "Simple Interest": result.simpleInterest },
      };
    }
  }, [principal, annualRate, years, compoundingFrequency, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Principal": principal, "Annual Rate": annualRate + "%", "Period": years + " years", "Compounding": compoundingFrequency }, outputs: { "Final Amount (CI)": result.finalAmount, "Total Interest (CI)": result.totalInterest, "Final Amount (SI)": result.simpleFinalAmount, "Simple Interest": result.simpleInterest } }; }, [principal, annualRate, years, compoundingFrequency, result]);

  return (
    <CalculatorShell
      title="Compound Interest Calculator"
      subtitle="Compound growth with simple interest comparison"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Principal" value={principal} onChange={setPrincipal} />
          <NumberInput label="Annual Rate (%)" value={annualRate} onChange={setAnnualRate} />
          <NumberInput label="Years" value={years} onChange={setYears} />

          <Field label="Compounding Frequency">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10 gap-1">
              {(["annually", "semi-annually", "quarterly", "monthly"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setCompoundingFrequency(item)}
                  className={cn(
                    "py-2 px-2 text-xs font-medium rounded-md transition-all capitalize",
                    compoundingFrequency === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Final Amount" value={formatINR(result.finalAmount)} />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
            <MiniStat label="Simple Interest Amount" value={formatINR(result.simpleFinalAmount)} />
            <MiniStat label="Simple Interest Earned" value={formatINR(result.simpleInterest)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Year-by-year Growth</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Amount</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Interest Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {result.growthTable.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.amount)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.interestEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function LoanEligibilityCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [existingEMIs, setExistingEMIs] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureYears, setTenureYears] = useState("");
  const [result, setResult] = useState({
    availableForEMI: 0,
    maxLoanAmount: 0,
    scenarios: [] as Array<{ label: string; foir: number; emi: number; maxLoan: number }>,
  });

  useEffect(() => {
    const income = toNum(monthlyIncome);
    const existing = toNum(existingEMIs);
    const rate = toNum(interestRate);
    const months = Math.max(0, Math.floor(toNum(tenureYears) * 12));

    const availableForEMI = Math.max(0, income * 0.5 - existing);
    const maxLoanAmount = calculateLoanFromEMI(availableForEMI, rate, months);

    const foirLevels = [
      { label: "Conservative", foir: 40 },
      { label: "Standard", foir: 50 },
      { label: "Aggressive", foir: 60 },
    ];

    const scenarios = foirLevels.map((item) => {
      const emi = Math.max(0, income * (item.foir / 100) - existing);
      const maxLoan = calculateLoanFromEMI(emi, rate, months);
      return {
        label: item.label,
        foir: item.foir,
        emi,
        maxLoan,
      };
    });

    setResult({ availableForEMI, maxLoanAmount, scenarios });
  }, [monthlyIncome, existingEMIs, interestRate, tenureYears]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Monthly Income": monthlyIncome, "Existing Em Is": existingEMIs, "Interest Rate": interestRate, "Tenure Years": tenureYears },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Monthly Income": monthlyIncome, "Existing E M Is": existingEMIs, "Interest Rate": interestRate, "Tenure Years": tenureYears }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Loan Eligibility Calculator"
      subtitle="Estimate maximum eligible loan based on FOIR"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome} />
          <MoneyInput label="Existing EMIs" value={existingEMIs} onChange={setExistingEMIs} />
          <NumberInput label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} />
          <NumberInput label="Tenure (Years)" value={tenureYears} onChange={setTenureYears} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Available For EMI (50% FOIR)" value={formatINR(result.availableForEMI)} />
            <MiniStat label="Max Loan Amount" value={formatINR(result.maxLoanAmount)} green />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">FOIR Scenarios</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Scenario</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">FOIR</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Monthly EMI</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Max Loan</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scenarios.map((row, index) => (
                    <tr key={row.label} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.label}</td>
                      <td className="px-3 py-2 text-right">{row.foir}%</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.emi)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.maxLoan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function HomeLoanCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [propertyValue, setPropertyValue] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureYears, setTenureYears] = useState("");
  const [result, setResult] = useState({
    downPayment: 0,
    loanAmount: 0,
    monthlyEMI: 0,
    totalInterest: 0,
    totalPayment: 0,
    interestToLoanRatio: 0,
    rateScenarios: [] as Array<{ label: string; rate: number; emi: number }>,
  });

  useEffect(() => {
    const value = toNum(propertyValue);
    const dpPct = toNum(downPaymentPercent);
    const rate = toNum(interestRate);
    const months = Math.max(0, Math.floor(toNum(tenureYears) * 12));

    const downPayment = value * (dpPct / 100);
    const loanAmount = value * (1 - dpPct / 100);
    const monthlyEMI = calculateEMIFromPrincipal(loanAmount, rate, months);
    const totalPayment = monthlyEMI * months;
    const totalInterest = Math.max(0, totalPayment - loanAmount);
    const interestToLoanRatio = loanAmount > 0 ? (totalInterest / loanAmount) * 100 : 0;

    const rateScenarios = [
      { label: "Rate - 1%", rate: Math.max(0, rate - 1) },
      { label: "Current Rate", rate },
      { label: "Rate + 1%", rate: rate + 1 },
    ].map((item) => ({
      label: item.label,
      rate: item.rate,
      emi: calculateEMIFromPrincipal(loanAmount, item.rate, months),
    }));

    setResult({
      downPayment,
      loanAmount,
      monthlyEMI,
      totalInterest,
      totalPayment,
      interestToLoanRatio,
      rateScenarios,
    });
  }, [propertyValue, downPaymentPercent, interestRate, tenureYears]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Property Value": propertyValue, "Down Payment": downPaymentPercent + "%", "Interest Rate": interestRate + "%", "Tenure": tenureYears + " years" },
        outputs: { "Down Payment": result.downPayment, "Loan Amount": result.loanAmount, "Monthly EMI": result.monthlyEMI, "Total Interest": result.totalInterest, "Total Payment": result.totalPayment },
      };
    }
  }, [propertyValue, downPaymentPercent, interestRate, tenureYears, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Property Value": propertyValue, "Down Payment": downPaymentPercent + "%", "Interest Rate": interestRate + "%", "Tenure": tenureYears + " years" }, outputs: { "Down Payment": result.downPayment, "Loan Amount": result.loanAmount, "Monthly EMI": result.monthlyEMI, "Total Interest": result.totalInterest, "Total Payment": result.totalPayment } }; }, [propertyValue, downPaymentPercent, interestRate, tenureYears, result]);

  return (
    <CalculatorShell
      title="Home Loan Calculator"
      subtitle="EMI analysis with rate sensitivity scenarios"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Property Value" value={propertyValue} onChange={setPropertyValue} />
          <NumberInput label="Down Payment (%)" value={downPaymentPercent} onChange={setDownPaymentPercent} />
          <NumberInput label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} />
          <NumberInput label="Tenure (Years)" value={tenureYears} onChange={setTenureYears} />
        </div>
      )}
      outputPanel={!toNum(propertyValue) ? <EmptyResults /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Loan Amount" value={formatINR(result.loanAmount)} />
            <MiniStat label="Down Payment" value={formatINR(result.downPayment)} />
            <MiniStat label="Monthly EMI" value={formatINR(result.monthlyEMI)} />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
            <MiniStat label="Total Payment" value={formatINR(result.totalPayment)} />
            <MiniStat label="Interest to Loan Ratio" value={formatPct(result.interestToLoanRatio)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {result.rateScenarios.map((item) => (
              <div key={item.label} className="card-surface p-4">
                <div className="text-xs uppercase tracking-wide text-tertiary">{item.label}</div>
                <div className="mt-1 text-sm text-secondary">{formatPct(item.rate)}</div>
                <div className="mt-2 text-lg font-bold text-gradient-orange">{formatINR(item.emi)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}

function RentalYieldCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [propertyValue, setPropertyValue] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [annualMaintenance, setAnnualMaintenance] = useState("");
  const [annualPropertyTax, setAnnualPropertyTax] = useState("");
  const [vacancyRate, setVacancyRate] = useState("");
  const [result, setResult] = useState({
    grossYield: 0,
    netYield: 0,
    annualGrossIncome: 0,
    annualNetIncome: 0,
    adjustedForVacancy: 0,
    paybackYears: 0,
  });

  useEffect(() => {
    const value = toNum(propertyValue);
    const rent = toNum(monthlyRent);
    const maintenance = toNum(annualMaintenance);
    const tax = toNum(annualPropertyTax);
    const vacancy = toNum(vacancyRate);

    const annualGrossIncome = rent * 12;
    const grossYield = value > 0 ? (annualGrossIncome / value) * 100 : 0;
    const annualNetIncome = annualGrossIncome - maintenance - tax;
    const adjustedForVacancy = annualNetIncome * (1 - vacancy / 100);
    const netYield = value > 0 ? (adjustedForVacancy / value) * 100 : 0;
    const paybackYears = annualNetIncome > 0 ? value / annualNetIncome : 0;

    setResult({
      grossYield,
      netYield,
      annualGrossIncome,
      annualNetIncome,
      adjustedForVacancy,
      paybackYears,
    });
  }, [propertyValue, monthlyRent, annualMaintenance, annualPropertyTax, vacancyRate]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Property Value": propertyValue, "Monthly Rent": monthlyRent, "Annual Maintenance": annualMaintenance, "Annual Property Tax": annualPropertyTax, "Vacancy Rate": vacancyRate + "%" },
        outputs: { "Gross Yield": result.grossYield + "%", "Net Yield": result.netYield + "%", "Annual Gross Income": result.annualGrossIncome, "Annual Net Income": result.annualNetIncome, "Payback Period": result.paybackYears + " years" },
      };
    }
  }, [propertyValue, monthlyRent, annualMaintenance, annualPropertyTax, vacancyRate, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Property Value": propertyValue, "Monthly Rent": monthlyRent, "Annual Maintenance": annualMaintenance, "Annual Property Tax": annualPropertyTax, "Vacancy Rate": vacancyRate + "%" }, outputs: { "Gross Yield": result.grossYield + "%", "Net Yield": result.netYield + "%", "Annual Gross Income": result.annualGrossIncome, "Annual Net Income": result.annualNetIncome, "Payback Period": result.paybackYears + " years" } }; }, [propertyValue, monthlyRent, annualMaintenance, annualPropertyTax, vacancyRate, result]);

  return (
    <CalculatorShell
      title="Rental Yield Calculator"
      subtitle="Gross and net rental yield with vacancy adjustment"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Property Value" value={propertyValue} onChange={setPropertyValue} />
          <MoneyInput label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} />
          <MoneyInput label="Annual Maintenance" value={annualMaintenance} onChange={setAnnualMaintenance} />
          <MoneyInput label="Annual Property Tax" value={annualPropertyTax} onChange={setAnnualPropertyTax} />
          <NumberInput label="Vacancy Rate (%)" value={vacancyRate} onChange={setVacancyRate} />
        </div>
      )}
      outputPanel={(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MiniStat label="Gross Yield" value={formatPct(result.grossYield)} />
          <MiniStat label="Net Yield" value={formatPct(result.netYield)} green />
          <MiniStat label="Annual Gross Income" value={formatINR(result.annualGrossIncome)} />
          <MiniStat label="Annual Net Income" value={formatINR(result.annualNetIncome)} />
          <MiniStat label="Adjusted for Vacancy" value={formatINR(result.adjustedForVacancy)} />
          <MiniStat label="Payback Years" value={formatNum(result.paybackYears)} />
        </div>
      )}
    />
  );
}

function NPVCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [cashFlows, setCashFlows] = useState<string[]>(["300000", "350000", "400000"]);
  const [result, setResult] = useState({
    npv: 0,
    irr: 0,
    paybackPeriod: 0,
    profitabilityIndex: 0,
  });

  useEffect(() => {
    const investment = toNum(initialInvestment);
    const rate = toNum(discountRate) / 100;
    const flows = cashFlows.map((item) => toNum(item));

    let discountedTotal = 0;
    for (let i = 0; i < flows.length; i += 1) {
      discountedTotal += flows[i] / (1 + rate) ** (i + 1);
    }
    const npv = discountedTotal - investment;

    let irr = 0;
    for (let candidate = 0; candidate <= 100; candidate += 0.1) {
      const candidateRate = candidate / 100;
      let candidateNpv = -investment;
      for (let i = 0; i < flows.length; i += 1) {
        candidateNpv += flows[i] / (1 + candidateRate) ** (i + 1);
      }
      if (candidateNpv <= 0) {
        irr = candidate;
        break;
      }
      if (candidate >= 99.9) irr = 100;
    }

    let cumulative = 0;
    let paybackPeriod = 0;
    for (let i = 0; i < flows.length; i += 1) {
      const prevCumulative = cumulative;
      cumulative += flows[i];
      if (!paybackPeriod && cumulative >= investment) {
        const remainingBeforeYear = Math.max(0, investment - prevCumulative);
        const fraction = flows[i] > 0 ? remainingBeforeYear / flows[i] : 0;
        paybackPeriod = i + fraction;
      }
    }

    const profitabilityIndex = investment > 0 ? discountedTotal / investment : 0;

    setResult({ npv, irr, paybackPeriod, profitabilityIndex });
  }, [initialInvestment, discountRate, cashFlows]);

  const addYear = () => {
    if (cashFlows.length >= 10) return;
    setCashFlows((prev) => [...prev, "0"]);
  };

  const updateCashFlow = (index: number, value: string) => {
    setCashFlows((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Initial Investment": initialInvestment, "Discount Rate": discountRate, "Cash Flows": cashFlows },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Initial Investment": initialInvestment, "Discount Rate": discountRate, "Cash Flows": cashFlows }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="NPV Calculator"
      subtitle="Discounted cash flow analysis with IRR approximation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Initial Investment" value={initialInvestment} onChange={setInitialInvestment} />
          <NumberInput label="Discount Rate (%)" value={discountRate} onChange={setDiscountRate} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-secondary">Cash Flows</label>
              <button
                onClick={addYear}
                disabled={cashFlows.length >= 10}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-orange text-white disabled:opacity-50"
              >
                Add Year
              </button>
            </div>
            {cashFlows.map((value, index) => (
              <MoneyInput
                key={`cf-${index + 1}`}
                label={`Year ${index + 1}`}
                value={value}
                onChange={(val) => updateCashFlow(index, val)}
              />
            ))}
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-6">
            <div className="text-xs text-tertiary uppercase tracking-wide font-medium">NPV</div>
            <div className={cn(
              "mt-2 text-4xl font-bold",
              result.npv >= 0 ? "text-success" : "text-red-400"
            )}>
              {formatINR(result.npv)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="IRR" value={formatPct(result.irr)} />
            <MiniStat label="Payback Period (Years)" value={formatNum(result.paybackPeriod)} />
            <MiniStat label="Profitability Index" value={formatNum(result.profitabilityIndex)} />
          </div>
        </div>
      )}
    />
  );
}

function TDSCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const paymentTypes = Object.keys(TDS_CONFIG) as TdsPaymentType[];
  const [paymentType, setPaymentType] = useState<TdsPaymentType>("Professional/Technical fees (194J)");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [recipientType, setRecipientType] = useState<"resident" | "NRI">("resident");
  const [contractorType, setContractorType] = useState<"individual" | "company">("individual");
  const [result, setResult] = useState({
    tdsAmount: 0,
    netPayment: 0,
    sectionReference: "",
    thresholdLimit: 0,
    thresholdMet: false,
    rateUsed: 0,
    dueDate: "7th of next month",
  });

  useEffect(() => {
    const amount = toNum(paymentAmount);
    const config = TDS_CONFIG[paymentType];
    const thresholdMet = amount >= config.threshold;

    let rateUsed = 0;
    if (paymentType === "Salary (192)") {
      if (recipientType === "resident") {
        const totalTax = computeIncomeTax(amount, "FY 2025-26", "new", "Below 60").totalTax;
        rateUsed = amount > 0 ? (totalTax / amount) * 100 : 0;
      } else {
        rateUsed = config.nriRate;
      }
    } else if (recipientType === "resident") {
      if (paymentType === "Contractor payment (194C)") {
        rateUsed = contractorType === "company" && "residentCompanyRate" in config
          ? config.residentCompanyRate
          : config.residentRate;
      } else {
        rateUsed = config.residentRate;
      }
    } else {
      rateUsed = config.nriRate;
    }

    const tdsAmount = thresholdMet ? amount * (rateUsed / 100) : 0;
    const netPayment = amount - tdsAmount;

    setResult({
      tdsAmount,
      netPayment,
      sectionReference: config.section,
      thresholdLimit: config.threshold,
      thresholdMet,
      rateUsed,
      dueDate: "7th of next month",
    });
  }, [paymentType, paymentAmount, recipientType, contractorType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Payment Type": paymentType, "Payment Amount": paymentAmount, "Recipient Type": recipientType, "Contractor Type": contractorType },
        outputs: { "TDS Rate": result.rateUsed + "%", "TDS Amount": result.tdsAmount, "Net Payment": result.netPayment, "Section": result.sectionReference, "Threshold Limit": result.thresholdLimit, "Due Date": result.dueDate },
      };
    }
  }, [paymentType, paymentAmount, recipientType, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Payment Type": paymentType, "Payment Amount": paymentAmount, "Recipient Type": recipientType, "Contractor Type": contractorType }, outputs: { "TDS Rate": result.rateUsed + "%", "TDS Amount": result.tdsAmount, "Net Payment": result.netPayment, "Section": result.sectionReference, "Threshold Limit": result.thresholdLimit, "Due Date": result.dueDate } }; }, [paymentType, paymentAmount, recipientType, contractorType, result]);

  return (
    <CalculatorShell
      title="TDS Calculator"
      subtitle="Section-wise TDS estimate with threshold checks"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <Field label="Payment Type">
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as TdsPaymentType)}
              className="glass-select w-full h-11 px-3 rounded-[10px] text-sm focus:outline-none focus:border-[rgba(249,115,22,0.5)]"
            >
              {paymentTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>

          <MoneyInput label="Payment Amount" value={paymentAmount} onChange={setPaymentAmount} />

          <Field label="Recipient Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["resident", "NRI"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setRecipientType(item)}
                  className={cn(
                    "py-2 text-sm font-medium rounded-md transition-all",
                    recipientType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          {paymentType === "Contractor payment (194C)" && recipientType === "resident" && (
            <Field label="Contractor Type">
              <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
                {(["individual", "company"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setContractorType(item)}
                    className={cn(
                      "py-2 text-sm font-medium rounded-md transition-all capitalize",
                      contractorType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}
      outputPanel={!toNum(paymentAmount) ? <EmptyResults /> : (
        <div className="space-y-4">
          {!result.thresholdMet && result.thresholdLimit > 0 && (
            <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
              Threshold warning: Payment is below {formatINR(result.thresholdLimit)}. TDS may not be applicable.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="TDS Amount" value={formatINR(result.tdsAmount)} />
            <MiniStat label="Net Payment" value={formatINR(result.netPayment)} />
            <MiniStat label="Section Reference" value={result.sectionReference} />
            <MiniStat label="Threshold Limit" value={formatINR(result.thresholdLimit)} />
            <MiniStat label="Rate Used" value={formatPct(result.rateUsed)} />
            <MiniStat label="Due Date for Deposit" value={result.dueDate} />
          </div>
        </div>
      )}
    />
  );
}

function PPFCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [annualInvestment, setAnnualInvestment] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState({
    maturityAmount: 0,
    totalInvested: 0,
    totalInterest: 0,
    effectiveReturn: 0,
    taxBenefit80C: 0,
    usedYears: 15,
    schedule: [] as Array<{ year: number; investment: number; interest: number; balance: number }>,
  });

  useEffect(() => {
    const investment = toNum(annualInvestment);
    const yearInput = Math.floor(toNum(years));
    const usedYears = Math.min(50, Math.max(15, yearInput || 15));

    let balance = 0;
    const schedule: Array<{ year: number; investment: number; interest: number; balance: number }> = [];

    for (let year = 1; year <= usedYears; year += 1) {
      const opening = balance;
      balance = (opening + investment) * 1.071;
      const interest = balance - opening - investment;
      schedule.push({
        year,
        investment,
        interest,
        balance,
      });
    }

    const totalInvested = investment * usedYears;
    const maturityAmount = balance;
    const totalInterest = maturityAmount - totalInvested;
    const effectiveReturn = totalInvested > 0 ? (totalInterest / totalInvested) * 100 : 0;
    const taxBenefit80C = Math.min(investment, 150000);

    setResult({
      maturityAmount,
      totalInvested,
      totalInterest,
      effectiveReturn,
      taxBenefit80C,
      usedYears,
      schedule,
    });
  }, [annualInvestment, years]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Annual Investment": annualInvestment, "Investment Period": years + " years" },
        outputs: { "Maturity Amount": result.maturityAmount, "Total Invested": result.totalInvested, "Total Interest": result.totalInterest, "Effective Return": result.effectiveReturn + "%", "Tax Benefit (80C)": result.taxBenefit80C },
      };
    }
  }, [annualInvestment, years, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Annual Investment": annualInvestment, "Investment Period": years + " years" }, outputs: { "Maturity Amount": result.maturityAmount, "Total Invested": result.totalInvested, "Total Interest": result.totalInterest, "Effective Return": result.effectiveReturn + "%", "Tax Benefit (80C)": result.taxBenefit80C } }; }, [annualInvestment, years, result]);

  return (
    <CalculatorShell
      title="PPF Calculator"
      subtitle="7.1% annual compounding with year-wise growth"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Annual Investment" value={annualInvestment} onChange={setAnnualInvestment} />
          <NumberInput label="Years (15 to 50)" value={years} onChange={setYears} />
          <div className="text-xs text-tertiary">Using {result.usedYears} years for calculation.</div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Maturity Amount" value={formatINR(result.maturityAmount)} green />
            <MiniStat label="Total Invested" value={formatINR(result.totalInvested)} />
            <MiniStat label="Interest Earned" value={formatINR(result.totalInterest)} />
            <MiniStat label="Effective Return" value={formatPct(result.effectiveReturn)} />
            <MiniStat label="80C Deduction (Yearly)" value={formatINR(result.taxBenefit80C)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Year-wise PPF Schedule</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Investment</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Interest</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.investment)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.interest)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function SLMCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [assetName, setAssetName] = useState("Asset");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [salvageValue, setSalvageValue] = useState("100000");
  const [usefulLifeYears, setUsefulLifeYears] = useState("");
  const [result, setResult] = useState({
    annualDepreciation: 0,
    depreciationRate: 0,
    totalDepreciation: 0,
    usedYears: 0,
    table: [] as Array<{ year: number; depreciation: number; accumulated: number; bookValue: number }>,
  });

  useEffect(() => {
    const cost = toNum(purchaseCost);
    const salvage = Math.min(cost, toNum(salvageValue));
    const yearsNum = Math.max(1, Math.floor(toNum(usefulLifeYears)));

    const annualDepreciation = yearsNum > 0 ? (cost - salvage) / yearsNum : 0;
    const depreciationRate = cost > 0 ? (annualDepreciation / cost) * 100 : 0;

    const table: Array<{ year: number; depreciation: number; accumulated: number; bookValue: number }> = [];
    for (let year = 1; year <= yearsNum; year += 1) {
      const accumulated = annualDepreciation * year;
      const bookValue = Math.max(salvage, cost - accumulated);
      table.push({
        year,
        depreciation: annualDepreciation,
        accumulated,
        bookValue,
      });
    }

    const totalDepreciation = annualDepreciation * yearsNum;

    setResult({
      annualDepreciation,
      depreciationRate,
      totalDepreciation,
      usedYears: yearsNum,
      table,
    });
  }, [purchaseCost, salvageValue, usefulLifeYears]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Asset Name": assetName, "Purchase Cost": purchaseCost, "Salvage Value": salvageValue, "Useful Life Years": usefulLifeYears },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Asset Name": assetName, "Purchase Cost": purchaseCost, "Salvage Value": salvageValue, "Useful Life Years": usefulLifeYears }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Straight Line Depreciation"
      subtitle="Uniform annual depreciation over useful life"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <Field label="Asset Name">
            <input
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Asset"
              className="glass-input w-full h-11 px-3 text-sm"
            />
          </Field>

          <MoneyInput label="Purchase Cost" value={purchaseCost} onChange={setPurchaseCost} />
          <MoneyInput label="Salvage Value" value={salvageValue} onChange={setSalvageValue} />
          <NumberInput label="Useful Life (Years)" value={usefulLifeYears} onChange={setUsefulLifeYears} />
          <div className="text-xs text-tertiary">Asset: {assetName || "Asset"} | Years: {result.usedYears}</div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Annual Depreciation" value={formatINR(result.annualDepreciation)} />
            <MiniStat label="Depreciation Rate" value={formatPct(result.depreciationRate)} />
            <MiniStat label="Total Depreciation" value={formatINR(result.totalDepreciation)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Straight Line Schedule</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Depreciation</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Accumulated</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.table.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.depreciation)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.accumulated)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.bookValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function MaterialityCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [totalRevenue, setTotalRevenue] = useState("");
  const [totalAssets, setTotalAssets] = useState("");
  const [netProfit, setNetProfit] = useState("");
  const [benchmark, setBenchmark] = useState<"revenue" | "assets" | "profit">("revenue");
  const [result, setResult] = useState({
    revenueMateriality: 0,
    assetsMateriality: 0,
    profitMateriality: 0,
    planningMateriality: 0,
    performanceMateriality: 0,
    trivialAmount: 0,
  });

  useEffect(() => {
    const revenue = toNum(totalRevenue);
    const assets = toNum(totalAssets);
    const profit = Math.abs(toNum(netProfit));

    const revenueMateriality = revenue * 0.0075;
    const assetsMateriality = assets * 0.015;
    const profitMateriality = profit * 0.075;

    const planningMateriality = benchmark === "revenue"
      ? revenueMateriality
      : benchmark === "assets"
        ? assetsMateriality
        : profitMateriality;

    const performanceMateriality = planningMateriality * 0.75;
    const trivialAmount = planningMateriality * 0.04;

    setResult({
      revenueMateriality,
      assetsMateriality,
      profitMateriality,
      planningMateriality,
      performanceMateriality,
      trivialAmount,
    });
  }, [totalRevenue, totalAssets, netProfit, benchmark]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Total Revenue": totalRevenue, "Total Assets": totalAssets, "Net Profit": netProfit, "Benchmark": benchmark },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Total Revenue": totalRevenue, "Total Assets": totalAssets, "Net Profit": netProfit, "Benchmark": benchmark }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Audit Materiality Calculator"
      subtitle="Planning, performance and trivial thresholds"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Total Revenue" value={totalRevenue} onChange={setTotalRevenue} />
          <MoneyInput label="Total Assets" value={totalAssets} onChange={setTotalAssets} />
          <MoneyInput label="Net Profit" value={netProfit} onChange={setNetProfit} />

          <Field label="Benchmark">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["revenue", "assets", "profit"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setBenchmark(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all capitalize",
                    benchmark === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Revenue (0.5% - 1%)</div>
              <div className="mt-2 text-lg font-bold">{formatINR(result.revenueMateriality)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Assets (1% - 2%)</div>
              <div className="mt-2 text-lg font-bold">{formatINR(result.assetsMateriality)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Net Profit (5% - 10%)</div>
              <div className="mt-2 text-lg font-bold">{formatINR(result.profitMateriality)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="Planning Materiality" value={formatINR(result.planningMateriality)} green />
            <MiniStat label="Performance Materiality (75%)" value={formatINR(result.performanceMateriality)} />
            <MiniStat label="Trivial Threshold (4%)" value={formatINR(result.trivialAmount)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Based on ISA 320 / SA 320 guidelines
          </div>
        </div>
      )}
    />
  );
}

function StampDutyCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const states = Object.keys(STAMP_DUTY_RATES) as Array<keyof typeof STAMP_DUTY_RATES>;
  const [propertyValue, setPropertyValue] = useState("");
  const [state, setState] = useState<keyof typeof STAMP_DUTY_RATES>("Maharashtra");
  const [propertyType, setPropertyType] = useState<"residential" | "commercial">("residential");
  const [ownerGender, setOwnerGender] = useState<"women" | "men">("women");
  const [result, setResult] = useState({
    stampDuty: 0,
    registrationCharge: 0,
    totalCharges: 0,
    effectiveRate: 0,
    appliedRate: 0,
    rows: [] as Array<{ state: string; rate: number; stampDuty: number; registration: number; total: number }>,
  });

  useEffect(() => {
    const value = toNum(propertyValue);

    const getRate = (
      itemState: keyof typeof STAMP_DUTY_RATES,
      itemPropertyType: "residential" | "commercial",
      gender: "women" | "men"
    ) => {
      if (itemState === "Delhi" && itemPropertyType === "residential") {
        return gender === "women"
          ? STAMP_DUTY_RATES.Delhi.residentialWomen
          : STAMP_DUTY_RATES.Delhi.residentialMen;
      }
      if (itemState === "Delhi") {
        return STAMP_DUTY_RATES.Delhi.commercial;
      }
      return STAMP_DUTY_RATES[itemState][itemPropertyType];
    };

    const appliedRate = getRate(state, propertyType, ownerGender);
    const stampDuty = value * (appliedRate / 100);
    const registrationCharge = value * 0.01;
    const totalCharges = stampDuty + registrationCharge;
    const effectiveRate = value > 0 ? (totalCharges / value) * 100 : 0;

    const rows: Array<{ state: string; rate: number; stampDuty: number; registration: number; total: number }> = [];
    states.forEach((item) => {
      if (item === "Delhi" && propertyType === "residential") {
        ["women", "men"].forEach((gender) => {
          const rate = getRate(item, propertyType, gender as "women" | "men");
          const rowStampDuty = value * (rate / 100);
          const rowRegistration = value * 0.01;
          rows.push({
            state: `Delhi (${gender === "women" ? "Women" : "Men"})`,
            rate,
            stampDuty: rowStampDuty,
            registration: rowRegistration,
            total: rowStampDuty + rowRegistration,
          });
        });
      } else {
        const rate = getRate(item, propertyType, ownerGender);
        const rowStampDuty = value * (rate / 100);
        const rowRegistration = value * 0.01;
        rows.push({
          state: item,
          rate,
          stampDuty: rowStampDuty,
          registration: rowRegistration,
          total: rowStampDuty + rowRegistration,
        });
      }
    });

    setResult({
      stampDuty,
      registrationCharge,
      totalCharges,
      effectiveRate,
      appliedRate,
      rows,
    });
  }, [propertyValue, state, propertyType, ownerGender]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Property Value": propertyValue, "State": state, "Property Type": propertyType, "Owner Gender": ownerGender },
        outputs: { "Stamp Duty": result.stampDuty, "Registration Charges": result.registrationCharge, "Total Charges": result.totalCharges, "Effective Rate": result.effectiveRate + "%" },
      };
    }
  }, [propertyValue, state, propertyType, ownerGender, result]);
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Property Value": propertyValue, "State": state, "Property Type": propertyType, "Owner Gender": ownerGender }, outputs: { "Stamp Duty": result.stampDuty, "Registration Charges": result.registrationCharge, "Total Charges": result.totalCharges, "Effective Rate": result.effectiveRate + "%" } }; }, [propertyValue, state, propertyType, ownerGender, result]);

  return (
    <CalculatorShell
      title="Stamp Duty Calculator"
      subtitle="State-wise stamp duty and registration charges"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Property Value" value={propertyValue} onChange={setPropertyValue} />

          <Field label="State">
            <select
              value={state}
              onChange={(e) => setState(e.target.value as keyof typeof STAMP_DUTY_RATES)}
              className="glass-select w-full h-11 px-3 rounded-[10px] text-sm focus:outline-none focus:border-[rgba(249,115,22,0.5)]"
            >
              {states.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>

          <Field label="Property Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["residential", "commercial"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setPropertyType(item)}
                  className={cn(
                    "py-2 text-sm font-medium rounded-md transition-all capitalize",
                    propertyType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          {state === "Delhi" && propertyType === "residential" && (
            <Field label="Owner Gender (Delhi residential)">
              <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
                {(["women", "men"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setOwnerGender(item)}
                    className={cn(
                      "py-2 text-sm font-medium rounded-md transition-all capitalize",
                      ownerGender === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Stamp Duty" value={formatINR(result.stampDuty)} />
            <MiniStat label="Registration Charge (1%)" value={formatINR(result.registrationCharge)} />
            <MiniStat label="Total Charges" value={formatINR(result.totalCharges)} green />
            <MiniStat label="Effective Rate" value={formatPct(result.effectiveRate)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-xs text-secondary">
            Applied Stamp Duty Rate: {formatPct(result.appliedRate)}
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">All States Comparison</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">State</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Rate</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Stamp Duty</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Registration</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={`${row.state}-${index}`} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.state}</td>
                      <td className="px-3 py-2 text-right">{formatPct(row.rate)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.stampDuty)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.registration)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function WACCCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [equityValue, setEquityValue] = useState("");
  const [debtValue, setDebtValue] = useState("");
  const [costOfEquity, setCostOfEquity] = useState("");
  const [costOfDebt, setCostOfDebt] = useState("");
  const [taxRate, setTaxRate] = useState("25");
  const [result, setResult] = useState({
    wacc: 0,
    weightEquity: 0,
    weightDebt: 0,
    afterTaxCostOfDebt: 0,
    formulaText: "",
  });

  useEffect(() => {
    const equity = toNum(equityValue);
    const debt = toNum(debtValue);
    const coe = toNum(costOfEquity);
    const cod = toNum(costOfDebt);
    const tax = toNum(taxRate);

    const totalCapital = equity + debt;
    const weightEquity = totalCapital > 0 ? equity / totalCapital : 0;
    const weightDebt = totalCapital > 0 ? debt / totalCapital : 0;
    const afterTaxCostOfDebt = cod * (1 - tax / 100);
    const wacc = (weightEquity * coe) + (weightDebt * afterTaxCostOfDebt);

    const formulaText = `(${weightEquity.toFixed(4)} x ${coe.toFixed(2)}%) + (${weightDebt.toFixed(4)} x ${afterTaxCostOfDebt.toFixed(2)}%) = ${wacc.toFixed(2)}%`;

    setResult({
      wacc,
      weightEquity: weightEquity * 100,
      weightDebt: weightDebt * 100,
      afterTaxCostOfDebt,
      formulaText,
    });
  }, [equityValue, debtValue, costOfEquity, costOfDebt, taxRate]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Equity Value": equityValue, "Debt Value": debtValue, "Cost Of Equity": costOfEquity, "Cost Of Debt": costOfDebt, "Tax Rate": taxRate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Equity Value": equityValue, "Debt Value": debtValue, "Cost Of Equity": costOfEquity, "Cost Of Debt": costOfDebt, "Tax Rate": taxRate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="WACC Calculator"
      subtitle="Weighted average cost of capital"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Equity Value" value={equityValue} onChange={setEquityValue} />
          <MoneyInput label="Debt Value" value={debtValue} onChange={setDebtValue} />
          <NumberInput label="Cost of Equity (%)" value={costOfEquity} onChange={setCostOfEquity} />
          <NumberInput label="Cost of Debt (%)" value={costOfDebt} onChange={setCostOfDebt} />
          <NumberInput label="Tax Rate (%)" value={taxRate} onChange={setTaxRate} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="WACC" value={formatPct(result.wacc)} green />
            <MiniStat label="Weight Equity" value={formatPct(result.weightEquity)} />
            <MiniStat label="Weight Debt" value={formatPct(result.weightDebt)} />
            <MiniStat label="After-tax Cost of Debt" value={formatPct(result.afterTaxCostOfDebt)} />
          </div>

          <div className="card-surface p-4 border border-white/10">
            <div className="text-xs uppercase tracking-wide text-tertiary">Formula with Substituted Values</div>
            <div className="mt-2 text-sm text-secondary">{result.formulaText}</div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            A project is viable if its return exceeds WACC of {formatPct(result.wacc)}.
          </div>
        </div>
      )}
    />
  );
}

function DCFCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [cashFlows, setCashFlows] = useState<string[]>(["0", "250000", "300000", "360000", "420000", "480000"]);
  const [terminalGrowth, setTerminalGrowth] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [netDebt, setNetDebt] = useState("");
  const [sharesOutstanding, setSharesOutstanding] = useState("");
  const [result, setResult] = useState({
    enterpriseValue: 0,
    equityValue: 0,
    pricePerShare: 0,
    terminalValue: 0,
    pvTerminalValue: 0,
    terminalPercent: 0,
    rows: [] as Array<{ year: number; fcf: number; pv: number }>,
  });

  useEffect(() => {
    const flows = cashFlows.map((value) => toNum(value));
    const g = toNum(terminalGrowth) / 100;
    const r = toNum(discountRate) / 100;
    const debt = toNum(netDebt);
    const shares = toNum(sharesOutstanding);

    const rows: Array<{ year: number; fcf: number; pv: number }> = [];
    let pvOfFcfs = 0;

    flows.forEach((fcf, year) => {
      const pv = fcf / (1 + r) ** year;
      pvOfFcfs += pv;
      rows.push({ year, fcf, pv });
    });

    const lastFcf = flows.length ? flows[flows.length - 1] : 0;
    const n = Math.max(0, flows.length - 1);
    const terminalValue = r > g ? (lastFcf * (1 + g)) / (r - g) : 0;
    const pvTerminalValue = terminalValue / (1 + r) ** n;

    const enterpriseValue = pvOfFcfs + pvTerminalValue;
    const equityValue = enterpriseValue - debt;
    const pricePerShare = shares > 0 ? equityValue / shares : 0;
    const terminalPercent = enterpriseValue > 0 ? (pvTerminalValue / enterpriseValue) * 100 : 0;

    setResult({
      enterpriseValue,
      equityValue,
      pricePerShare,
      terminalValue,
      pvTerminalValue,
      terminalPercent,
      rows,
    });
  }, [cashFlows, terminalGrowth, discountRate, netDebt, sharesOutstanding]);

  const updateCashFlow = (index: number, value: string) => {
    setCashFlows((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addYear = () => {
    if (cashFlows.length >= 10) return;
    setCashFlows((prev) => [...prev, "0"]);
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Cash Flows": cashFlows, "Terminal Growth": terminalGrowth, "Discount Rate": discountRate, "Net Debt": netDebt, "Shares Outstanding": sharesOutstanding },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Cash Flows": cashFlows, "Terminal Growth": terminalGrowth, "Discount Rate": discountRate, "Net Debt": netDebt, "Shares Outstanding": sharesOutstanding }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="DCF Valuation"
      subtitle="Discounted cash flow enterprise and equity valuation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
            <button
              onClick={addYear}
              disabled={cashFlows.length >= 10}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-orange text-white disabled:opacity-50"
            >
              Add Year
            </button>
          </div>

          {cashFlows.map((value, index) => (
            <MoneyInput
              key={`dcf-year-${index}`}
              label={`Year ${index} Free Cash Flow`}
              value={value}
              onChange={(val) => updateCashFlow(index, val)}
            />
          ))}

          <NumberInput label="Terminal Growth Rate (%)" value={terminalGrowth} onChange={setTerminalGrowth} />
          <NumberInput label="Discount Rate / WACC (%)" value={discountRate} onChange={setDiscountRate} />
          <MoneyInput label="Net Debt (Optional)" value={netDebt} onChange={setNetDebt} />
          <NumberInput label="Shares Outstanding (Optional)" value={sharesOutstanding} onChange={setSharesOutstanding} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Enterprise Value" value={formatINR(result.enterpriseValue)} green />
            <MiniStat label="Equity Value" value={formatINR(result.equityValue)} />
            <MiniStat label="Price Per Share" value={formatINR(result.pricePerShare)} />
            <MiniStat label="Terminal Value Contribution" value={formatPct(result.terminalPercent)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-xs text-secondary">
            Terminal Value: {formatINR(result.terminalValue)} | PV of Terminal Value: {formatINR(result.pvTerminalValue)}
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">PV Breakdown</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">FCF</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Present Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">Year {row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.fcf)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.pv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function SampleSizeCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [populationSize, setPopulationSize] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState<"90" | "95" | "99">("95");
  const [tolerableErrorRate, setTolerableErrorRate] = useState("");
  const [expectedErrorRate, setExpectedErrorRate] = useState("");
  const [populationValue, setPopulationValue] = useState("");
  const [tolerableMisstatement, setTolerableMisstatement] = useState("1000000");
  const [result, setResult] = useState({
    sampleSize: 0,
    rawN: 0,
    adjustedN: 0,
    musSize: 0,
    zValue: 1.96,
  });

  useEffect(() => {
    const N = Math.max(1, toNum(populationSize));
    const e = Math.max(0.0001, toNum(tolerableErrorRate) / 100);
    const p = Math.min(0.9999, Math.max(0.0001, toNum(expectedErrorRate) / 100));
    const zMap: Record<"90" | "95" | "99", number> = { "90": 1.645, "95": 1.96, "99": 2.576 };
    const zValue = zMap[confidenceLevel];

    const rawN = (zValue ** 2 * p * (1 - p)) / (e ** 2);
    const adjustedN = rawN / (1 + (rawN - 1) / N);
    const sampleSize = Math.ceil(adjustedN);

    const popValue = toNum(populationValue);
    const tolMiss = toNum(tolerableMisstatement);
    const musSize = tolMiss > 0 ? popValue / (tolMiss / zValue) : 0;

    setResult({
      sampleSize,
      rawN,
      adjustedN,
      musSize,
      zValue,
    });
  }, [populationSize, confidenceLevel, tolerableErrorRate, expectedErrorRate, populationValue, tolerableMisstatement]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Population Size": populationSize, "Confidence Level": confidenceLevel, "Tolerable Error Rate": tolerableErrorRate, "Expected Error Rate": expectedErrorRate, "Population Value": populationValue, "Tolerable Misstatement": tolerableMisstatement },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Population Size": populationSize, "Confidence Level": confidenceLevel, "Tolerable Error Rate": tolerableErrorRate, "Expected Error Rate": expectedErrorRate, "Population Value": populationValue, "Tolerable Misstatement": tolerableMisstatement }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Audit Sample Size Calculator"
      subtitle="Attribute sampling and MUS estimate"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <NumberInput label="Population Size" value={populationSize} onChange={setPopulationSize} />

          <Field label="Confidence Level">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["90", "95", "99"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setConfidenceLevel(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all",
                    confidenceLevel === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}%
                </button>
              ))}
            </div>
          </Field>

          <NumberInput label="Tolerable Error Rate (%)" value={tolerableErrorRate} onChange={setTolerableErrorRate} />
          <NumberInput label="Expected Error Rate (%)" value={expectedErrorRate} onChange={setExpectedErrorRate} />
          <MoneyInput label="Population Value (for MUS)" value={populationValue} onChange={setPopulationValue} />
          <MoneyInput label="Tolerable Misstatement (for MUS)" value={tolerableMisstatement} onChange={setTolerableMisstatement} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Sample Size" value={Math.max(0, result.sampleSize).toLocaleString("en-IN")} green />
            <MiniStat label="MUS Size" value={Math.ceil(Math.max(0, result.musSize)).toLocaleString("en-IN")} />
            <MiniStat label="Raw n" value={formatNum(result.rawN)} />
            <MiniStat label="Adjusted n" value={formatNum(result.adjustedN)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Test {Math.max(0, result.sampleSize).toLocaleString("en-IN")} items from population of {Math.max(1, toNum(populationSize)).toLocaleString("en-IN")} with {confidenceLevel}% confidence.
          </div>
        </div>
      )}
    />
  );
}

function Section80CCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [epf, setEpf] = useState("");
  const [ppf, setPpf] = useState("");
  const [elss, setElss] = useState("");
  const [lic, setLic] = useState("");
  const [homePrincipal, setHomePrincipal] = useState("");
  const [tuitionFees, setTuitionFees] = useState("");
  const [nscFd, setNscFd] = useState("");
  const [healthSelfFamily, setHealthSelfFamily] = useState("");
  const [healthParents, setHealthParents] = useState("");
  const [npsAdditional, setNpsAdditional] = useState("");
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
  const [isParentsSeniorCitizen, setIsParentsSeniorCitizen] = useState(false);
  const [result, setResult] = useState({
    total80C: 0,
    total80D: 0,
    totalNPS: 0,
    grandTotalDeduction: 0,
    unused80CCapacity: 0,
    taxSavingAt30: 0,
    taxSavingAt20: 0,
    taxSavingAt5: 0,
    raw80C: 0,
  });

  useEffect(() => {
    const raw80C =
      toNum(epf) +
      toNum(ppf) +
      toNum(elss) +
      toNum(lic) +
      toNum(homePrincipal) +
      toNum(tuitionFees) +
      toNum(nscFd);

    const total80C = Math.min(raw80C, 150000);

    const selfFamilyCap = isSeniorCitizen ? 50000 : 25000;
    const parentsCap = isParentsSeniorCitizen ? 50000 : 25000;
    const total80D = Math.min(toNum(healthSelfFamily), selfFamilyCap) + Math.min(toNum(healthParents), parentsCap);

    const totalNPS = Math.min(toNum(npsAdditional), 50000);
    const grandTotalDeduction = total80C + total80D + totalNPS;
    const unused80CCapacity = Math.max(0, 150000 - total80C);

    setResult({
      total80C,
      total80D,
      totalNPS,
      grandTotalDeduction,
      unused80CCapacity,
      taxSavingAt30: grandTotalDeduction * 0.3,
      taxSavingAt20: grandTotalDeduction * 0.2,
      taxSavingAt5: grandTotalDeduction * 0.05,
      raw80C,
    });
  }, [
    epf,
    ppf,
    elss,
    lic,
    homePrincipal,
    tuitionFees,
    nscFd,
    healthSelfFamily,
    healthParents,
    npsAdditional,
    isSeniorCitizen,
    isParentsSeniorCitizen,
  ]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Epf": epf, "Ppf": ppf, "Elss": elss, "Lic": lic, "Home Principal": homePrincipal, "Tuition Fees": tuitionFees, "Nsc Fd": nscFd, "Health Self Family": healthSelfFamily, "Health Parents": healthParents, "Nps Additional": npsAdditional, "Is Senior Citizen": isSeniorCitizen, "Is Parents Senior Citizen": isParentsSeniorCitizen },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Epf": epf, "Ppf": ppf, "Elss": elss, "Lic": lic, "Home Principal": homePrincipal, "Tuition Fees": tuitionFees, "Nsc Fd": nscFd, "Health Self Family": healthSelfFamily, "Health Parents": healthParents, "Nps Additional": npsAdditional, "Is Senior Citizen": isSeniorCitizen, "Is Parents Senior Citizen": isParentsSeniorCitizen }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Section 80C / 80D Deduction Planner"
      subtitle="Optimize deductions across 80C, 80D and 80CCD(1B)"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">80C Inputs</h2>
          <MoneyInput label="EPF Contribution" value={epf} onChange={setEpf} />
          <MoneyInput label="PPF Investment" value={ppf} onChange={setPpf} />
          <MoneyInput label="ELSS Mutual Funds" value={elss} onChange={setElss} />
          <MoneyInput label="LIC Premium" value={lic} onChange={setLic} />
          <MoneyInput label="Home Loan Principal" value={homePrincipal} onChange={setHomePrincipal} />
          <MoneyInput label="Tuition Fees" value={tuitionFees} onChange={setTuitionFees} />
          <MoneyInput label="NSC / Tax Saving FD" value={nscFd} onChange={setNscFd} />

          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary pt-2">80D + 80CCD(1B)</h2>
          <MoneyInput label="Self & Family Health Premium" value={healthSelfFamily} onChange={setHealthSelfFamily} />
          <MoneyInput label="Parents Health Premium" value={healthParents} onChange={setHealthParents} />
          <MoneyInput label="NPS Additional (80CCD(1B))" value={npsAdditional} onChange={setNpsAdditional} />

          <Field label="Senior Citizen Status">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10 gap-1">
              <button
                onClick={() => setIsSeniorCitizen((v) => !v)}
                className={cn(
                  "py-2 text-xs font-medium rounded-md transition-all",
                  isSeniorCitizen ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                )}
              >
                Self/Family Senior: {isSeniorCitizen ? "Yes" : "No"}
              </button>
              <button
                onClick={() => setIsParentsSeniorCitizen((v) => !v)}
                className={cn(
                  "py-2 text-xs font-medium rounded-md transition-all",
                  isParentsSeniorCitizen ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                )}
              >
                Parents Senior: {isParentsSeniorCitizen ? "Yes" : "No"}
              </button>
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total 80C (Capped)" value={formatINR(result.total80C)} />
            <MiniStat label="Unused 80C Capacity" value={formatINR(result.unused80CCapacity)} />
            <MiniStat label="Total 80D" value={formatINR(result.total80D)} />
            <MiniStat label="Total NPS (80CCD(1B))" value={formatINR(result.totalNPS)} />
            <MiniStat label="Grand Total Deduction" value={formatINR(result.grandTotalDeduction)} green />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Tax Saving @ 30%</div>
              <div className="mt-2 text-lg font-bold text-gradient-orange">{formatINR(result.taxSavingAt30)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Tax Saving @ 20%</div>
              <div className="mt-2 text-lg font-bold">{formatINR(result.taxSavingAt20)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Tax Saving @ 5%</div>
              <div className="mt-2 text-lg font-bold">{formatINR(result.taxSavingAt5)}</div>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function BalanceTransferCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [currentLoanBalance, setCurrentLoanBalance] = useState("");
  const [currentInterestRate, setCurrentInterestRate] = useState("");
  const [currentRemainingTenure, setCurrentRemainingTenure] = useState("");
  const [newInterestRate, setNewInterestRate] = useState("");
  const [processingFee, setProcessingFee] = useState("");
  const [prepaymentPenalty, setPrepaymentPenalty] = useState("");
  const [result, setResult] = useState({
    oldEMI: 0,
    newEMI: 0,
    monthlySaving: 0,
    totalInterestSaved: 0,
    switchingCost: 0,
    netSaving: 0,
    breakevenMonths: 0,
    recommended: false,
  });

  useEffect(() => {
    const balance = toNum(currentLoanBalance);
    const oldRate = toNum(currentInterestRate);
    const tenure = Math.max(1, Math.floor(toNum(currentRemainingTenure)));
    const newRate = toNum(newInterestRate);
    const processPct = toNum(processingFee);
    const penaltyPct = toNum(prepaymentPenalty);

    const oldEMI = calculateEMIFromPrincipal(balance, oldRate, tenure);
    const newEMI = calculateEMIFromPrincipal(balance, newRate, tenure);
    const monthlySaving = oldEMI - newEMI;

    const totalInterestOld = oldEMI * tenure - balance;
    const totalInterestNew = newEMI * tenure - balance;
    const totalInterestSaved = totalInterestOld - totalInterestNew;

    const switchingCost = (processPct / 100) * balance + (penaltyPct / 100) * balance;
    const netSaving = totalInterestSaved - switchingCost;
    const breakevenMonths = monthlySaving > 0 ? switchingCost / monthlySaving : 0;

    setResult({
      oldEMI,
      newEMI,
      monthlySaving,
      totalInterestSaved,
      switchingCost,
      netSaving,
      breakevenMonths,
      recommended: netSaving > 0,
    });
  }, [
    currentLoanBalance,
    currentInterestRate,
    currentRemainingTenure,
    newInterestRate,
    processingFee,
    prepaymentPenalty,
  ]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Current Loan Balance": currentLoanBalance, "Current Interest Rate": currentInterestRate, "Current Remaining Tenure": currentRemainingTenure, "New Interest Rate": newInterestRate, "Processing Fee": processingFee, "Prepayment Penalty": prepaymentPenalty },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Current Loan Balance": currentLoanBalance, "Current Interest Rate": currentInterestRate, "Current Remaining Tenure": currentRemainingTenure, "New Interest Rate": newInterestRate, "Processing Fee": processingFee, "Prepayment Penalty": prepaymentPenalty }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Loan Balance Transfer Calculator"
      subtitle="Compare refinancing savings against switching cost"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Current Loan Balance" value={currentLoanBalance} onChange={setCurrentLoanBalance} />
          <NumberInput label="Current Interest Rate (%)" value={currentInterestRate} onChange={setCurrentInterestRate} />
          <NumberInput label="Remaining Tenure (Months)" value={currentRemainingTenure} onChange={setCurrentRemainingTenure} />
          <NumberInput label="New Interest Rate (%)" value={newInterestRate} onChange={setNewInterestRate} />
          <NumberInput label="Processing Fee (%)" value={processingFee} onChange={setProcessingFee} />
          <NumberInput label="Prepayment Penalty (%)" value={prepaymentPenalty} onChange={setPrepaymentPenalty} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Old EMI" value={formatINR(result.oldEMI)} />
            <MiniStat label="New EMI" value={formatINR(result.newEMI)} />
            <MiniStat label="Monthly EMI Saving" value={formatINR(result.monthlySaving)} />
            <MiniStat label="Total Interest Saved" value={formatINR(result.totalInterestSaved)} />
            <MiniStat label="Switching Cost" value={formatINR(result.switchingCost)} />
            <MiniStat label="Net Saving" value={formatINR(result.netSaving)} green={result.netSaving > 0} />
            <MiniStat label="Breakeven (Months)" value={formatNum(result.breakevenMonths)} />
          </div>

          <div className={cn(
            "card-surface p-4 border text-sm",
            result.recommended ? "border-success/40 text-success" : "border-red-400/40 text-red-400"
          )}>
            {result.recommended ? "Worth switching" : "Not recommended"}
          </div>
        </div>
      )}
    />
  );
}

function DividendTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [dividendAmount, setDividendAmount] = useState("");
  const [shareholderType, setShareholderType] = useState<"individual" | "company" | "NRI">("individual");
  const [taxSlab, setTaxSlab] = useState<"5" | "20" | "30">("30");
  const [hasDTAA, setHasDTAA] = useState(false);
  const [result, setResult] = useState({
    grossDividend: 0,
    tdsDeducted: 0,
    netDividendReceived: 0,
    additionalTaxIfAny: 0,
    totalTaxOnDividend: 0,
    effectiveRate: 0,
  });

  useEffect(() => {
    const gross = toNum(dividendAmount);
    let tdsDeducted = 0;
    let totalTaxOnDividend = 0;

    if (shareholderType === "individual") {
      const slabRate = toNum(taxSlab) / 100;
      totalTaxOnDividend = gross * slabRate;
      tdsDeducted = gross > 5000 ? gross * 0.1 : 0;
    } else if (shareholderType === "company") {
      totalTaxOnDividend = gross * 0.22;
      tdsDeducted = 0;
    } else {
      if (hasDTAA) {
        totalTaxOnDividend = gross * 0.1;
      } else {
        const baseTax = gross * 0.2;
        const surcharge = baseTax * 0.1;
        const cess = (baseTax + surcharge) * 0.04;
        totalTaxOnDividend = baseTax + surcharge + cess;
      }
      tdsDeducted = totalTaxOnDividend;
    }

    const additionalTaxIfAny = Math.max(0, totalTaxOnDividend - tdsDeducted);
    const netDividendReceived = gross - tdsDeducted;
    const effectiveRate = gross > 0 ? (totalTaxOnDividend / gross) * 100 : 0;

    setResult({
      grossDividend: gross,
      tdsDeducted,
      netDividendReceived,
      additionalTaxIfAny,
      totalTaxOnDividend,
      effectiveRate,
    });
  }, [dividendAmount, shareholderType, taxSlab, hasDTAA]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Dividend Amount": dividendAmount, "Shareholder Type": shareholderType, "Tax Slab": taxSlab, "Has Dtaa": hasDTAA },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Dividend Amount": dividendAmount, "Shareholder Type": shareholderType, "Tax Slab": taxSlab, "Has D T A A": hasDTAA }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Dividend Tax Calculator"
      subtitle="Estimate withholding and final tax by shareholder type"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Dividend Amount" value={dividendAmount} onChange={setDividendAmount} />

          <Field label="Shareholder Type">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["individual", "company", "NRI"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setShareholderType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all capitalize",
                    shareholderType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tax Slab (Individual)">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["5", "20", "30"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTaxSlab(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all",
                    taxSlab === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}%
                </button>
              ))}
            </div>
          </Field>

          {shareholderType === "NRI" && (
            <Field label="DTAA Available">
              <button
                onClick={() => setHasDTAA((v) => !v)}
                className={cn(
                  "w-full py-2 text-sm font-medium rounded-md transition-all border",
                  hasDTAA
                    ? "bg-gradient-orange text-white glow-orange border-transparent"
                    : "text-secondary border-white/10 hover:text-[var(--text-primary)]"
                )}
              >
                {hasDTAA ? "Yes (Use 10% DTAA rate)" : "No (Use 20% + surcharge + cess)"}
              </button>
            </Field>
          )}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Gross Dividend" value={formatINR(result.grossDividend)} />
            <MiniStat label="TDS Deducted" value={formatINR(result.tdsDeducted)} />
            <MiniStat label="Net Dividend Received" value={formatINR(result.netDividendReceived)} green />
            <MiniStat label="Additional Tax If Any" value={formatINR(result.additionalTaxIfAny)} />
            <MiniStat label="Total Tax on Dividend" value={formatINR(result.totalTaxOnDividend)} />
            <MiniStat label="Effective Rate" value={formatPct(result.effectiveRate)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            TDS of 10% deducted by company if dividend &gt; ₹5,000 annually
          </div>
        </div>
      )}
    />
  );
}

function ROEDetailCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [netIncome, setNetIncome] = useState("");
  const [revenue, setRevenue] = useState("");
  const [totalAssets, setTotalAssets] = useState("");
  const [shareholderEquity, setShareholderEquity] = useState("");
  const [result, setResult] = useState({
    basicROE: 0,
    netProfitMarginPct: 0,
    assetTurnover: 0,
    equityMultiplier: 0,
    dupontROE: 0,
    driver: "",
  });

  useEffect(() => {
    const ni = toNum(netIncome);
    const rev = toNum(revenue);
    const assets = toNum(totalAssets);
    const equity = toNum(shareholderEquity);

    const basicROE = equity > 0 ? (ni / equity) * 100 : 0;
    const netProfitMarginPct = rev > 0 ? (ni / rev) * 100 : 0;
    const assetTurnover = assets > 0 ? rev / assets : 0;
    const equityMultiplier = equity > 0 ? assets / equity : 0;
    const dupontROE = netProfitMarginPct * assetTurnover * equityMultiplier;

    const marginScore = Math.abs(netProfitMarginPct);
    const efficiencyScore = Math.abs(assetTurnover);
    const leverageScore = Math.abs(equityMultiplier);
    let driver = "Balanced contribution across margin, efficiency, and leverage.";
    if (marginScore >= efficiencyScore && marginScore >= leverageScore) {
      driver = "ROE is primarily driven by profit margin.";
    } else if (efficiencyScore >= marginScore && efficiencyScore >= leverageScore) {
      driver = "ROE is primarily driven by asset efficiency (turnover).";
    } else if (leverageScore >= marginScore && leverageScore >= efficiencyScore) {
      driver = "ROE is primarily driven by financial leverage.";
    }

    setResult({
      basicROE,
      netProfitMarginPct,
      assetTurnover,
      equityMultiplier,
      dupontROE,
      driver,
    });
  }, [netIncome, revenue, totalAssets, shareholderEquity]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Net Income": netIncome, "Revenue": revenue, "Total Assets": totalAssets, "Shareholder Equity": shareholderEquity },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Net Income": netIncome, "Revenue": revenue, "Total Assets": totalAssets, "Shareholder Equity": shareholderEquity }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Return on Equity (ROE) — DuPont Analysis"
      subtitle="Understand whether ROE is driven by margin, efficiency, or leverage"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Net Income" value={netIncome} onChange={setNetIncome} />
          <MoneyInput label="Revenue" value={revenue} onChange={setRevenue} />
          <MoneyInput label="Total Assets" value={totalAssets} onChange={setTotalAssets} />
          <MoneyInput label="Shareholder Equity" value={shareholderEquity} onChange={setShareholderEquity} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Basic ROE" value={formatPct(result.basicROE)} green />
            <MiniStat label="DuPont ROE" value={formatPct(result.dupontROE)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Net Profit Margin</div>
              <div className="mt-2 text-xl font-bold">{formatPct(result.netProfitMarginPct)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Asset Turnover</div>
              <div className="mt-2 text-xl font-bold">{formatNum(result.assetTurnover)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Equity Multiplier</div>
              <div className="mt-2 text-xl font-bold">{formatNum(result.equityMultiplier)}</div>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            {formatPct(result.netProfitMarginPct)} × {formatNum(result.assetTurnover)} × {formatNum(result.equityMultiplier)} = {formatPct(result.dupontROE)}
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.driver}</div>
        </div>
      )}
    />
  );
}

function IRRCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [cashFlows, setCashFlows] = useState<string[]>(["250000", "300000", "350000", "400000"]);
  const [reinvestmentRate, setReinvestmentRate] = useState("");
  const [result, setResult] = useState({
    irr: 0,
    mirr: 0,
    npvProfile: [] as Array<{ rate: number; npv: number }>,
  });

  useEffect(() => {
    const investment = toNum(initialInvestment);
    const flows = cashFlows.map((value) => toNum(value));
    const n = flows.length;
    const reinvestRate = toNum(reinvestmentRate) / 100;

    const npvAtRate = (ratePct: number) => {
      const rate = ratePct / 100;
      return -investment + flows.reduce((sum, cf, idx) => sum + cf / (1 + rate) ** (idx + 1), 0);
    };

    let irr = 0;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let rate = 0; rate <= 200; rate += 0.01) {
      const npv = npvAtRate(rate);
      const diff = Math.abs(npv);
      if (diff < bestDiff) {
        bestDiff = diff;
        irr = rate;
      }
      if (diff < 1) break;
    }

    const fvPositive = flows.reduce((sum, cf, idx) => {
      if (cf <= 0) return sum;
      return sum + cf * (1 + reinvestRate) ** (n - (idx + 1));
    }, 0);

    const pvNegative = investment + flows.reduce((sum, cf, idx) => {
      if (cf >= 0) return sum;
      return sum + Math.abs(cf) / (1 + reinvestRate) ** (idx + 1);
    }, 0);

    const mirr = n > 0 && pvNegative > 0
      ? ((fvPositive / pvNegative) ** (1 / n) - 1) * 100
      : 0;

    const profileRates = [5, 10, 15, 20, 25, 30];
    const npvProfile = profileRates.map((rate) => ({
      rate,
      npv: npvAtRate(rate),
    }));

    setResult({ irr, mirr, npvProfile });
  }, [initialInvestment, cashFlows, reinvestmentRate]);

  const addYear = () => {
    if (cashFlows.length >= 10) return;
    setCashFlows((prev) => [...prev, "0"]);
  };

  const updateCashFlow = (index: number, value: string) => {
    setCashFlows((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Initial Investment": initialInvestment, "Cash Flows": cashFlows, "Reinvestment Rate": reinvestmentRate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Initial Investment": initialInvestment, "Cash Flows": cashFlows, "Reinvestment Rate": reinvestmentRate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="IRR Calculator"
      subtitle="IRR and MIRR analysis with NPV profile"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
            <button
              onClick={addYear}
              disabled={cashFlows.length >= 10}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-orange text-white disabled:opacity-50"
            >
              Add Year
            </button>
          </div>

          <MoneyInput label="Initial Investment" value={initialInvestment} onChange={setInitialInvestment} />
          {cashFlows.map((value, index) => (
            <MoneyInput
              key={`irr-cf-${index + 1}`}
              label={`Year ${index + 1} Cash Flow`}
              value={value}
              onChange={(val) => updateCashFlow(index, val)}
            />
          ))}
          <NumberInput label="Reinvestment Rate (%)" value={reinvestmentRate} onChange={setReinvestmentRate} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="IRR" value={formatPct(result.irr)} green />
            <MiniStat label="MIRR" value={formatPct(result.mirr)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Accept project if IRR &gt; cost of capital.
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">NPV Profile</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Rate</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">NPV</th>
                  </tr>
                </thead>
                <tbody>
                  {result.npvProfile.map((row, index) => (
                    <tr key={row.rate} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.rate}%</td>
                      <td className={cn("px-5 py-2 text-right font-medium", row.npv >= 0 ? "text-success" : "text-red-400")}>{formatINR(row.npv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function PaybackCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [cashFlows, setCashFlows] = useState<string[]>(["250000", "300000", "350000", "400000"]);
  const [result, setResult] = useState({
    simplePaybackMonths: 0,
    discountedPaybackMonths: 0,
    simpleLabel: "Not achieved",
    discountedLabel: "Not achieved",
    simpleAchievedYear: -1,
    discountedAchievedYear: -1,
    rows: [] as Array<{
      year: number;
      cashFlow: number;
      cumulativeSimple: number;
      pvCashFlow: number;
      cumulativeDiscounted: number;
      highlight: boolean;
    }>,
  });

  useEffect(() => {
    const investment = toNum(initialInvestment);
    const rate = toNum(discountRate) / 100;
    const flows = cashFlows.map((value) => toNum(value));

    let cumulativeSimple = 0;
    let cumulativeDiscounted = 0;
    let simplePaybackMonths = 0;
    let discountedPaybackMonths = 0;
    let simpleFound = false;
    let discountedFound = false;
    let simpleAchievedYear = -1;
    let discountedAchievedYear = -1;

    const rows = flows.map((cf, idx) => {
      const year = idx + 1;

      const prevSimple = cumulativeSimple;
      cumulativeSimple += cf;
      if (!simpleFound && cumulativeSimple >= investment && cf > 0) {
        const fraction = (investment - prevSimple) / cf;
        simplePaybackMonths = Math.max(0, (idx + fraction) * 12);
        simpleFound = true;
        simpleAchievedYear = year;
      }

      const pvCashFlow = cf / (1 + rate) ** year;
      const prevDiscounted = cumulativeDiscounted;
      cumulativeDiscounted += pvCashFlow;
      if (!discountedFound && cumulativeDiscounted >= investment && pvCashFlow > 0) {
        const fraction = (investment - prevDiscounted) / pvCashFlow;
        discountedPaybackMonths = Math.max(0, (idx + fraction) * 12);
        discountedFound = true;
        discountedAchievedYear = year;
      }

      return {
        year,
        cashFlow: cf,
        cumulativeSimple,
        pvCashFlow,
        cumulativeDiscounted,
        highlight: year === simpleAchievedYear || year === discountedAchievedYear,
      };
    });

    const toYearsMonths = (months: number) => {
      const yearsInt = Math.floor(months / 12);
      const monthsInt = Math.round(months % 12);
      return `${yearsInt}y ${monthsInt}m`;
    };

    setResult({
      simplePaybackMonths,
      discountedPaybackMonths,
      simpleLabel: simpleFound ? toYearsMonths(simplePaybackMonths) : "Not achieved",
      discountedLabel: discountedFound ? toYearsMonths(discountedPaybackMonths) : "Not achieved",
      simpleAchievedYear,
      discountedAchievedYear,
      rows,
    });
  }, [initialInvestment, discountRate, cashFlows]);

  const addYear = () => {
    if (cashFlows.length >= 8) return;
    setCashFlows((prev) => [...prev, "0"]);
  };

  const updateCashFlow = (index: number, value: string) => {
    setCashFlows((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Initial Investment": initialInvestment, "Discount Rate": discountRate, "Cash Flows": cashFlows },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Initial Investment": initialInvestment, "Discount Rate": discountRate, "Cash Flows": cashFlows }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Payback Period Calculator"
      subtitle="Simple and discounted payback analysis"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
            <button
              onClick={addYear}
              disabled={cashFlows.length >= 8}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-orange text-white disabled:opacity-50"
            >
              Add Year
            </button>
          </div>
          <MoneyInput label="Initial Investment" value={initialInvestment} onChange={setInitialInvestment} />
          <NumberInput label="Discount Rate (%)" value={discountRate} onChange={setDiscountRate} />
          {cashFlows.map((value, index) => (
            <MoneyInput
              key={`payback-cf-${index + 1}`}
              label={`Year ${index + 1} Cash Flow`}
              value={value}
              onChange={(val) => updateCashFlow(index, val)}
            />
          ))}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Simple Payback" value={result.simpleLabel} green />
            <MiniStat label="Discounted Payback" value={result.discountedLabel} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Cumulative Cash Flow Table</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Cash Flow</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Cumulative Simple</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">PV of CF</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Cumulative Discounted</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.year} className={cn(index % 2 ? "bg-white/[0.02]" : "", row.highlight && "bg-primary/10") }>
                      <td className={cn("px-5 py-2 text-secondary", row.highlight && "text-primary font-semibold")}>{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.cashFlow)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.cumulativeSimple)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.pvCashFlow)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.cumulativeDiscounted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function LumpsumCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [principalAmount, setPrincipalAmount] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [years, setYears] = useState("");
  const [inflationRate, setInflationRate] = useState("");
  const [result, setResult] = useState({
    futureValue: 0,
    realValueAfterInflation: 0,
    wealthGained: 0,
    absoluteReturn: 0,
    cagr: 0,
    rows: [] as Array<{ year: number; your: number; fd: number; savings: number; real: number }>,
  });

  useEffect(() => {
    const principal = toNum(principalAmount);
    const nominal = toNum(expectedReturn);
    const y = Math.max(0, Math.floor(toNum(years)));
    const inflation = toNum(inflationRate);

    const futureValue = principal * (1 + nominal / 100) ** y;
    const realReturn = ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100;
    const realValueAfterInflation = principal * (1 + realReturn / 100) ** y;
    const wealthGained = futureValue - principal;
    const absoluteReturn = principal > 0 ? (wealthGained / principal) * 100 : 0;
    const cagr = y > 0 && principal > 0 ? ((futureValue / principal) ** (1 / y) - 1) * 100 : 0;

    const rows = Array.from({ length: y }, (_, idx) => {
      const year = idx + 1;
      return {
        year,
        your: principal * (1 + nominal / 100) ** year,
        fd: principal * (1 + 7 / 100) ** year,
        savings: principal * (1 + 4 / 100) ** year,
        real: principal * (1 + realReturn / 100) ** year,
      };
    });

    setResult({
      futureValue,
      realValueAfterInflation,
      wealthGained,
      absoluteReturn,
      cagr,
      rows,
    });
  }, [principalAmount, expectedReturn, years, inflationRate]);

  const latest = result.rows[result.rows.length - 1];

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Principal Amount": principalAmount, "Expected Return": expectedReturn, "Years": years, "Inflation Rate": inflationRate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Principal Amount": principalAmount, "Expected Return": expectedReturn, "Years": years, "Inflation Rate": inflationRate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Lumpsum Investment Calculator"
      subtitle="Nominal and inflation-adjusted growth comparison"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Principal Amount" value={principalAmount} onChange={setPrincipalAmount} />
          <NumberInput label="Expected Return (%)" value={expectedReturn} onChange={setExpectedReturn} />
          <NumberInput label="Years" value={years} onChange={setYears} />
          <NumberInput label="Inflation Rate (%)" value={inflationRate} onChange={setInflationRate} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Future Value" value={formatINR(result.futureValue)} green />
            <MiniStat label="Real Value After Inflation" value={formatINR(result.realValueAfterInflation)} />
            <MiniStat label="Wealth Gained" value={formatINR(result.wealthGained)} />
            <MiniStat label="Absolute Return" value={formatPct(result.absoluteReturn)} />
            <MiniStat label="CAGR" value={formatPct(result.cagr)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Comparison (Final Year)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Instrument</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-2 text-secondary">Your Investment</td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(latest?.your ?? 0)}</td>
                  </tr>
                  <tr className="bg-white/[0.02]">
                    <td className="px-5 py-2 text-secondary">FD @ 7%</td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(latest?.fd ?? 0)}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-2 text-secondary">Savings @ 4%</td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(latest?.savings ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Year-by-year Growth</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Your Investment</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">FD @ 7%</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Savings @ 4%</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Real Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.your)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.fd)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.savings)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.real)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function ESICalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [grossSalary, setGrossSalary] = useState("");
  const [result, setResult] = useState({
    applicable: true,
    employeeESI: 0,
    employerESI: 0,
    totalESI: 0,
    annualESI: 0,
    rows: [] as Array<{ salary: number; employee: number; employer: number; total: number }>,
  });

  useEffect(() => {
    const gross = toNum(grossSalary);
    const applicable = gross <= 21000;

    const employeeESI = applicable ? gross * 0.0075 : 0;
    const employerESI = applicable ? gross * 0.0325 : 0;
    const totalESI = employeeESI + employerESI;
    const annualESI = totalESI * 12;

    const rows: Array<{ salary: number; employee: number; employer: number; total: number }> = [];
    for (let salary = 10000; salary <= 21000; salary += 1000) {
      const employee = salary * 0.0075;
      const employer = salary * 0.0325;
      rows.push({ salary, employee, employer, total: employee + employer });
    }

    setResult({
      applicable,
      employeeESI,
      employerESI,
      totalESI,
      annualESI,
      rows,
    });
  }, [grossSalary]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Gross Salary": grossSalary },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Gross Salary": grossSalary }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="ESI (Employee State Insurance) Calculator"
      subtitle="Monthly and annual ESI contribution breakdown"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Gross Salary (Monthly)" value={grossSalary} onChange={setGrossSalary} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          {!result.applicable && (
            <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
              Not applicable — gross salary exceeds ₹21,000 limit
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Employee ESI (0.75%)" value={formatINR(result.employeeESI)} />
            <MiniStat label="Employer ESI (3.25%)" value={formatINR(result.employerESI)} />
            <MiniStat label="Total ESI (4%)" value={formatINR(result.totalESI)} green />
            <MiniStat label="Annual ESI" value={formatINR(result.annualESI)} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Benefits covered: medical, maternity, disability, dependent benefit
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">ESI Contribution Table (₹10,000 to ₹21,000)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Salary</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Employee</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Employer</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.salary} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{formatINR(row.salary)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.employee)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.employer)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function CarLoanCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [carPrice, setCarPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureYears, setTenureYears] = useState("");
  const [processingFeePercent, setProcessingFeePercent] = useState("");
  const [insuranceAmount, setInsuranceAmount] = useState("");
  const [result, setResult] = useState({
    loanAmount: 0,
    monthlyEMI: 0,
    totalInterest: 0,
    totalCostOfOwnership: 0,
    effectiveInterestRate: 0,
    comparisons: [] as Array<{ years: number; emi: number; totalInterest: number }>,
  });

  useEffect(() => {
    const price = toNum(carPrice);
    const dp = toNum(downPayment);
    const rate = toNum(interestRate);
    const years = Math.max(1, Math.floor(toNum(tenureYears)));
    const insurance = toNum(insuranceAmount);
    const feePct = toNum(processingFeePercent);

    const loanAmount = Math.max(0, price - dp);
    const months = years * 12;
    const monthlyEMI = calculateEMIFromPrincipal(loanAmount, rate, months);
    const totalInterest = monthlyEMI * months - loanAmount;

    const processingFee = loanAmount * feePct / 100;
    const totalCostOfOwnership = dp + monthlyEMI * months + insurance;
    const effectiveInterestRate = loanAmount > 0
      ? ((totalInterest + processingFee) / loanAmount / years) * 100
      : 0;

    const tenures = [3, 5, 7];
    const comparisons = tenures.map((y) => {
      const m = y * 12;
      const emi = calculateEMIFromPrincipal(loanAmount, rate, m);
      const ti = emi * m - loanAmount;
      return { years: y, emi, totalInterest: ti };
    });

    setResult({
      loanAmount,
      monthlyEMI,
      totalInterest,
      totalCostOfOwnership,
      effectiveInterestRate,
      comparisons,
    });
  }, [carPrice, downPayment, interestRate, tenureYears, processingFeePercent, insuranceAmount]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Car Price": carPrice, "Down Payment": downPayment, "Interest Rate": interestRate, "Tenure Years": tenureYears, "Processing Fee Percent": processingFeePercent, "Insurance Amount": insuranceAmount },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Car Price": carPrice, "Down Payment": downPayment, "Interest Rate": interestRate, "Tenure Years": tenureYears, "Processing Fee Percent": processingFeePercent, "Insurance Amount": insuranceAmount }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Car Loan EMI Calculator"
      subtitle="On-road financing and tenure comparison"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Car Price" value={carPrice} onChange={setCarPrice} />
          <MoneyInput label="Down Payment" value={downPayment} onChange={setDownPayment} />
          <NumberInput label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} />
          <NumberInput label="Tenure (Years)" value={tenureYears} onChange={setTenureYears} />
          <NumberInput label="Processing Fee (%)" value={processingFeePercent} onChange={setProcessingFeePercent} />
          <MoneyInput label="Insurance Amount" value={insuranceAmount} onChange={setInsuranceAmount} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Loan Amount" value={formatINR(result.loanAmount)} />
            <MiniStat label="Monthly EMI" value={formatINR(result.monthlyEMI)} />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
            <MiniStat label="Total Cost of Ownership" value={formatINR(result.totalCostOfOwnership)} green />
            <MiniStat label="Effective Interest Rate" value={formatPct(result.effectiveInterestRate)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {result.comparisons.map((item) => (
              <div key={item.years} className="card-surface p-4">
                <div className="text-xs uppercase tracking-wide text-tertiary">{item.years} Years</div>
                <div className="mt-2 text-sm text-secondary">EMI</div>
                <div className="text-lg font-bold text-gradient-orange">{formatINR(item.emi)}</div>
                <div className="mt-2 text-xs text-secondary">Interest: {formatINR(item.totalInterest)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}

function PersonalLoanCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [processingFeePercent, setProcessingFeePercent] = useState("");
  const [result, setResult] = useState({
    monthlyEMI: 0,
    processingFee: 0,
    totalInterest: 0,
    totalPayment: 0,
    effectiveAPR: 0,
    amortization: [] as Array<{ month: number; principal: number; interest: number; balance: number }>,
  });

  useEffect(() => {
    const principal = toNum(loanAmount);
    const rate = toNum(interestRate);
    const months = Math.max(1, Math.floor(toNum(tenureMonths)));
    const feePct = toNum(processingFeePercent);

    const monthlyEMI = calculateEMIFromPrincipal(principal, rate, months);
    const totalPayment = monthlyEMI * months;
    const totalInterest = totalPayment - principal;
    const processingFee = principal * feePct / 100;
    const effectiveAPR = principal > 0
      ? ((totalInterest + processingFee) / principal / (months / 12)) * 100
      : 0;

    const r = rate / 12 / 100;
    let balance = principal;
    const amortization: Array<{ month: number; principal: number; interest: number; balance: number }> = [];
    for (let month = 1; month <= Math.min(6, months); month += 1) {
      const interest = r === 0 ? 0 : balance * r;
      const principalPart = Math.min(balance, monthlyEMI - interest);
      balance = Math.max(0, balance - principalPart);
      amortization.push({ month, principal: principalPart, interest, balance });
    }

    setResult({
      monthlyEMI,
      processingFee,
      totalInterest,
      totalPayment,
      effectiveAPR,
      amortization,
    });
  }, [loanAmount, interestRate, tenureMonths, processingFeePercent]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Loan Amount": loanAmount, "Interest Rate": interestRate, "Tenure Months": tenureMonths, "Processing Fee Percent": processingFeePercent },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Loan Amount": loanAmount, "Interest Rate": interestRate, "Tenure Months": tenureMonths, "Processing Fee Percent": processingFeePercent }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Personal Loan Calculator"
      subtitle="EMI, effective APR and first 6-month amortization"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} />
          <NumberInput label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} />
          <NumberInput label="Tenure (Months)" value={tenureMonths} onChange={setTenureMonths} />
          <NumberInput label="Processing Fee (%)" value={processingFeePercent} onChange={setProcessingFeePercent} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Monthly EMI" value={formatINR(result.monthlyEMI)} />
            <MiniStat label="Processing Fee" value={formatINR(result.processingFee)} />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
            <MiniStat label="Total Payment" value={formatINR(result.totalPayment)} />
            <MiniStat label="Effective APR" value={formatPct(result.effectiveAPR)} green />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Amortization (First 6 Months)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Month</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Principal</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Interest</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.amortization.map((row, index) => (
                    <tr key={row.month} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.month}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.principal)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.interest)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function PrepaymentCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [originalLoan, setOriginalLoan] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [originalTenureMonths, setOriginalTenureMonths] = useState("");
  const [monthsPaid, setMonthsPaid] = useState("");
  const [prepaymentAmount, setPrepaymentAmount] = useState("");
  const [prepaymentPenaltyPercent, setPrepaymentPenaltyPercent] = useState("2");
  const [result, setResult] = useState({
    remainingBalance: 0,
    penaltyAmount: 0,
    optionA: { newTenure: 0, monthsSaved: 0, interestSaved: 0, netSaving: 0 },
    optionB: { newEMI: 0, emiSaving: 0, totalSaving: 0 },
  });

  useEffect(() => {
    const principal = toNum(originalLoan);
    const annualRate = toNum(interestRate);
    const tenure = Math.max(1, Math.floor(toNum(originalTenureMonths)));
    const paid = Math.min(tenure - 1, Math.max(0, Math.floor(toNum(monthsPaid))));
    const prepay = Math.max(0, toNum(prepaymentAmount));
    const penaltyPct = toNum(prepaymentPenaltyPercent);

    const emi = calculateEMIFromPrincipal(principal, annualRate, tenure);
    const r = annualRate / 12 / 100;

    let remainingBalance = principal;
    let interestPaidSoFar = 0;
    for (let i = 0; i < paid; i += 1) {
      const interest = r === 0 ? 0 : remainingBalance * r;
      const principalPart = Math.min(remainingBalance, emi - interest);
      remainingBalance = Math.max(0, remainingBalance - principalPart);
      interestPaidSoFar += interest;
    }

    const balanceAfterPrepayment = Math.max(0, remainingBalance - prepay);
    const penaltyAmount = prepay * penaltyPct / 100;
    const remainingTenure = Math.max(1, tenure - paid);

    let newTenureA = 0;
    let interestOnNewBalanceA = 0;
    if (balanceAfterPrepayment > 0) {
      if (r === 0) {
        newTenureA = Math.ceil(balanceAfterPrepayment / emi);
      } else {
        newTenureA = Math.ceil(Math.log(emi / (emi - balanceAfterPrepayment * r)) / Math.log(1 + r));
      }
      let balA = balanceAfterPrepayment;
      for (let i = 0; i < newTenureA; i += 1) {
        const interest = r === 0 ? 0 : balA * r;
        const principalPart = Math.min(balA, emi - interest);
        balA = Math.max(0, balA - principalPart);
        interestOnNewBalanceA += interest;
      }
    }

    const originalTotalInterest = emi * tenure - principal;
    const interestSavedA = originalTotalInterest - interestPaidSoFar - interestOnNewBalanceA;
    const monthsSaved = Math.max(0, remainingTenure - newTenureA);
    const netSavingA = interestSavedA - penaltyAmount;

    const newEMI = calculateEMIFromPrincipal(balanceAfterPrepayment, annualRate, remainingTenure);
    const totalInterestNewB = newEMI * remainingTenure - balanceAfterPrepayment;
    const totalInterestOldRemaining = emi * remainingTenure - remainingBalance;
    const totalSavingB = totalInterestOldRemaining - totalInterestNewB - penaltyAmount;
    const emiSaving = emi - newEMI;

    setResult({
      remainingBalance,
      penaltyAmount,
      optionA: {
        newTenure: newTenureA,
        monthsSaved,
        interestSaved: interestSavedA,
        netSaving: netSavingA,
      },
      optionB: {
        newEMI,
        emiSaving,
        totalSaving: totalSavingB,
      },
    });
  }, [originalLoan, interestRate, originalTenureMonths, monthsPaid, prepaymentAmount, prepaymentPenaltyPercent]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Original Loan": originalLoan, "Interest Rate": interestRate, "Original Tenure Months": originalTenureMonths, "Months Paid": monthsPaid, "Prepayment Amount": prepaymentAmount, "Prepayment Penalty Percent": prepaymentPenaltyPercent },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Original Loan": originalLoan, "Interest Rate": interestRate, "Original Tenure Months": originalTenureMonths, "Months Paid": monthsPaid, "Prepayment Amount": prepaymentAmount, "Prepayment Penalty Percent": prepaymentPenaltyPercent }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Loan Prepayment Savings Calculator"
      subtitle="Compare reduced tenure vs reduced EMI after prepayment"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Original Loan" value={originalLoan} onChange={setOriginalLoan} />
          <NumberInput label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} />
          <NumberInput label="Original Tenure (Months)" value={originalTenureMonths} onChange={setOriginalTenureMonths} />
          <NumberInput label="Months Paid" value={monthsPaid} onChange={setMonthsPaid} />
          <MoneyInput label="Prepayment Amount" value={prepaymentAmount} onChange={setPrepaymentAmount} />
          <NumberInput label="Prepayment Penalty (%)" value={prepaymentPenaltyPercent} onChange={setPrepaymentPenaltyPercent} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Remaining Balance" value={formatINR(result.remainingBalance)} />
            <MiniStat label="Penalty Amount" value={formatINR(result.penaltyAmount)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Option A: Reduced Tenure</div>
              <div className="mt-2 text-xs text-secondary">New Tenure: {result.optionA.newTenure.toLocaleString("en-IN")} months</div>
              <div className="text-xs text-secondary">Months Saved: {result.optionA.monthsSaved.toLocaleString("en-IN")}</div>
              <div className="text-xs text-secondary">Interest Saved: {formatINR(result.optionA.interestSaved)}</div>
              <div className="mt-2 text-sm font-semibold">Net Saving: {formatINR(result.optionA.netSaving)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">Option B: Reduced EMI</div>
              <div className="mt-2 text-xs text-secondary">New EMI: {formatINR(result.optionB.newEMI)}</div>
              <div className="text-xs text-secondary">EMI Saving: {formatINR(result.optionB.emiSaving)} / month</div>
              <div className="mt-2 text-sm font-semibold">Total Saving: {formatINR(result.optionB.totalSaving)}</div>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function GSTLateFeeCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [returnType, setReturnType] = useState<"GSTR-1" | "GSTR-3B" | "GSTR-9">("GSTR-3B");
  const [dueDate, setDueDate] = useState("2026-04-20");
  const [filingDate, setFilingDate] = useState("2026-04-25");
  const [taxPayable, setTaxPayable] = useState("");
  const [isNilReturn, setIsNilReturn] = useState(false);
  const [result, setResult] = useState({
    daysLate: 0,
    cgstLateFee: 0,
    sgstLateFee: 0,
    lateFee: 0,
    interestAmount: 0,
    totalPenalty: 0,
    dailyRows: [] as Array<{ day: number; cumulativeLateFee: number; cumulativeInterest: number }>,
  });

  useEffect(() => {
    const due = new Date(dueDate);
    const filing = new Date(filingDate);
    const payable = toNum(taxPayable);

    const msPerDay = 24 * 60 * 60 * 1000;
    const rawDays = Math.floor((filing.getTime() - due.getTime()) / msPerDay);
    const daysLate = Math.max(0, Number.isFinite(rawDays) ? rawDays : 0);

    let dailyTotalFee = 0;
    let maxTotalFee = 0;

    if (returnType === "GSTR-9") {
      dailyTotalFee = 200;
      maxTotalFee = payable * 0.0025;
    } else if (isNilReturn) {
      dailyTotalFee = 20;
      maxTotalFee = 1000;
    } else {
      dailyTotalFee = 50;
      maxTotalFee = 20000;
    }

    const lateFee = Math.min(daysLate * dailyTotalFee, maxTotalFee);
    const cgstLateFee = lateFee / 2;
    const sgstLateFee = lateFee / 2;
    const interestAmount = payable > 0 ? payable * 0.18 * daysLate / 365 : 0;
    const totalPenalty = lateFee + interestAmount;

    const dailyRows: Array<{ day: number; cumulativeLateFee: number; cumulativeInterest: number }> = [];
    if (daysLate > 0 && daysLate < 30) {
      for (let day = 1; day <= daysLate; day += 1) {
        const cumulativeLateFee = Math.min(day * dailyTotalFee, maxTotalFee);
        const cumulativeInterest = payable > 0 ? payable * 0.18 * day / 365 : 0;
        dailyRows.push({ day, cumulativeLateFee, cumulativeInterest });
      }
    }

    setResult({
      daysLate,
      cgstLateFee,
      sgstLateFee,
      lateFee,
      interestAmount,
      totalPenalty,
      dailyRows,
    });
  }, [returnType, dueDate, filingDate, taxPayable, isNilReturn]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Return Type": returnType, "Due Date": dueDate, "Filing Date": filingDate, "Tax Payable": taxPayable, "Is Nil Return": isNilReturn },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Return Type": returnType, "Due Date": dueDate, "Filing Date": filingDate, "Tax Payable": taxPayable, "Is Nil Return": isNilReturn }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="GST Late Fee Calculator"
      subtitle="Late fee and interest computation by return type"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <Field label="Return Type">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["GSTR-1", "GSTR-3B", "GSTR-9"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setReturnType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all",
                    returnType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Due Date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            />
          </Field>

          <Field label="Filing Date">
            <input
              type="date"
              value={filingDate}
              onChange={(e) => setFilingDate(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            />
          </Field>

          <MoneyInput label="Tax Payable" value={taxPayable} onChange={setTaxPayable} />

          <Field label="Nil Return">
            <button
              onClick={() => setIsNilReturn((v) => !v)}
              className={cn(
                "w-full py-2 text-sm font-medium rounded-md transition-all border",
                isNilReturn
                  ? "bg-gradient-orange text-white glow-orange border-transparent"
                  : "text-secondary border-white/10 hover:text-[var(--text-primary)]"
              )}
            >
              {isNilReturn ? "Yes" : "No"}
            </button>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Days Late" value={result.daysLate.toLocaleString("en-IN")} />
            <MiniStat label="Late Fee" value={formatINR(result.lateFee)} />
            <MiniStat label="CGST Portion" value={formatINR(result.cgstLateFee)} />
            <MiniStat label="SGST Portion" value={formatINR(result.sgstLateFee)} />
            <MiniStat label="Interest Amount" value={formatINR(result.interestAmount)} />
            <MiniStat label="Total Penalty" value={formatINR(result.totalPenalty)} green />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Penalty Breakdown</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="px-5 py-2 text-secondary">Late fee (CGST)</td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(result.cgstLateFee)}</td>
                  </tr>
                  <tr className="bg-white/[0.02]">
                    <td className="px-5 py-2 text-secondary">Late fee (SGST)</td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(result.sgstLateFee)}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-2 text-secondary">Interest @ 18% p.a.</td>
                    <td className="px-5 py-2 text-right font-medium">{formatINR(result.interestAmount)}</td>
                  </tr>
                  <tr className="border-t border-primary/20 bg-primary/5">
                    <td className="px-5 py-2.5 font-bold">Total</td>
                    <td className="px-5 py-2.5 text-right font-bold text-primary">{formatINR(result.totalPenalty)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {result.dailyRows.length > 0 && (
            <div className="card-surface p-5 overflow-hidden">
              <div className="text-sm font-semibold mb-3">Daily Breakdown</div>
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-tertiary">
                      <th className="text-left font-medium px-5 py-2 bg-primary/10">Day</th>
                      <th className="text-right font-medium px-3 py-2 bg-primary/10">Cumulative Late Fee</th>
                      <th className="text-right font-medium px-5 py-2 bg-primary/10">Cumulative Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.dailyRows.map((row, index) => (
                      <tr key={row.day} className={index % 2 ? "bg-white/[0.02]" : ""}>
                        <td className="px-5 py-2 text-secondary">{row.day}</td>
                        <td className="px-3 py-2 text-right">{formatINR(row.cumulativeLateFee)}</td>
                        <td className="px-5 py-2 text-right font-medium">{formatINR(row.cumulativeInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}

function ITCReconciliationCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [igst2B, setIgst2B] = useState("");
  const [cgst2B, setCgst2B] = useState("");
  const [sgst2B, setSgst2B] = useState("");
  const [igstClaimed, setIgstClaimed] = useState("");
  const [cgstClaimed, setCgstClaimed] = useState("");
  const [sgstClaimed, setSgstClaimed] = useState("");
  const [igstReversed, setIgstReversed] = useState("");
  const [cgstReversed, setCgstReversed] = useState("");
  const [sgstReversed, setSgstReversed] = useState("");
  const [result, setResult] = useState({
    rows: [] as Array<{
      type: "IGST" | "CGST" | "SGST";
      available: number;
      claimed: number;
      reversed: number;
      netEligible: number;
      difference: number;
      status: "Excess Claimed" | "Under Claimed" | "Matched";
    }> ,
    totalAvailable: 0,
    totalClaimed: 0,
    totalDifference: 0,
    hasExcess: false,
  });

  useEffect(() => {
    const buildRow = (
      type: "IGST" | "CGST" | "SGST",
      available: number,
      claimed: number,
      reversed: number
    ) => {
      const netEligible = available - reversed;
      const difference = claimed - available;
      const status: "Excess Claimed" | "Under Claimed" | "Matched" = difference > 0
        ? "Excess Claimed"
        : difference < 0
          ? "Under Claimed"
          : "Matched";
      return { type, available, claimed, reversed, netEligible, difference, status };
    };

    const rows = [
      buildRow("IGST", toNum(igst2B), toNum(igstClaimed), toNum(igstReversed)),
      buildRow("CGST", toNum(cgst2B), toNum(cgstClaimed), toNum(cgstReversed)),
      buildRow("SGST", toNum(sgst2B), toNum(sgstClaimed), toNum(sgstReversed)),
    ];

    const totalAvailable = rows.reduce((sum, row) => sum + row.available, 0);
    const totalClaimed = rows.reduce((sum, row) => sum + row.claimed, 0);
    const totalDifference = rows.reduce((sum, row) => sum + row.difference, 0);
    const hasExcess = rows.some((row) => row.status === "Excess Claimed");

    setResult({ rows, totalAvailable, totalClaimed, totalDifference, hasExcess });
  }, [
    igst2B,
    cgst2B,
    sgst2B,
    igstClaimed,
    cgstClaimed,
    sgstClaimed,
    igstReversed,
    cgstReversed,
    sgstReversed,
  ]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Igst2B": igst2B, "Cgst2B": cgst2B, "Sgst2B": sgst2B, "Igst Claimed": igstClaimed, "Cgst Claimed": cgstClaimed, "Sgst Claimed": sgstClaimed, "Igst Reversed": igstReversed, "Cgst Reversed": cgstReversed, "Sgst Reversed": sgstReversed },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Igst2 B": igst2B, "Cgst2 B": cgst2B, "Sgst2 B": sgst2B, "Igst Claimed": igstClaimed, "Cgst Claimed": cgstClaimed, "Sgst Claimed": sgstClaimed, "Igst Reversed": igstReversed, "Cgst Reversed": cgstReversed, "Sgst Reversed": sgstReversed }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="GST ITC Reconciliation"
      subtitle="Compare GSTR-2B, claimed ITC and reversals"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MoneyInput label="IGST as per 2B" value={igst2B} onChange={setIgst2B} />
            <MoneyInput label="IGST Claimed" value={igstClaimed} onChange={setIgstClaimed} />
            <MoneyInput label="CGST as per 2B" value={cgst2B} onChange={setCgst2B} />
            <MoneyInput label="CGST Claimed" value={cgstClaimed} onChange={setCgstClaimed} />
            <MoneyInput label="SGST as per 2B" value={sgst2B} onChange={setSgst2B} />
            <MoneyInput label="SGST Claimed" value={sgstClaimed} onChange={setSgstClaimed} />
            <MoneyInput label="IGST Reversed" value={igstReversed} onChange={setIgstReversed} />
            <MoneyInput label="CGST Reversed" value={cgstReversed} onChange={setCgstReversed} />
            <MoneyInput label="SGST Reversed" value={sgstReversed} onChange={setSgstReversed} />
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">ITC Summary</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Type</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Available</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Claimed</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Reversed</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Net Eligible</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Difference</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.type} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.type}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.available)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.claimed)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.reversed)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.netEligible)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.difference)}</td>
                      <td className="px-5 py-2 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-pill text-[10px] font-semibold border",
                          row.status === "Excess Claimed"
                            ? "text-red-400 border-red-400/40 bg-red-400/10"
                            : row.status === "Under Claimed"
                              ? "text-warning border-warning/40 bg-warning/10"
                              : "text-success border-success/40 bg-success/10"
                        )}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-primary/20 bg-primary/5">
                    <td className="px-5 py-2.5 font-bold">Total</td>
                    <td className="px-3 py-2.5 text-right font-bold">{formatINR(result.totalAvailable)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{formatINR(result.totalClaimed)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">-</td>
                    <td className="px-3 py-2.5 text-right font-bold">-</td>
                    <td className="px-3 py-2.5 text-right font-bold">{formatINR(result.totalDifference)}</td>
                    <td className="px-5 py-2.5 text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            {result.hasExcess
              ? "Reverse excess ITC in next return"
              : "No excess claim detected based on current reconciliation."}
          </div>
        </div>
      )}
    />
  );
}

function DebtEquityCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [totalDebt, setTotalDebt] = useState("");
  const [totalEquity, setTotalEquity] = useState("");
  const [totalAssets, setTotalAssets] = useState("");
  const [ebit, setEbit] = useState("");
  const [interestExpense, setInterestExpense] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [cards, setCards] = useState(
    [] as Array<{
      key: string;
      label: string;
      value: number;
      healthyRange: string;
      interpretation: string;
      status: "Healthy" | "Caution" | "Risk";
    }>
  );

  useEffect(() => {
    const debt = toNum(totalDebt);
    const equity = toNum(totalEquity);
    const assets = toNum(totalAssets);
    const ebitValue = toNum(ebit);
    const interest = toNum(interestExpense);
    const net = toNum(netIncome);
    const revenue = toNum(totalRevenue);

    const safeDiv = (num: number, den: number): number => (den > 0 ? num / den : 0);
    const debtToEquity = safeDiv(debt, equity);
    const debtToAssets = safeDiv(debt, assets);
    const equityRatio = safeDiv(equity, assets);
    const interestCoverage = safeDiv(ebitValue, interest);
    const financialLeverage = safeDiv(assets, equity);
    const debtServiceCoverage = safeDiv(net, interest);

    const asStatus = (value: number, healthy: (v: number) => boolean, caution: (v: number) => boolean) => {
      if (healthy(value)) return "Healthy" as const;
      if (caution(value)) return "Caution" as const;
      return "Risk" as const;
    };

    setCards([
      {
        key: "de",
        label: "Debt to Equity",
        value: debtToEquity,
        healthyRange: "Healthy: < 2.00",
        interpretation: "Shows leverage relative to shareholder capital.",
        status: asStatus(debtToEquity, (v) => v < 2, (v) => v < 3),
      },
      {
        key: "da",
        label: "Debt to Assets",
        value: debtToAssets,
        healthyRange: "Healthy: < 0.50",
        interpretation: "Indicates what portion of assets is financed by debt.",
        status: asStatus(debtToAssets, (v) => v < 0.5, (v) => v < 0.7),
      },
      {
        key: "eq",
        label: "Equity Ratio",
        value: equityRatio,
        healthyRange: "Healthy: > 0.50",
        interpretation: "Higher ratio means stronger equity cushion.",
        status: asStatus(equityRatio, (v) => v > 0.5, (v) => v > 0.35),
      },
      {
        key: "ic",
        label: "Interest Coverage",
        value: interestCoverage,
        healthyRange: "Healthy: > 3.00",
        interpretation: "Measures capacity to service interest from operating profit.",
        status: asStatus(interestCoverage, (v) => v > 3, (v) => v > 1.5),
      },
      {
        key: "fl",
        label: "Financial Leverage",
        value: financialLeverage,
        healthyRange: "Context-based (lower is safer)",
        interpretation: "Reflects asset base supported by each unit of equity.",
        status: asStatus(financialLeverage, (v) => v <= 2.5, (v) => v <= 4),
      },
      {
        key: "dsc",
        label: "Debt Service Coverage",
        value: debtServiceCoverage,
        healthyRange: "Healthy: > 1.25",
        interpretation: "Tracks ability to meet debt obligations from earnings.",
        status: asStatus(debtServiceCoverage, (v) => v > 1.25, (v) => v > 1),
      },
      {
        key: "rev",
        label: "Debt to Revenue",
        value: safeDiv(debt, revenue),
        healthyRange: "Lower is better",
        interpretation: "Optional leverage context against top-line capacity.",
        status: asStatus(safeDiv(debt, revenue), (v) => v < 0.4, (v) => v < 0.7),
      },
    ].slice(0, 6));
  }, [totalDebt, totalEquity, totalAssets, ebit, interestExpense, netIncome, totalRevenue]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Total Debt": totalDebt, "Total Equity": totalEquity, "Total Assets": totalAssets, "Ebit": ebit, "Interest Expense": interestExpense, "Net Income": netIncome, "Total Revenue": totalRevenue, "Cards": cards },
        outputs: {  },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Total Debt": totalDebt, "Total Equity": totalEquity, "Total Assets": totalAssets, "Ebit": ebit, "Interest Expense": interestExpense, "Net Income": netIncome, "Total Revenue": totalRevenue, "Cards": cards }, outputs: {  } }; });

  return (
    <CalculatorShell
      title="Debt to Equity & Leverage Ratios"
      subtitle="Six key solvency and coverage ratios with health flags"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Total Debt" value={totalDebt} onChange={setTotalDebt} />
          <MoneyInput label="Total Equity" value={totalEquity} onChange={setTotalEquity} />
          <MoneyInput label="Total Assets" value={totalAssets} onChange={setTotalAssets} />
          <MoneyInput label="EBIT" value={ebit} onChange={setEbit} />
          <MoneyInput label="Interest Expense" value={interestExpense} onChange={setInterestExpense} />
          <MoneyInput label="Net Income" value={netIncome} onChange={setNetIncome} />
          <MoneyInput label="Total Revenue" value={totalRevenue} onChange={setTotalRevenue} />
        </div>
      )}
      outputPanel={(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.key} className="card-surface p-4 space-y-2">
              <div className="text-xs uppercase tracking-wide text-tertiary">{card.label}</div>
              <div className="text-2xl font-bold text-gradient-orange">{formatNum(card.value, 2)}x</div>
              <div className="text-[11px] text-secondary">{card.healthyRange}</div>
              <div className="text-xs text-secondary">{card.interpretation}</div>
              <span className={cn(
                "inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold border",
                card.status === "Healthy"
                  ? "text-success border-success/40 bg-success/10"
                  : card.status === "Caution"
                    ? "text-warning border-warning/40 bg-warning/10"
                    : "text-red-400 border-red-400/40 bg-red-400/10"
              )}>
                {card.status}
              </span>
            </div>
          ))}
        </div>
      )}
    />
  );
}

function LeaveEncashmentCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [basicSalary, setBasicSalary] = useState("");
  const [daPay, setDaPay] = useState("");
  const [leavesEncashed, setLeavesEncashed] = useState("");
  const [totalServiceYears, setTotalServiceYears] = useState("");
  const [isGovernmentEmployee, setIsGovernmentEmployee] = useState(false);
  const [result, setResult] = useState({
    totalEncashment: 0,
    exemptAmount: 0,
    taxableAmount: 0,
    limits: [] as Array<{ key: "actual" | "tenMonths" | "cashEquivalent" | "statutory"; label: string; value: number }>,
    appliedLimit: "actual" as "actual" | "tenMonths" | "cashEquivalent" | "statutory",
  });

  useEffect(() => {
    const basic = toNum(basicSalary);
    const da = toNum(daPay);
    const leaves = Math.max(0, Math.floor(toNum(leavesEncashed)));
    const years = Math.max(0, Math.floor(toNum(totalServiceYears)));
    const averageSalary = basic + da;
    const totalEncashment = averageSalary / 26 * leaves;

    const maxEarnedLeaveDays = years * 30;
    const eligibleLeaveDays = Math.min(leaves, maxEarnedLeaveDays);
    const cashEquivalent = averageSalary / 26 * eligibleLeaveDays;
    const tenMonthsAverageSalary = averageSalary * 10;
    const statutoryLimit = 2500000;

    const limits: Array<{ key: "actual" | "tenMonths" | "cashEquivalent" | "statutory"; label: string; value: number }> = [
      { key: "actual", label: "Actual leave encashment received", value: totalEncashment },
      { key: "tenMonths", label: "10 months average salary", value: tenMonthsAverageSalary },
      { key: "cashEquivalent", label: "Cash equivalent of earned leave", value: cashEquivalent },
      { key: "statutory", label: "Statutory limit under Section 10(10AA)", value: statutoryLimit },
    ];

    let exemptAmount = totalEncashment;
    let appliedLimit: "actual" | "tenMonths" | "cashEquivalent" | "statutory" = "actual";
    if (!isGovernmentEmployee) {
      const minLimit = limits.reduce((acc, item) => (item.value < acc.value ? item : acc), limits[0]);
      exemptAmount = minLimit.value;
      appliedLimit = minLimit.key;
    }

    const taxableAmount = Math.max(0, totalEncashment - exemptAmount);
    setResult({ totalEncashment, exemptAmount, taxableAmount, limits, appliedLimit });
  }, [basicSalary, daPay, leavesEncashed, totalServiceYears, isGovernmentEmployee]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Basic Salary": basicSalary, "Da Pay": daPay, "Leaves Encashed": leavesEncashed, "Total Service Years": totalServiceYears, "Is Government Employee": isGovernmentEmployee },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Basic Salary": basicSalary, "Da Pay": daPay, "Leaves Encashed": leavesEncashed, "Total Service Years": totalServiceYears, "Is Government Employee": isGovernmentEmployee }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Leave Encashment Tax Calculator"
      subtitle="Compute exemption and taxable amount under Section 10(10AA)"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Monthly Basic Salary" value={basicSalary} onChange={setBasicSalary} />
          <MoneyInput label="Monthly DA" value={daPay} onChange={setDaPay} />
          <NumberInput label="Leaves Encashed (Days)" value={leavesEncashed} onChange={setLeavesEncashed} />
          <NumberInput label="Total Service Years" value={totalServiceYears} onChange={setTotalServiceYears} />

          <Field label="Government Employee">
            <button
              onClick={() => setIsGovernmentEmployee((v) => !v)}
              className={cn(
                "w-full py-2 text-sm font-medium rounded-md transition-all border",
                isGovernmentEmployee
                  ? "bg-gradient-orange text-white glow-orange border-transparent"
                  : "text-secondary border-white/10 hover:text-[var(--text-primary)]"
              )}
            >
              {isGovernmentEmployee ? "Yes" : "No"}
            </button>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total Encashment" value={formatINR(result.totalEncashment)} />
            <MiniStat label="Exempt Amount" value={formatINR(result.exemptAmount)} green />
            <MiniStat label="Taxable Amount" value={formatINR(result.taxableAmount)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Exemption Limits</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Limit</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.limits.map((row, index) => (
                    <tr key={row.key} className={cn(index % 2 ? "bg-white/[0.02]" : "", !isGovernmentEmployee && result.appliedLimit === row.key && "bg-primary/10")}>
                      <td className="px-5 py-2 text-secondary">{row.label}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            {isGovernmentEmployee
              ? "Government employee: leave encashment is fully exempt under Section 10(10AA)."
              : "Exempt under Section 10(10AA). Applied limit is highlighted above."}
          </div>
        </div>
      )}
    />
  );
}

function CapitalGainsPropertyCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const ciiYears = Object.keys(CII_TABLE).map((y) => Number(y)).sort((a, b) => a - b);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [purchaseYear, setPurchaseYear] = useState(String(ciiYears[ciiYears.length - 3] ?? 2022));
  const [saleYear, setSaleYear] = useState(String(ciiYears[ciiYears.length - 1] ?? 2024));
  const [stampDutyPaid, setStampDutyPaid] = useState("");
  const [improvementCost, setImprovementCost] = useState("");
  const [brokerageSalePercent, setBrokerageSalePercent] = useState("1.5");
  const [slabRate, setSlabRate] = useState("30");
  const [result, setResult] = useState({
    holdingPeriod: 0,
    gainAmount: 0,
    indexedCost: 0,
    indexedImprovement: 0,
    netSalePrice: 0,
    saleExpenses: 0,
    tax20Indexation: 0,
    tax12_5NoIndexation: 0,
    stcgTaxAtSlab: 0,
    gainType: "LTCG" as "LTCG" | "STCG",
  });

  useEffect(() => {
    const purchase = toNum(purchasePrice);
    const sale = toNum(salePrice);
    const pYear = Math.floor(toNum(purchaseYear));
    const sYear = Math.floor(toNum(saleYear));
    const stampDuty = toNum(stampDutyPaid);
    const improve = toNum(improvementCost);
    const brokeragePct = toNum(brokerageSalePercent);
    const slab = toNum(slabRate);

    const holdingPeriod = Math.max(0, sYear - pYear);
    const saleExpenses = sale * brokeragePct / 100;
    const netSalePrice = Math.max(0, sale - saleExpenses);
    const purchaseCII = getCIIForYear(pYear);
    const saleCII = getCIIForYear(sYear);
    const indexFactor = purchaseCII > 0 ? saleCII / purchaseCII : 1;

    const indexedCost = (purchase + stampDuty) * indexFactor;
    const indexedImprovement = improve * indexFactor;

    if (holdingPeriod >= 2) {
      const ltcgIndexed = Math.max(0, netSalePrice - indexedCost - indexedImprovement);
      const ltcgNoIndex = Math.max(0, netSalePrice - (purchase + stampDuty + improve));
      const tax20Indexation = ltcgIndexed * 0.2;
      const tax12_5NoIndexation = ltcgNoIndex * 0.125;

      setResult({
        holdingPeriod,
        gainAmount: ltcgIndexed,
        indexedCost,
        indexedImprovement,
        netSalePrice,
        saleExpenses,
        tax20Indexation,
        tax12_5NoIndexation,
        stcgTaxAtSlab: 0,
        gainType: "LTCG",
      });
      return;
    }

    const stcg = Math.max(0, netSalePrice - (purchase + stampDuty + improve));
    setResult({
      holdingPeriod,
      gainAmount: stcg,
      indexedCost,
      indexedImprovement,
      netSalePrice,
      saleExpenses,
      tax20Indexation: 0,
      tax12_5NoIndexation: 0,
      stcgTaxAtSlab: stcg * slab / 100,
      gainType: "STCG",
    });
  }, [purchasePrice, salePrice, purchaseYear, saleYear, stampDutyPaid, improvementCost, brokerageSalePercent, slabRate]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Purchase Price": purchasePrice, "Sale Price": salePrice, "Purchase Year": purchaseYear, "Sale Year": saleYear, "Stamp Duty Paid": stampDutyPaid, "Improvement Cost": improvementCost, "Brokerage Sale Percent": brokerageSalePercent, "Slab Rate": slabRate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Purchase Price": purchasePrice, "Sale Price": salePrice, "Purchase Year": purchaseYear, "Sale Year": saleYear, "Stamp Duty Paid": stampDutyPaid, "Improvement Cost": improvementCost, "Brokerage Sale Percent": brokerageSalePercent, "Slab Rate": slabRate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Property Capital Gains Calculator"
      subtitle="LTCG/STCG with indexation and tax option comparison"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} />
          <MoneyInput label="Sale Price" value={salePrice} onChange={setSalePrice} />

          <Field label="Purchase Year (CII)">
            <select
              value={purchaseYear}
              onChange={(e) => setPurchaseYear(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            >
              {ciiYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </Field>

          <Field label="Sale Year (CII)">
            <select
              value={saleYear}
              onChange={(e) => setSaleYear(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            >
              {ciiYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </Field>

          <MoneyInput label="Stamp Duty Paid" value={stampDutyPaid} onChange={setStampDutyPaid} />
          <MoneyInput label="Improvement Cost" value={improvementCost} onChange={setImprovementCost} />
          <NumberInput label="Brokerage on Sale (%)" value={brokerageSalePercent} onChange={setBrokerageSalePercent} />
          <NumberInput label="Slab Rate for STCG (%)" value={slabRate} onChange={setSlabRate} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Holding Period (Years)" value={result.holdingPeriod.toLocaleString("en-IN")} />
            <MiniStat label="Net Sale Price" value={formatINR(result.netSalePrice)} />
            <MiniStat label="Sale Expenses" value={formatINR(result.saleExpenses)} />
            <MiniStat label="Indexed Cost" value={formatINR(result.indexedCost)} />
            <MiniStat label="Gain Amount" value={formatINR(result.gainAmount)} green />
          </div>

          {result.gainType === "LTCG" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card-surface p-4">
                <div className="text-xs uppercase tracking-wide text-tertiary">Tax Option 1</div>
                <div className="mt-2 text-sm text-secondary">20% with indexation</div>
                <div className="text-xl font-bold text-gradient-orange">{formatINR(result.tax20Indexation)}</div>
              </div>
              <div className="card-surface p-4">
                <div className="text-xs uppercase tracking-wide text-tertiary">Tax Option 2</div>
                <div className="mt-2 text-sm text-secondary">12.5% without indexation</div>
                <div className="text-xl font-bold text-gradient-orange">{formatINR(result.tax12_5NoIndexation)}</div>
              </div>
            </div>
          ) : (
            <div className="card-surface p-4">
              <div className="text-sm text-secondary">STCG taxed at slab rate</div>
              <div className="text-xl font-bold text-gradient-orange">{formatINR(result.stcgTaxAtSlab)}</div>
            </div>
          )}

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Note: Exemption may be available under Sections 54/54F if reinvested in eligible property.
          </div>
        </div>
      )}
    />
  );
}

function ITDepreciationCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const assetRates = {
    "Buildings (residential)": 5,
    "Buildings (commercial)": 10,
    "Furniture & Fittings": 10,
    "Plant & Machinery (general)": 15,
    "Motor Cars": 15,
    "Computers & Software": 40,
    "Intangible Assets": 25,
    Ships: 20,
  } as const;

  const [assetBlock, setAssetBlock] = useState<keyof typeof assetRates>("Plant & Machinery (general)");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [dateOfPurchase, setDateOfPurchase] = useState("2025-11-15");
  const [financialYearEnd, setFinancialYearEnd] = useState("2026-03-31");
  const [result, setResult] = useState({
    fullYearDepreciation: 0,
    applicableDepreciation: 0,
    closingWDV: 0,
    taxSavingAtSlab30: 0,
    schedule: [] as Array<{ year: number; openingWDV: number; rate: number; depreciation: number; closingWDV: number }> ,
  });

  useEffect(() => {
    const cost = Math.max(0, toNum(purchaseCost));
    const rate = assetRates[assetBlock];
    const purchaseDate = new Date(dateOfPurchase);
    const fyEndDate = new Date(financialYearEnd);
    const fyStartYear = fyEndDate.getFullYear() - 1;
    const halfYearCutoff = new Date(fyStartYear, 9, 1);
    const halfYearRule = purchaseDate > halfYearCutoff;

    const fullYearDepreciation = cost * rate / 100;
    const firstYearRate = halfYearRule ? rate / 2 : rate;
    const applicableDepreciation = cost * firstYearRate / 100;
    const closingWDV = Math.max(0, cost - applicableDepreciation);
    const taxSavingAtSlab30 = applicableDepreciation * 0.3;

    const schedule: Array<{ year: number; openingWDV: number; rate: number; depreciation: number; closingWDV: number }> = [];
    let opening = cost;
    for (let y = 1; y <= 5; y += 1) {
      const appliedRate = y === 1 ? firstYearRate : rate;
      const depreciation = opening * appliedRate / 100;
      const closing = Math.max(0, opening - depreciation);
      schedule.push({ year: y, openingWDV: opening, rate: appliedRate, depreciation, closingWDV: closing });
      opening = closing;
    }

    setResult({ fullYearDepreciation, applicableDepreciation, closingWDV, taxSavingAtSlab30, schedule });
  }, [assetBlock, purchaseCost, dateOfPurchase, financialYearEnd]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Asset Block": assetBlock, "Purchase Cost": purchaseCost, "Date Of Purchase": dateOfPurchase, "Financial Year End": financialYearEnd },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Asset Block": assetBlock, "Purchase Cost": purchaseCost, "Date Of Purchase": dateOfPurchase, "Financial Year End": financialYearEnd }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Income Tax Act Depreciation"
      subtitle="Block-rate depreciation with half-year rule and 5-year WDV schedule"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <Field label="Asset Block">
            <select
              value={assetBlock}
              onChange={(e) => setAssetBlock(e.target.value as keyof typeof assetRates)}
              className="glass-input w-full h-11 px-3 text-sm"
            >
              {Object.keys(assetRates).map((asset) => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </Field>

          <MoneyInput label="Purchase Cost" value={purchaseCost} onChange={setPurchaseCost} />

          <Field label="Date of Purchase">
            <input
              type="date"
              value={dateOfPurchase}
              onChange={(e) => setDateOfPurchase(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            />
          </Field>

          <Field label="Financial Year End">
            <input
              type="date"
              value={financialYearEnd}
              onChange={(e) => setFinancialYearEnd(e.target.value)}
              className="glass-input w-full h-11 px-3 text-sm"
            />
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Full-Year Depreciation" value={formatINR(result.fullYearDepreciation)} />
            <MiniStat label="Applicable Depreciation" value={formatINR(result.applicableDepreciation)} />
            <MiniStat label="Closing WDV" value={formatINR(result.closingWDV)} />
            <MiniStat label="Tax Saving @ 30%" value={formatINR(result.taxSavingAtSlab30)} green />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">5-Year Depreciation Schedule</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Opening WDV</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Rate</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Depreciation</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Closing WDV</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.openingWDV)}</td>
                      <td className="px-3 py-2 text-right">{formatPct(row.rate)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.depreciation)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.closingWDV)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function NetWorthCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type LineItem = { name: string; value: string };

  const [assets, setAssets] = useState<LineItem[]>([
    { name: "Cash & Bank", value: "500000" },
    { name: "Mutual Funds", value: "700000" },
    { name: "Stocks", value: "450000" },
    { name: "PPF/EPF", value: "600000" },
    { name: "Real Estate", value: "4500000" },
    { name: "Gold", value: "300000" },
    { name: "Vehicle", value: "650000" },
    { name: "Other", value: "100000" },
  ]);

  const [liabilities, setLiabilities] = useState<LineItem[]>([
    { name: "Home Loan", value: "2800000" },
    { name: "Car Loan", value: "250000" },
    { name: "Personal Loan", value: "100000" },
    { name: "Credit Card", value: "45000" },
    { name: "Other Loans", value: "50000" },
  ]);

  const [result, setResult] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    debtToAssetRatio: 0,
    assetBreakdown: [] as Array<{ name: string; value: number; pct: number }>,
    liabilityBreakdown: [] as Array<{ name: string; value: number; pct: number }>,
  });

  useEffect(() => {
    const assetRows = assets.map((item) => ({ name: item.name || "Unnamed Asset", value: toNum(item.value) }));
    const liabilityRows = liabilities.map((item) => ({ name: item.name || "Unnamed Liability", value: toNum(item.value) }));

    const totalAssets = assetRows.reduce((sum, item) => sum + item.value, 0);
    const totalLiabilities = liabilityRows.reduce((sum, item) => sum + item.value, 0);
    const netWorth = totalAssets - totalLiabilities;
    const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets * 100 : 0;

    const assetBreakdown = assetRows
      .filter((item) => item.value > 0)
      .map((item) => ({ ...item, pct: totalAssets > 0 ? item.value / totalAssets * 100 : 0 }));

    const liabilityBreakdown = liabilityRows
      .filter((item) => item.value > 0)
      .map((item) => ({ ...item, pct: totalLiabilities > 0 ? item.value / totalLiabilities * 100 : 0 }));

    setResult({ totalAssets, totalLiabilities, netWorth, debtToAssetRatio, assetBreakdown, liabilityBreakdown });
  }, [assets, liabilities]);

  const updateItem = (
    type: "asset" | "liability",
    index: number,
    patch: Partial<{ name: string; value: string }>
  ) => {
    if (type === "asset") {
      setAssets((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
      return;
    }
    setLiabilities((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = (type: "asset" | "liability") => {
    if (type === "asset") {
      setAssets((prev) => (prev.length >= 10 ? prev : [...prev, { name: "", value: "0" }]));
      return;
    }
    setLiabilities((prev) => (prev.length >= 10 ? prev : [...prev, { name: "", value: "0" }]));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Assets": assets, "Liabilities": liabilities },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Assets": assets, "Liabilities": liabilities }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Personal Net Worth Calculator"
      subtitle="Track assets, liabilities and leverage position"
      inputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Assets</h2>
              <button
                onClick={() => addItem("asset")}
                className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]"
              >
                Add Asset
              </button>
            </div>
            {assets.map((item, index) => (
              <div key={`asset-${index}`} className="grid grid-cols-[1fr_120px] gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem("asset", index, { name: e.target.value })}
                  placeholder="Asset name"
                  className="glass-input h-10 px-3 text-sm"
                />
                <input
                  inputMode="numeric"
                  value={item.value}
                  onChange={(e) => updateItem("asset", index, { value: e.target.value.replace(/[^0-9.]/g, "") })}
                  placeholder="0"
                  className="glass-input h-10 px-3 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Liabilities</h2>
              <button
                onClick={() => addItem("liability")}
                className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]"
              >
                Add Liability
              </button>
            </div>
            {liabilities.map((item, index) => (
              <div key={`liability-${index}`} className="grid grid-cols-[1fr_120px] gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem("liability", index, { name: e.target.value })}
                  placeholder="Liability name"
                  className="glass-input h-10 px-3 text-sm"
                />
                <input
                  inputMode="numeric"
                  value={item.value}
                  onChange={(e) => updateItem("liability", index, { value: e.target.value.replace(/[^0-9.]/g, "") })}
                  placeholder="0"
                  className="glass-input h-10 px-3 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total Assets" value={formatINR(result.totalAssets)} />
            <MiniStat label="Total Liabilities" value={formatINR(result.totalLiabilities)} />
            <div className="card-surface p-3 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-wide text-tertiary">Net Worth</div>
              <div className={cn("mt-1 text-2xl font-bold", result.netWorth >= 0 ? "text-success" : "text-red-400")}>
                ₹ {result.netWorth.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
            </div>
            <MiniStat label="Debt to Asset Ratio" value={formatPct(result.debtToAssetRatio)} />
          </div>

          <div className="card-surface p-4 space-y-3">
            <div className="text-sm font-semibold">Assets Breakdown</div>
            {result.assetBreakdown.map((item) => (
              <div key={`asset-bar-${item.name}`}>
                <div className="flex justify-between text-xs text-secondary mb-1">
                  <span>{item.name}</span>
                  <span>{formatNum(item.pct, 2)}%</span>
                </div>
                <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                  <div className="h-full bg-gradient-orange" style={{ width: `${Math.min(100, item.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card-surface p-4 space-y-3">
            <div className="text-sm font-semibold">Liabilities Breakdown</div>
            {result.liabilityBreakdown.map((item) => (
              <div key={`liability-bar-${item.name}`}>
                <div className="flex justify-between text-xs text-secondary mb-1">
                  <span>{item.name}</span>
                  <span>{formatNum(item.pct, 2)}%</span>
                </div>
                <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                  <div className="h-full bg-red-400/80" style={{ width: `${Math.min(100, item.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}

function WorkingCapitalCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [currentAssets, setCurrentAssets] = useState("");
  const [currentLiabilities, setCurrentLiabilities] = useState("");
  const [inventory, setInventory] = useState("");
  const [accountsReceivable, setAccountsReceivable] = useState("");
  const [accountsPayable, setAccountsPayable] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [annualCOGS, setAnnualCOGS] = useState("");
  const [result, setResult] = useState({
    workingCapital: 0,
    currentRatio: 0,
    quickRatio: 0,
    cashRatio: 0,
    daysReceivable: 0,
    daysPayable: 0,
    daysInventory: 0,
    cashConversionCycle: 0,
  });

  useEffect(() => {
    const ca = toNum(currentAssets);
    const cl = toNum(currentLiabilities);
    const inv = toNum(inventory);
    const ar = toNum(accountsReceivable);
    const ap = toNum(accountsPayable);
    const revenue = toNum(annualRevenue);
    const cogs = toNum(annualCOGS);

    const safeDiv = (num: number, den: number) => (den > 0 ? num / den : 0);
    const workingCapital = ca - cl;
    const currentRatio = safeDiv(ca, cl);
    const quickRatio = safeDiv(ca - inv, cl);
    const cashRatio = safeDiv(ca - inv - ar, cl);
    const daysReceivable = safeDiv(ar, revenue) * 365;
    const daysPayable = safeDiv(ap, cogs) * 365;
    const daysInventory = safeDiv(inv, cogs) * 365;
    const cashConversionCycle = daysReceivable + daysInventory - daysPayable;

    setResult({
      workingCapital,
      currentRatio,
      quickRatio,
      cashRatio,
      daysReceivable,
      daysPayable,
      daysInventory,
      cashConversionCycle,
    });
  }, [currentAssets, currentLiabilities, inventory, accountsReceivable, accountsPayable, annualRevenue, annualCOGS]);

  const ratioStatus = (type: "current" | "quick" | "cash", value: number) => {
    if (type === "current") {
      if (value >= 1.5 && value <= 2.5) return "Healthy";
      if (value >= 1) return "Caution";
      return "Risk";
    }
    if (type === "quick") {
      if (value >= 1) return "Healthy";
      if (value >= 0.7) return "Caution";
      return "Risk";
    }
    if (value >= 0.5) return "Healthy";
    if (value >= 0.2) return "Caution";
    return "Risk";
  };

  const cccText = result.cashConversionCycle < 0
    ? "Negative cycle: business collects cash before paying suppliers."
    : result.cashConversionCycle < 45
      ? "Efficient cycle: lower CCC improves liquidity."
      : "Long cycle: optimize inventory and collections to reduce CCC.";

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Current Assets": currentAssets, "Current Liabilities": currentLiabilities, "Inventory": inventory, "Accounts Receivable": accountsReceivable, "Accounts Payable": accountsPayable, "Annual Revenue": annualRevenue, "Annual Cogs": annualCOGS },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Current Assets": currentAssets, "Current Liabilities": currentLiabilities, "Inventory": inventory, "Accounts Receivable": accountsReceivable, "Accounts Payable": accountsPayable, "Annual Revenue": annualRevenue, "Annual C O G S": annualCOGS }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Working Capital Analysis"
      subtitle="Liquidity ratios and cash conversion cycle"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Current Assets" value={currentAssets} onChange={setCurrentAssets} />
          <MoneyInput label="Current Liabilities" value={currentLiabilities} onChange={setCurrentLiabilities} />
          <MoneyInput label="Inventory" value={inventory} onChange={setInventory} />
          <MoneyInput label="Accounts Receivable" value={accountsReceivable} onChange={setAccountsReceivable} />
          <MoneyInput label="Accounts Payable" value={accountsPayable} onChange={setAccountsPayable} />
          <MoneyInput label="Annual Revenue" value={annualRevenue} onChange={setAnnualRevenue} />
          <MoneyInput label="Annual COGS" value={annualCOGS} onChange={setAnnualCOGS} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Working Capital" value={formatINR(result.workingCapital)} green={result.workingCapital > 0} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Current Ratio", value: result.currentRatio, type: "current" as const },
              { label: "Quick Ratio", value: result.quickRatio, type: "quick" as const },
              { label: "Cash Ratio", value: result.cashRatio, type: "cash" as const },
            ].map((row) => {
              const status = ratioStatus(row.type, row.value);
              return (
                <div key={row.label} className="card-surface p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wide text-tertiary">{row.label}</div>
                  <div className="text-xl font-bold text-gradient-orange">{formatNum(row.value, 2)}x</div>
                  <span className={cn(
                    "inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold border",
                    status === "Healthy"
                      ? "text-success border-success/40 bg-success/10"
                      : status === "Caution"
                        ? "text-warning border-warning/40 bg-warning/10"
                        : "text-red-400 border-red-400/40 bg-red-400/10"
                  )}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Working Capital Days Table</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Metric</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Days</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-2 text-secondary">DRO (Days Receivable Outstanding)</td>
                    <td className="px-5 py-2 text-right font-medium">{result.daysReceivable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="bg-white/[0.02]">
                    <td className="px-5 py-2 text-secondary">DPO (Days Payable Outstanding)</td>
                    <td className="px-5 py-2 text-right font-medium">{result.daysPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-2 text-secondary">DIO (Days Inventory Outstanding)</td>
                    <td className="px-5 py-2 text-right font-medium">{result.daysInventory.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Cash Conversion Cycle: <span className="font-semibold text-[var(--text-primary)]">{result.cashConversionCycle.toLocaleString("en-IN", { maximumFractionDigits: 2 })} days</span>.
            {" "}{cccText}
          </div>
        </div>
      )}
    />
  );
}

function BondValuationCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [faceValue, setFaceValue] = useState("");
  const [couponRate, setCouponRate] = useState("");
  const [marketRate, setMarketRate] = useState("");
  const [yearsToMaturity, setYearsToMaturity] = useState("");
  const [couponFrequency, setCouponFrequency] = useState<"annual" | "semi-annual">("annual");
  const [result, setResult] = useState({
    bondPrice: 0,
    premiumDiscount: 0,
    currentYield: 0,
    cashFlows: [] as Array<{ year: number; couponCashFlow: number; principalCashFlow: number; totalCashFlow: number }>,
  });

  useEffect(() => {
    const fv = toNum(faceValue);
    const cRate = toNum(couponRate);
    const mRate = toNum(marketRate);
    const years = Math.max(1, Math.floor(toNum(yearsToMaturity)));

    const periodsPerYear = couponFrequency === "semi-annual" ? 2 : 1;
    const periodRate = mRate / 100 / periodsPerYear;
    const totalPeriods = years * periodsPerYear;
    const couponPayment = fv * (cRate / 100) / periodsPerYear;

    let pvCoupons = 0;
    if (periodRate === 0) {
      pvCoupons = couponPayment * totalPeriods;
    } else {
      pvCoupons = couponPayment * (1 - (1 + periodRate) ** (-totalPeriods)) / periodRate;
    }
    const pvFaceValue = fv / (1 + periodRate) ** totalPeriods;
    const bondPrice = pvCoupons + pvFaceValue;
    const premiumDiscount = bondPrice - fv;
    const currentYield = bondPrice > 0 ? (couponPayment * periodsPerYear) / bondPrice * 100 : 0;

    const cashFlows = Array.from({ length: years }, (_, idx) => {
      const year = idx + 1;
      const couponCashFlow = couponPayment * periodsPerYear;
      const principalCashFlow = year === years ? fv : 0;
      return {
        year,
        couponCashFlow,
        principalCashFlow,
        totalCashFlow: couponCashFlow + principalCashFlow,
      };
    });

    setResult({ bondPrice, premiumDiscount, currentYield, cashFlows });
  }, [faceValue, couponRate, marketRate, yearsToMaturity, couponFrequency]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Face Value": faceValue, "Coupon Rate": couponRate, "Market Rate": marketRate, "Years To Maturity": yearsToMaturity, "Coupon Frequency": couponFrequency },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Face Value": faceValue, "Coupon Rate": couponRate, "Market Rate": marketRate, "Years To Maturity": yearsToMaturity, "Coupon Frequency": couponFrequency }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Bond Valuation Calculator"
      subtitle="Present value pricing with yield and premium/discount"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Face Value" value={faceValue} onChange={setFaceValue} />
          <NumberInput label="Coupon Rate (%)" value={couponRate} onChange={setCouponRate} />
          <NumberInput label="Market Rate (%)" value={marketRate} onChange={setMarketRate} />
          <NumberInput label="Years to Maturity" value={yearsToMaturity} onChange={setYearsToMaturity} />

          <Field label="Coupon Frequency">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["annual", "semi-annual"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setCouponFrequency(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all capitalize",
                    couponFrequency === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Bond Price" value={formatINR(result.bondPrice)} />
            <MiniStat
              label="Premium / Discount"
              value={`₹ ${Math.abs(result.premiumDiscount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              green={result.premiumDiscount >= 0}
            />
            <MiniStat label="Current Yield" value={formatPct(result.currentYield)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Year-by-Year Cash Flows</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Coupon</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Principal</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cashFlows.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.couponCashFlow)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.principalCashFlow)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.totalCashFlow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function SYDCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [assetCost, setAssetCost] = useState("");
  const [salvageValue, setSalvageValue] = useState("120000");
  const [usefulLife, setUsefulLife] = useState("");
  const [result, setResult] = useState({
    sumOfYears: 0,
    yearOneDepreciation: 0,
    schedule: [] as Array<{ year: number; fraction: string; sydDep: number; accumulated: number; bookValue: number; slmDep: number }>,
  });

  useEffect(() => {
    const cost = toNum(assetCost);
    const salvage = toNum(salvageValue);
    const life = Math.max(1, Math.floor(toNum(usefulLife)));
    const depreciable = Math.max(0, cost - salvage);
    const sumOfYears = life * (life + 1) / 2;
    const slmDep = life > 0 ? depreciable / life : 0;

    let accumulated = 0;
    const schedule = Array.from({ length: life }, (_, idx) => {
      const year = idx + 1;
      const numerator = life - year + 1;
      const sydDep = sumOfYears > 0 ? (numerator / sumOfYears) * depreciable : 0;
      accumulated += sydDep;
      const bookValue = Math.max(salvage, cost - accumulated);
      return {
        year,
        fraction: `${numerator}/${sumOfYears}`,
        sydDep,
        accumulated,
        bookValue,
        slmDep,
      };
    });

    setResult({
      sumOfYears,
      yearOneDepreciation: schedule[0]?.sydDep ?? 0,
      schedule,
    });
  }, [assetCost, salvageValue, usefulLife]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Asset Cost": assetCost, "Salvage Value": salvageValue, "Useful Life": usefulLife },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Asset Cost": assetCost, "Salvage Value": salvageValue, "Useful Life": usefulLife }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Sum of Years Digits Depreciation"
      subtitle="Accelerated depreciation schedule with SLM comparison"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Asset Cost" value={assetCost} onChange={setAssetCost} />
          <MoneyInput label="Salvage Value" value={salvageValue} onChange={setSalvageValue} />
          <NumberInput label="Useful Life (Years)" value={usefulLife} onChange={setUsefulLife} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Sum of Years" value={result.sumOfYears.toLocaleString("en-IN")} />
            <MiniStat label="Year 1 Depreciation" value={formatINR(result.yearOneDepreciation)} green />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">SYD Full Schedule</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Fraction</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Depreciation</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Accumulated</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{row.fraction}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.sydDep)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.accumulated)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.bookValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">SYD vs SLM (Depreciation Per Year)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">SYD</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">SLM</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row, index) => (
                    <tr key={`compare-${row.year}`} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.sydDep)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.slmDep)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function ProfitabilityRatiosCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [revenue, setRevenue] = useState("");
  const [grossProfit, setGrossProfit] = useState("");
  const [ebitda, setEbitda] = useState("");
  const [ebit, setEbit] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [totalAssets, setTotalAssets] = useState("");
  const [totalEquity, setTotalEquity] = useState("");
  const [capitalEmployed, setCapitalEmployed] = useState("");
  const [cards, setCards] = useState(
    [] as Array<{ label: string; value: number; suffix: string; benchmark: string; status: "Healthy" | "Caution" | "Risk" }>
  );

  useEffect(() => {
    const rev = toNum(revenue);
    const gp = toNum(grossProfit);
    const ebitdaVal = toNum(ebitda);
    const ebitVal = toNum(ebit);
    const net = toNum(netIncome);
    const assets = toNum(totalAssets);
    const equity = toNum(totalEquity);
    const ce = toNum(capitalEmployed);

    const safePct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);
    const safeMul = (num: number, den: number) => (den > 0 ? num / den : 0);

    const baseRatios = [
      { label: "Gross Profit Margin", value: safePct(gp, rev), suffix: "%", benchmark: "Healthy > 20%", healthy: 20 },
      { label: "EBITDA Margin", value: safePct(ebitdaVal, rev), suffix: "%", benchmark: "Healthy > 15%", healthy: 15 },
      { label: "EBIT Margin", value: safePct(ebitVal, rev), suffix: "%", benchmark: "Healthy > 12%", healthy: 12 },
      { label: "Net Profit Margin", value: safePct(net, rev), suffix: "%", benchmark: "Healthy > 10%", healthy: 10 },
      { label: "ROA", value: safePct(net, assets), suffix: "%", benchmark: "Healthy > 5%", healthy: 5 },
      { label: "ROE", value: safePct(net, equity), suffix: "%", benchmark: "Healthy > 15%", healthy: 15 },
      { label: "ROCE", value: safePct(ebitVal, ce), suffix: "%", benchmark: "Healthy > 12%", healthy: 12 },
      { label: "Asset Turnover", value: safeMul(rev, assets), suffix: "x", benchmark: "Healthy > 1.00x", healthy: 1 },
    ];

    const ratios: Array<{ label: string; value: number; suffix: string; benchmark: string; status: "Healthy" | "Caution" | "Risk" }> = baseRatios.map((row) => {
      const status: "Healthy" | "Caution" | "Risk" = row.value > row.healthy
        ? "Healthy"
        : row.value > row.healthy * 0.7
          ? "Caution"
          : "Risk";
      return { label: row.label, value: row.value, suffix: row.suffix, benchmark: row.benchmark, status };
    });

    setCards(ratios);
  }, [revenue, grossProfit, ebitda, ebit, netIncome, totalAssets, totalEquity, capitalEmployed]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Revenue": revenue, "Gross Profit": grossProfit, "Ebitda": ebitda, "Ebit": ebit, "Net Income": netIncome, "Total Assets": totalAssets, "Total Equity": totalEquity, "Capital Employed": capitalEmployed, "Cards": cards },
        outputs: {  },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Revenue": revenue, "Gross Profit": grossProfit, "Ebitda": ebitda, "Ebit": ebit, "Net Income": netIncome, "Total Assets": totalAssets, "Total Equity": totalEquity, "Capital Employed": capitalEmployed, "Cards": cards }, outputs: {  } }; });

  return (
    <CalculatorShell
      title="Profitability Ratios Dashboard"
      subtitle="Margins, returns and turnover in one view"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Revenue" value={revenue} onChange={setRevenue} />
          <MoneyInput label="Gross Profit" value={grossProfit} onChange={setGrossProfit} />
          <MoneyInput label="EBITDA" value={ebitda} onChange={setEbitda} />
          <MoneyInput label="EBIT" value={ebit} onChange={setEbit} />
          <MoneyInput label="Net Income" value={netIncome} onChange={setNetIncome} />
          <MoneyInput label="Total Assets" value={totalAssets} onChange={setTotalAssets} />
          <MoneyInput label="Total Equity" value={totalEquity} onChange={setTotalEquity} />
          <MoneyInput label="Capital Employed" value={capitalEmployed} onChange={setCapitalEmployed} />
        </div>
      )}
      outputPanel={(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.label} className="card-surface p-4 space-y-2">
              <div className="text-xs uppercase tracking-wide text-tertiary">{card.label}</div>
              <div className="text-xl font-bold text-gradient-orange">
                {card.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{card.suffix}
              </div>
              <div className="text-[11px] text-secondary">{card.benchmark}</div>
              <span className={cn(
                "inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold border",
                card.status === "Healthy"
                  ? "text-success border-success/40 bg-success/10"
                  : card.status === "Caution"
                    ? "text-warning border-warning/40 bg-warning/10"
                    : "text-red-400 border-red-400/40 bg-red-400/10"
              )}>
                {card.status}
              </span>
            </div>
          ))}
        </div>
      )}
    />
  );
}

function RentVsBuyCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [propertyPrice, setPropertyPrice] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState("");
  const [mortgageRate, setMortgageRate] = useState("8.5");
  const [tenureYears, setTenureYears] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [rentIncreasePercent, setRentIncreasePercent] = useState("");
  const [propertyAppreciationPercent, setPropertyAppreciationPercent] = useState("");
  const [maintenancePercent, setMaintenancePercent] = useState("");
  const [investmentReturnPercent, setInvestmentReturnPercent] = useState("");
  const [result, setResult] = useState({
    totalBuyingCost: 0,
    totalRentCost: 0,
    recommendation: "",
    breakEvenYear: 0,
    comparison: [] as Array<{ year: number; cumulativeRent: number; netBuyingCost: number; difference: number }>,
  });

  useEffect(() => {
    const price = toNum(propertyPrice);
    const dpPct = toNum(downPaymentPercent);
    const loanRate = toNum(mortgageRate);
    const years = Math.max(1, Math.floor(toNum(tenureYears)));
    const rent = toNum(monthlyRent);
    const rentInc = toNum(rentIncreasePercent);
    const app = toNum(propertyAppreciationPercent);
    const maintPct = toNum(maintenancePercent);
    const investRet = toNum(investmentReturnPercent);

    const downPayment = price * dpPct / 100;
    const loanAmount = Math.max(0, price - downPayment);
    const months = years * 12;
    const emi = calculateEMIFromPrincipal(loanAmount, loanRate, months);
    const totalMortgageCost = emi * months + downPayment;
    const totalInterest = Math.max(0, totalMortgageCost - price);
    const annualMaintenance = price * maintPct / 100;
    const totalBuyingCost = downPayment + totalInterest + annualMaintenance * years;

    let totalRentCost = 0;
    for (let y = 0; y < years; y += 1) {
      totalRentCost += rent * 12 * (1 + rentInc / 100) ** y;
    }

    const opportunityCost = downPayment * (1 + investRet / 100) ** years;
    const finalPropertyValue = price * (1 + app / 100) ** years;
    const netCostBuying = totalBuyingCost - (finalPropertyValue - price);
    const recommendation = netCostBuying <= totalRentCost
      ? "Buying is financially favorable over the selected horizon."
      : "Renting appears cheaper over the selected horizon.";

    let cumulativeRent = 0;
    const firstTen = Math.min(10, years);
    const comparison: Array<{ year: number; cumulativeRent: number; netBuyingCost: number; difference: number }> = [];
    let breakEvenYear = 0;

    for (let y = 1; y <= firstTen; y += 1) {
      cumulativeRent += rent * 12 * (1 + rentInc / 100) ** (y - 1);
      const cumulativeBuyOutflow = downPayment + emi * 12 * y + annualMaintenance * y;
      const propertyGain = price * ((1 + app / 100) ** y - 1);
      const netBuyingCost = cumulativeBuyOutflow - propertyGain;
      const difference = cumulativeRent - netBuyingCost;
      if (breakEvenYear === 0 && difference >= 0) breakEvenYear = y;
      comparison.push({ year: y, cumulativeRent, netBuyingCost, difference });
    }

    setResult({
      totalBuyingCost: totalBuyingCost + (opportunityCost - downPayment),
      totalRentCost,
      recommendation,
      breakEvenYear,
      comparison,
    });
  }, [
    propertyPrice,
    downPaymentPercent,
    mortgageRate,
    tenureYears,
    monthlyRent,
    rentIncreasePercent,
    propertyAppreciationPercent,
    maintenancePercent,
    investmentReturnPercent,
  ]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Property Price": propertyPrice, "Down Payment Percent": downPaymentPercent, "Mortgage Rate": mortgageRate, "Tenure Years": tenureYears, "Monthly Rent": monthlyRent, "Rent Increase Percent": rentIncreasePercent, "Property Appreciation Percent": propertyAppreciationPercent, "Maintenance Percent": maintenancePercent, "Investment Return Percent": investmentReturnPercent },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Property Price": propertyPrice, "Down Payment Percent": downPaymentPercent, "Mortgage Rate": mortgageRate, "Tenure Years": tenureYears, "Monthly Rent": monthlyRent, "Rent Increase Percent": rentIncreasePercent, "Property Appreciation Percent": propertyAppreciationPercent, "Maintenance Percent": maintenancePercent, "Investment Return Percent": investmentReturnPercent }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Rent vs Buy Analysis"
      subtitle="Compare ownership economics with rent escalation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Property Price" value={propertyPrice} onChange={setPropertyPrice} />
          <NumberInput label="Down Payment (%)" value={downPaymentPercent} onChange={setDownPaymentPercent} />
          <NumberInput label="Mortgage Rate (%)" value={mortgageRate} onChange={setMortgageRate} />
          <NumberInput label="Tenure (Years)" value={tenureYears} onChange={setTenureYears} />
          <MoneyInput label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} />
          <NumberInput label="Rent Increase (%)" value={rentIncreasePercent} onChange={setRentIncreasePercent} />
          <NumberInput label="Property Appreciation (%)" value={propertyAppreciationPercent} onChange={setPropertyAppreciationPercent} />
          <NumberInput label="Maintenance (%)" value={maintenancePercent} onChange={setMaintenancePercent} />
          <NumberInput label="Investment Return (%)" value={investmentReturnPercent} onChange={setInvestmentReturnPercent} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total Buying Cost" value={formatINR(result.totalBuyingCost)} />
            <MiniStat label="Total Rent Cost" value={formatINR(result.totalRentCost)} />
            <MiniStat
              label="Break-even Year"
              value={result.breakEvenYear > 0 ? result.breakEvenYear.toLocaleString("en-IN") : "Not within 10 yrs"}
              green={result.breakEvenYear > 0}
            />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            {result.recommendation}
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Year-by-Year Comparison (First 10 Years)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Cumulative Rent</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Net Buying Cost</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Rent - Buy</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.cumulativeRent)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.netBuyingCost)}</td>
                      <td className={cn("px-5 py-2 text-right font-medium", row.difference >= 0 ? "text-success" : "text-red-400")}>
                        {`₹ ${row.difference.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function HUFTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type Member = { name: string; income: string };

  const [hufIncome, setHufIncome] = useState("");
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [memberIncomes, setMemberIncomes] = useState<Member[]>([
    { name: "Member 1", income: "600000" },
    { name: "Member 2", income: "450000" },
  ]);
  const [result, setResult] = useState({
    hufTax: 0,
    effectiveRate: 0,
    individualTax: 0,
    taxSaving: 0,
    memberRows: [] as Array<{ name: string; baseIncome: number; withShareIncome: number; tax: number }>,
  });

  useEffect(() => {
    const income = toNum(hufIncome);
    const selectedSlabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
    const hufDeduction80C = regime === "old" ? Math.min(150000, income) : 0;
    const hufTaxable = Math.max(0, income - hufDeduction80C);
    const hufBaseTax = calculateSlabTax(hufTaxable, selectedSlabs).baseTax;
    const hufTax = hufBaseTax * 1.04;

    const validMembers = memberIncomes.filter((m) => m.name.trim() && toNum(m.income) > 0);
    const memberCount = validMembers.length || 1;
    const sharedIncome = income / memberCount;

    const memberRows = validMembers.map((member) => {
      const baseIncome = toNum(member.income);
      const taxable = Math.max(0, baseIncome + sharedIncome);
      const memberTax = calculateSlabTax(taxable, selectedSlabs).baseTax * 1.04;
      return {
        name: member.name,
        baseIncome,
        withShareIncome: taxable,
        tax: memberTax,
      };
    });

    const individualTax = memberRows.reduce((sum, row) => sum + row.tax, 0);
    const taxSaving = Math.max(0, individualTax - hufTax);
    const effectiveRate = income > 0 ? (hufTax / income) * 100 : 0;

    setResult({ hufTax, effectiveRate, individualTax, taxSaving, memberRows });
  }, [hufIncome, regime, memberIncomes]);

  const updateMember = (index: number, key: keyof Member, value: string) => {
    setMemberIncomes((prev) => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  };

  const addMember = () => {
    setMemberIncomes((prev) => (prev.length >= 5 ? prev : [...prev, { name: `Member ${prev.length + 1}`, income: "0" }]));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Huf Income": hufIncome, "Regime": regime, "Member Incomes": memberIncomes },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Huf Income": hufIncome, "Regime": regime, "Member Incomes": memberIncomes }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="HUF Tax Calculator"
      subtitle="Compare HUF taxation vs income taxed in individual hands"
      inputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">HUF Inputs</h2>
            <MoneyInput label="HUF Income" value={hufIncome} onChange={setHufIncome} />
            <Field label="Regime">
              <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
                {(["new", "old"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setRegime(item)}
                    className={cn(
                      "py-2 text-xs font-medium rounded-md transition-all uppercase",
                      regime === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>
            <div className="text-xs text-tertiary border-t border-white/10 pt-3">
              HUF deduction considered: Section 80C up to ₹1.5L in old regime.
            </div>
          </div>

          <div className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Member Incomes (Max 5)</h2>
              <button
                onClick={addMember}
                className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]"
              >
                Add Member
              </button>
            </div>
            {memberIncomes.map((member, index) => (
              <div key={`${member.name}-${index}`} className="grid grid-cols-[1fr_140px] gap-2">
                <input
                  value={member.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  className="glass-input h-10 px-3 text-sm"
                  placeholder="Member name"
                />
                <input
                  value={member.income}
                  inputMode="numeric"
                  onChange={(e) => updateMember(index, "income", e.target.value.replace(/[^0-9]/g, ""))}
                  className="glass-input h-10 px-3 text-sm text-right"
                  placeholder="Income"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="HUF Tax" value={formatINR(result.hufTax)} />
            <MiniStat label="Effective Rate" value={formatPct(result.effectiveRate)} />
            <MiniStat label="If Taxed in Individual Hands" value={formatINR(result.individualTax)} />
            <MiniStat label="Tax Saving via HUF" value={formatINR(result.taxSaving)} green />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Member Comparison</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Member</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Base Income</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Income + Share</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {result.memberRows.map((row, index) => (
                    <tr key={row.name + index} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.name}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.baseIncome)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.withShareIncome)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function Form16Calc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [employerName, setEmployerName] = useState("ABC Private Limited");
  const [tan, setTan] = useState("BLRA12345A");
  const [pan, setPan] = useState("ABCDE1234F");
  const [grossSalary, setGrossSalary] = useState("");
  const [allowances, setAllowances] = useState("");
  const [perquisites, setPerquisites] = useState("");
  const [hraExemption, setHraExemption] = useState("");
  const [ltaExemption, setLtaExemption] = useState("");
  const [otherExemption, setOtherExemption] = useState("");
  const [ded80c, setDed80c] = useState("");
  const [ded80d, setDed80d] = useState("");
  const [ded80ccd1b, setDed80ccd1b] = useState("");
  const [otherDeduction, setOtherDeduction] = useState("");
  const [result, setResult] = useState({
    grossIncome: 0,
    exemptIncome: 0,
    netSalary: 0,
    deductions: 0,
    taxableIncome: 0,
    tax: 0,
    cess: 0,
    totalTax: 0,
  });

  useEffect(() => {
    const gross = toNum(grossSalary);
    const allow = toNum(allowances);
    const perq = toNum(perquisites);

    const grossIncome = gross + allow + perq;
    const hra = Math.min(toNum(hraExemption), grossIncome);
    const lta = Math.min(toNum(ltaExemption), grossIncome);
    const otherEx = Math.min(toNum(otherExemption), grossIncome);
    const exemptIncome = Math.min(grossIncome, hra + lta + otherEx);

    const standardDeduction = 75000;
    const d80c = Math.min(toNum(ded80c), 150000);
    const d80d = Math.min(toNum(ded80d), 25000);
    const d80ccd = Math.min(toNum(ded80ccd1b), 50000);
    const otherDed = toNum(otherDeduction);
    const deductions = d80c + d80d + d80ccd + otherDed;

    const netSalary = Math.max(0, grossIncome - exemptIncome);
    const taxableIncome = Math.max(0, netSalary - standardDeduction - deductions);
    const tax = calculateSlabTax(taxableIncome, NEW_REGIME_SLABS).baseTax;
    const cess = tax * 0.04;
    const totalTax = tax + cess;

    setResult({ grossIncome, exemptIncome, netSalary, deductions, taxableIncome, tax, cess, totalTax });
  }, [
    grossSalary,
    allowances,
    perquisites,
    hraExemption,
    ltaExemption,
    otherExemption,
    ded80c,
    ded80d,
    ded80ccd1b,
    otherDeduction,
  ]);

  const rows = [
    { label: "Gross Salary (incl. Allowances & Perquisites)", value: result.grossIncome },
    { label: "Less: Exemptions (HRA + LTA + Other)", value: -result.exemptIncome },
    { label: "Net Salary", value: result.netSalary },
    { label: "Less: Standard Deduction", value: -75000 },
    { label: "Less: Chapter VI-A Deductions", value: -result.deductions },
    { label: "Taxable Income", value: result.taxableIncome },
    { label: "Income Tax (New Regime)", value: result.tax },
    { label: "Health & Education Cess @4%", value: result.cess },
    { label: "Total Tax Liability", value: result.totalTax },
  ];

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Employer Name": employerName, "Tan": tan, "Pan": pan, "Gross Salary": grossSalary, "Allowances": allowances, "Perquisites": perquisites, "Hra Exemption": hraExemption, "Lta Exemption": ltaExemption, "Other Exemption": otherExemption, "Ded80C": ded80c, "Ded80D": ded80d, "Ded80Ccd1B": ded80ccd1b, "Other Deduction": otherDeduction },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Employer Name": employerName, "Tan": tan, "Pan": pan, "Gross Salary": grossSalary, "Allowances": allowances, "Perquisites": perquisites, "Hra Exemption": hraExemption, "Lta Exemption": ltaExemption, "Other Exemption": otherExemption, "Ded80c": ded80c, "Ded80d": ded80d, "Ded80ccd1b": ded80ccd1b, "Other Deduction": otherDeduction }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Form 16 / Salary Tax Computation"
      subtitle="Formal Part B style salary tax computation"
      inputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Part A: Employer Details</h2>
            <Field label="Employer Name">
              <input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="glass-input w-full h-11 px-3 text-sm" />
            </Field>
            <Field label="TAN">
              <input value={tan} onChange={(e) => setTan(e.target.value.toUpperCase())} className="glass-input w-full h-11 px-3 text-sm" />
            </Field>
            <Field label="PAN">
              <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} className="glass-input w-full h-11 px-3 text-sm" />
            </Field>
          </div>

          <div className="card-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Part B: Income / Exemptions / Deductions</h2>
            <MoneyInput label="Gross Salary" value={grossSalary} onChange={setGrossSalary} />
            <MoneyInput label="Allowances" value={allowances} onChange={setAllowances} />
            <MoneyInput label="Perquisites" value={perquisites} onChange={setPerquisites} />
            <MoneyInput label="HRA Exemption" value={hraExemption} onChange={setHraExemption} />
            <MoneyInput label="LTA Exemption" value={ltaExemption} onChange={setLtaExemption} />
            <MoneyInput label="Other Exemption" value={otherExemption} onChange={setOtherExemption} />
            <MoneyInput label="Deduction 80C" value={ded80c} onChange={setDed80c} />
            <MoneyInput label="Deduction 80D" value={ded80d} onChange={setDed80d} />
            <MoneyInput label="Deduction 80CCD(1B)" value={ded80ccd1b} onChange={setDed80ccd1b} />
            <MoneyInput label="Other Deductions" value={otherDeduction} onChange={setOtherDeduction} />
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-4 text-xs text-secondary">
            Employer: <span className="text-[var(--text-primary)] font-medium">{employerName}</span> | TAN: <span className="text-[var(--text-primary)] font-medium">{tan}</span> | PAN: <span className="text-[var(--text-primary)] font-medium">{pan}</span>
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Form 16 Part B Computation</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.label} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.label}</td>
                      <td className="px-5 py-2 text-right font-medium">
                        {row.value < 0 ? `- ${formatINR(Math.abs(row.value))}` : formatINR(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function TDSSalaryCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [monthlyBasic, setMonthlyBasic] = useState("");
  const [monthlyHRA, setMonthlyHRA] = useState("");
  const [otherAllowances, setOtherAllowances] = useState("");
  const [employerPF, setEmployerPF] = useState("");
  const [rentPaid, setRentPaid] = useState("");
  const [cityType, setCityType] = useState<"metro" | "non-metro">("metro");
  const [investments80C, setInvestments80C] = useState("");
  const [insurance80D, setInsurance80D] = useState("");
  const [nps80CCD, setNps80CCD] = useState("");
  const [result, setResult] = useState({
    annualTaxableIncome: 0,
    totalAnnualTax: 0,
    monthlyTDS: 0,
    effectiveMonthlyTakeHome: 0,
    monthlyRows: [] as Array<{ month: string; tds: number }>,
  });

  useEffect(() => {
    const basic = toNum(monthlyBasic);
    const hra = toNum(monthlyHRA);
    const other = toNum(otherAllowances);
    const pf = toNum(employerPF);
    const rent = toNum(rentPaid);

    const annualBasic = basic * 12;
    const annualHRA = hra * 12;
    const annualOther = other * 12;
    const annualPF = pf * 12;
    const annualRent = rent * 12;

    const hraLimitByCity = annualBasic * (cityType === "metro" ? 0.5 : 0.4);
    const rentMinus10pctBasic = Math.max(0, annualRent - annualBasic * 0.1);
    const hraExempt = Math.max(0, Math.min(annualHRA, hraLimitByCity, rentMinus10pctBasic));

    const grossAnnual = annualBasic + annualHRA + annualOther + annualPF;
    const deductions = Math.min(toNum(investments80C), 150000) + Math.min(toNum(insurance80D), 25000) + Math.min(toNum(nps80CCD), 50000) + 75000;
    const annualTaxableIncome = Math.max(0, grossAnnual - hraExempt - deductions);

    const tax = calculateSlabTax(annualTaxableIncome, NEW_REGIME_SLABS).baseTax;
    const totalAnnualTax = tax * 1.04;
    const monthlyTDS = Math.max(0, totalAnnualTax / 12);
    const effectiveMonthlyTakeHome = basic + hra + other - monthlyTDS;

    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const monthlyRows = months.map((month) => ({ month, tds: monthlyTDS }));

    setResult({ annualTaxableIncome, totalAnnualTax, monthlyTDS, effectiveMonthlyTakeHome, monthlyRows });
  }, [monthlyBasic, monthlyHRA, otherAllowances, employerPF, rentPaid, cityType, investments80C, insurance80D, nps80CCD]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Monthly Basic": monthlyBasic, "Monthly Hra": monthlyHRA, "Other Allowances": otherAllowances, "Employer Pf": employerPF, "Rent Paid": rentPaid, "City Type": cityType, "Investments80C": investments80C, "Insurance80D": insurance80D, "Nps80Ccd": nps80CCD },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Monthly Basic": monthlyBasic, "Monthly H R A": monthlyHRA, "Other Allowances": otherAllowances, "Employer P F": employerPF, "Rent Paid": rentPaid, "City Type": cityType, "Investments80 C": investments80C, "Insurance80 D": insurance80D, "Nps80 C C D": nps80CCD }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="TDS on Salary Calculator (Section 192)"
      subtitle="Annual tax estimation and equal monthly TDS projection"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Monthly Basic" value={monthlyBasic} onChange={setMonthlyBasic} />
          <MoneyInput label="Monthly HRA" value={monthlyHRA} onChange={setMonthlyHRA} />
          <MoneyInput label="Other Allowances" value={otherAllowances} onChange={setOtherAllowances} />
          <MoneyInput label="Employer PF" value={employerPF} onChange={setEmployerPF} />
          <MoneyInput label="Rent Paid" value={rentPaid} onChange={setRentPaid} />

          <Field label="City Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["metro", "non-metro"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setCityType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all capitalize",
                    cityType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          <MoneyInput label="Investments 80C" value={investments80C} onChange={setInvestments80C} />
          <MoneyInput label="Insurance 80D" value={insurance80D} onChange={setInsurance80D} />
          <MoneyInput label="NPS 80CCD" value={nps80CCD} onChange={setNps80CCD} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Annual Taxable Income" value={formatINR(result.annualTaxableIncome)} />
            <MiniStat label="Total Annual Tax" value={formatINR(result.totalAnnualTax)} />
            <MiniStat label="Monthly TDS" value={formatINR(result.monthlyTDS)} />
            <MiniStat label="Effective Monthly Take Home" value={formatINR(result.effectiveMonthlyTakeHome)} green />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Month-wise TDS Schedule</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Month</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">TDS</th>
                  </tr>
                </thead>
                <tbody>
                  {result.monthlyRows.map((row, index) => (
                    <tr key={row.month} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.month}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.tds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            TDS adjusted in Dec/Jan if investments not submitted.
          </div>
        </div>
      )}
    />
  );
}

function GSTCompositionCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [businessType, setBusinessType] = useState<"Manufacturer" | "Trader" | "Restaurant" | "Service">("Manufacturer");
  const [annualTurnover, setAnnualTurnover] = useState("");
  const [quarterlyTurnover, setQuarterlyTurnover] = useState("");
  const [result, setResult] = useState({
    compositionTaxAnnual: 0,
    compositionTaxQuarterly: 0,
    regularGSTEstimate: 0,
    potentialSaving: 0,
    eligibilityStatus: "",
    cgstShare: 0,
    sgstShare: 0,
  });

  useEffect(() => {
    const annual = toNum(annualTurnover);
    const quarterly = toNum(quarterlyTurnover);

    const compositionRateMap = {
      Manufacturer: 1,
      Trader: 1,
      Restaurant: 5,
      Service: 6,
    } as const;

    const regularRateMap = {
      Manufacturer: 12,
      Trader: 12,
      Restaurant: 18,
      Service: 18,
    } as const;

    const rate = compositionRateMap[businessType];
    const annualTax = annual * rate / 100;
    const quarterTax = quarterly * rate / 100;
    const regularGSTEstimate = annual * regularRateMap[businessType] / 100;
    const potentialSaving = Math.max(0, regularGSTEstimate - annualTax);
    const eligibilityStatus = annual <= 15000000 ? "Eligible under ₹1.5 Cr limit" : "Not eligible (turnover above ₹1.5 Cr)";

    setResult({
      compositionTaxAnnual: annualTax,
      compositionTaxQuarterly: quarterTax,
      regularGSTEstimate,
      potentialSaving,
      eligibilityStatus,
      cgstShare: annualTax / 2,
      sgstShare: annualTax / 2,
    });
  }, [businessType, annualTurnover, quarterlyTurnover]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Business Type": businessType, "Annual Turnover": annualTurnover, "Quarterly Turnover": quarterlyTurnover },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Business Type": businessType, "Annual Turnover": annualTurnover, "Quarterly Turnover": quarterlyTurnover }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="GST Composition Scheme Calculator"
      subtitle="Composition liability vs regular GST estimate"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <Field label="Business Type">
            <div className="grid grid-cols-2 gap-2">
              {(["Manufacturer", "Trader", "Restaurant", "Service"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setBusinessType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md border transition-all",
                    businessType === item
                      ? "bg-gradient-orange text-white glow-orange border-transparent"
                      : "text-secondary border-white/10 hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          <MoneyInput label="Annual Turnover" value={annualTurnover} onChange={setAnnualTurnover} />
          <MoneyInput label="Quarterly Turnover" value={quarterlyTurnover} onChange={setQuarterlyTurnover} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Composition Tax (Annual)" value={formatINR(result.compositionTaxAnnual)} />
            <MiniStat label="Composition Tax (Quarterly)" value={formatINR(result.compositionTaxQuarterly)} />
            <MiniStat label="Regular GST Estimate" value={formatINR(result.regularGSTEstimate)} />
            <MiniStat label="Potential Saving" value={formatINR(result.potentialSaving)} green />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Eligibility: <span className="text-[var(--text-primary)] font-medium">{result.eligibilityStatus}</span>. Lower threshold of ₹75L may apply in some states.
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Cannot claim ITC under composition scheme.
          </div>
        </div>
      )}
    />
  );
}

function ExportGSTCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [exportValue, setExportValue] = useState("");
  const [exportType, setExportType] = useState<"Goods" | "Services">("Goods");
  const [hasLUT, setHasLUT] = useState(true);
  const [igstPaidOnInputs, setIgstPaidOnInputs] = useState("");
  const [refundType, setRefundType] = useState<"Refund of IGST" | "ITC Refund">("ITC Refund");
  const [result, setResult] = useState({
    exportValue: 0,
    igstLiability: 0,
    refundAmount: 0,
  });

  useEffect(() => {
    const value = toNum(exportValue);
    const itc = toNum(igstPaidOnInputs);
    const igstOnExport = hasLUT ? 0 : value * 0.18;
    const refundAmount = hasLUT ? itc : igstOnExport;

    setResult({
      exportValue: value,
      igstLiability: igstOnExport,
      refundAmount,
    });
  }, [exportValue, hasLUT, igstPaidOnInputs, refundType, exportType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Export Value": exportValue, "Export Type": exportType, "Has Lut": hasLUT, "Igst Paid On Inputs": igstPaidOnInputs, "Refund Type": refundType },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Export Value": exportValue, "Export Type": exportType, "Has L U T": hasLUT, "Igst Paid On Inputs": igstPaidOnInputs, "Refund Type": refundType }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="GST on Exports Calculator"
      subtitle="Zero-rated export treatment with LUT and refund paths"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Export Value" value={exportValue} onChange={setExportValue} />

          <Field label="Export Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["Goods", "Services"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setExportType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all",
                    exportType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Has LUT">
            <button
              onClick={() => setHasLUT((v) => !v)}
              className={cn(
                "w-full py-2 text-sm font-medium rounded-md transition-all border",
                hasLUT
                  ? "bg-gradient-orange text-white glow-orange border-transparent"
                  : "text-secondary border-white/10 hover:text-[var(--text-primary)]"
              )}
            >
              {hasLUT ? "Yes" : "No"}
            </button>
          </Field>

          <MoneyInput label="IGST Paid on Inputs" value={igstPaidOnInputs} onChange={setIgstPaidOnInputs} />

          <Field label="Refund Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["Refund of IGST", "ITC Refund"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setRefundType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all",
                    refundType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Export Value" value={formatINR(result.exportValue)} />
            <MiniStat label="IGST Liability" value={formatINR(result.igstLiability)} />
            <MiniStat label="Refund Amount" value={formatINR(result.refundAmount)} green />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Filing LUT is recommended to avoid cash flow blockage.
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Reporting: GSTR-1 required. Refund application through Form RFD-01.
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Typical timeline: Refund processed within 60 days.
          </div>
        </div>
      )}
    />
  );
}

function MISCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [accountType, setAccountType] = useState<"Single" | "Joint">("Single");
  const [result, setResult] = useState({
    monthlyPayout: 0,
    totalInterestEarned: 0,
    maturityAmount: 0,
    fdMaturity: 0,
    sipFutureValue: 0,
  });

  useEffect(() => {
    const maxLimit = accountType === "Single" ? 900000 : 1500000;
    const principal = Math.min(toNum(investmentAmount), maxLimit);
    const monthlyPayout = principal * 7.4 / 100 / 12;
    const totalInterestEarned = monthlyPayout * 60;
    const maturityAmount = principal;

    const fdMaturity = principal * (1 + 0.07 / 4) ** (4 * 5);
    const monthlySip = principal / 60;
    const r = 0.12 / 12;
    const sipFutureValue = r > 0 ? monthlySip * (((1 + r) ** 60 - 1) / r) * (1 + r) : monthlySip * 60;

    setResult({ monthlyPayout, totalInterestEarned, maturityAmount, fdMaturity, sipFutureValue });
  }, [investmentAmount, accountType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Investment Amount": investmentAmount, "Account Type": accountType },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Investment Amount": investmentAmount, "Account Type": accountType }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Post Office MIS Calculator"
      subtitle="Fixed monthly income with principal returned after 5 years"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput
            label={accountType === "Single" ? "Investment Amount (Max ₹9L)" : "Investment Amount (Max ₹15L)"}
            value={investmentAmount}
            onChange={setInvestmentAmount}
          />
          <Field label="Account Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["Single", "Joint"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setAccountType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all",
                    accountType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tenure">
            <input value="5 years (fixed)" disabled className="glass-input w-full h-11 px-3 text-sm opacity-80" />
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Monthly Payout" value={formatINR(result.monthlyPayout)} green />
            <MiniStat label="Total Interest Earned" value={formatINR(result.totalInterestEarned)} />
            <MiniStat label="Maturity Amount (Principal)" value={formatINR(result.maturityAmount)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">FD at 7% (5Y)</div>
              <div className="mt-2 text-xl font-bold text-gradient-orange">{formatINR(result.fdMaturity)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary">SIP at 12% (same total outlay)</div>
              <div className="mt-2 text-xl font-bold text-gradient-orange">{formatINR(result.sipFutureValue)}</div>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            No compounding in MIS, fixed monthly payout. Interest is taxable. TDS applicable if interest &gt; ₹40,000/year.
          </div>
        </div>
      )}
    />
  );
}

function SSYCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [annualDeposit, setAnnualDeposit] = useState("");
  const [girlAge, setGirlAge] = useState("2");
  const [startYear, setStartYear] = useState(String(new Date().getFullYear()));
  const [result, setResult] = useState({
    maturityAmount: 0,
    totalDeposited: 0,
    totalInterest: 0,
    maturityYear: 0,
    girlAgeAtMaturity: 0,
    rows: [] as Array<{ year: number; age: number; deposit: number; interest: number; closingBalance: number }>,
  });

  useEffect(() => {
    const deposit = Math.min(150000, Math.max(250, toNum(annualDeposit)));
    const age = Math.min(10, Math.max(0, Math.floor(toNum(girlAge))));
    const openYear = Math.floor(toNum(startYear));
    const rate = 0.082;

    let balance = 0;
    let totalDeposited = 0;
    const rows: Array<{ year: number; age: number; deposit: number; interest: number; closingBalance: number }> = [];

    for (let i = 1; i <= 21; i += 1) {
      const depositThisYear = i <= 15 ? deposit : 0;
      const openingWithDeposit = balance + depositThisYear;
      const interest = openingWithDeposit * rate;
      balance = openingWithDeposit + interest;
      totalDeposited += depositThisYear;
      rows.push({
        year: openYear + i - 1,
        age: age + i,
        deposit: depositThisYear,
        interest,
        closingBalance: balance,
      });
    }

    const maturityAmount = balance;
    const totalInterest = maturityAmount - totalDeposited;
    const maturityYear = openYear + 20;
    const girlAgeAtMaturity = age + 21;

    setResult({ maturityAmount, totalDeposited, totalInterest, maturityYear, girlAgeAtMaturity, rows });
  }, [annualDeposit, girlAge, startYear]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Annual Deposit": annualDeposit, "Girl Age": girlAge, "Start Year": startYear },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Annual Deposit": annualDeposit, "Girl Age": girlAge, "Start Year": startYear }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Sukanya Samriddhi Yojana Calculator"
      subtitle="15-year deposit period with maturity at 21 years"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Annual Deposit (₹250 to ₹1.5L)" value={annualDeposit} onChange={setAnnualDeposit} />
          <NumberInput label="Girl Age (0-10)" value={girlAge} onChange={setGirlAge} />
          <NumberInput label="Start Year" value={startYear} onChange={setStartYear} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Maturity Amount" value={formatINR(result.maturityAmount)} green />
            <MiniStat label="Total Deposited" value={formatINR(result.totalDeposited)} />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
            <MiniStat label="Maturity Year" value={result.maturityYear.toLocaleString("en-IN")} />
            <MiniStat label="Girl Age At Maturity" value={result.girlAgeAtMaturity.toLocaleString("en-IN")} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Year-wise SSY Projection</div>
            <div className="overflow-x-auto -mx-5 max-h-72">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary sticky top-0">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Age</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Deposit</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Interest</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{row.age.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.deposit)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.interest)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Fully exempt under EEE — deposit, interest and maturity all tax-free.
          </div>
        </div>
      )}
    />
  );
}

function NPSCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [currentAge, setCurrentAge] = useState("30");
  const [retirementAge, setRetirementAge] = useState("60");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [annuityRate, setAnnuityRate] = useState("");
  const [result, setResult] = useState({
    corpusAtRetirement: 0,
    lumpsum: 0,
    annuityAmount: 0,
    estimatedMonthlyPension: 0,
    totalInvested: 0,
    wealthGained: 0,
    taxBenefit80CCD: 0,
  });

  useEffect(() => {
    const monthly = toNum(monthlyContribution);
    const ageNow = Math.floor(toNum(currentAge));
    const retireAge = Math.max(ageNow + 1, Math.floor(toNum(retirementAge)));
    const years = Math.max(0, retireAge - ageNow);
    const annualReturn = toNum(expectedReturn);
    const annRate = toNum(annuityRate);

    const n = years * 12;
    const r = annualReturn / 12 / 100;
    const corpusAtRetirement = r === 0
      ? monthly * n
      : monthly * (((1 + r) ** n - 1) / r) * (1 + r);

    const mandatoryAnnuity = corpusAtRetirement * 0.4;
    const lumpsum = corpusAtRetirement * 0.6;
    const estimatedMonthlyPension = mandatoryAnnuity * annRate / 100 / 12;
    const totalInvested = monthly * n;
    const wealthGained = Math.max(0, corpusAtRetirement - totalInvested);

    const yearlyContribution = monthly * 12;
    const taxEligible = Math.min(yearlyContribution, 50000);
    const taxBenefit80CCD = taxEligible * 0.3;

    setResult({
      corpusAtRetirement,
      lumpsum,
      annuityAmount: mandatoryAnnuity,
      estimatedMonthlyPension,
      totalInvested,
      wealthGained,
      taxBenefit80CCD,
    });
  }, [monthlyContribution, currentAge, retirementAge, expectedReturn, annuityRate]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Monthly Contribution": monthlyContribution, "Current Age": currentAge, "Retirement Age": retirementAge, "Expected Return": expectedReturn, "Annuity Rate": annuityRate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Monthly Contribution": monthlyContribution, "Current Age": currentAge, "Retirement Age": retirementAge, "Expected Return": expectedReturn, "Annuity Rate": annuityRate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="NPS (National Pension System) Calculator"
      subtitle="Retirement corpus, mandatory annuity and pension estimate"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Monthly Contribution" value={monthlyContribution} onChange={setMonthlyContribution} />
          <NumberInput label="Current Age" value={currentAge} onChange={setCurrentAge} />
          <NumberInput label="Retirement Age" value={retirementAge} onChange={setRetirementAge} />
          <NumberInput label="Expected Return (%)" value={expectedReturn} onChange={setExpectedReturn} />
          <NumberInput label="Annuity Rate (%)" value={annuityRate} onChange={setAnnuityRate} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Corpus At Retirement" value={formatINR(result.corpusAtRetirement)} green />
            <MiniStat label="Lumpsum (60%)" value={formatINR(result.lumpsum)} />
            <MiniStat label="Annuity Amount (40%)" value={formatINR(result.annuityAmount)} />
            <MiniStat label="Estimated Monthly Pension" value={formatINR(result.estimatedMonthlyPension)} />
            <MiniStat label="Total Invested" value={formatINR(result.totalInvested)} />
            <MiniStat label="Wealth Gained" value={formatINR(result.wealthGained)} />
            <MiniStat label="Tax Benefit 80CCD (30% slab)" value={formatINR(result.taxBenefit80CCD)} green />
          </div>
        </div>
      )}
    />
  );
}

function SCFDCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [principal, setPrincipal] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [bankName, setBankName] = useState<"SBI" | "HDFC" | "ICICI" | "Post Office TD" | "Small Finance Banks">("SBI");
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(true);
  const [result, setResult] = useState({
    maturityAmount: 0,
    totalInterest: 0,
    effectiveYield: 0,
    tdsDeductible: 0,
    netInterest: 0,
    comparisons: [] as Array<{ bank: string; rate: number; maturity: number; interest: number }>,
  });

  useEffect(() => {
    const p = toNum(principal);
    const months = Math.max(1, Math.floor(toNum(tenureMonths)));
    const years = months / 12;

    const rates = {
      SBI: { regular: 6.5, senior: 7.0 },
      HDFC: { regular: 7.0, senior: 7.5 },
      ICICI: { regular: 7.0, senior: 7.5 },
      "Post Office TD": { regular: 7.5, senior: 7.5 },
      "Small Finance Banks": { regular: 8.5, senior: 9.0 },
    } as const;

    const selectedRate = isSeniorCitizen ? rates[bankName].senior : rates[bankName].regular;
    const maturityAmount = p * (1 + selectedRate / 100 / 4) ** (4 * years);
    const totalInterest = Math.max(0, maturityAmount - p);
    const effectiveYield = p > 0 ? ((maturityAmount / p) ** (1 / years) - 1) * 100 : 0;

    const tdsThreshold = isSeniorCitizen ? 50000 : 40000;
    const tdsDeductible = totalInterest > tdsThreshold ? totalInterest * 0.1 : 0;
    const netInterest = totalInterest - tdsDeductible;

    const comparisons = Object.entries(rates).map(([bank, rateObj]) => {
      const rate = isSeniorCitizen ? rateObj.senior : rateObj.regular;
      const maturity = p * (1 + rate / 100 / 4) ** (4 * years);
      return { bank, rate, maturity, interest: Math.max(0, maturity - p) };
    });

    setResult({ maturityAmount, totalInterest, effectiveYield, tdsDeductible, netInterest, comparisons });
  }, [principal, tenureMonths, bankName, isSeniorCitizen]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Principal": principal, "Tenure Months": tenureMonths, "Bank Name": bankName, "Is Senior Citizen": isSeniorCitizen },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Principal": principal, "Tenure Months": tenureMonths, "Bank Name": bankName, "Is Senior Citizen": isSeniorCitizen }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Senior Citizen FD & Savings Calculator"
      subtitle="Quarterly-compounded FD comparison with TDS impact"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Principal" value={principal} onChange={setPrincipal} />
          <NumberInput label="Tenure (Months)" value={tenureMonths} onChange={setTenureMonths} />

          <Field label="Bank / Institution">
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value as "SBI" | "HDFC" | "ICICI" | "Post Office TD" | "Small Finance Banks")}
              className="glass-input w-full h-11 px-3 text-sm"
            >
              {["SBI", "HDFC", "ICICI", "Post Office TD", "Small Finance Banks"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>

          <Field label="Senior Citizen">
            <button
              onClick={() => setIsSeniorCitizen((v) => !v)}
              className={cn(
                "w-full py-2 text-sm font-medium rounded-md transition-all border",
                isSeniorCitizen
                  ? "bg-gradient-orange text-white glow-orange border-transparent"
                  : "text-secondary border-white/10 hover:text-[var(--text-primary)]"
              )}
            >
              {isSeniorCitizen ? "Yes" : "No"}
            </button>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Maturity Amount" value={formatINR(result.maturityAmount)} green />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
            <MiniStat label="Effective Yield (%)" value={formatPct(result.effectiveYield)} />
            <MiniStat label="TDS Deductible" value={formatINR(result.tdsDeductible)} />
            <MiniStat label="Net Interest after TDS" value={formatINR(result.netInterest)} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Rate & Maturity Comparison</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Bank</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Rate</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Maturity</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparisons.map((row, index) => (
                    <tr key={row.bank} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.bank}</td>
                      <td className="px-3 py-2 text-right">{formatPct(row.rate)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.maturity)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.interest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Form 15H can be submitted by eligible senior citizens to avoid TDS.
          </div>
        </div>
      )}
    />
  );
}

function GratuityEligibilityCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [employeeType, setEmployeeType] = useState<"Covered" | "Not Covered">("Covered");
  const [lastDrawnBasic, setLastDrawnBasic] = useState("");
  const [daPay, setDaPay] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("2019-04-01");
  const [dateOfLeaving, setDateOfLeaving] = useState("2026-04-10");
  const [reasonForLeaving, setReasonForLeaving] = useState<"Resignation" | "Retirement" | "Death" | "Disability">("Resignation");
  const [result, setResult] = useState({
    exactServicePeriod: "0 years, 0 months, 0 days",
    isEligible: false,
    gratuityAmount: 0,
    taxExemptAmount: 0,
    taxableGratuity: 0,
    appliedFourYearRule: false,
    serviceYearsForCalc: 0,
  });

  useEffect(() => {
    const basic = toNum(lastDrawnBasic);
    const da = toNum(daPay);
    const doj = new Date(dateOfJoining);
    const dol = new Date(dateOfLeaving);

    const msDiff = Math.max(0, dol.getTime() - doj.getTime());
    const totalDays = Math.floor(msDiff / (1000 * 60 * 60 * 24));

    let years = dol.getFullYear() - doj.getFullYear();
    let months = dol.getMonth() - doj.getMonth();
    let days = dol.getDate() - doj.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(dol.getFullYear(), dol.getMonth(), 0).getDate();
      days += prevMonth;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const exactServicePeriod = `${Math.max(0, years)} years, ${Math.max(0, months)} months, ${Math.max(0, days)} days`;
    const yearsCompleted = Math.max(0, years);
    const remainingDaysApprox = Math.max(0, totalDays - yearsCompleted * 365);
    const fourYearRuleApplies = reasonForLeaving === "Resignation" && yearsCompleted === 4 && remainingDaysApprox >= 240;

    const isEligible = reasonForLeaving === "Death" || reasonForLeaving === "Disability"
      ? true
      : yearsCompleted >= 5 || fourYearRuleApplies;

    const serviceYearsForCalc = yearsCompleted + (months >= 6 ? 1 : 0) + (fourYearRuleApplies ? 1 : 0);
    const salaryBase = basic + da;
    const gratuityAmount = isEligible
      ? employeeType === "Covered"
        ? salaryBase * 15 / 26 * serviceYearsForCalc
        : salaryBase * 15 / 30 * serviceYearsForCalc
      : 0;

    const exemptByFormula = salaryBase * 15 / 26 * serviceYearsForCalc;
    const taxExemptAmount = Math.min(gratuityAmount, 2000000, exemptByFormula);
    const taxableGratuity = Math.max(0, gratuityAmount - taxExemptAmount);

    setResult({
      exactServicePeriod,
      isEligible,
      gratuityAmount,
      taxExemptAmount,
      taxableGratuity,
      appliedFourYearRule: fourYearRuleApplies,
      serviceYearsForCalc,
    });
  }, [employeeType, lastDrawnBasic, daPay, dateOfJoining, dateOfLeaving, reasonForLeaving]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Employee Type": employeeType, "Last Drawn Basic": lastDrawnBasic, "Da Pay": daPay, "Date Of Joining": dateOfJoining, "Date Of Leaving": dateOfLeaving, "Reason For Leaving": reasonForLeaving },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Employee Type": employeeType, "Last Drawn Basic": lastDrawnBasic, "Da Pay": daPay, "Date Of Joining": dateOfJoining, "Date Of Leaving": dateOfLeaving, "Reason For Leaving": reasonForLeaving }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Gratuity Eligibility & Computation (Detailed)"
      subtitle="Service period-based eligibility with tax exemption calculation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>

          <Field label="Employee Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["Covered", "Not Covered"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setEmployeeType(item)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-md transition-all",
                    employeeType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>

          <MoneyInput label="Last Drawn Basic" value={lastDrawnBasic} onChange={setLastDrawnBasic} />
          <MoneyInput label="DA (monthly)" value={daPay} onChange={setDaPay} />

          <Field label="Date of Joining">
            <input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} className="glass-input w-full h-11 px-3 text-sm" />
          </Field>

          <Field label="Date of Leaving">
            <input type="date" value={dateOfLeaving} onChange={(e) => setDateOfLeaving(e.target.value)} className="glass-input w-full h-11 px-3 text-sm" />
          </Field>

          <Field label="Reason for Leaving">
            <select
              value={reasonForLeaving}
              onChange={(e) => setReasonForLeaving(e.target.value as "Resignation" | "Retirement" | "Death" | "Disability")}
              className="glass-input w-full h-11 px-3 text-sm"
            >
              {(["Resignation", "Retirement", "Death", "Disability"] as const).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Exact Service Period: <span className="text-[var(--text-primary)] font-medium">{result.exactServicePeriod}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Eligibility" value={result.isEligible ? "Eligible" : "Not Eligible"} green={result.isEligible} />
            <MiniStat label="Service Years For Computation" value={result.serviceYearsForCalc.toLocaleString("en-IN")} />
            <MiniStat label="Gratuity Amount" value={formatINR(result.gratuityAmount)} />
            <MiniStat label="Tax Exempt Amount" value={formatINR(result.taxExemptAmount)} green />
            <MiniStat label="Taxable Gratuity" value={formatINR(result.taxableGratuity)} />
          </div>

          {result.appliedFourYearRule && (
            <div className="card-surface p-4 border border-warning/40 text-sm text-warning">
              4 years + 240 days rule applied for resignation eligibility.
            </div>
          )}
        </div>
      )}
    />
  );
}

function CashFlowCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [netIncome, setNetIncome] = useState("");
  const [depreciation, setDepreciation] = useState("");
  const [amortisation, setAmortisation] = useState("");
  const [changeInReceivables, setChangeInReceivables] = useState("");
  const [changeInInventory, setChangeInInventory] = useState("");
  const [changeInPayables, setChangeInPayables] = useState("");
  const [otherOperating, setOtherOperating] = useState("");
  const [capex, setCapex] = useState("");
  const [assetSales, setAssetSales] = useState("");
  const [acquisitions, setAcquisitions] = useState("");
  const [otherInvesting, setOtherInvesting] = useState("");
  const [debtRaised, setDebtRaised] = useState("");
  const [debtRepaid, setDebtRepaid] = useState("");
  const [equityIssued, setEquityIssued] = useState("");
  const [dividendsPaid, setDividendsPaid] = useState("");
  const [otherFinancing, setOtherFinancing] = useState("");
  const [revenue, setRevenue] = useState("");
  const [result, setResult] = useState({
    operatingCF: 0,
    investingCF: 0,
    financingCF: 0,
    netCashFlow: 0,
    freeCashFlow: 0,
    ocfRevenueRatio: 0,
  });

  useEffect(() => {
    const opNet = toNum(netIncome);
    const dep = toNum(depreciation);
    const amo = toNum(amortisation);
    const recv = toNum(changeInReceivables);
    const inv = toNum(changeInInventory);
    const pay = toNum(changeInPayables);
    const otherOp = toNum(otherOperating);

    const cap = toNum(capex);
    const sales = toNum(assetSales);
    const acq = toNum(acquisitions);
    const otherInv = toNum(otherInvesting);

    const debtIn = toNum(debtRaised);
    const debtOut = toNum(debtRepaid);
    const eq = toNum(equityIssued);
    const div = toNum(dividendsPaid);
    const otherFin = toNum(otherFinancing);

    const rev = toNum(revenue);

    const operatingCF = opNet + dep + amo - recv - inv + pay + otherOp;
    const investingCF = -cap + sales - acq + otherInv;
    const financingCF = debtIn - debtOut + eq - div + otherFin;
    const netCashFlow = operatingCF + investingCF + financingCF;
    const freeCashFlow = operatingCF - cap;
    const ocfRevenueRatio = rev > 0 ? (operatingCF / rev) * 100 : 0;

    setResult({ operatingCF, investingCF, financingCF, netCashFlow, freeCashFlow, ocfRevenueRatio });
  }, [
    netIncome,
    depreciation,
    amortisation,
    changeInReceivables,
    changeInInventory,
    changeInPayables,
    otherOperating,
    capex,
    assetSales,
    acquisitions,
    otherInvesting,
    debtRaised,
    debtRepaid,
    equityIssued,
    dividendsPaid,
    otherFinancing,
    revenue,
  ]);

  const status = result.operatingCF > 0 ? "Healthy" : "Warning";

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Net Income": netIncome, "Depreciation": depreciation, "Amortisation": amortisation, "Change In Receivables": changeInReceivables, "Change In Inventory": changeInInventory, "Change In Payables": changeInPayables, "Other Operating": otherOperating, "Capex": capex, "Asset Sales": assetSales, "Acquisitions": acquisitions, "Other Investing": otherInvesting, "Debt Raised": debtRaised, "Debt Repaid": debtRepaid, "Equity Issued": equityIssued, "Dividends Paid": dividendsPaid, "Other Financing": otherFinancing, "Revenue": revenue },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Net Income": netIncome, "Depreciation": depreciation, "Amortisation": amortisation, "Change In Receivables": changeInReceivables, "Change In Inventory": changeInInventory, "Change In Payables": changeInPayables, "Other Operating": otherOperating, "Capex": capex, "Asset Sales": assetSales, "Acquisitions": acquisitions, "Other Investing": otherInvesting, "Debt Raised": debtRaised, "Debt Repaid": debtRepaid, "Equity Issued": equityIssued, "Dividends Paid": dividendsPaid, "Other Financing": otherFinancing, "Revenue": revenue }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Cash Flow Statement Analyser"
      subtitle="Operating, investing, financing cash flow with formal statement view"
      inputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Operating Activities</h2>
            <MoneyInput label="Net Income" value={netIncome} onChange={setNetIncome} />
            <MoneyInput label="Depreciation" value={depreciation} onChange={setDepreciation} />
            <MoneyInput label="Amortisation" value={amortisation} onChange={setAmortisation} />
            <MoneyInput label="Change in Receivables" value={changeInReceivables} onChange={setChangeInReceivables} />
            <MoneyInput label="Change in Inventory" value={changeInInventory} onChange={setChangeInInventory} />
            <MoneyInput label="Change in Payables" value={changeInPayables} onChange={setChangeInPayables} />
            <MoneyInput label="Other Operating" value={otherOperating} onChange={setOtherOperating} />
          </div>

          <div className="card-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Investing Activities</h2>
            <MoneyInput label="Capex" value={capex} onChange={setCapex} />
            <MoneyInput label="Asset Sales" value={assetSales} onChange={setAssetSales} />
            <MoneyInput label="Acquisitions" value={acquisitions} onChange={setAcquisitions} />
            <MoneyInput label="Other Investing" value={otherInvesting} onChange={setOtherInvesting} />
          </div>

          <div className="card-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Financing Activities</h2>
            <MoneyInput label="Debt Raised" value={debtRaised} onChange={setDebtRaised} />
            <MoneyInput label="Debt Repaid" value={debtRepaid} onChange={setDebtRepaid} />
            <MoneyInput label="Equity Issued" value={equityIssued} onChange={setEquityIssued} />
            <MoneyInput label="Dividends Paid" value={dividendsPaid} onChange={setDividendsPaid} />
            <MoneyInput label="Other Financing" value={otherFinancing} onChange={setOtherFinancing} />
            <MoneyInput label="Revenue (Optional for OCF Ratio)" value={revenue} onChange={setRevenue} />
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Cash Flow Statement Layout</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  <tr><td className="px-5 py-2 text-secondary">Cash Flow from Operating Activities</td><td className="px-5 py-2 text-right font-semibold">{formatINR(result.operatingCF)}</td></tr>
                  <tr className="bg-white/[0.02]"><td className="px-5 py-2 text-secondary">Cash Flow from Investing Activities</td><td className="px-5 py-2 text-right font-semibold">{formatINR(result.investingCF)}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Cash Flow from Financing Activities</td><td className="px-5 py-2 text-right font-semibold">{formatINR(result.financingCF)}</td></tr>
                  <tr className="border-t border-primary/20 bg-primary/5"><td className="px-5 py-2.5 font-bold">Net Cash Flow</td><td className="px-5 py-2.5 text-right font-bold">{formatINR(result.netCashFlow)}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Free Cash Flow (OCF - Capex)</td><td className="px-5 py-2 text-right font-semibold">{formatINR(result.freeCashFlow)}</td></tr>
                  <tr className="bg-white/[0.02]"><td className="px-5 py-2 text-secondary">OCF / Revenue Ratio</td><td className="px-5 py-2 text-right font-semibold">{formatPct(result.ocfRevenueRatio)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={cn(
            "card-surface p-4 border text-sm",
            status === "Healthy" ? "border-success/40 text-success" : "border-warning/40 text-warning"
          )}>
            Operating Cash Flow Status: {status}
          </div>
        </div>
      )}
    />
  );
}

function BudgetVarianceCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type VarianceItem = { label: string; budgeted: string; actual: string };

  const [items, setItems] = useState<VarianceItem[]>([
    { label: "Revenue", budgeted: "12000000", actual: "12500000" },
    { label: "COGS", budgeted: "7000000", actual: "7300000" },
    { label: "Gross Profit", budgeted: "5000000", actual: "5200000" },
    { label: "Salaries", budgeted: "1400000", actual: "1450000" },
    { label: "Rent", budgeted: "600000", actual: "600000" },
    { label: "Marketing", budgeted: "500000", actual: "550000" },
    { label: "Admin", budgeted: "350000", actual: "320000" },
    { label: "EBITDA", budgeted: "2150000", actual: "2280000" },
  ]);

  const [result, setResult] = useState({
    rows: [] as Array<{
      label: string;
      budgeted: number;
      actual: number;
      variance: number;
      variancePercent: number;
      status: "Favourable" | "Adverse" | "Within 5%";
    }>,
    totalBudgeted: 0,
    totalActual: 0,
    totalVariance: 0,
    totalVariancePct: 0,
    summary: "",
  });

  useEffect(() => {
    const isPerformanceLabel = (label: string) => /revenue|profit|ebitda/i.test(label);
    const computed = items.map((item) => {
      const budgeted = toNum(item.budgeted);
      const actual = toNum(item.actual);
      const variance = actual - budgeted;
      const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;
      const within5 = Math.abs(variancePercent) <= 5;
      const favourable = isPerformanceLabel(item.label) ? variance >= 0 : variance <= 0;
      const status: "Favourable" | "Adverse" | "Within 5%" = within5
        ? "Within 5%"
        : favourable
          ? "Favourable"
          : "Adverse";
      return { label: item.label, budgeted, actual, variance, variancePercent, status };
    });

    const totalBudgeted = computed.reduce((sum, row) => sum + row.budgeted, 0);
    const totalActual = computed.reduce((sum, row) => sum + row.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePct = totalBudgeted !== 0 ? (totalVariance / totalBudgeted) * 100 : 0;
    const favourableCount = computed.filter((row) => row.status === "Favourable").length;
    const adverseCount = computed.filter((row) => row.status === "Adverse").length;
    const summary = favourableCount >= adverseCount
      ? "Overall performance is trending favourable."
      : "Overall performance shows adverse variance pressure.";

    setResult({ rows: computed, totalBudgeted, totalActual, totalVariance, totalVariancePct, summary });
  }, [items]);

  const updateItem = (index: number, key: keyof VarianceItem, value: string) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Items": items },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Items": items }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Budget vs Actual Variance Analysis"
      subtitle="Line-item variance, percentage and favourable/adverse classification"
      inputPanel={(
        <div className="card-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Line Items (Up to 8)</h2>
          {items.map((item, index) => (
            <div key={item.label + index} className="grid grid-cols-[1fr_120px_120px] gap-2">
              <input
                value={item.label}
                onChange={(e) => updateItem(index, "label", e.target.value)}
                className="glass-input h-10 px-3 text-sm"
              />
              <input
                value={item.budgeted}
                inputMode="decimal"
                onChange={(e) => updateItem(index, "budgeted", e.target.value.replace(/[^0-9.]/g, ""))}
                className="glass-input h-10 px-3 text-sm text-right"
              />
              <input
                value={item.actual}
                inputMode="decimal"
                onChange={(e) => updateItem(index, "actual", e.target.value.replace(/[^0-9.]/g, ""))}
                className="glass-input h-10 px-3 text-sm text-right"
              />
            </div>
          ))}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Variance Table</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Item</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Budget</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Actual</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Variance</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">%</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.label + index} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.label}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.budgeted)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.actual)}</td>
                      <td className="px-3 py-2 text-right">{`₹ ${row.variance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</td>
                      <td className="px-3 py-2 text-right">{formatPct(row.variancePercent)}</td>
                      <td className="px-5 py-2 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-pill text-[10px] font-semibold border",
                          row.status === "Favourable"
                            ? "text-success border-success/40 bg-success/10"
                            : row.status === "Adverse"
                              ? "text-red-400 border-red-400/40 bg-red-400/10"
                              : "text-warning border-warning/40 bg-warning/10"
                        )}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-primary/20 bg-primary/5">
                    <td className="px-5 py-2.5 font-bold">Total</td>
                    <td className="px-3 py-2.5 text-right font-bold">{formatINR(result.totalBudgeted)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{formatINR(result.totalActual)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{`₹ ${result.totalVariance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{formatPct(result.totalVariancePct)}</td>
                    <td className="px-5 py-2.5 text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.summary}</div>
        </div>
      )}
    />
  );
}

function InvoiceGSTCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type InvoiceItem = { description: string; quantity: string; rate: string; gstRate: string };

  const [sellerState, setSellerState] = useState("Karnataka");
  const [buyerState, setBuyerState] = useState("Karnataka");
  const [hsnNote, setHsnNote] = useState("HSN/SAC to be filled as applicable");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "Consulting Service", quantity: "1", rate: "50000", gstRate: "18" },
  ]);
  const [result, setResult] = useState({
    rows: [] as Array<{ description: string; quantity: number; rate: number; gstRate: number; taxableValue: number; cgst: number; sgst: number; igst: number; total: number }>,
    totalTaxableValue: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalGST: 0,
    grandTotal: 0,
    sameState: true,
  });

  useEffect(() => {
    const sameState = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();
    const rows = items.map((item) => {
      const quantity = toNum(item.quantity);
      const rate = toNum(item.rate);
      const gstRate = toNum(item.gstRate);
      const taxableValue = quantity * rate;
      const cgst = sameState ? taxableValue * gstRate / 200 : 0;
      const sgst = sameState ? taxableValue * gstRate / 200 : 0;
      const igst = sameState ? 0 : taxableValue * gstRate / 100;
      const total = taxableValue + cgst + sgst + igst;
      return { description: item.description, quantity, rate, gstRate, taxableValue, cgst, sgst, igst, total };
    });

    const totalTaxableValue = rows.reduce((sum, row) => sum + row.taxableValue, 0);
    const totalCGST = rows.reduce((sum, row) => sum + row.cgst, 0);
    const totalSGST = rows.reduce((sum, row) => sum + row.sgst, 0);
    const totalIGST = rows.reduce((sum, row) => sum + row.igst, 0);
    const totalGST = totalCGST + totalSGST + totalIGST;
    const grandTotal = totalTaxableValue + totalGST;

    setResult({ rows, totalTaxableValue, totalCGST, totalSGST, totalIGST, totalGST, grandTotal, sameState });
  }, [sellerState, buyerState, items]);

  const updateItem = (index: number, key: keyof InvoiceItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => (prev.length >= 5 ? prev : [...prev, { description: "", quantity: "1", rate: "0", gstRate: "18" }]));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Seller State": sellerState, "Buyer State": buyerState, "Hsn Note": hsnNote, "Items": items },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Seller State": sellerState, "Buyer State": buyerState, "Hsn Note": hsnNote, "Items": items }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="GST Invoice Calculator"
      subtitle="Invoice-style GST computation for intra/inter-state supply"
      inputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Party Details</h2>
            <Field label="Seller State">
              <input value={sellerState} onChange={(e) => setSellerState(e.target.value)} className="glass-input w-full h-10 px-3 text-sm" />
            </Field>
            <Field label="Buyer State">
              <input value={buyerState} onChange={(e) => setBuyerState(e.target.value)} className="glass-input w-full h-10 px-3 text-sm" />
            </Field>
          </div>

          <div className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Line Items (Max 5)</h2>
              <button onClick={addItem} className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]">Add Item</button>
            </div>
            {items.map((item, index) => (
              <div key={`line-${index}`} className="grid grid-cols-[1.2fr_70px_110px_80px] gap-2">
                <input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} className="glass-input h-10 px-3 text-sm" placeholder="Description" />
                <input value={item.quantity} inputMode="decimal" onChange={(e) => updateItem(index, "quantity", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Qty" />
                <input value={item.rate} inputMode="decimal" onChange={(e) => updateItem(index, "rate", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Rate" />
                <select value={item.gstRate} onChange={(e) => updateItem(index, "gstRate", e.target.value)} className="glass-input h-10 px-2 text-sm">
                  {["0", "5", "12", "18", "28"].map((rate) => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
              </div>
            ))}
            <Field label="HSN/SAC Note">
              <input value={hsnNote} onChange={(e) => setHsnNote(e.target.value)} className="glass-input w-full h-10 px-3 text-sm" />
            </Field>
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Invoice-style Tax Table</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Description</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Qty</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Rate</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">GST %</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Taxable</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Tax</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.description + index} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.description || "Item"}</td>
                      <td className="px-2 py-2 text-right">{row.quantity.toLocaleString("en-IN")}</td>
                      <td className="px-2 py-2 text-right">{formatINR(row.rate)}</td>
                      <td className="px-2 py-2 text-right">{formatPct(row.gstRate)}</td>
                      <td className="px-2 py-2 text-right">{formatINR(row.taxableValue)}</td>
                      <td className="px-2 py-2 text-right">{formatINR(result.sameState ? row.cgst + row.sgst : row.igst)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 text-sm text-secondary space-y-1">
            <div>Total Taxable Value: <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalTaxableValue)}</span></div>
            {result.sameState ? (
              <>
                <div>CGST: <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalCGST)}</span></div>
                <div>SGST: <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalSGST)}</span></div>
              </>
            ) : (
              <div>IGST: <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalIGST)}</span></div>
            )}
            <div>Grand Total: <span className="text-[var(--text-primary)] font-semibold">{formatINR(result.grandTotal)}</span></div>
            <div>HSN/SAC Note: <span className="text-[var(--text-primary)]">{hsnNote}</span></div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            This is a tax computation — not a legal invoice.
          </div>
        </div>
      )}
    />
  );
}

function PartnershipProfitCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type Partner = { name: string; profitSharingRatio: string; salary: string; interestOnCapital: string; capital: string };

  const [totalProfit, setTotalProfit] = useState("");
  const [partners, setPartners] = useState<Partner[]>([
    { name: "Partner A", profitSharingRatio: "3", salary: "120000", interestOnCapital: "8", capital: "1500000" },
    { name: "Partner B", profitSharingRatio: "2", salary: "90000", interestOnCapital: "8", capital: "1000000" },
  ]);
  const [result, setResult] = useState({
    salaryTotal: 0,
    interestTotal: 0,
    distributableProfit: 0,
    rows: [] as Array<{
      name: string;
      salary: number;
      interest: number;
      share: number;
      finalAmount: number;
      effectivePct: number;
    }>,
  });

  useEffect(() => {
    const profit = toNum(totalProfit);
    const isLoss = profit < 0;
    const ratios = partners.map((p) => Math.max(0, toNum(p.profitSharingRatio)));
    const ratioSum = ratios.reduce((sum, r) => sum + r, 0) || 1;

    const salaryTotal = isLoss ? 0 : partners.reduce((sum, p) => sum + toNum(p.salary), 0);
    const interestAmounts = isLoss
      ? partners.map(() => 0)
      : partners.map((p) => toNum(p.capital) * toNum(p.interestOnCapital) / 100);
    const interestTotal = interestAmounts.reduce((sum, x) => sum + x, 0);
    const distributableProfit = isLoss ? profit : profit - salaryTotal - interestTotal;

    const rows = partners.map((partner, index) => {
      const salary = isLoss ? 0 : toNum(partner.salary);
      const interest = isLoss ? 0 : interestAmounts[index];
      const share = distributableProfit * (ratios[index] / ratioSum);
      const finalAmount = salary + interest + share;
      const effectivePct = profit !== 0 ? (finalAmount / profit) * 100 : 0;
      return { name: partner.name, salary, interest, share, finalAmount, effectivePct };
    });

    setResult({ salaryTotal, interestTotal, distributableProfit, rows });
  }, [totalProfit, partners]);

  const updatePartner = (index: number, key: keyof Partner, value: string) => {
    setPartners((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const addPartner = () => {
    setPartners((prev) => (prev.length >= 6 ? prev : [...prev, {
      name: `Partner ${prev.length + 1}`,
      profitSharingRatio: "1",
      salary: "0",
      interestOnCapital: "0",
      capital: "0",
    }]));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Total Profit": totalProfit, "Partners": partners },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Total Profit": totalProfit, "Partners": partners }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Partnership Profit Sharing Calculator"
      subtitle="Appropriation from net profit to partner-level final allocation"
      inputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 space-y-3">
            <MoneyInput label="Total Profit / (Loss)" value={totalProfit} onChange={setTotalProfit} />
          </div>
          <div className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Partners (Max 6)</h2>
              <button onClick={addPartner} className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]">Add Partner</button>
            </div>
            {partners.map((partner, index) => (
              <div key={partner.name + index} className="grid grid-cols-[1fr_70px_90px_80px_120px] gap-2">
                <input value={partner.name} onChange={(e) => updatePartner(index, "name", e.target.value)} className="glass-input h-10 px-3 text-sm" placeholder="Name" />
                <input value={partner.profitSharingRatio} onChange={(e) => updatePartner(index, "profitSharingRatio", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Ratio" />
                <input value={partner.salary} onChange={(e) => updatePartner(index, "salary", e.target.value.replace(/[^0-9]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Salary" />
                <input value={partner.interestOnCapital} onChange={(e) => updatePartner(index, "interestOnCapital", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Int%" />
                <input value={partner.capital} onChange={(e) => updatePartner(index, "capital", e.target.value.replace(/[^0-9]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Capital" />
              </div>
            ))}
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-4 text-sm text-secondary space-y-1">
            <div>Net Profit: <span className="text-[var(--text-primary)] font-medium">{formatINR(toNum(totalProfit))}</span></div>
            <div>Less: Salaries: <span className="text-[var(--text-primary)] font-medium">{formatINR(result.salaryTotal)}</span></div>
            <div>Less: Interest on Capital: <span className="text-[var(--text-primary)] font-medium">{formatINR(result.interestTotal)}</span></div>
            <div>Distributable Profit: <span className="text-[var(--text-primary)] font-semibold">{formatINR(result.distributableProfit)}</span></div>
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Partner Allocation</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Partner</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Salary</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Interest</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Share</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">Final Amount</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Effective %</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.name + index} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.name}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.salary)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.interest)}</td>
                      <td className="px-3 py-2 text-right">{`₹ ${row.share.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</td>
                      <td className="px-3 py-2 text-right font-medium">{`₹ ${row.finalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</td>
                      <td className="px-5 py-2 text-right">{formatPct(row.effectivePct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function DepreciationComparisonCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [assetCost, setAssetCost] = useState("");
  const [salvageValue, setSalvageValue] = useState("100000");
  const [usefulLife, setUsefulLife] = useState("");
  const [decliningRate, setDecliningRate] = useState("200");
  const [result, setResult] = useState({
    rows: [] as Array<{
      year: number;
      slm: number;
      wdv: number;
      syd: number;
      ddb: number;
      slmBook: number;
      wdvBook: number;
      sydBook: number;
      ddbBook: number;
    }>,
    totalSLM: 0,
    totalWDV: 0,
    totalSYD: 0,
    totalDDB: 0,
    earlyHighMethod: "",
  });

  useEffect(() => {
    const cost = toNum(assetCost);
    const salvage = Math.min(cost, toNum(salvageValue));
    const life = Math.max(1, Math.floor(toNum(usefulLife)));
    const depBase = Math.max(0, cost - salvage);
    const wdvRate = 100 / life;
    const ddbMultiplier = toNum(decliningRate) / 100;
    const sumDigits = life * (life + 1) / 2;
    const slmDep = depBase / life;

    let slmBook = cost;
    let wdvBook = cost;
    let sydBook = cost;
    let ddbBook = cost;

    const rows: Array<{
      year: number;
      slm: number;
      wdv: number;
      syd: number;
      ddb: number;
      slmBook: number;
      wdvBook: number;
      sydBook: number;
      ddbBook: number;
    }> = [];

    for (let year = 1; year <= life; year += 1) {
      const slm = Math.min(slmDep, Math.max(0, slmBook - salvage));
      slmBook = Math.max(salvage, slmBook - slm);

      const wdv = Math.min(wdvBook * wdvRate / 100, Math.max(0, wdvBook - salvage));
      wdvBook = Math.max(salvage, wdvBook - wdv);

      const syd = Math.min(((life - year + 1) / sumDigits) * depBase, Math.max(0, sydBook - salvage));
      sydBook = Math.max(salvage, sydBook - syd);

      const ddbCandidate = ddbBook * ddbMultiplier / life;
      const ddb = Math.min(ddbCandidate, Math.max(0, ddbBook - salvage));
      ddbBook = Math.max(salvage, ddbBook - ddb);

      rows.push({ year, slm, wdv, syd, ddb, slmBook, wdvBook, sydBook, ddbBook });
    }

    const totalSLM = rows.reduce((sum, row) => sum + row.slm, 0);
    const totalWDV = rows.reduce((sum, row) => sum + row.wdv, 0);
    const totalSYD = rows.reduce((sum, row) => sum + row.syd, 0);
    const totalDDB = rows.reduce((sum, row) => sum + row.ddb, 0);
    const earlyHighMethod = rows.length > 0 && rows[0].ddb >= rows[0].syd ? "DDB" : "SYD";

    setResult({ rows, totalSLM, totalWDV, totalSYD, totalDDB, earlyHighMethod });
  }, [assetCost, salvageValue, usefulLife, decliningRate]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Asset Cost": assetCost, "Salvage Value": salvageValue, "Useful Life": usefulLife, "Declining Rate": decliningRate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Asset Cost": assetCost, "Salvage Value": salvageValue, "Useful Life": usefulLife, "Declining Rate": decliningRate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Depreciation Methods Comparison"
      subtitle="Side-by-side SLM, WDV, SYD and Double Declining comparison"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Inputs</h2>
          <MoneyInput label="Asset Cost" value={assetCost} onChange={setAssetCost} />
          <MoneyInput label="Salvage Value" value={salvageValue} onChange={setSalvageValue} />
          <NumberInput label="Useful Life (Years)" value={usefulLife} onChange={setUsefulLife} />
          <NumberInput label="Declining Rate Multiplier (%)" value={decliningRate} onChange={setDecliningRate} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Depreciation Per Year</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">SLM</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">WDV</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">SYD</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">DDB</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.slm)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.wdv)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.syd)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.ddb)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 text-sm text-secondary space-y-1">
            <div>Total Depreciation (SLM): <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalSLM)}</span></div>
            <div>Total Depreciation (WDV): <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalWDV)}</span></div>
            <div>Total Depreciation (SYD): <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalSYD)}</span></div>
            <div>Total Depreciation (DDB): <span className="text-[var(--text-primary)] font-medium">{formatINR(result.totalDDB)}</span></div>
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Chart Data (Declining Book Values)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">SLM Book</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">WDV Book</th>
                    <th className="text-right font-medium px-3 py-2 bg-primary/10">SYD Book</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">DDB Book</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={`book-${row.year}`} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.year.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.slmBook)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.wdvBook)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.sydBook)}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.ddbBook)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">
            Highest early-year depreciation method: <span className="text-[var(--text-primary)] font-medium">{result.earlyHighMethod}</span>. Equal annual distribution method: <span className="text-[var(--text-primary)] font-medium">SLM</span>.
          </div>
        </div>
      )}
    />
  );
}

function EquityValuationCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [currentEPS, setCurrentEPS] = useState("");
  const [epsGrowthRate, setEpsGrowthRate] = useState("");
  const [dividendPerShare, setDividendPerShare] = useState("");
  const [dividendGrowthRate, setDividendGrowthRate] = useState("");
  const [requiredReturn, setRequiredReturn] = useState("");
  const [industryPE, setIndustryPE] = useState("");
  const [currentMarketPrice, setCurrentMarketPrice] = useState("");
  const [result, setResult] = useState({
    intrinsicValueDDM: 0,
    intrinsicValuePE: 0,
    fairValueEPS: 0,
    averageValue: 0,
    marginOfSafety: 0,
    upsideDownside: 0,
    recommendation: "",
  });

  useEffect(() => {
    const eps = toNum(currentEPS);
    const epsG = toNum(epsGrowthRate) / 100;
    const dps = toNum(dividendPerShare);
    const divG = toNum(dividendGrowthRate) / 100;
    const req = toNum(requiredReturn) / 100;
    const pe = toNum(industryPE);
    const market = toNum(currentMarketPrice);

    const intrinsicValueDDM = req > divG ? dps * (1 + divG) / (req - divG) : 0;
    const intrinsicValuePE = eps * pe;
    const projectedEPS5Y = eps * (1 + epsG) ** 5;
    const fairValueEPS = req > 0 ? (projectedEPS5Y * pe) / (1 + req) ** 5 : projectedEPS5Y * pe;

    const averageValue = (intrinsicValueDDM + intrinsicValuePE + fairValueEPS) / 3;
    const marginOfSafety = averageValue * 0.8;
    const upsideDownside = market > 0 ? ((averageValue - market) / market) * 100 : 0;
    const recommendation = market <= 0
      ? "Provide market price for valuation call"
      : averageValue > market * 1.1
        ? "Undervalued"
        : averageValue < market * 0.9
          ? "Overvalued"
          : "Fairly Valued";

    setResult({
      intrinsicValueDDM,
      intrinsicValuePE,
      fairValueEPS,
      averageValue,
      marginOfSafety,
      upsideDownside,
      recommendation,
    });
  }, [currentEPS, epsGrowthRate, dividendPerShare, dividendGrowthRate, requiredReturn, industryPE, currentMarketPrice]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Current Eps": currentEPS, "Eps Growth Rate": epsGrowthRate, "Dividend Per Share": dividendPerShare, "Dividend Growth Rate": dividendGrowthRate, "Required Return": requiredReturn, "Industry Pe": industryPE, "Current Market Price": currentMarketPrice },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Current E P S": currentEPS, "Eps Growth Rate": epsGrowthRate, "Dividend Per Share": dividendPerShare, "Dividend Growth Rate": dividendGrowthRate, "Required Return": requiredReturn, "Industry P E": industryPE, "Current Market Price": currentMarketPrice }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Equity Valuation — DDM & P/E"
      subtitle="Multi-method intrinsic value and recommendation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Current EPS" value={currentEPS} onChange={setCurrentEPS} />
          <NumberInput label="EPS Growth Rate (%)" value={epsGrowthRate} onChange={setEpsGrowthRate} />
          <MoneyInput label="Dividend Per Share" value={dividendPerShare} onChange={setDividendPerShare} />
          <NumberInput label="Dividend Growth Rate (%)" value={dividendGrowthRate} onChange={setDividendGrowthRate} />
          <NumberInput label="Required Return (%)" value={requiredReturn} onChange={setRequiredReturn} />
          <NumberInput label="Industry P/E" value={industryPE} onChange={setIndustryPE} />
          <MoneyInput label="Current Market Price (Optional)" value={currentMarketPrice} onChange={setCurrentMarketPrice} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="DDM Value" value={formatINR(result.intrinsicValueDDM)} />
            <MiniStat label="P/E Value" value={formatINR(result.intrinsicValuePE)} />
            <MiniStat label="EPS Growth Fair Value" value={formatINR(result.fairValueEPS)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Average Value" value={formatINR(result.averageValue)} green />
            <MiniStat label="Margin of Safety (20%)" value={formatINR(result.marginOfSafety)} />
            <MiniStat label="Upside / Downside" value={formatPct(result.upsideDownside)} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Recommendation: <span className="text-[var(--text-primary)] font-medium">{result.recommendation}</span></div>
        </div>
      )}
    />
  );
}

function EMIMoratoriumCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [originalTenure, setOriginalTenure] = useState("");
  const [moratoriumMonths, setMoratoriumMonths] = useState("");
  const [moratoriumType, setMoratoriumType] = useState<"interest-only" | "full deferment">("interest-only");
  const [result, setResult] = useState({
    originalEMI: 0,
    newLoanAmount: 0,
    newEMI: 0,
    extraInterestDue: 0,
    totalExtraCost: 0,
    rows: [] as Array<{ month: number; opening: number; interest: number; closing: number }>,
  });

  useEffect(() => {
    const principal = toNum(loanAmount);
    const rate = toNum(interestRate);
    const tenure = Math.max(1, Math.floor(toNum(originalTenure)));
    const mMonths = Math.min(6, Math.max(1, Math.floor(toNum(moratoriumMonths))));
    const r = rate / 12 / 100;

    const originalEMI = calculateEMIFromPrincipal(principal, rate, tenure);
    let newLoanAmount = principal;
    const rows: Array<{ month: number; opening: number; interest: number; closing: number }> = [];
    let opening = principal;

    for (let m = 1; m <= mMonths; m += 1) {
      const interest = moratoriumType === "interest-only"
        ? principal * r
        : opening * r;
      const closing = moratoriumType === "interest-only" ? opening : opening + interest;
      rows.push({ month: m, opening, interest, closing });
      opening = closing;
    }

    const interestAccrued = moratoriumType === "interest-only"
      ? principal * r * mMonths
      : principal * (1 + r) ** mMonths - principal;

    newLoanAmount = principal + interestAccrued;
    const newEMI = calculateEMIFromPrincipal(newLoanAmount, rate, tenure);
    const extraInterestDue = Math.max(0, (newEMI * tenure) - (originalEMI * tenure));
    const totalExtraCost = extraInterestDue;

    setResult({ originalEMI, newLoanAmount, newEMI, extraInterestDue, totalExtraCost, rows });
  }, [loanAmount, interestRate, originalTenure, moratoriumMonths, moratoriumType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Loan Amount": loanAmount, "Interest Rate": interestRate, "Original Tenure": originalTenure, "Moratorium Months": moratoriumMonths, "Moratorium Type": moratoriumType },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Loan Amount": loanAmount, "Interest Rate": interestRate, "Original Tenure": originalTenure, "Moratorium Months": moratoriumMonths, "Moratorium Type": moratoriumType }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="EMI Moratorium Impact Calculator"
      subtitle="Compare EMI impact of interest-only vs full deferment"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} />
          <NumberInput label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} />
          <NumberInput label="Original Tenure (Months)" value={originalTenure} onChange={setOriginalTenure} />
          <NumberInput label="Moratorium Months (1-6)" value={moratoriumMonths} onChange={setMoratoriumMonths} />
          <Field label="Moratorium Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["interest-only", "full deferment"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setMoratoriumType(item)}
                  className={cn("py-2 text-xs font-medium rounded-md transition-all capitalize", moratoriumType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Original EMI" value={formatINR(result.originalEMI)} />
            <MiniStat label="New Loan Amount" value={formatINR(result.newLoanAmount)} />
            <MiniStat label="New EMI" value={formatINR(result.newEMI)} />
            <MiniStat label="Extra Interest Due" value={formatINR(result.extraInterestDue)} />
            <MiniStat label="Total Extra Cost" value={formatINR(result.totalExtraCost)} green />
          </div>
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Moratorium Month-wise</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead><tr className="text-tertiary"><th className="text-left font-medium px-5 py-2 bg-primary/10">Month</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Opening</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Interest</th><th className="text-right font-medium px-5 py-2 bg-primary/10">Closing</th></tr></thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={row.month} className={i % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.month.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.opening)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(row.interest)}</td>
                      <td className="px-5 py-2 text-right">{formatINR(row.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Recommendation: Interest-only preferred over full deferment.</div>
        </div>
      )}
    />
  );
}

function IncomeTaxNoticeCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [taxDemand, setTaxDemand] = useState("");
  const [noticeDate, setNoticeDate] = useState("2026-01-10");
  const [paymentDate, setPaymentDate] = useState("2026-04-25");
  const [noticeType, setNoticeType] = useState<"143(1)" | "143(3)" | "148" | "271">("143(1)");
  const [result, setResult] = useState({
    months: 0,
    interest234A: 0,
    interest234B: 0,
    interest234C: 0,
    totalInterest: 0,
    totalDue: 0,
    overdueDays: 0,
    penaltyMin: 0,
    penaltyMax: 0,
  });

  useEffect(() => {
    const demand = toNum(taxDemand);
    const start = new Date(noticeDate);
    const end = new Date(paymentDate);
    const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const months = Math.max(0, Math.ceil(days / 30));

    const hasA = noticeType === "143(1)" || noticeType === "148";
    const hasB = noticeType === "143(1)" || noticeType === "143(3)" || noticeType === "148";
    const hasC = noticeType === "143(1)" || noticeType === "143(3)" || noticeType === "148";

    const interest234A = hasA ? demand * 0.01 * months : 0;
    const interest234B = hasB ? demand * 0.01 * months : 0;
    const interest234C = hasC ? demand * 0.01 * months : 0;
    const totalInterest = interest234A + interest234B + interest234C;
    const totalDue = demand + totalInterest;
    const penaltyMin = noticeType === "271" ? demand * 1 : 0;
    const penaltyMax = noticeType === "271" ? demand * 3 : 0;

    setResult({ months, interest234A, interest234B, interest234C, totalInterest, totalDue, overdueDays: days, penaltyMin, penaltyMax });
  }, [taxDemand, noticeDate, paymentDate, noticeType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Tax Demand": taxDemand, "Notice Date": noticeDate, "Payment Date": paymentDate, "Notice Type": noticeType },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Tax Demand": taxDemand, "Notice Date": noticeDate, "Payment Date": paymentDate, "Notice Type": noticeType }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Income Tax Notice Interest Calculator"
      subtitle="Section 234 interest and notice-related due computation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Tax Demand" value={taxDemand} onChange={setTaxDemand} />
          <Field label="Notice Date"><input type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} className="glass-input w-full h-11 px-3 text-sm" /></Field>
          <Field label="Payment Date"><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="glass-input w-full h-11 px-3 text-sm" /></Field>
          <Field label="Notice Type">
            <select value={noticeType} onChange={(e) => setNoticeType(e.target.value as "143(1)" | "143(3)" | "148" | "271")} className="glass-input w-full h-11 px-3 text-sm">
              {(["143(1)", "143(3)", "148", "271"] as const).map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Months" value={result.months.toLocaleString("en-IN")} />
            <MiniStat label="Interest 234A" value={formatINR(result.interest234A)} />
            <MiniStat label="Interest 234B" value={formatINR(result.interest234B)} />
            <MiniStat label="Interest 234C" value={formatINR(result.interest234C)} />
            <MiniStat label="Total Interest" value={formatINR(result.totalInterest)} />
            <MiniStat label="Total Due" value={formatINR(result.totalDue)} green />
          </div>
          <div className="card-surface p-4 border border-warning/40 text-sm text-warning">Payment urgency: overdue by {result.overdueDays.toLocaleString("en-IN")} days.</div>
          {noticeType === "271" && (
            <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Penalty range under 271(1)(c): {formatINR(result.penaltyMin)} to {formatINR(result.penaltyMax)}.</div>
          )}
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Interest calculated as per Section 234 of Income Tax Act.</div>
        </div>
      )}
    />
  );
}

function StartupValuationCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [revenueGrowthRate, setRevenueGrowthRate] = useState("");
  const [netMargin, setNetMargin] = useState("");
  const [industryRevenueMultiple, setIndustryRevenueMultiple] = useState("");
  const [industryEBITDAMultiple, setIndustryEBITDAMultiple] = useState("");
  const [totalFunding, setTotalFunding] = useState("");
  const [berkusIdea, setBerkusIdea] = useState(true);
  const [berkusPrototype, setBerkusPrototype] = useState(true);
  const [berkusManagement, setBerkusManagement] = useState(true);
  const [berkusRelations, setBerkusRelations] = useState(false);
  const [berkusRollout, setBerkusRollout] = useState(false);
  const [result, setResult] = useState({
    revenueMultipleValue: 0,
    ebitdaMultipleValue: 0,
    berkusValue: 0,
    vcMethodValue: 0,
    averageValue: 0,
    suggestedDilution: 0,
  });

  useEffect(() => {
    const rev = toNum(annualRevenue);
    const growth = toNum(revenueGrowthRate) / 100;
    const margin = toNum(netMargin) / 100;
    const revMult = toNum(industryRevenueMultiple);
    const ebitdaMult = toNum(industryEBITDAMultiple);
    const funding = toNum(totalFunding);

    const revenueMultipleValue = rev * revMult;
    const ebitdaMultipleValue = rev * margin * ebitdaMult;
    const berkusFactors = [berkusIdea, berkusPrototype, berkusManagement, berkusRelations, berkusRollout].filter(Boolean).length;
    const berkusValue = berkusFactors * 500000 * 83;
    const projectedRevenue5Y = rev * (1 + growth) ** 5;
    const terminalValue = projectedRevenue5Y * revMult;
    const vcMethodValue = terminalValue / (1 + 0.5) ** 5;
    const averageValue = (revenueMultipleValue + ebitdaMultipleValue + berkusValue + vcMethodValue) / 4;
    const suggestedDilution = averageValue > 0 ? (funding / averageValue) * 20 : 0;

    setResult({ revenueMultipleValue, ebitdaMultipleValue, berkusValue, vcMethodValue, averageValue, suggestedDilution });
  }, [annualRevenue, revenueGrowthRate, netMargin, industryRevenueMultiple, industryEBITDAMultiple, totalFunding, berkusIdea, berkusPrototype, berkusManagement, berkusRelations, berkusRollout]);

  const berkusItems = [
    { label: "Sound idea", value: berkusIdea, set: setBerkusIdea },
    { label: "Prototype", value: berkusPrototype, set: setBerkusPrototype },
    { label: "Quality management", value: berkusManagement, set: setBerkusManagement },
    { label: "Strategic relationships", value: berkusRelations, set: setBerkusRelations },
    { label: "Product rollout/sales", value: berkusRollout, set: setBerkusRollout },
  ];

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Annual Revenue": annualRevenue, "Revenue Growth Rate": revenueGrowthRate, "Net Margin": netMargin, "Industry Revenue Multiple": industryRevenueMultiple, "Industry Ebitda Multiple": industryEBITDAMultiple, "Total Funding": totalFunding, "Berkus Idea": berkusIdea, "Berkus Prototype": berkusPrototype, "Berkus Management": berkusManagement, "Berkus Relations": berkusRelations, "Berkus Rollout": berkusRollout },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Annual Revenue": annualRevenue, "Revenue Growth Rate": revenueGrowthRate, "Net Margin": netMargin, "Industry Revenue Multiple": industryRevenueMultiple, "Industry E B I T D A Multiple": industryEBITDAMultiple, "Total Funding": totalFunding, "Berkus Idea": berkusIdea, "Berkus Prototype": berkusPrototype, "Berkus Management": berkusManagement, "Berkus Relations": berkusRelations, "Berkus Rollout": berkusRollout }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Startup Valuation Calculator"
      subtitle="Revenue, EBITDA, Berkus and VC method side-by-side"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Annual Revenue" value={annualRevenue} onChange={setAnnualRevenue} />
          <NumberInput label="Revenue Growth Rate (%)" value={revenueGrowthRate} onChange={setRevenueGrowthRate} />
          <NumberInput label="Net Margin (%)" value={netMargin} onChange={setNetMargin} />
          <NumberInput label="Industry Revenue Multiple" value={industryRevenueMultiple} onChange={setIndustryRevenueMultiple} />
          <NumberInput label="Industry EBITDA Multiple" value={industryEBITDAMultiple} onChange={setIndustryEBITDAMultiple} />
          <MoneyInput label="Total Funding Raised" value={totalFunding} onChange={setTotalFunding} />
          <Field label="Berkus Factors (Each worth up to $500K)">
            <div className="space-y-2">
              {berkusItems.map((item) => (
                <button key={item.label} onClick={() => item.set(!item.value)} className={cn("w-full py-2 text-xs font-medium rounded-md border transition-all text-left px-3", item.value ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{item.label}</button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Revenue Multiple" value={formatINR(result.revenueMultipleValue)} />
            <MiniStat label="EBITDA Multiple" value={formatINR(result.ebitdaMultipleValue)} />
            <MiniStat label="Berkus Method" value={formatINR(result.berkusValue)} />
            <MiniStat label="VC Method" value={formatINR(result.vcMethodValue)} />
            <MiniStat label="Average Valuation" value={formatINR(result.averageValue)} green />
            <MiniStat label="Suggested Dilution @20% round" value={formatPct(result.suggestedDilution)} />
          </div>
        </div>
      )}
    />
  );
}

function TaxPlanningCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [annualIncome, setAnnualIncome] = useState("");
  const [currentRegime, setCurrentRegime] = useState<"new" | "old">("new");
  const [current80C, setCurrent80C] = useState("");
  const [current80D, setCurrent80D] = useState("");
  const [hasNPS, setHasNPS] = useState(false);
  const [rentPaid, setRentPaid] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [cityType, setCityType] = useState<"metro" | "non-metro">("metro");
  const [homeLoanInterest, setHomeLoanInterest] = useState("");
  const [result, setResult] = useState({
    currentTaxNew: 0,
    currentTaxOld: 0,
    betterRegime: "",
    optimizedTax: 0,
    totalPotentialSaving: 0,
    actions: [] as Array<{ action: string; saving: number }>,
  });

  useEffect(() => {
    const income = toNum(annualIncome);
    const ded80cUsed = Math.min(toNum(current80C), 150000);
    const ded80dUsed = Math.min(toNum(current80D), 25000);
    const annualRent = toNum(rentPaid) * 12;
    const annualBasic = toNum(basicSalary) * 12;
    const hraCap = annualBasic * (cityType === "metro" ? 0.5 : 0.4);
    const hraPotential = Math.max(0, Math.min(hraCap, annualRent - annualBasic * 0.1));
    const homeLoanDed = Math.min(200000, toNum(homeLoanInterest));

    const taxNew = calculateSlabTax(Math.max(0, income), NEW_REGIME_SLABS).baseTax * 1.04;
    const oldBaseTaxable = Math.max(0, income - ded80cUsed - ded80dUsed - (hasNPS ? 50000 : 0) - hraPotential - homeLoanDed);
    const taxOld = calculateSlabTax(oldBaseTaxable, OLD_REGIME_SLABS).baseTax * 1.04;

    const betterRegime = taxNew <= taxOld ? "New Regime" : "Old Regime";
    const baseTax = currentRegime === "new" ? taxNew : taxOld;

    const remaining80C = Math.max(0, 150000 - ded80cUsed);
    const remaining80D = Math.max(0, 25000 - ded80dUsed);
    const npsExtra = hasNPS ? 0 : 50000;
    const homeLoanExtra = Math.max(0, 200000 - homeLoanDed);

    const effectiveSlab = income > 1500000 ? 0.3 : income > 1000000 ? 0.2 : 0.1;
    const actions = [
      { action: "Use remaining Section 80C capacity", saving: remaining80C * effectiveSlab },
      { action: "Use NPS 80CCD(1B) additional deduction", saving: npsExtra * effectiveSlab },
      { action: "Claim HRA exemption if eligible", saving: hraPotential * effectiveSlab },
      { action: "Use unused 80D health insurance deduction", saving: remaining80D * effectiveSlab },
      { action: "Use Section 24 home loan interest deduction", saving: homeLoanExtra * effectiveSlab },
    ];

    const totalPotentialSaving = actions.reduce((sum, row) => sum + row.saving, 0);
    const optimizedTax = Math.max(0, baseTax - totalPotentialSaving);

    setResult({ currentTaxNew: taxNew, currentTaxOld: taxOld, betterRegime, optimizedTax, totalPotentialSaving, actions });
  }, [annualIncome, currentRegime, current80C, current80D, hasNPS, rentPaid, basicSalary, cityType, homeLoanInterest]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Annual Income": annualIncome, "Current Regime": currentRegime, "Current80C": current80C, "Current80D": current80D, "Has Nps": hasNPS, "Rent Paid": rentPaid, "Basic Salary": basicSalary, "City Type": cityType, "Home Loan Interest": homeLoanInterest },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Annual Income": annualIncome, "Current Regime": currentRegime, "Current80 C": current80C, "Current80 D": current80D, "Has N P S": hasNPS, "Rent Paid": rentPaid, "Basic Salary": basicSalary, "City Type": cityType, "Home Loan Interest": homeLoanInterest }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Tax Planning & Saving Optimizer"
      subtitle="Regime comparison with prioritized tax-saving actions"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Annual Income" value={annualIncome} onChange={setAnnualIncome} />
          <Field label="Current Regime">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["new", "old"] as const).map((r) => (
                <button key={r} onClick={() => setCurrentRegime(r)} className={cn("py-2 text-xs font-medium rounded-md transition-all uppercase", currentRegime === r ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{r}</button>
              ))}
            </div>
          </Field>
          <MoneyInput label="Current 80C" value={current80C} onChange={setCurrent80C} />
          <MoneyInput label="Current 80D" value={current80D} onChange={setCurrent80D} />
          <Field label="Has NPS (80CCD)">
            <button onClick={() => setHasNPS((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", hasNPS ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{hasNPS ? "Yes" : "No"}</button>
          </Field>
          <MoneyInput label="Rent Paid (Monthly)" value={rentPaid} onChange={setRentPaid} />
          <MoneyInput label="Basic Salary (Monthly)" value={basicSalary} onChange={setBasicSalary} />
          <Field label="City Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["metro", "non-metro"] as const).map((c) => (
                <button key={c} onClick={() => setCityType(c)} className={cn("py-2 text-xs font-medium rounded-md transition-all capitalize", cityType === c ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{c}</button>
              ))}
            </div>
          </Field>
          <MoneyInput label="Home Loan Interest" value={homeLoanInterest} onChange={setHomeLoanInterest} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Current Tax (New Regime)" value={formatINR(result.currentTaxNew)} />
            <MiniStat label="Current Tax (Old Regime)" value={formatINR(result.currentTaxOld)} />
            <MiniStat label="Optimized Tax" value={formatINR(result.optimizedTax)} green />
            <MiniStat label="Total Potential Saving" value={formatINR(result.totalPotentialSaving)} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Better Regime: <span className="text-[var(--text-primary)] font-medium">{result.betterRegime}</span></div>
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Prioritized Action List</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  {result.actions.sort((a, b) => b.saving - a.saving).map((row, index) => (
                    <tr key={row.action} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{index + 1}. {row.action}</td>
                      <td className="px-5 py-2 text-right font-medium">{formatINR(row.saving)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function ReceivablesAgingCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type Debtor = { clientName: string; invoiceAmount: string; invoiceDate: string; expectedCollection: string };
  type BucketKey = "Current (0-30)" | "31-60" | "61-90" | "91-180" | ">180";

  const [debtors, setDebtors] = useState<Debtor[]>([
    { clientName: "Client A", invoiceAmount: "125000", invoiceDate: "2026-03-01", expectedCollection: "2026-04-30" },
    { clientName: "Client B", invoiceAmount: "280000", invoiceDate: "2025-10-15", expectedCollection: "2026-05-15" },
  ]);
  const [result, setResult] = useState({
    rows: [] as Array<{ clientName: string; invoiceAmount: number; invoiceDate: string; expectedCollection: string; daysOutstanding: number; bucket: BucketKey; provisionRate: number; provisionAmount: number }> ,
    bucketTotals: {
      "Current (0-30)": 0,
      "31-60": 0,
      "61-90": 0,
      "91-180": 0,
      ">180": 0,
    } as Record<BucketKey, number>,
    totalAmount: 0,
    totalProvision: 0,
  });

  useEffect(() => {
    const now = new Date();
    const getBucket = (days: number): { bucket: BucketKey; rate: number } => {
      if (days <= 30) return { bucket: "Current (0-30)", rate: 0 };
      if (days <= 60) return { bucket: "31-60", rate: 0.05 };
      if (days <= 90) return { bucket: "61-90", rate: 0.1 };
      if (days <= 180) return { bucket: "91-180", rate: 0.25 };
      return { bucket: ">180", rate: 0.5 };
    };

    const bucketTotals: Record<BucketKey, number> = {
      "Current (0-30)": 0,
      "31-60": 0,
      "61-90": 0,
      "91-180": 0,
      ">180": 0,
    };

    const rows = debtors.map((debtor) => {
      const amount = toNum(debtor.invoiceAmount);
      const invoiceDate = debtor.invoiceDate ? new Date(debtor.invoiceDate) : now;
      const daysOutstanding = Math.max(0, Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)));
      const { bucket, rate } = getBucket(daysOutstanding);
      const provisionAmount = amount * rate;
      bucketTotals[bucket] += amount;

      return {
        clientName: debtor.clientName,
        invoiceAmount: amount,
        invoiceDate: debtor.invoiceDate,
        expectedCollection: debtor.expectedCollection,
        daysOutstanding,
        bucket,
        provisionRate: rate * 100,
        provisionAmount,
      };
    });

    const totalAmount = rows.reduce((sum, row) => sum + row.invoiceAmount, 0);
    const totalProvision = rows.reduce((sum, row) => sum + row.provisionAmount, 0);
    setResult({ rows, bucketTotals, totalAmount, totalProvision });
  }, [debtors]);

  const updateDebtor = (index: number, key: keyof Debtor, value: string) => {
    setDebtors((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addDebtor = () => {
    setDebtors((prev) => (prev.length >= 10 ? prev : [...prev, { clientName: "", invoiceAmount: "0", invoiceDate: "", expectedCollection: "" }]));
  };

  const bucketOrder: BucketKey[] = ["Current (0-30)", "31-60", "61-90", "91-180", ">180"];

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Debtors": debtors },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Debtors": debtors }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Accounts Receivable Aging Analysis"
      subtitle="Debtor aging buckets with provisioning and concentration view"
      inputPanel={(
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Debtors (Max 10)</h2>
            <button onClick={addDebtor} className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]">Add Debtor</button>
          </div>
          {debtors.map((debtor, index) => (
            <div key={`debtor-${index}`} className="grid grid-cols-1 sm:grid-cols-[1.2fr_120px_140px_140px] gap-2">
              <input value={debtor.clientName} onChange={(e) => updateDebtor(index, "clientName", e.target.value)} className="glass-input h-10 px-3 text-sm" placeholder="Client Name" />
              <input value={debtor.invoiceAmount} inputMode="decimal" onChange={(e) => updateDebtor(index, "invoiceAmount", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Amount" />
              <input type="date" value={debtor.invoiceDate} onChange={(e) => updateDebtor(index, "invoiceDate", e.target.value)} className="glass-input h-10 px-3 text-sm" />
              <input type="date" value={debtor.expectedCollection} onChange={(e) => updateDebtor(index, "expectedCollection", e.target.value)} className="glass-input h-10 px-3 text-sm" />
            </div>
          ))}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Aging Table</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Client</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Invoice Amt</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Invoice Date</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Expected</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Days</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Bucket</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Prov %</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Provision</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={`${row.clientName}-${index}`} className={cn(index % 2 ? "bg-white/[0.02]" : "", row.daysOutstanding > 90 ? "text-red-300" : row.daysOutstanding > 60 ? "text-warning" : row.daysOutstanding <= 30 ? "text-success" : "") }>
                      <td className="px-5 py-2">{row.clientName || `Client ${index + 1}`}</td>
                      <td className="px-2 py-2 text-right text-[var(--text-primary)]">₹ {row.invoiceAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-2 text-right">{row.invoiceDate || "-"}</td>
                      <td className="px-2 py-2 text-right">{row.expectedCollection || "-"}</td>
                      <td className="px-2 py-2 text-right">{row.daysOutstanding.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{row.bucket}</td>
                      <td className="px-2 py-2 text-right">{formatPct(row.provisionRate)}</td>
                      <td className="px-5 py-2 text-right text-[var(--text-primary)]">₹ {row.provisionAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 text-sm text-secondary space-y-2">
            {bucketOrder.map((bucket) => {
              const amount = result.bucketTotals[bucket];
              const pct = result.totalAmount > 0 ? (amount / result.totalAmount) * 100 : 0;
              const barClass = bucket === "Current (0-30)" ? "bg-success" : bucket === "61-90" ? "bg-warning" : (bucket === "91-180" || bucket === ">180") ? "bg-red-400" : "bg-primary";
              return (
                <div key={bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{bucket}</span>
                    <span className="text-[var(--text-primary)]">₹ {amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({pct.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className={cn("h-full rounded-full", barClass)} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
            <div>Total Provision: <span className="text-[var(--text-primary)] font-semibold">₹ {result.totalProvision.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      )}
    />
  );
}

function TDS26ASCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type TdsEntry = { deductorName: string; section: string; tdsDeducted: string; incomeAmount: string; quarter: "Q1" | "Q2" | "Q3" | "Q4" };

  const [entries, setEntries] = useState<TdsEntry[]>([
    { deductorName: "ABC Ltd", section: "194J", tdsDeducted: "25000", incomeAmount: "250000", quarter: "Q1" },
    { deductorName: "XYZ Pvt Ltd", section: "194C", tdsDeducted: "18000", incomeAmount: "900000", quarter: "Q2" },
  ]);
  const [result, setResult] = useState({
    rows: [] as Array<{ deductorName: string; section: string; incomeAmount: number; tdsDeducted: number; quarter: string }> ,
    totalIncome: 0,
    totalTDS: 0,
    taxLiability: 0,
    netTaxPayable: 0,
    refundDue: 0,
    itrSuggestion: "",
  });

  useEffect(() => {
    const rows = entries.map((entry) => ({
      deductorName: entry.deductorName,
      section: entry.section,
      incomeAmount: toNum(entry.incomeAmount),
      tdsDeducted: toNum(entry.tdsDeducted),
      quarter: entry.quarter,
    }));

    const totalIncome = rows.reduce((sum, row) => sum + row.incomeAmount, 0);
    const totalTDS = rows.reduce((sum, row) => sum + row.tdsDeducted, 0);
    const baseTax = calculateSlabTax(Math.max(0, totalIncome), NEW_REGIME_SLABS).baseTax;
    const rebate = totalIncome <= 700000 ? Math.min(baseTax, 25000) : 0;
    const taxLiability = Math.max(0, baseTax - rebate) * 1.04;
    const netTaxPayable = taxLiability - totalTDS;
    const refundDue = netTaxPayable < 0 ? Math.abs(netTaxPayable) : 0;

    const itrSuggestion = totalIncome <= 500000
      ? "ITR-1 likely suitable (salary/one house property/other sources)."
      : totalIncome <= 5000000
        ? "Review ITR-2/ITR-3 based on capital gains/business income."
        : "Use detailed audit-ready return workflow and verify all schedules.";

    setResult({ rows, totalIncome, totalTDS, taxLiability, netTaxPayable, refundDue, itrSuggestion });
  }, [entries]);

  const updateEntry = (index: number, key: keyof TdsEntry, value: string) => {
    setEntries((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addEntry = () => {
    setEntries((prev) => (prev.length >= 10 ? prev : [...prev, { deductorName: "", section: "194J", tdsDeducted: "0", incomeAmount: "0", quarter: "Q1" }]));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Entries": entries },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Entries": entries }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="TDS 26AS Reconciliation"
      subtitle="Match deducted tax with computed annual tax liability"
      inputPanel={(
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">TDS Entries (Max 10)</h2>
            <button onClick={addEntry} className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]">Add Entry</button>
          </div>
          {entries.map((entry, index) => (
            <div key={`tds-${index}`} className="grid grid-cols-1 sm:grid-cols-[1.2fr_80px_120px_120px_80px] gap-2">
              <input value={entry.deductorName} onChange={(e) => updateEntry(index, "deductorName", e.target.value)} className="glass-input h-10 px-3 text-sm" placeholder="Deductor" />
              <input value={entry.section} onChange={(e) => updateEntry(index, "section", e.target.value)} className="glass-input h-10 px-3 text-sm text-center" placeholder="Section" />
              <input value={entry.incomeAmount} inputMode="decimal" onChange={(e) => updateEntry(index, "incomeAmount", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Income" />
              <input value={entry.tdsDeducted} inputMode="decimal" onChange={(e) => updateEntry(index, "tdsDeducted", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="TDS" />
              <select value={entry.quarter} onChange={(e) => updateEntry(index, "quarter", e.target.value)} className="glass-input h-10 px-2 text-sm">
                {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">26AS-style Entries</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Deductor</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Section</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Income</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">TDS</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Quarter</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={`${row.deductorName}-${index}`} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.deductorName || `Deductor ${index + 1}`}</td>
                      <td className="px-2 py-2 text-right">{row.section}</td>
                      <td className="px-2 py-2 text-right">₹ {row.incomeAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-2 text-right">₹ {row.tdsDeducted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-5 py-2 text-right">{row.quarter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total Income" value={`₹ ${result.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total TDS" value={`₹ ${result.totalTDS.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Tax Liability (New Regime)" value={`₹ ${result.taxLiability.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat
              label={result.netTaxPayable >= 0 ? "Net Tax Payable" : "Refund Due"}
              value={`₹ ${Math.abs(result.netTaxPayable).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              green={result.netTaxPayable < 0}
            />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">ITR Suggestion: <span className="text-[var(--text-primary)]">{result.itrSuggestion}</span></div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Download Form 26AS from TRACES portal.</div>
        </div>
      )}
    />
  );
}

function SalaryHikeCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [currentCTC, setCurrentCTC] = useState("");
  const [hikePercent, setHikePercent] = useState("");
  const [currentBasicPercent, setCurrentBasicPercent] = useState("");
  const [hraPercent, setHraPercent] = useState("");
  const [currentPFEmployee, setCurrentPFEmployee] = useState("");
  const [currentPFEmployer, setCurrentPFEmployer] = useState("");
  const [result, setResult] = useState({
    current: { ctc: 0, basic: 0, hra: 0, pfEmployee: 0, pfEmployer: 0, special: 0, gross: 0, takeHome: 0 },
    revised: { ctc: 0, basic: 0, hra: 0, pfEmployee: 0, pfEmployer: 0, special: 0, gross: 0, takeHome: 0 },
    increase: { ctc: 0, basic: 0, hra: 0, pfEmployee: 0, pfEmployer: 0, special: 0, gross: 0, takeHome: 0 },
    hikeAmount: 0,
    monthlyTakeHomeIncrease: 0,
  });

  useEffect(() => {
    const ctc = toNum(currentCTC);
    const hike = toNum(hikePercent) / 100;
    const basicPct = toNum(currentBasicPercent) / 100;
    const hraPct = toNum(hraPercent) / 100;
    const currentPfEmp = toNum(currentPFEmployee);
    const currentPfEr = toNum(currentPFEmployer);

    const newCTC = ctc * (1 + hike);
    const hikeAmount = newCTC - ctc;

    const currentBasic = ctc * basicPct;
    const currentHRA = currentBasic * hraPct;
    const currentSpecial = Math.max(0, ctc - currentBasic - currentHRA - currentPfEr);
    const currentGross = currentBasic + currentHRA + currentSpecial;
    const currentBaseTax = calculateSlabTax(Math.max(0, ctc), NEW_REGIME_SLABS).baseTax;
    const currentRebate = ctc <= 700000 ? Math.min(currentBaseTax, 25000) : 0;
    const currentIncomeTax = Math.max(0, currentBaseTax - currentRebate) * 1.04;
    const currentTakeHome = ctc - currentPfEmp - currentIncomeTax;

    const newBasic = newCTC * basicPct;
    const newHRA = newBasic * hraPct;
    const newPFEmployee = Math.min(newBasic * 0.12, 1800) * 12;
    const newPFEmployer = Math.min(newBasic * 0.12, 1800) * 12;
    const newSpecialAllowance = Math.max(0, newCTC - newBasic - newHRA - newPFEmployer);
    const newGross = newBasic + newHRA + newSpecialAllowance;
    const newBaseTax = calculateSlabTax(Math.max(0, newCTC), NEW_REGIME_SLABS).baseTax;
    const newRebate = newCTC <= 700000 ? Math.min(newBaseTax, 25000) : 0;
    const incomeTaxQuickEstimate = Math.max(0, newBaseTax - newRebate) * 1.04;
    const newTakeHome = newCTC - newPFEmployee - incomeTaxQuickEstimate;

    const increase = {
      ctc: newCTC - ctc,
      basic: newBasic - currentBasic,
      hra: newHRA - currentHRA,
      pfEmployee: newPFEmployee - currentPfEmp,
      pfEmployer: newPFEmployer - currentPfEr,
      special: newSpecialAllowance - currentSpecial,
      gross: newGross - currentGross,
      takeHome: newTakeHome - currentTakeHome,
    };

    setResult({
      current: { ctc, basic: currentBasic, hra: currentHRA, pfEmployee: currentPfEmp, pfEmployer: currentPfEr, special: currentSpecial, gross: currentGross, takeHome: currentTakeHome },
      revised: { ctc: newCTC, basic: newBasic, hra: newHRA, pfEmployee: newPFEmployee, pfEmployer: newPFEmployer, special: newSpecialAllowance, gross: newGross, takeHome: newTakeHome },
      increase,
      hikeAmount,
      monthlyTakeHomeIncrease: increase.takeHome / 12,
    });
  }, [currentCTC, hikePercent, currentBasicPercent, hraPercent, currentPFEmployee, currentPFEmployer]);

  const componentRows = [
    { key: "ctc", label: "CTC" },
    { key: "basic", label: "Basic" },
    { key: "hra", label: "HRA" },
    { key: "pfEmployee", label: "PF Employee" },
    { key: "pfEmployer", label: "PF Employer" },
    { key: "special", label: "Special Allowance" },
    { key: "gross", label: "Gross" },
    { key: "takeHome", label: "Take Home" },
  ] as const;

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Current Ctc": currentCTC, "Hike Percent": hikePercent, "Current Basic Percent": currentBasicPercent, "Hra Percent": hraPercent, "Current Pf Employee": currentPFEmployee, "Current Pf Employer": currentPFEmployer },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Current C T C": currentCTC, "Hike Percent": hikePercent, "Current Basic Percent": currentBasicPercent, "Hra Percent": hraPercent, "Current P F Employee": currentPFEmployee, "Current P F Employer": currentPFEmployer }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Salary Hike & CTC Revision Calculator"
      subtitle="Compare current vs revised structure with component-level increase"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Current CTC" value={currentCTC} onChange={setCurrentCTC} />
          <NumberInput label="Hike (%)" value={hikePercent} onChange={setHikePercent} />
          <NumberInput label="Current Basic (% of CTC)" value={currentBasicPercent} onChange={setCurrentBasicPercent} />
          <NumberInput label="HRA (% of Basic)" value={hraPercent} onChange={setHraPercent} />
          <MoneyInput label="Current PF Employee (Annual)" value={currentPFEmployee} onChange={setCurrentPFEmployee} />
          <MoneyInput label="Current PF Employer (Annual)" value={currentPFEmployer} onChange={setCurrentPFEmployer} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Hike Amount" value={`₹ ${result.hikeAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Monthly Take-home Increase" value={`₹ ${result.monthlyTakeHomeIncrease.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Current vs New</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Component</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Current</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Revised</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Increase</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">Increase %</th>
                  </tr>
                </thead>
                <tbody>
                  {componentRows.map((row, index) => {
                    const currentValue = result.current[row.key];
                    const revisedValue = result.revised[row.key];
                    const increaseValue = result.increase[row.key];
                    const increasePct = currentValue > 0 ? (increaseValue / currentValue) * 100 : 0;
                    return (
                      <tr key={row.key} className={index % 2 ? "bg-white/[0.02]" : ""}>
                        <td className="px-5 py-2 text-secondary">{row.label}</td>
                        <td className="px-2 py-2 text-right">₹ {currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-2 text-right">₹ {revisedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-2 text-right">₹ {increaseValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="px-5 py-2 text-right">{increasePct.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function GSTAnnualReturnCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [outwardSupplies, setOutwardSupplies] = useState("");
  const [outwardIGST, setOutwardIGST] = useState("");
  const [outwardCGST, setOutwardCGST] = useState("");
  const [outwardSGST, setOutwardSGST] = useState("");

  const [availedIGST, setAvailedIGST] = useState("");
  const [availedCGST, setAvailedCGST] = useState("");
  const [availedSGST, setAvailedSGST] = useState("");
  const [reversedIGST, setReversedIGST] = useState("");
  const [reversedCGST, setReversedCGST] = useState("");
  const [reversedSGST, setReversedSGST] = useState("");

  const [cashIGST, setCashIGST] = useState("");
  const [cashCGST, setCashCGST] = useState("");
  const [cashSGST, setCashSGST] = useState("");
  const [itcUsedIGST, setItcUsedIGST] = useState("");
  const [itcUsedCGST, setItcUsedCGST] = useState("");
  const [itcUsedSGST, setItcUsedSGST] = useState("");

  const [dueDate, setDueDate] = useState("2026-12-31");
  const [filingDate, setFilingDate] = useState("2027-01-10");

  const [result, setResult] = useState({
    outwardTax: { igst: 0, cgst: 0, sgst: 0 },
    netITC: { igst: 0, cgst: 0, sgst: 0 },
    taxLiability: 0,
    netITCTotal: 0,
    netTaxPayable: 0,
    cashPaid: 0,
    itcUsed: 0,
    reconciliationDiff: 0,
    daysLate: 0,
    lateFee: 0,
  });

  useEffect(() => {
    const outward = {
      igst: toNum(outwardIGST),
      cgst: toNum(outwardCGST),
      sgst: toNum(outwardSGST),
    };
    const netITC = {
      igst: Math.max(0, toNum(availedIGST) - toNum(reversedIGST)),
      cgst: Math.max(0, toNum(availedCGST) - toNum(reversedCGST)),
      sgst: Math.max(0, toNum(availedSGST) - toNum(reversedSGST)),
    };

    const taxLiability = outward.igst + outward.cgst + outward.sgst;
    const netITCTotal = netITC.igst + netITC.cgst + netITC.sgst;
    const netTaxPayable = taxLiability - netITCTotal;
    const cashPaid = toNum(cashIGST) + toNum(cashCGST) + toNum(cashSGST);
    const itcUsed = toNum(itcUsedIGST) + toNum(itcUsedCGST) + toNum(itcUsedSGST);
    const reconciliationDiff = netTaxPayable - cashPaid - itcUsed;

    const due = new Date(dueDate);
    const filed = new Date(filingDate);
    const daysLate = Math.max(0, Math.ceil((filed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    const lateFee = daysLate * 200;

    setResult({ outwardTax: outward, netITC, taxLiability, netITCTotal, netTaxPayable, cashPaid, itcUsed, reconciliationDiff, daysLate, lateFee });
  }, [outwardIGST, outwardCGST, outwardSGST, availedIGST, availedCGST, availedSGST, reversedIGST, reversedCGST, reversedSGST, cashIGST, cashCGST, cashSGST, itcUsedIGST, itcUsedCGST, itcUsedSGST, dueDate, filingDate]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Outward Supplies": outwardSupplies, "Outward Igst": outwardIGST, "Outward Cgst": outwardCGST, "Outward Sgst": outwardSGST, "Availed Igst": availedIGST, "Availed Cgst": availedCGST, "Availed Sgst": availedSGST, "Reversed Igst": reversedIGST, "Reversed Cgst": reversedCGST, "Reversed Sgst": reversedSGST, "Cash Igst": cashIGST, "Cash Cgst": cashCGST, "Cash Sgst": cashSGST, "Itc Used Igst": itcUsedIGST, "Itc Used Cgst": itcUsedCGST, "Itc Used Sgst": itcUsedSGST, "Due Date": dueDate, "Filing Date": filingDate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Outward Supplies": outwardSupplies, "Outward I G S T": outwardIGST, "Outward C G S T": outwardCGST, "Outward S G S T": outwardSGST, "Availed I G S T": availedIGST, "Availed C G S T": availedCGST, "Availed S G S T": availedSGST, "Reversed I G S T": reversedIGST, "Reversed C G S T": reversedCGST, "Reversed S G S T": reversedSGST, "Cash I G S T": cashIGST, "Cash C G S T": cashCGST, "Cash S G S T": cashSGST, "Itc Used I G S T": itcUsedIGST, "Itc Used C G S T": itcUsedCGST, "Itc Used S G S T": itcUsedSGST, "Due Date": dueDate, "Filing Date": filingDate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="GSTR-9 Annual Return Summary"
      subtitle="Outward tax, ITC reconciliation and annual payable check"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Total Outward Supplies (Table 4)" value={outwardSupplies} onChange={setOutwardSupplies} />

          <Field label="Tax Paid on Outward">
            <div className="grid grid-cols-3 gap-2">
              <input value={outwardIGST} onChange={(e) => setOutwardIGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="IGST" />
              <input value={outwardCGST} onChange={(e) => setOutwardCGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="CGST" />
              <input value={outwardSGST} onChange={(e) => setOutwardSGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="SGST" />
            </div>
          </Field>

          <Field label="ITC Availed">
            <div className="grid grid-cols-3 gap-2">
              <input value={availedIGST} onChange={(e) => setAvailedIGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="IGST" />
              <input value={availedCGST} onChange={(e) => setAvailedCGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="CGST" />
              <input value={availedSGST} onChange={(e) => setAvailedSGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="SGST" />
            </div>
          </Field>

          <Field label="ITC Reversed">
            <div className="grid grid-cols-3 gap-2">
              <input value={reversedIGST} onChange={(e) => setReversedIGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="IGST" />
              <input value={reversedCGST} onChange={(e) => setReversedCGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="CGST" />
              <input value={reversedSGST} onChange={(e) => setReversedSGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="SGST" />
            </div>
          </Field>

          <Field label="Tax Paid Through Cash Ledger">
            <div className="grid grid-cols-3 gap-2">
              <input value={cashIGST} onChange={(e) => setCashIGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="IGST" />
              <input value={cashCGST} onChange={(e) => setCashCGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="CGST" />
              <input value={cashSGST} onChange={(e) => setCashSGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="SGST" />
            </div>
          </Field>

          <Field label="Tax Paid Through ITC Ledger">
            <div className="grid grid-cols-3 gap-2">
              <input value={itcUsedIGST} onChange={(e) => setItcUsedIGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="IGST" />
              <input value={itcUsedCGST} onChange={(e) => setItcUsedCGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="CGST" />
              <input value={itcUsedSGST} onChange={(e) => setItcUsedSGST(e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="SGST" />
            </div>
          </Field>

          <Field label="Due Date / Filing Date">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="glass-input h-10 px-3 text-sm" />
              <input type="date" value={filingDate} onChange={(e) => setFilingDate(e.target.value)} className="glass-input h-10 px-3 text-sm" />
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">GSTR-9 Summary</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  <tr><td className="px-5 py-2 text-secondary">Table 4 Outward Supplies</td><td className="px-5 py-2 text-right">₹ {toNum(outwardSupplies).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Tax Liability (IGST+CGST+SGST)</td><td className="px-5 py-2 text-right">₹ {result.taxLiability.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Net ITC (Availed - Reversed)</td><td className="px-5 py-2 text-right">₹ {result.netITCTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Net Tax Payable</td><td className="px-5 py-2 text-right">₹ {result.netTaxPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Paid via Cash Ledger</td><td className="px-5 py-2 text-right">₹ {result.cashPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Paid via ITC Ledger</td><td className="px-5 py-2 text-right">₹ {result.itcUsed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr className="border-t border-primary/20"><td className="px-5 py-2.5 font-bold">Reconciliation Difference</td><td className="px-5 py-2.5 text-right font-bold">₹ {result.reconciliationDiff.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-4 text-sm text-secondary space-y-1">
            <div>ITC Reconciliation (IGST/CGST/SGST): <span className="text-[var(--text-primary)]">₹ {result.netITC.igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })} / ₹ {result.netITC.cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })} / ₹ {result.netITC.sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
            <div>Late Fee: <span className="text-[var(--text-primary)] font-medium">₹ {result.lateFee.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span> ({result.daysLate.toLocaleString('en-IN')} days late)</div>
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">GSTR-9 due date: December 31 of following FY.</div>
        </div>
      )}
    />
  );
}

function CryptoTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type VdaTx = { assetName: string; buyPrice: string; sellPrice: string; quantity: string; transactionDate: string };

  const [transactions, setTransactions] = useState<VdaTx[]>([
    { assetName: "BTC", buyPrice: "4500000", sellPrice: "5200000", quantity: "0.2", transactionDate: "2026-02-18" },
    { assetName: "ETH", buyPrice: "180000", sellPrice: "150000", quantity: "1.5", transactionDate: "2026-03-04" },
  ]);
  const [result, setResult] = useState({
    rows: [] as Array<{ assetName: string; quantity: number; saleValue: number; gain: number; tax: number; tds: number; transactionDate: string }> ,
    totalGains: 0,
    totalLosses: 0,
    totalTax: 0,
    totalTDS: 0,
    netTaxPayable: 0,
  });

  useEffect(() => {
    const rows = transactions.map((tx) => {
      const buy = toNum(tx.buyPrice);
      const sell = toNum(tx.sellPrice);
      const qty = toNum(tx.quantity);
      const saleValue = sell * qty;
      const gain = (sell - buy) * qty;
      const tax = Math.max(0, gain) * 0.3;
      const tds = saleValue > 50000 ? saleValue * 0.01 : 0;
      return { assetName: tx.assetName, quantity: qty, saleValue, gain, tax, tds, transactionDate: tx.transactionDate };
    });

    const totalGains = rows.reduce((sum, row) => sum + Math.max(0, row.gain), 0);
    const totalLosses = rows.reduce((sum, row) => sum + Math.min(0, row.gain), 0);
    const totalTax = totalGains * 0.3;
    const totalTDS = rows.reduce((sum, row) => sum + row.tds, 0);
    const netTaxPayable = totalTax - totalTDS;

    setResult({ rows, totalGains, totalLosses, totalTax, totalTDS, netTaxPayable });
  }, [transactions]);

  const updateTx = (index: number, key: keyof VdaTx, value: string) => {
    setTransactions((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addTransaction = () => {
    setTransactions((prev) => (prev.length >= 8 ? prev : [...prev, { assetName: "", buyPrice: "0", sellPrice: "0", quantity: "0", transactionDate: "" }]));
  };

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Transactions": transactions },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Transactions": transactions }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Crypto & VDA Tax Calculator (India)"
      subtitle="30% gain tax + 1% TDS logic under VDA provisions"
      inputPanel={(
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Transactions (Max 8)</h2>
            <button onClick={addTransaction} className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]">Add Txn</button>
          </div>
          {transactions.map((tx, index) => (
            <div key={`vda-${index}`} className="grid grid-cols-1 sm:grid-cols-[90px_120px_120px_90px_140px] gap-2">
              <input value={tx.assetName} onChange={(e) => updateTx(index, "assetName", e.target.value)} className="glass-input h-10 px-3 text-sm" placeholder="Asset" />
              <input value={tx.buyPrice} inputMode="decimal" onChange={(e) => updateTx(index, "buyPrice", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Buy" />
              <input value={tx.sellPrice} inputMode="decimal" onChange={(e) => updateTx(index, "sellPrice", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Sell" />
              <input value={tx.quantity} inputMode="decimal" onChange={(e) => updateTx(index, "quantity", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Qty" />
              <input type="date" value={tx.transactionDate} onChange={(e) => updateTx(index, "transactionDate", e.target.value)} className="glass-input h-10 px-3 text-sm" />
            </div>
          ))}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Transaction-wise Tax View</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-tertiary">
                    <th className="text-left font-medium px-5 py-2 bg-primary/10">Asset</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Qty</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Sale Value</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Gain/Loss</th>
                    <th className="text-right font-medium px-2 py-2 bg-primary/10">Tax 30%</th>
                    <th className="text-right font-medium px-5 py-2 bg-primary/10">TDS 1%</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={`${row.assetName}-${index}`} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{row.assetName || `VDA ${index + 1}`}</td>
                      <td className="px-2 py-2 text-right">{row.quantity.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</td>
                      <td className="px-2 py-2 text-right">₹ {row.saleValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className={cn("px-2 py-2 text-right", row.gain >= 0 ? "text-success" : "text-red-300")}>₹ {row.gain.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-2 text-right">₹ {row.tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-5 py-2 text-right">₹ {row.tds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total Gains (Taxable)" value={`₹ ${result.totalGains.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Losses (Not Set-off)" value={`₹ ${Math.abs(result.totalLosses).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Tax @30%" value={`₹ ${result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total TDS Deducted" value={`₹ ${result.totalTDS.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Final Payable / (Refund)" value={`₹ ${result.netTaxPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green={result.netTaxPayable <= 0} />
          </div>

          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Losses from VDA cannot be set off against any other income under Section 115BBH.</div>
        </div>
      )}
    />
  );
}

function MarginalReliefCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [totalIncome, setTotalIncome] = useState("");
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [result, setResult] = useState({
    baseTax: 0,
    surchargeRate: 0,
    surchargeAmount: 0,
    grossTax: 0,
    thresholdUsed: 0,
    taxAtThreshold: 0,
    excessIncome: 0,
    marginalRelief: 0,
    netSurcharge: 0,
    cessAmount: 0,
    totalTax: 0,
    effectiveRate: 0,
    reliefApplied: false,
  });

  useEffect(() => {
    const income = toNum(totalIncome);
    const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
    const baseTax = calculateSlabTax(Math.max(0, income), slabs).baseTax;

    const thresholds = regime === "new"
      ? [5000000, 10000000, 20000000]
      : [5000000, 10000000, 20000000, 50000000];

    let surchargeRate = 0;
    if (income > 50000000) {
      surchargeRate = regime === "new" ? 25 : 37;
    } else if (income > 20000000) {
      surchargeRate = regime === "new" ? 25 : 25;
    } else if (income > 10000000) {
      surchargeRate = 15;
    } else if (income > 5000000) {
      surchargeRate = 10;
    }

    const surchargeAmount = baseTax * surchargeRate / 100;
    const grossTax = baseTax + surchargeAmount;

    let thresholdUsed = 0;
    for (let i = thresholds.length - 1; i >= 0; i -= 1) {
      if (income > thresholds[i]) {
        thresholdUsed = thresholds[i];
        break;
      }
    }

    const taxAtThreshold = thresholdUsed > 0 ? calculateSlabTax(thresholdUsed, slabs).baseTax : 0;
    const excessIncome = thresholdUsed > 0 ? income - thresholdUsed : 0;
    const reliefRaw = thresholdUsed > 0 ? grossTax - (taxAtThreshold + excessIncome) : 0;
    const marginalRelief = Math.max(0, reliefRaw);
    const netSurcharge = Math.max(0, surchargeAmount - marginalRelief);
    const cessAmount = (baseTax + netSurcharge) * 0.04;
    const totalTax = baseTax + netSurcharge + cessAmount;
    const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

    setResult({
      baseTax,
      surchargeRate,
      surchargeAmount,
      grossTax,
      thresholdUsed,
      taxAtThreshold,
      excessIncome,
      marginalRelief,
      netSurcharge,
      cessAmount,
      totalTax,
      effectiveRate,
      reliefApplied: marginalRelief > 0,
    });
  }, [totalIncome, regime]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Total Income": totalIncome, "Regime": regime },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Total Income": totalIncome, "Regime": regime }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Marginal Relief & Surcharge Calculator"
      subtitle="Surcharge impact with threshold-based marginal relief check"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Total Income" value={totalIncome} onChange={setTotalIncome} />
          <Field label="Regime">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["new", "old"] as const).map((r) => (
                <button key={r} onClick={() => setRegime(r)} className={cn("py-2 text-xs font-medium rounded-md transition-all uppercase", regime === r ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{r}</button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Step-by-step Computation</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  <tr><td className="px-5 py-2 text-secondary">Base Tax</td><td className="px-5 py-2 text-right">₹ {result.baseTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Surcharge Rate</td><td className="px-5 py-2 text-right">{result.surchargeRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Surcharge Amount</td><td className="px-5 py-2 text-right">₹ {result.surchargeAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Gross Tax (Tax + Surcharge)</td><td className="px-5 py-2 text-right">₹ {result.grossTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Threshold Used</td><td className="px-5 py-2 text-right">₹ {result.thresholdUsed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Tax at Threshold</td><td className="px-5 py-2 text-right">₹ {result.taxAtThreshold.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Excess Income over Threshold</td><td className="px-5 py-2 text-right">₹ {result.excessIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Marginal Relief</td><td className="px-5 py-2 text-right">₹ {result.marginalRelief.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Net Surcharge</td><td className="px-5 py-2 text-right">₹ {result.netSurcharge.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Cess @4%</td><td className="px-5 py-2 text-right">₹ {result.cessAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr className="border-t border-primary/20"><td className="px-5 py-2.5 font-bold">Total Tax</td><td className="px-5 py-2.5 text-right font-bold">₹ {result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Effective Tax Rate" value={`${result.effectiveRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
            <MiniStat label="Marginal Relief Applied" value={result.reliefApplied ? `Yes (₹ ${result.marginalRelief.toLocaleString('en-IN', { maximumFractionDigits: 2 })})` : "No"} green={result.reliefApplied} />
          </div>
        </div>
      )}
    />
  );
}

function PresumptiveTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [schemeType, setSchemeType] = useState<"44AD" | "44ADA" | "44AE">("44AD");
  const [grossReceipts, setGrossReceipts] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "digital">("digital");
  const [professionType, setProfessionType] = useState<"Doctor" | "Lawyer" | "CA" | "Engineer" | "Architect">("CA");
  const [actualProfit, setActualProfit] = useState("");
  const [vehicleCount, setVehicleCount] = useState("");
  const [monthsOwned, setMonthsOwned] = useState("");
  const [result, setResult] = useState({
    presumptiveRate: 0,
    presumptiveIncome: 0,
    taxLiability: 0,
    effectiveTaxRate: 0,
    eligible: false,
    eligibilityMessage: "",
    actualProfitTax: 0,
    taxSavingVsActual: 0,
  });

  useEffect(() => {
    const receipts = toNum(grossReceipts);
    const actual = toNum(actualProfit);
    const vehicles = Math.max(0, Math.floor(toNum(vehicleCount)));
    const months = Math.max(0, Math.floor(toNum(monthsOwned)));

    let presumptiveRate = 0;
    let presumptiveIncome = 0;
    let eligible = false;
    let eligibilityMessage = "";

    if (schemeType === "44AD") {
      presumptiveRate = paymentMode === "digital" ? 6 : 8;
      presumptiveIncome = receipts * presumptiveRate / 100;
      eligible = receipts <= 30000000;
      eligibilityMessage = eligible ? "Eligible under 44AD (turnover within ₹3Cr)." : "Not eligible under 44AD (turnover exceeds ₹3Cr).";
    } else if (schemeType === "44ADA") {
      presumptiveRate = 50;
      presumptiveIncome = receipts * 0.5;
      eligible = receipts <= 7500000;
      eligibilityMessage = eligible
        ? `Eligible under 44ADA for ${professionType}.`
        : "Not eligible under 44ADA (gross receipts exceed ₹75L).";
    } else {
      presumptiveRate = 0;
      presumptiveIncome = vehicles * months * 7500;
      eligible = vehicles > 0 && months > 0;
      eligibilityMessage = eligible ? "Calculated under 44AE at ₹7,500 per vehicle per month." : "Enter vehicle count and months for 44AE.";
    }

    const baseTax = calculateSlabTax(Math.max(0, presumptiveIncome), NEW_REGIME_SLABS).baseTax;
    const rebate = presumptiveIncome <= 700000 ? Math.min(baseTax, 25000) : 0;
    const taxLiability = Math.max(0, baseTax - rebate) * 1.04;

    const actualBaseTax = calculateSlabTax(Math.max(0, actual), NEW_REGIME_SLABS).baseTax;
    const actualRebate = actual <= 700000 ? Math.min(actualBaseTax, 25000) : 0;
    const actualProfitTax = Math.max(0, actualBaseTax - actualRebate) * 1.04;

    const effectiveTaxRate = receipts > 0 ? (taxLiability / receipts) * 100 : 0;
    const taxSavingVsActual = actualProfitTax - taxLiability;

    setResult({ presumptiveRate, presumptiveIncome, taxLiability, effectiveTaxRate, eligible, eligibilityMessage, actualProfitTax, taxSavingVsActual });
  }, [schemeType, grossReceipts, paymentMode, professionType, actualProfit, vehicleCount, monthsOwned]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Scheme Type": schemeType, "Gross Receipts": grossReceipts, "Payment Mode": paymentMode, "Profession Type": professionType, "Actual Profit": actualProfit, "Vehicle Count": vehicleCount, "Months Owned": monthsOwned },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Scheme Type": schemeType, "Gross Receipts": grossReceipts, "Payment Mode": paymentMode, "Profession Type": professionType, "Actual Profit": actualProfit, "Vehicle Count": vehicleCount, "Months Owned": monthsOwned }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Presumptive Tax Calculator (44AD/44ADA/44AE)"
      subtitle="Presumptive income, eligibility and tax comparison with actual profit"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <Field label="Scheme Type">
            <select value={schemeType} onChange={(e) => setSchemeType(e.target.value as "44AD" | "44ADA" | "44AE")} className="glass-input w-full h-11 px-3 text-sm">
              <option value="44AD">44AD Business</option>
              <option value="44ADA">44ADA Profession</option>
              <option value="44AE">44AE Transport</option>
            </select>
          </Field>
          <MoneyInput label="Gross Receipts / Turnover" value={grossReceipts} onChange={setGrossReceipts} />
          {schemeType === "44AD" && (
            <Field label="Payment Mode">
              <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
                {(["cash", "digital"] as const).map((m) => (
                  <button key={m} onClick={() => setPaymentMode(m)} className={cn("py-2 text-xs font-medium rounded-md transition-all capitalize", paymentMode === m ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{m}</button>
                ))}
              </div>
            </Field>
          )}
          {schemeType === "44ADA" && (
            <Field label="Profession Type">
              <select value={professionType} onChange={(e) => setProfessionType(e.target.value as "Doctor" | "Lawyer" | "CA" | "Engineer" | "Architect")} className="glass-input w-full h-11 px-3 text-sm">
                {(["Doctor", "Lawyer", "CA", "Engineer", "Architect"] as const).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          )}
          {schemeType === "44AE" && (
            <>
              <NumberInput label="Number of Vehicles" value={vehicleCount} onChange={setVehicleCount} />
              <NumberInput label="Months Held" value={monthsOwned} onChange={setMonthsOwned} />
            </>
          )}
          <MoneyInput label="Actual Profit (Optional for comparison)" value={actualProfit} onChange={setActualProfit} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Presumptive Rate" value={schemeType === '44AE' ? 'As per vehicle-month formula' : `${result.presumptiveRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
            <MiniStat label="Presumptive Income" value={`₹ ${result.presumptiveIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Tax Liability" value={`₹ ${result.taxLiability.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Effective Tax Rate" value={`${result.effectiveTaxRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
            <MiniStat label="Tax on Actual Profit" value={`₹ ${result.actualProfitTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Difference vs Actual" value={`₹ ${result.taxSavingVsActual.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green={result.taxSavingVsActual > 0} />
          </div>
          <div className={cn("card-surface p-4 border text-sm", result.eligible ? "border-success/40 text-success" : "border-red-400/40 text-red-300")}>{result.eligibilityMessage}</div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Benefit: no books of accounts required, no audit required (subject to conditions).</div>
        </div>
      )}
    />
  );
}

function ESOPCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [grantPrice, setGrantPrice] = useState("");
  const [vestingPrice, setVestingPrice] = useState("");
  const [exercisePrice, setExercisePrice] = useState("");
  const [currentFMV, setCurrentFMV] = useState("");
  const [numberOfShares, setNumberOfShares] = useState("");
  const [employmentType, setEmploymentType] = useState<"listed" | "unlisted">("listed");
  const [holdingPeriodAfterExercise, setHoldingPeriodAfterExercise] = useState("");
  const [result, setResult] = useState({
    perquisiteValue: 0,
    perquisiteTaxAtVesting: 0,
    capitalGainAtSale: 0,
    capitalGainTax: 0,
    totalTax: 0,
    netProfit: 0,
    gainType: "",
  });

  useEffect(() => {
    const grant = toNum(grantPrice);
    const vest = toNum(vestingPrice);
    const exercise = toNum(exercisePrice);
    const sale = toNum(currentFMV);
    const shares = toNum(numberOfShares);
    const holdingMonths = Math.max(0, Math.floor(toNum(holdingPeriodAfterExercise)));

    const perquisiteValue = Math.max(0, (vest - grant) * shares);
    const perquisiteTaxAtVesting = perquisiteValue * 0.3;

    const capitalGainAtSale = (sale - exercise) * shares;
    let capitalGainTax = 0;
    let gainType = "";

    if (employmentType === "listed") {
      if (holdingMonths > 12) {
        gainType = "LTCG @12.5% above ₹1.25L";
        capitalGainTax = Math.max(0, capitalGainAtSale - 125000) * 0.125;
      } else {
        gainType = "STCG @20%";
        capitalGainTax = Math.max(0, capitalGainAtSale) * 0.2;
      }
    } else if (holdingMonths > 24) {
      gainType = "LTCG @12.5% (unlisted)";
      capitalGainTax = Math.max(0, capitalGainAtSale) * 0.125;
    } else {
      gainType = "STCG at slab (assumed 30%)";
      capitalGainTax = Math.max(0, capitalGainAtSale) * 0.3;
    }

    const totalTax = perquisiteTaxAtVesting + capitalGainTax;
    const netProfit = (sale - grant) * shares - totalTax;

    setResult({ perquisiteValue, perquisiteTaxAtVesting, capitalGainAtSale, capitalGainTax, totalTax, netProfit, gainType });
  }, [grantPrice, vestingPrice, exercisePrice, currentFMV, numberOfShares, employmentType, holdingPeriodAfterExercise]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Grant Price": grantPrice, "Vesting Price": vestingPrice, "Exercise Price": exercisePrice, "Current Fmv": currentFMV, "Number Of Shares": numberOfShares, "Employment Type": employmentType, "Holding Period After Exercise": holdingPeriodAfterExercise },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Grant Price": grantPrice, "Vesting Price": vestingPrice, "Exercise Price": exercisePrice, "Current F M V": currentFMV, "Number Of Shares": numberOfShares, "Employment Type": employmentType, "Holding Period After Exercise": holdingPeriodAfterExercise }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="ESOP Tax Calculator"
      subtitle="Perquisite tax at vesting and capital gains tax at sale"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Grant Price" value={grantPrice} onChange={setGrantPrice} />
          <MoneyInput label="Vesting Price (FMV on vesting)" value={vestingPrice} onChange={setVestingPrice} />
          <MoneyInput label="Exercise Price" value={exercisePrice} onChange={setExercisePrice} />
          <MoneyInput label="Current FMV / Sale Price" value={currentFMV} onChange={setCurrentFMV} />
          <NumberInput label="Number of Shares" value={numberOfShares} onChange={setNumberOfShares} />
          <Field label="Company Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["listed", "unlisted"] as const).map((t) => (
                <button key={t} onClick={() => setEmploymentType(t)} className={cn("py-2 text-xs font-medium rounded-md transition-all capitalize", employmentType === t ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{t}</button>
              ))}
            </div>
          </Field>
          <NumberInput label="Holding Period After Exercise (Months)" value={holdingPeriodAfterExercise} onChange={setHoldingPeriodAfterExercise} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Perquisite Value" value={`₹ ${result.perquisiteValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Perquisite Tax @30%" value={`₹ ${result.perquisiteTaxAtVesting.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Capital Gain at Sale" value={`₹ ${result.capitalGainAtSale.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Capital Gain Tax" value={`₹ ${result.capitalGainTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Tax" value={`₹ ${result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Net Profit" value={`₹ ${result.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green={result.netProfit > 0} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Capital Gains Rule Applied: <span className="text-[var(--text-primary)]">{result.gainType}</span></div>
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Timeline</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                "Grant",
                "Vest",
                "Exercise",
                "Sale",
              ].map((item, index) => (
                <div key={item} className="p-3 rounded-md border border-white/10 bg-card-elevated text-center">
                  <div className="text-tertiary">Step {index + 1}</div>
                  <div className="mt-1 text-[var(--text-primary)] font-medium">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}

function ForeignIncomeCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [indianIncome, setIndianIncome] = useState("");
  const [foreignIncome, setForeignIncome] = useState("");
  const [foreignTaxPaid, setForeignTaxPaid] = useState("");
  const [sourceCountry, setSourceCountry] = useState<"USA" | "UK" | "UAE" | "Germany" | "Singapore" | "Other">("USA");
  const [foreignIncomeType, setForeignIncomeType] = useState<"Salary" | "Business" | "Dividend" | "Interest">("Dividend");
  const [result, setResult] = useState({
    totalWorldIncome: 0,
    indianTax: 0,
    foreignTaxCredit: 0,
    netTaxPayable: 0,
    reliefUnderDTAA: 0,
    applicableDTAARate: 0,
  });

  useEffect(() => {
    const india = toNum(indianIncome);
    const foreign = toNum(foreignIncome);
    const foreignTax = toNum(foreignTaxPaid);
    const totalWorldIncome = india + foreign;

    const baseTax = calculateSlabTax(Math.max(0, totalWorldIncome), NEW_REGIME_SLABS).baseTax;
    const rebate = totalWorldIncome <= 700000 ? Math.min(baseTax, 25000) : 0;
    const indianTax = Math.max(0, baseTax - rebate) * 1.04;

    const dtaaRates: Record<string, Partial<Record<"Dividend" | "Interest" | "Salary" | "Business", number>>> = {
      USA: { Dividend: 15, Interest: 15 },
      UK: { Dividend: 15, Interest: 15 },
      UAE: {},
      Germany: { Dividend: 10, Interest: 10 },
      Singapore: { Dividend: 15, Interest: 15 },
      Other: {},
    };

    const applicableDTAARate = dtaaRates[sourceCountry]?.[foreignIncomeType] ?? 0;
    const proportionalIndianTax = totalWorldIncome > 0 ? indianTax * (foreign / totalWorldIncome) : 0;
    const foreignTaxCredit = Math.min(foreignTax, proportionalIndianTax);
    const netTaxPayable = Math.max(0, indianTax - foreignTaxCredit);

    setResult({
      totalWorldIncome,
      indianTax,
      foreignTaxCredit,
      netTaxPayable,
      reliefUnderDTAA: foreignTaxCredit,
      applicableDTAARate,
    });
  }, [indianIncome, foreignIncome, foreignTaxPaid, sourceCountry, foreignIncomeType]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Indian Income": indianIncome, "Foreign Income": foreignIncome, "Foreign Tax Paid": foreignTaxPaid, "Source Country": sourceCountry, "Foreign Income Type": foreignIncomeType },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Indian Income": indianIncome, "Foreign Income": foreignIncome, "Foreign Tax Paid": foreignTaxPaid, "Source Country": sourceCountry, "Foreign Income Type": foreignIncomeType }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Foreign Income & DTAA Calculator"
      subtitle="Foreign tax credit computation with country-level DTAA reference"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Indian Income" value={indianIncome} onChange={setIndianIncome} />
          <MoneyInput label="Foreign Income" value={foreignIncome} onChange={setForeignIncome} />
          <MoneyInput label="Foreign Tax Paid" value={foreignTaxPaid} onChange={setForeignTaxPaid} />
          <Field label="Source Country">
            <select value={sourceCountry} onChange={(e) => setSourceCountry(e.target.value as "USA" | "UK" | "UAE" | "Germany" | "Singapore" | "Other")} className="glass-input w-full h-11 px-3 text-sm">
              {(["USA", "UK", "UAE", "Germany", "Singapore", "Other"] as const).map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </Field>
          <Field label="Foreign Income Type">
            <select value={foreignIncomeType} onChange={(e) => setForeignIncomeType(e.target.value as "Salary" | "Business" | "Dividend" | "Interest")} className="glass-input w-full h-11 px-3 text-sm">
              {(["Salary", "Business", "Dividend", "Interest"] as const).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total World Income" value={`₹ ${result.totalWorldIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Indian Tax" value={`₹ ${result.indianTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Foreign Tax Credit" value={`₹ ${result.foreignTaxCredit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Net Tax Payable" value={`₹ ${result.netTaxPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Relief under DTAA" value={`₹ ${result.reliefUnderDTAA.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Applicable DTAA Rate" value={result.applicableDTAARate > 0 ? `${result.applicableDTAARate.toLocaleString('en-IN')}%` : 'N/A'} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">File Form 67 before ITR filing to claim DTAA relief.</div>
          {sourceCountry === 'UAE' && (
            <div className="card-surface p-4 border border-warning/40 text-sm text-warning">UAE generally has no personal income tax; DTAA relief may not apply for all cases.</div>
          )}
        </div>
      )}
    />
  );
}

function AuditChecklistCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type CategoryKey = "Internal Controls" | "Financial Reporting" | "Compliance" | "Operations" | "Risk";
  type ChecklistQuestion = { id: string; category: CategoryKey; text: string; yes: boolean };

  const [questions, setQuestions] = useState<ChecklistQuestion[]>([
    { id: "ic-1", category: "Internal Controls", text: "Is there a proper authorization matrix?", yes: false },
    { id: "ic-2", category: "Internal Controls", text: "Are bank reconciliations done monthly?", yes: false },
    { id: "ic-3", category: "Internal Controls", text: "Is there segregation of duties?", yes: false },
    { id: "ic-4", category: "Internal Controls", text: "Are physical verifications conducted annually?", yes: false },
    { id: "fr-1", category: "Financial Reporting", text: "Are accounting policies disclosed?", yes: false },
    { id: "fr-2", category: "Financial Reporting", text: "Is going concern assessment done?", yes: false },
    { id: "fr-3", category: "Financial Reporting", text: "Are related party transactions disclosed?", yes: false },
    { id: "fr-4", category: "Financial Reporting", text: "Are contingent liabilities properly disclosed?", yes: false },
    { id: "co-1", category: "Compliance", text: "Is TDS deposited on time?", yes: false },
    { id: "co-2", category: "Compliance", text: "Is GST filed monthly?", yes: false },
    { id: "co-3", category: "Compliance", text: "Are ROC filings up to date?", yes: false },
    { id: "co-4", category: "Compliance", text: "Is the company free of tax demands/notices?", yes: false },
    { id: "op-1", category: "Operations", text: "Is stock verified against books?", yes: false },
    { id: "op-2", category: "Operations", text: "Are fixed asset registers maintained?", yes: false },
    { id: "op-3", category: "Operations", text: "Are loans and advances documented?", yes: false },
    { id: "op-4", category: "Operations", text: "Is there a documented credit policy?", yes: false },
    { id: "rk-1", category: "Risk", text: "Is there adequate insurance coverage?", yes: false },
    { id: "rk-2", category: "Risk", text: "Are contracts reviewed by legal?", yes: false },
    { id: "rk-3", category: "Risk", text: "Is there a fraud risk assessment?", yes: false },
    { id: "rk-4", category: "Risk", text: "Are IT systems backed up regularly?", yes: false },
  ]);
  const [result, setResult] = useState({
    yesCount: 0,
    score: 0,
    rating: "High Risk",
    categoryScores: {
      "Internal Controls": 0,
      "Financial Reporting": 0,
      Compliance: 0,
      Operations: 0,
      Risk: 0,
    } as Record<CategoryKey, number>,
    failedItems: [] as string[],
  });

  useEffect(() => {
    const yesCount = questions.filter((q) => q.yes).length;
    const score = (yesCount / 20) * 100;
    const rating = score <= 40 ? "High Risk" : score <= 70 ? "Moderate" : score <= 90 ? "Good" : "Excellent";

    const categories: CategoryKey[] = ["Internal Controls", "Financial Reporting", "Compliance", "Operations", "Risk"];
    const categoryScores = categories.reduce((acc, category) => {
      const catItems = questions.filter((q) => q.category === category);
      const catYes = catItems.filter((q) => q.yes).length;
      acc[category] = (catYes / 4) * 100;
      return acc;
    }, {
      "Internal Controls": 0,
      "Financial Reporting": 0,
      Compliance: 0,
      Operations: 0,
      Risk: 0,
    } as Record<CategoryKey, number>);

    const failedItems = questions.filter((q) => !q.yes).map((q) => q.text);
    setResult({ yesCount, score, rating, categoryScores, failedItems });
  }, [questions]);

  const toggleQuestion = (id: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, yes: !q.yes } : q)));
  };

  const categories: CategoryKey[] = ["Internal Controls", "Financial Reporting", "Compliance", "Operations", "Risk"];

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Questions": questions },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Questions": questions }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Statutory Audit Checklist Score"
      subtitle="20-point audit readiness checklist with risk rating"
      inputPanel={(
        <div className="card-surface p-5 space-y-4">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-tertiary font-semibold">{category}</div>
              {questions.filter((q) => q.category === category).map((q) => (
                <button key={q.id} onClick={() => toggleQuestion(q.id)} className={cn("w-full text-left p-3 rounded-md border transition-all text-xs", q.yes ? "bg-gradient-orange text-white glow-orange border-transparent" : "border-white/10 text-secondary hover:text-[var(--text-primary)]")}>
                  {q.text}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Yes Responses" value={result.yesCount.toLocaleString('en-IN')} />
            <MiniStat label="Score" value={`${result.score.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} green={result.score >= 71} />
            <MiniStat label="Rating" value={result.rating} green={result.rating === 'Excellent' || result.rating === 'Good'} />
          </div>

          <div className="card-surface p-4 text-sm text-secondary space-y-3">
            {categories.map((category) => (
              <div key={`score-${category}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{category}</span>
                  <span className="text-[var(--text-primary)]">{result.categoryScores[category].toLocaleString('en-IN', { maximumFractionDigits: 0 })}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className={cn("h-full rounded-full", result.categoryScores[category] > 75 ? "bg-success" : result.categoryScores[category] > 40 ? "bg-warning" : "bg-red-400")} style={{ width: `${Math.min(100, result.categoryScores[category])}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Action Points (Failed Items)</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  {result.failedItems.map((item, index) => (
                    <tr key={`${item}-${index}`} className={index % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-5 py-2 text-secondary">{index + 1}. {item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function GoldReturnsCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [investmentType, setInvestmentType] = useState<"Physical Gold" | "Sovereign Gold Bond" | "Gold ETF">("Physical Gold");
  const [purchasePricePerGram, setPurchasePricePerGram] = useState("");
  const [currentPricePerGram, setCurrentPricePerGram] = useState("");
  const [result, setResult] = useState({
    grams: 0,
    currentValue: 0,
    absoluteReturn: 0,
    holdingYears: 1,
    cagr: 0,
    sgbInterest: 0,
    taxLiability: 0,
    netReturnAfterTax: 0,
    compareRows: [] as Array<{ type: string; tax: number; netReturn: number }>,
  });

  useEffect(() => {
    const amount = toNum(investmentAmount);
    const buyPrice = Math.max(1, toNum(purchasePricePerGram));
    const sellPrice = toNum(currentPricePerGram);
    const pYear = Math.max(1900, Math.floor(toNum(purchaseYear)));
    const cYear = Math.max(pYear + 1, Math.floor(toNum(currentYear)));
    const holdingYears = Math.max(1, cYear - pYear);

    const grams = amount / buyPrice;
    const currentValue = grams * sellPrice;
    const absoluteReturn = currentValue - amount;
    const cagr = amount > 0 ? (((currentValue / amount) ** (1 / holdingYears)) - 1) * 100 : 0;

    const indexedTax = (gain: number) => {
      if (gain <= 0) return 0;
      const indexedCost = amount * (1 + 0.04 * holdingYears);
      const taxableGain = Math.max(0, currentValue - indexedCost);
      return taxableGain * 0.2;
    };

    const computeByType = (type: "Physical Gold" | "Sovereign Gold Bond" | "Gold ETF") => {
      const sgbInterest = type === "Sovereign Gold Bond" ? amount * 0.025 * holdingYears : 0;
      let taxLiability = 0;

      if (type === "Sovereign Gold Bond" && holdingYears >= 8) {
        taxLiability = 0;
      } else if ((type === "Physical Gold" || type === "Gold ETF" || type === "Sovereign Gold Bond") && holdingYears > 3) {
        taxLiability = indexedTax(absoluteReturn);
      } else {
        taxLiability = Math.max(0, absoluteReturn) * 0.3;
      }

      const netReturn = absoluteReturn + sgbInterest - taxLiability;
      return { sgbInterest, taxLiability, netReturn };
    };

    const selected = computeByType(investmentType);

    const compareRows = investmentType === "Physical Gold"
      ? (["Physical Gold", "Sovereign Gold Bond", "Gold ETF"] as const).map((type) => {
        const row = computeByType(type);
        return { type, tax: row.taxLiability, netReturn: row.netReturn };
      })
      : [];

    setResult({
      grams,
      currentValue,
      absoluteReturn,
      holdingYears,
      cagr,
      sgbInterest: selected.sgbInterest,
      taxLiability: selected.taxLiability,
      netReturnAfterTax: selected.netReturn,
      compareRows,
    });
  }, [investmentAmount, purchaseYear, currentYear, investmentType, purchasePricePerGram, currentPricePerGram]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Investment Amount": investmentAmount, "Purchase Year": purchaseYear, "Current Year": currentYear, "Investment Type": investmentType, "Purchase Price Per Gram": purchasePricePerGram, "Current Price Per Gram": currentPricePerGram },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Investment Amount": investmentAmount, "Purchase Year": purchaseYear, "Current Year": currentYear, "Investment Type": investmentType, "Purchase Price Per Gram": purchasePricePerGram, "Current Price Per Gram": currentPricePerGram }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Gold Investment Returns Calculator"
      subtitle="Return, CAGR, tax and post-tax comparison across gold options"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Investment Amount" value={investmentAmount} onChange={setInvestmentAmount} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Purchase Year" value={purchaseYear} onChange={setPurchaseYear} />
            <NumberInput label="Current Year" value={currentYear} onChange={setCurrentYear} />
          </div>
          <Field label="Investment Type">
            <select value={investmentType} onChange={(e) => setInvestmentType(e.target.value as "Physical Gold" | "Sovereign Gold Bond" | "Gold ETF")} className="glass-input w-full h-11 px-3 text-sm">
              {(["Physical Gold", "Sovereign Gold Bond", "Gold ETF"] as const).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>
          <MoneyInput label="Purchase Price per Gram" value={purchasePricePerGram} onChange={setPurchasePricePerGram} />
          <MoneyInput label="Current Price per Gram" value={currentPricePerGram} onChange={setCurrentPricePerGram} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Gold Quantity (grams)" value={result.grams.toLocaleString('en-IN', { maximumFractionDigits: 4 })} />
            <MiniStat label="Current Value" value={`₹ ${result.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Absolute Return" value={`₹ ${result.absoluteReturn.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green={result.absoluteReturn >= 0} />
            <MiniStat label="CAGR" value={`${result.cagr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
            <MiniStat label="SGB Interest" value={`₹ ${result.sgbInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Tax Liability" value={`₹ ${result.taxLiability.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Net Return After Tax" value={`₹ ${result.netReturnAfterTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green={result.netReturnAfterTax >= 0} />
          </div>

          {result.compareRows.length > 0 && (
            <div className="card-surface p-5 overflow-hidden">
              <div className="text-sm font-semibold mb-3">Side-by-side Type Comparison</div>
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-tertiary">
                      <th className="text-left font-medium px-5 py-2 bg-primary/10">Type</th>
                      <th className="text-right font-medium px-3 py-2 bg-primary/10">Tax Liability</th>
                      <th className="text-right font-medium px-5 py-2 bg-primary/10">Net Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.compareRows.map((row, index) => (
                      <tr key={row.type} className={index % 2 ? "bg-white/[0.02]" : ""}>
                        <td className="px-5 py-2 text-secondary">{row.type}</td>
                        <td className="px-3 py-2 text-right">₹ {row.tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="px-5 py-2 text-right font-medium">₹ {row.netReturn.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}

function RetrenchmentCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [monthlyBasic, setMonthlyBasic] = useState("");
  const [monthlyDA, setMonthlyDA] = useState("");
  const [yearsOfService, setYearsOfService] = useState("");
  const [retrenchmentType, setRetrenchmentType] = useState<"Retrenchment" | "VRS" | "Closure">("Retrenchment");
  const [remainingMonths, setRemainingMonths] = useState("");
  const [result, setResult] = useState({
    compensation: 0,
    taxExemptAmount: 0,
    taxableAmount: 0,
    monthlyEquivalent: 0,
    averagePay: 0,
    sectionNote: "",
  });

  useEffect(() => {
    const basic = toNum(monthlyBasic);
    const da = toNum(monthlyDA);
    const years = Math.max(0, Math.floor(toNum(yearsOfService)));
    const remain = Math.max(0, Math.floor(toNum(remainingMonths)));

    const salary = basic + da;
    const averagePay = (salary / 26) * 15;
    const baseComp = averagePay * years;

    let compensation = baseComp;
    let taxExemptAmount = 0;
    let sectionNote = "Section 10(10B) applies";

    if (retrenchmentType === "VRS") {
      const vrsComp = Math.min(salary * 3 * years, salary * remain);
      compensation = vrsComp;
      taxExemptAmount = Math.min(vrsComp, 500000);
      sectionNote = "Section 10(10C) applies";
    } else {
      compensation = baseComp;
      taxExemptAmount = Math.min(compensation, 500000, baseComp);
      sectionNote = "Section 10(10B) applies";
    }

    const taxableAmount = Math.max(0, compensation - taxExemptAmount);
    const monthlyEquivalent = compensation / 12;

    setResult({ compensation, taxExemptAmount, taxableAmount, monthlyEquivalent, averagePay, sectionNote });
  }, [monthlyBasic, monthlyDA, yearsOfService, retrenchmentType, remainingMonths]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Monthly Basic": monthlyBasic, "Monthly Da": monthlyDA, "Years Of Service": yearsOfService, "Retrenchment Type": retrenchmentType, "Remaining Months": remainingMonths },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Monthly Basic": monthlyBasic, "Monthly D A": monthlyDA, "Years Of Service": yearsOfService, "Retrenchment Type": retrenchmentType, "Remaining Months": remainingMonths }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Retrenchment Compensation Calculator"
      subtitle="Compensation and exemption computation for retrenchment/VRS/closure"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Monthly Basic" value={monthlyBasic} onChange={setMonthlyBasic} />
          <MoneyInput label="Monthly DA" value={monthlyDA} onChange={setMonthlyDA} />
          <NumberInput label="Years of Service" value={yearsOfService} onChange={setYearsOfService} />
          <Field label="Type">
            <select value={retrenchmentType} onChange={(e) => setRetrenchmentType(e.target.value as "Retrenchment" | "VRS" | "Closure")} className="glass-input w-full h-11 px-3 text-sm">
              {(["Retrenchment", "VRS", "Closure"] as const).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>
          {retrenchmentType === "VRS" && <NumberInput label="Remaining Months (for VRS check)" value={remainingMonths} onChange={setRemainingMonths} />}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Average 15-day Pay" value={`₹ ${result.averagePay.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Compensation" value={`₹ ${result.compensation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Tax Exempt Amount" value={`₹ ${result.taxExemptAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Taxable Amount" value={`₹ ${result.taxableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Monthly Equivalent" value={`₹ ${result.monthlyEquivalent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Applicable note: <span className="text-[var(--text-primary)]">{result.sectionNote}</span></div>
        </div>
      )}
    />
  );
}

function TDSPropertyCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [propertyValue, setPropertyValue] = useState("");
  const [sellerType, setSellerType] = useState<"Resident" | "NRI">("Resident");
  const [isRuralAgriculturalLand, setIsRuralAgriculturalLand] = useState(false);
  const [holdingPeriodMonths, setHoldingPeriodMonths] = useState("");
  const [deductionDate, setDeductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState({
    tdsRate: 0,
    tdsAmount: 0,
    netPaymentToSeller: 0,
    depositDueDate: "-",
    formToFile: "26QB",
    note: "",
  });

  useEffect(() => {
    const value = toNum(propertyValue);
    const holdingMonths = Math.max(0, Math.floor(toNum(holdingPeriodMonths)));

    let tdsRate = 0;
    let note = "";
    if (isRuralAgriculturalLand) {
      tdsRate = 0;
      note = "Rural agricultural land is exempt from TDS.";
    } else if (value < 5000000) {
      tdsRate = 0;
      note = "Section 194IA applies only when value is ₹50L or more.";
    } else if (sellerType === "Resident") {
      tdsRate = 1;
      note = "Resident seller: TDS @1% under Section 194IA.";
    } else {
      tdsRate = holdingMonths > 24 ? 22.88 : 30;
      note = holdingMonths > 24 ? "NRI LTCG assumed @20% + surcharge + cess." : "NRI STCG assumed @30%.";
    }

    const tdsAmount = value * tdsRate / 100;
    const netPaymentToSeller = value - tdsAmount;

    const dd = new Date(deductionDate || new Date().toISOString().slice(0, 10));
    const dueMonthFirst = new Date(dd.getFullYear(), dd.getMonth() + 1, 1);
    const dueMonthLast = new Date(dd.getFullYear(), dd.getMonth() + 2, 0).getDate();
    const dueDay = Math.min(30, dueMonthLast);
    const dueDate = new Date(dd.getFullYear(), dd.getMonth() + 1, dueDay);
    const depositDueDate = `${dueDate.getDate().toString().padStart(2, '0')}-${(dueDate.getMonth() + 1).toString().padStart(2, '0')}-${dueDate.getFullYear()}`;

    setResult({ tdsRate, tdsAmount, netPaymentToSeller, depositDueDate, formToFile: "26QB", note });
  }, [propertyValue, sellerType, isRuralAgriculturalLand, holdingPeriodMonths, deductionDate]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Property Value": propertyValue, "Seller Type": sellerType, "Is Rural Agricultural Land": isRuralAgriculturalLand, "Holding Period Months": holdingPeriodMonths, "Deduction Date": deductionDate },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Property Value": propertyValue, "Seller Type": sellerType, "Is Rural Agricultural Land": isRuralAgriculturalLand, "Holding Period Months": holdingPeriodMonths, "Deduction Date": deductionDate }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="TDS on Property Purchase (Section 194IA)"
      subtitle="TDS rate, deduction amount and compliance timeline"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Property Value" value={propertyValue} onChange={setPropertyValue} />
          <Field label="Seller Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["Resident", "NRI"] as const).map((type) => (
                <button key={type} onClick={() => setSellerType(type)} className={cn("py-2 text-xs font-medium rounded-md transition-all", sellerType === type ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{type}</button>
              ))}
            </div>
          </Field>
          {sellerType === "NRI" && <NumberInput label="Seller Holding Period (Months)" value={holdingPeriodMonths} onChange={setHoldingPeriodMonths} />}
          <Field label="Rural Agricultural Land">
            <button onClick={() => setIsRuralAgriculturalLand((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", isRuralAgriculturalLand ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{isRuralAgriculturalLand ? "Yes" : "No"}</button>
          </Field>
          <Field label="Date of Deduction">
            <input type="date" value={deductionDate} onChange={(e) => setDeductionDate(e.target.value)} className="glass-input w-full h-11 px-3 text-sm" />
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="TDS Rate" value={`${result.tdsRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
            <MiniStat label="TDS Amount" value={`₹ ${result.tdsAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Net Payment to Seller" value={`₹ ${result.netPaymentToSeller.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Deposit Due Date" value={result.depositDueDate} />
            <MiniStat label="Form to File" value={result.formToFile} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.note}</div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">TDS certificate Form 16B to be issued to seller within 15 days.</div>
        </div>
      )}
    />
  );
}

function AdvanceRulingCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [transactionType, setTransactionType] = useState<
    "Sale of Goods" | "Export of Services" | "Import of Services" | "Works Contract" | "Real Estate (under construction)" | "Real Estate (ready to move)" | "Restaurant Services" | "Healthcare Services" | "Educational Services"
  >("Sale of Goods");
  const [transactionValue, setTransactionValue] = useState("");
  const [stateOfSupply, setStateOfSupply] = useState("Karnataka");
  const [isRegistered, setIsRegistered] = useState(true);
  const [saleGoodsRate, setSaleGoodsRate] = useState("");
  const [realEstateWithITC, setRealEstateWithITC] = useState(false);
  const [result, setResult] = useState({
    gstLiability: 0,
    reverseChargeApplicable: false,
    isExempt: false,
    effectiveRate: 0,
    filingRequirement: "",
    itcEligibilityNote: "",
  });

  useEffect(() => {
    const value = toNum(transactionValue);
    let effectiveRate = 0;
    let reverseChargeApplicable = false;
    let isExempt = false;
    let itcEligibilityNote = "ITC eligibility depends on section-specific conditions.";

    if (transactionType === "Sale of Goods") {
      effectiveRate = toNum(saleGoodsRate);
      itcEligibilityNote = "ITC generally available for business use and valid tax invoice.";
    } else if (transactionType === "Export of Services") {
      effectiveRate = 0;
      itcEligibilityNote = "Zero-rated supply; refund route may apply for input credits.";
    } else if (transactionType === "Import of Services") {
      effectiveRate = 18;
      reverseChargeApplicable = true;
      itcEligibilityNote = "GST paid under RCM may be eligible as ITC subject to conditions.";
    } else if (transactionType === "Works Contract") {
      effectiveRate = 18;
      itcEligibilityNote = "ITC available subject to blocked credit restrictions.";
    } else if (transactionType === "Real Estate (under construction)") {
      effectiveRate = realEstateWithITC ? 12 : 5;
      itcEligibilityNote = realEstateWithITC ? "12% scheme with ITC." : "5% scheme generally without ITC.";
    } else if (transactionType === "Real Estate (ready to move)") {
      effectiveRate = 0;
      isExempt = true;
      itcEligibilityNote = "Exempt transaction; output GST not applicable.";
    } else if (transactionType === "Restaurant Services") {
      effectiveRate = 5;
      itcEligibilityNote = "5% rate generally without ITC.";
    } else if (transactionType === "Healthcare Services") {
      effectiveRate = 0;
      isExempt = true;
      itcEligibilityNote = "Healthcare services are generally exempt.";
    } else if (transactionType === "Educational Services") {
      effectiveRate = 0;
      isExempt = true;
      itcEligibilityNote = "Educational services are generally exempt.";
    }

    const gstLiability = value * effectiveRate / 100;
    const filingRequirement = isRegistered
      ? (isExempt ? "Nil/appropriate GST return filing as applicable" : "GSTR-1 and GSTR-3B")
      : "Evaluate registration threshold before filing requirement";

    setResult({ gstLiability, reverseChargeApplicable, isExempt, effectiveRate, filingRequirement, itcEligibilityNote });
  }, [transactionType, transactionValue, stateOfSupply, isRegistered, saleGoodsRate, realEstateWithITC]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Transaction Type": transactionType, "Transaction Value": transactionValue, "State Of Supply": stateOfSupply, "Is Registered": isRegistered, "Sale Goods Rate": saleGoodsRate, "Real Estate With Itc": realEstateWithITC },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Transaction Type": transactionType, "Transaction Value": transactionValue, "State Of Supply": stateOfSupply, "Is Registered": isRegistered, "Sale Goods Rate": saleGoodsRate, "Real Estate With I T C": realEstateWithITC }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="GST Liability Quick Estimator"
      subtitle="Transaction-wise GST, exemption and RCM indication"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <Field label="Transaction Type">
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value as "Sale of Goods" | "Export of Services" | "Import of Services" | "Works Contract" | "Real Estate (under construction)" | "Real Estate (ready to move)" | "Restaurant Services" | "Healthcare Services" | "Educational Services")} className="glass-input w-full h-11 px-3 text-sm">
              {([
                "Sale of Goods",
                "Export of Services",
                "Import of Services",
                "Works Contract",
                "Real Estate (under construction)",
                "Real Estate (ready to move)",
                "Restaurant Services",
                "Healthcare Services",
                "Educational Services",
              ] as const).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>
          <MoneyInput label="Transaction Value" value={transactionValue} onChange={setTransactionValue} />
          <Field label="State of Supply">
            <input value={stateOfSupply} onChange={(e) => setStateOfSupply(e.target.value)} className="glass-input w-full h-11 px-3 text-sm" />
          </Field>
          <Field label="GST Registered">
            <button onClick={() => setIsRegistered((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", isRegistered ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{isRegistered ? "Yes" : "No"}</button>
          </Field>
          {transactionType === "Sale of Goods" && <NumberInput label="GST Rate for Sale of Goods (%)" value={saleGoodsRate} onChange={setSaleGoodsRate} />}
          {transactionType === "Real Estate (under construction)" && (
            <Field label="Choose Scheme">
              <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
                {(["5% no ITC", "12% with ITC"] as const).map((option, idx) => (
                  <button key={option} onClick={() => setRealEstateWithITC(idx === 1)} className={cn("py-2 text-xs font-medium rounded-md transition-all", (idx === 1) === realEstateWithITC ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{option}</button>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="GST Liability" value={`₹ ${result.gstLiability.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Effective Rate" value={`${result.effectiveRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
            <MiniStat label="Reverse Charge" value={result.reverseChargeApplicable ? "Applicable" : "Not Applicable"} />
            <MiniStat label="Exempt" value={result.isExempt ? "Yes" : "No"} green={result.isExempt} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Filing requirement: <span className="text-[var(--text-primary)]">{result.filingRequirement}</span></div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">ITC note: {result.itcEligibilityNote}</div>
        </div>
      )}
    />
  );
}

function CustomsDutyCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [assessableValue, setAssessableValue] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [productCategory, setProductCategory] = useState<"Electronics" | "Mobile Phones" | "Machinery" | "Raw Materials" | "Luxury Goods" | "Food Products">("Electronics");
  const [result, setResult] = useState({
    inrValue: 0,
    bcd: 0,
    sws: 0,
    igst: 0,
    totalDuty: 0,
    totalLandedCost: 0,
    effectiveDutyRate: 0,
    bcdRate: 0,
    igstRate: 0,
  });

  useEffect(() => {
    const rates: Record<"Electronics" | "Mobile Phones" | "Machinery" | "Raw Materials" | "Luxury Goods" | "Food Products", { bcdRate: number; igstRate: number }> = {
      Electronics: { bcdRate: 20, igstRate: 18 },
      "Mobile Phones": { bcdRate: 20, igstRate: 12 },
      Machinery: { bcdRate: 7.5, igstRate: 18 },
      "Raw Materials": { bcdRate: 5, igstRate: 12 },
      "Luxury Goods": { bcdRate: 100, igstRate: 28 },
      "Food Products": { bcdRate: 30, igstRate: 5 },
    };

    const usd = toNum(assessableValue);
    const fx = toNum(exchangeRate);
    const inrValue = usd * fx;
    const bcdRate = rates[productCategory].bcdRate;
    const igstRate = rates[productCategory].igstRate;

    const bcd = inrValue * bcdRate / 100;
    const sws = bcd * 0.1;
    const totalDutyBeforeIGST = inrValue + bcd + sws;
    const igst = totalDutyBeforeIGST * igstRate / 100;
    const totalDuty = bcd + sws + igst;
    const totalLandedCost = inrValue + totalDuty;
    const effectiveDutyRate = inrValue > 0 ? (totalDuty / inrValue) * 100 : 0;

    setResult({ inrValue, bcd, sws, igst, totalDuty, totalLandedCost, effectiveDutyRate, bcdRate, igstRate });
  }, [assessableValue, exchangeRate, productCategory]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Assessable Value": assessableValue, "Exchange Rate": exchangeRate, "Product Category": productCategory },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Assessable Value": assessableValue, "Exchange Rate": exchangeRate, "Product Category": productCategory }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Import Customs Duty Calculator"
      subtitle="BCD + SWS + IGST computation with landed cost view"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <NumberInput label="Assessable Value (USD)" value={assessableValue} onChange={setAssessableValue} />
          <NumberInput label="Exchange Rate" value={exchangeRate} onChange={setExchangeRate} />
          <Field label="Product Category">
            <select value={productCategory} onChange={(e) => setProductCategory(e.target.value as "Electronics" | "Mobile Phones" | "Machinery" | "Raw Materials" | "Luxury Goods" | "Food Products")} className="glass-input w-full h-11 px-3 text-sm">
              {(["Electronics", "Mobile Phones", "Machinery", "Raw Materials", "Luxury Goods", "Food Products"] as const).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="INR Value" value={`₹ ${result.inrValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="BCD" value={`₹ ${result.bcd.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="SWS" value={`₹ ${result.sws.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="IGST" value={`₹ ${result.igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Duty" value={`₹ ${result.totalDuty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Landed Cost" value={`₹ ${result.totalLandedCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Effective Duty Rate" value={`${result.effectiveDutyRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
          </div>

          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Duty Breakdown</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  <tr><td className="px-5 py-2 text-secondary">Assessable INR Value</td><td className="px-5 py-2 text-right">₹ {result.inrValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">BCD ({result.bcdRate.toLocaleString('en-IN')}%)</td><td className="px-5 py-2 text-right">₹ {result.bcd.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">SWS (10% on BCD)</td><td className="px-5 py-2 text-right">₹ {result.sws.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">IGST ({result.igstRate.toLocaleString('en-IN')}%)</td><td className="px-5 py-2 text-right">₹ {result.igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr className="border-t border-primary/20"><td className="px-5 py-2.5 font-bold">Total Duty</td><td className="px-5 py-2.5 text-right font-bold">₹ {result.totalDuty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    />
  );
}

function PFWithdrawalCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [totalPFBalance, setTotalPFBalance] = useState("");
  const [yearsOfService, setYearsOfService] = useState("");
  const [reason, setReason] = useState<"Resignation" | "Retirement" | "Medical" | "Housing">("Resignation");
  const [hasPAN, setHasPAN] = useState(true);
  const [result, setResult] = useState({ taxableAmount: 0, tdsDeductible: 0, netAmount: 0, note: "", formNote: "" });

  useEffect(() => {
    const balance = toNum(totalPFBalance);
    const years = toNum(yearsOfService);
    const taxableAmount = reason === "Resignation" && years < 5 ? balance : 0;
    const tdsDeductible = taxableAmount * (hasPAN ? 0.1 : 0.34608);
    const netAmount = balance - tdsDeductible;
    const note = reason === "Resignation" && years < 5 ? "Taxable because service is under 5 years on resignation." : "Exempt under applicable PF withdrawal rules.";
    const formNote = taxableAmount > 0 ? "Form 15G/15H generally not applicable unless overall income is below taxable limits." : "Form 15G/15H not required for exempt withdrawal.";
    setResult({ taxableAmount, tdsDeductible, netAmount, note, formNote });
  }, [totalPFBalance, yearsOfService, reason, hasPAN]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Total Pf Balance": totalPFBalance, "Years Of Service": yearsOfService, "Reason": reason, "Has Pan": hasPAN },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Total P F Balance": totalPFBalance, "Years Of Service": yearsOfService, "Reason": reason, "Has P A N": hasPAN }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="PF Withdrawal Tax Calculator"
      subtitle="Tax and TDS estimation on employee provident fund withdrawal"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Total PF Balance" value={totalPFBalance} onChange={setTotalPFBalance} />
          <NumberInput label="Years of Service" value={yearsOfService} onChange={setYearsOfService} />
          <Field label="Reason">
            <select value={reason} onChange={(e) => setReason(e.target.value as "Resignation" | "Retirement" | "Medical" | "Housing")} className="glass-input w-full h-11 px-3 text-sm">
              {(["Resignation", "Retirement", "Medical", "Housing"] as const).map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </Field>
          <Field label="PAN Provided">
            <button onClick={() => setHasPAN((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", hasPAN ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{hasPAN ? "Yes" : "No"}</button>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Taxable Amount" value={`₹ ${result.taxableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="TDS Deductible" value={`₹ ${result.tdsDeductible.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Net Amount" value={`₹ ${result.netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.note}</div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.formNote}</div>
        </div>
      )}
    />
  );
}

function NRITaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [indianSourceIncome, setIndianSourceIncome] = useState("");
  const [incomeType, setIncomeType] = useState<"Salary" | "Rent" | "Interest" | "Capital Gains" | "Dividend">("Salary");
  const [capitalGainNature, setCapitalGainNature] = useState<"LTCG" | "STCG">("LTCG");
  const [residencyStatus, setResidencyStatus] = useState<"NRI" | "RNOR" | "Resident">("NRI");
  const [result, setResult] = useState({ taxLiability: 0, effectiveRate: 0, tdsLikelyDeducted: 0, refundOrPayable: 0, dtaaNote: "" });

  useEffect(() => {
    const income = toNum(indianSourceIncome);
    let taxLiability = 0;
    if (incomeType === "Salary") {
      taxLiability = calculateSlabTax(income, NEW_REGIME_SLABS).baseTax * 1.04;
    } else if (incomeType === "Rent") {
      taxLiability = income * 0.7 * 0.3 * 1.04;
    } else if (incomeType === "Interest") {
      taxLiability = income * 0.3 * 1.04;
    } else if (incomeType === "Capital Gains") {
      taxLiability = income * (capitalGainNature === "LTCG" ? 0.125 : 0.2);
    } else {
      taxLiability = income * 0.2 * 1.04;
    }
    if (residencyStatus === "Resident" && incomeType !== "Salary") {
      taxLiability *= 1;
    }
    const tdsLikelyDeducted = income * 0.3;
    const refundOrPayable = taxLiability - tdsLikelyDeducted;
    const effectiveRate = income > 0 ? (taxLiability / income) * 100 : 0;
    const dtaaNote = incomeType === "Dividend" || incomeType === "Interest"
      ? "DTAA relief may cap dividend/interest withholding at 15% for major treaty countries."
      : "DTAA may apply based on specific treaty article and country of residence.";
    setResult({ taxLiability, effectiveRate, tdsLikelyDeducted, refundOrPayable, dtaaNote });
  }, [indianSourceIncome, incomeType, capitalGainNature, residencyStatus]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Indian Source Income": indianSourceIncome, "Income Type": incomeType, "Capital Gain Nature": capitalGainNature, "Residency Status": residencyStatus },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Indian Source Income": indianSourceIncome, "Income Type": incomeType, "Capital Gain Nature": capitalGainNature, "Residency Status": residencyStatus }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="NRI Income Tax Calculator"
      subtitle="Tax estimate on Indian-source income for NRI / RNOR / resident cases"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Indian Source Income" value={indianSourceIncome} onChange={setIndianSourceIncome} />
          <Field label="Income Type">
            <select value={incomeType} onChange={(e) => setIncomeType(e.target.value as "Salary" | "Rent" | "Interest" | "Capital Gains" | "Dividend")} className="glass-input w-full h-11 px-3 text-sm">
              {(["Salary", "Rent", "Interest", "Capital Gains", "Dividend"] as const).map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </Field>
          {incomeType === "Capital Gains" && (
            <Field label="Capital Gain Nature">
              <select value={capitalGainNature} onChange={(e) => setCapitalGainNature(e.target.value as "LTCG" | "STCG")} className="glass-input w-full h-11 px-3 text-sm">
                <option value="LTCG">LTCG Equity</option>
                <option value="STCG">STCG Equity</option>
              </select>
            </Field>
          )}
          <Field label="Residency Status">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["NRI", "RNOR", "Resident"] as const).map((status) => (
                <button key={status} onClick={() => setResidencyStatus(status)} className={cn("py-2 text-xs font-medium rounded-md transition-all", residencyStatus === status ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{status}</button>
              ))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Tax Liability" value={`₹ ${result.taxLiability.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Effective Rate" value={`${result.effectiveRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`} />
            <MiniStat label="TDS Likely Deducted" value={`₹ ${result.tdsLikelyDeducted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label={result.refundOrPayable >= 0 ? "Payable" : "Refund"} value={`₹ ${Math.abs(result.refundOrPayable).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green={result.refundOrPayable < 0} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.dtaaNote}</div>
        </div>
      )}
    />
  );
}

function HomeLoanTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureYears, setTenureYears] = useState("");
  const [propertyType, setPropertyType] = useState<"Self-occupied" | "Let-out">("Self-occupied");
  const [annualRent, setAnnualRent] = useState("");
  const [ownershipType, setOwnershipType] = useState<"Sole" | "Joint 50-50">("Sole");
  const [affordableHousing, setAffordableHousing] = useState(false);
  const [result, setResult] = useState({ annualEMI: 0, annualInterest: 0, annualPrincipal: 0, section24Deduction: 0, section80CDeduction: 0, section80EEDeduction: 0, totalDeduction: 0, taxSavingAt30: 0, taxSavingAt20: 0, netCostOfLoan: 0, rentalNetImpact: 0, rows: [] as Array<{ year: number; opening: number; interest: number; principal: number; closing: number }> });

  useEffect(() => {
    const principal = toNum(loanAmount);
    const rate = toNum(interestRate);
    const years = Math.max(1, Math.floor(toNum(tenureYears)));
    const emi = calculateEMIFromPrincipal(principal, rate, years * 12);
    let balance = principal;
    const rows: Array<{ year: number; opening: number; interest: number; principal: number; closing: number }> = [];
    for (let year = 1; year <= Math.min(5, years); year += 1) {
      let annualInterest = 0;
      let annualPrincipal = 0;
      const opening = balance;
      for (let m = 0; m < 12 && balance > 0; m += 1) {
        const monthInterest = balance * rate / 12 / 100;
        const monthPrincipal = Math.min(emi - monthInterest, balance);
        annualInterest += monthInterest;
        annualPrincipal += Math.max(0, monthPrincipal);
        balance = Math.max(0, balance - monthPrincipal);
      }
      rows.push({ year, opening, interest: annualInterest, principal: annualPrincipal, closing: balance });
    }

    const annualEMI = emi * 12;
    const annualInterest = rows[0]?.interest ?? 0;
    const annualPrincipal = rows[0]?.principal ?? 0;
    const ownershipMultiplier = ownershipType === "Joint 50-50" ? 2 : 1;
    const section24Deduction = propertyType === "Self-occupied" ? Math.min(annualInterest, 200000) : annualInterest;
    const section80CDeduction = Math.min(annualPrincipal, 150000);
    const section80EEDeduction = affordableHousing ? 150000 : 0;
    const totalDeduction = (section24Deduction + section80CDeduction + section80EEDeduction) * ownershipMultiplier;
    const taxSavingAt30 = totalDeduction * 0.3;
    const taxSavingAt20 = totalDeduction * 0.2;
    const netCostOfLoan = annualInterest - taxSavingAt30;
    const rentalNetImpact = propertyType === "Let-out" ? toNum(annualRent) - annualInterest : 0;

    setResult({ annualEMI, annualInterest, annualPrincipal, section24Deduction, section80CDeduction, section80EEDeduction, totalDeduction, taxSavingAt30, taxSavingAt20, netCostOfLoan, rentalNetImpact, rows });
  }, [loanAmount, interestRate, tenureYears, propertyType, annualRent, ownershipType, affordableHousing]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Loan Amount": loanAmount, "Interest Rate": interestRate, "Tenure Years": tenureYears, "Property Type": propertyType, "Annual Rent": annualRent, "Ownership Type": ownershipType, "Affordable Housing": affordableHousing },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Loan Amount": loanAmount, "Interest Rate": interestRate, "Tenure Years": tenureYears, "Property Type": propertyType, "Annual Rent": annualRent, "Ownership Type": ownershipType, "Affordable Housing": affordableHousing }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Home Loan Tax Benefit Calculator"
      subtitle="Interest, principal, Section 24 / 80C / 80EEA and year-wise benefit view"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} />
          <NumberInput label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} />
          <NumberInput label="Tenure (Years)" value={tenureYears} onChange={setTenureYears} />
          <Field label="Property Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["Self-occupied", "Let-out"] as const).map((type) => (<button key={type} onClick={() => setPropertyType(type)} className={cn("py-2 text-xs font-medium rounded-md transition-all", propertyType === type ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{type}</button>))}
            </div>
          </Field>
          {propertyType === "Let-out" && <MoneyInput label="Annual Rent" value={annualRent} onChange={setAnnualRent} />}
          <Field label="Ownership Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["Sole", "Joint 50-50"] as const).map((type) => (<button key={type} onClick={() => setOwnershipType(type)} className={cn("py-2 text-xs font-medium rounded-md transition-all", ownershipType === type ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{type}</button>))}
            </div>
          </Field>
          <Field label="Affordable Housing (80EEA)">
            <button onClick={() => setAffordableHousing((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", affordableHousing ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{affordableHousing ? "Yes" : "No"}</button>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Annual EMI" value={`₹ ${result.annualEMI.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Annual Interest" value={`₹ ${result.annualInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Annual Principal" value={`₹ ${result.annualPrincipal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Section 24 Deduction" value={`₹ ${result.section24Deduction.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Section 80C Deduction" value={`₹ ${result.section80CDeduction.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Section 80EEA Deduction" value={`₹ ${result.section80EEDeduction.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Deduction" value={`₹ ${result.totalDeduction.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Net Cost of Loan" value={`₹ ${result.netCostOfLoan.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
          </div>
          {propertyType === "Let-out" && <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Net rental impact after interest: <span className="text-[var(--text-primary)]">₹ {result.rentalNetImpact.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">First 5 Years</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead><tr className="text-tertiary"><th className="text-left font-medium px-5 py-2 bg-primary/10">Year</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Opening</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Interest</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Principal</th><th className="text-right font-medium px-5 py-2 bg-primary/10">Closing</th></tr></thead>
                <tbody>{result.rows.map((row, index) => (<tr key={row.year} className={index % 2 ? "bg-white/[0.02]" : ""}><td className="px-5 py-2 text-secondary">{row.year.toLocaleString('en-IN')}</td><td className="px-3 py-2 text-right">₹ {row.opening.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-3 py-2 text-right">₹ {row.interest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-3 py-2 text-right">₹ {row.principal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-5 py-2 text-right">₹ {row.closing.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Tax saving shown at 30% and 20% slab assumptions.</div>
        </div>
      )}
    />
  );
}

function ITRFormSelectorCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [entityType, setEntityType] = useState<"Individual" | "Company" | "Firm" | "LLP" | "Trust" | "Political Party" | "AOP/BOI">("Individual");
  const [answers, setAnswers] = useState({ resident: true, salaryOnly: true, businessIncome: false, turnoverOver2Cr: false, partnerInFirm: false, foreignIncomeAssets: false, capitalGains: false, incomeOver50L: false, companyFirmLlp: false, agriOver5000: false, otherSourcesOnly: false, seniorCitizen: false, broughtForwardLosses: false, presumptiveIncome: false, exemptLtcgOnly: false });
  const toggle = (key: keyof typeof answers) => setAnswers((prev) => ({ ...prev, [key]: !prev[key] }));

  const result = (() => {
    let form = "ITR-1";
    let reason = "Salaried individual with simple return profile.";
    const schedules = new Set<string>();
    const docs = new Set<string>(["Form 16", "AIS/TIS", "26AS", "Bank statements"]);

    if (entityType === "Company") {
      form = "ITR-6";
      reason = "Companies must file ITR-6.";
    } else if (entityType === "Trust" || entityType === "Political Party") {
      form = "ITR-7";
      reason = "Trusts / political parties fall under ITR-7.";
    } else if (entityType === "Firm" || entityType === "LLP" || entityType === "AOP/BOI") {
      form = "ITR-5";
      reason = "Firms, LLPs and AOP/BOIs generally use ITR-5.";
    } else if (answers.presumptiveIncome) {
      form = "ITR-4";
      reason = "Presumptive income under 44AD/44ADA/44AE points to ITR-4.";
    } else if (answers.businessIncome || answers.partnerInFirm) {
      form = "ITR-3";
      reason = answers.partnerInFirm ? "Partner in a firm requires ITR-3." : "Business/profession income requires ITR-3.";
    } else if (answers.capitalGains || answers.foreignIncomeAssets || answers.broughtForwardLosses || answers.agriOver5000 || answers.exemptLtcgOnly || answers.incomeOver50L || answers.otherSourcesOnly) {
      form = "ITR-2";
      reason = "Capital gains / foreign assets / higher income profile indicate ITR-2.";
    }

    if (answers.salaryOnly) schedules.add("Salary");
    if (answers.capitalGains || answers.exemptLtcgOnly) schedules.add("Capital Gains");
    if (answers.foreignIncomeAssets) schedules.add("Foreign Assets/Income");
    if (answers.businessIncome) schedules.add("Business & Profession");
    if (answers.partnerInFirm) schedules.add("Partnership Income");
    if (answers.presumptiveIncome) schedules.add("Presumptive Income");
    if (answers.agriOver5000) schedules.add("Agricultural Income");
    if (answers.broughtForwardLosses) schedules.add("Brought Forward Losses");
    if (answers.otherSourcesOnly) schedules.add("Other Sources");
    if (answers.incomeOver50L) docs.add("Capital gain statements / investment proofs");
    if (answers.businessIncome || answers.partnerInFirm || answers.presumptiveIncome) docs.add("P&L / Balance Sheet / Books of accounts");
    if (answers.foreignIncomeAssets) docs.add("Foreign tax / asset statements");
    if (answers.broughtForwardLosses) docs.add("Earlier year return acknowledgements");

    const auditCase = entityType === "Company" || entityType === "Firm" || entityType === "LLP" || answers.businessIncome || answers.turnoverOver2Cr || answers.partnerInFirm;
    const dueDate = auditCase ? "October 31" : "July 31";
    return { form, reason, schedules: [...schedules], docs: [...docs], dueDate };
  })();

  const questions: Array<[keyof typeof answers, string]> = [
    ["resident", "Are you a resident Indian?"],
    ["salaryOnly", "Is your income only from salary?"],
    ["businessIncome", "Do you have business/profession income?"],
    ["turnoverOver2Cr", "Is your business turnover > ₹2Cr?"],
    ["partnerInFirm", "Are you a partner in a firm?"],
    ["foreignIncomeAssets", "Do you have foreign income/assets?"],
    ["capitalGains", "Do you have capital gains?"],
    ["incomeOver50L", "Is your total income > ₹50L?"],
    ["companyFirmLlp", "Are you a company/firm/LLP?"],
    ["agriOver5000", "Do you have agricultural income > ₹5000?"],
    ["otherSourcesOnly", "Do you have income from other sources only?"],
    ["seniorCitizen", "Are you a senior citizen (60+)?"],
    ["broughtForwardLosses", "Do you have brought forward losses?"],
    ["presumptiveIncome", "Do you have presumptive income (44AD/44ADA)?"],
    ["exemptLtcgOnly", "Do you have exempt LTCG only (no other schedule)?"],
  ];

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Entity Type": entityType, "Answers": answers },
        outputs: {  },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Entity Type": entityType, "Answers": answers }, outputs: {  } }; });

  return (
    <CalculatorShell
      title="ITR Form Selector & Filing Guide"
      subtitle="Answer the profile questions to identify the likely return form and filing checklist"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <Field label="Entity Type">
            <select value={entityType} onChange={(e) => setEntityType(e.target.value as typeof entityType)} className="glass-input w-full h-11 px-3 text-sm">
              {(["Individual", "Company", "Firm", "LLP", "Trust", "Political Party", "AOP/BOI"] as const).map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </Field>
          <div className="space-y-2">
            {questions.map(([key, text]) => (
              <button key={key} onClick={() => toggle(key)} className={cn("w-full text-left p-3 rounded-md border transition-all text-xs", answers[key] ? "bg-gradient-orange text-white glow-orange border-transparent" : "border-white/10 text-secondary hover:text-[var(--text-primary)]")}>
                {text}
              </button>
            ))}
          </div>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Recommended ITR Form" value={result.form} green />
            <MiniStat label="Due Date" value={result.dueDate} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Reason: <span className="text-[var(--text-primary)]">{result.reason}</span></div>
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Schedules to Fill</div>
            <div className="overflow-x-auto -mx-5"><table className="w-full text-xs"><tbody>{result.schedules.map((item, index) => (<tr key={item} className={index % 2 ? "bg-white/[0.02]" : ""}><td className="px-5 py-2 text-secondary">{item}</td></tr>))}</tbody></table></div>
          </div>
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Documents Required</div>
            <div className="overflow-x-auto -mx-5"><table className="w-full text-xs"><tbody>{result.docs.map((item, index) => (<tr key={item} className={index % 2 ? "bg-white/[0.02]" : ""}><td className="px-5 py-2 text-secondary">{item}</td></tr>))}</tbody></table></div>
          </div>
        </div>
      )}
    />
  );
}

function BalanceSheetAnalysisCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [cashAndBank, setCashAndBank] = useState("");
  const [shortTermInvestments, setShortTermInvestments] = useState("");
  const [receivables, setReceivables] = useState("");
  const [inventory, setInventory] = useState("");
  const [otherCurrentAssets, setOtherCurrentAssets] = useState("");
  const [fixedAssets, setFixedAssets] = useState("");
  const [intangibles, setIntangibles] = useState("");
  const [otherNonCurrentAssets, setOtherNonCurrentAssets] = useState("");
  const [shortTermDebt, setShortTermDebt] = useState("");
  const [payables, setPayables] = useState("");
  const [otherCurrentLiab, setOtherCurrentLiab] = useState("");
  const [longTermDebt, setLongTermDebt] = useState("");
  const [otherNonCurrentLiab, setOtherNonCurrentLiab] = useState("");
  const [shareCapital, setShareCapital] = useState("");
  const [reserves, setReserves] = useState("");
  const [sharesOutstanding, setSharesOutstanding] = useState("");
  const [result, setResult] = useState({ currentRatio: 0, quickRatio: 0, cashRatio: 0, debtEquity: 0, debtAssets: 0, equityRatio: 0, bvps: 0, tangibleNetWorth: 0, score: 0, balanced: false, totalAssets: 0, totalLiabilities: 0, totalEquity: 0, totalCurrentAssets: 0, totalNonCurrentAssets: 0, totalCurrentLiab: 0, totalNonCurrentLiab: 0 });

  useEffect(() => {
    const ca = toNum(cashAndBank) + toNum(shortTermInvestments) + toNum(receivables) + toNum(inventory) + toNum(otherCurrentAssets);
    const nca = toNum(fixedAssets) + toNum(intangibles) + toNum(otherNonCurrentAssets);
    const totalAssets = ca + nca;
    const cl = toNum(shortTermDebt) + toNum(payables) + toNum(otherCurrentLiab);
    const ncl = toNum(longTermDebt) + toNum(otherNonCurrentLiab);
    const equity = toNum(shareCapital) + toNum(reserves);
    const totalLiabilities = cl + ncl;
    const totalLiabEquity = totalLiabilities + equity;
    const balanced = Math.abs(totalAssets - totalLiabEquity) < 1;
    const currentRatio = cl > 0 ? ca / cl : 0;
    const quickRatio = cl > 0 ? (toNum(cashAndBank) + toNum(shortTermInvestments) + toNum(receivables)) / cl : 0;
    const cashRatio = cl > 0 ? (toNum(cashAndBank) + toNum(shortTermInvestments)) / cl : 0;
    const debtEquity = equity > 0 ? (toNum(shortTermDebt) + toNum(longTermDebt)) / equity : 0;
    const debtAssets = totalAssets > 0 ? (toNum(shortTermDebt) + toNum(longTermDebt)) / totalAssets : 0;
    const equityRatio = totalAssets > 0 ? equity / totalAssets : 0;
    const bvps = toNum(sharesOutstanding) > 0 ? equity / toNum(sharesOutstanding) : 0;
    const tangibleNetWorth = equity - toNum(intangibles);
    const tangibleNetWorthRatio = totalAssets > 0 ? tangibleNetWorth / totalAssets : 0;
    const criterion = (ok: boolean) => (ok ? 1 : 0);
    const score = Math.round(((criterion(currentRatio >= 1.5 && currentRatio <= 3) + criterion(quickRatio >= 1) + criterion(cashRatio >= 0.5) + criterion(debtEquity <= 1) + criterion(debtAssets <= 0.5) + criterion(equityRatio >= 0.5) + criterion(bvps > 0) + criterion(tangibleNetWorth > 0)) / 8) * 100);
    setResult({ currentRatio, quickRatio, cashRatio, debtEquity, debtAssets, equityRatio, bvps, tangibleNetWorth, score, balanced, totalAssets, totalLiabilities, totalEquity: equity, totalCurrentAssets: ca, totalNonCurrentAssets: nca, totalCurrentLiab: cl, totalNonCurrentLiab: ncl });
  }, [cashAndBank, shortTermInvestments, receivables, inventory, otherCurrentAssets, fixedAssets, intangibles, otherNonCurrentAssets, shortTermDebt, payables, otherCurrentLiab, longTermDebt, otherNonCurrentLiab, shareCapital, reserves, sharesOutstanding]);

  const ratioCard = (label: string, value: number, good: boolean, suffix = "") => (
    <div className="card-surface p-3">
      <div className="text-[10px] uppercase tracking-wide text-tertiary">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="text-base font-bold">{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}{suffix}</div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", good ? "text-success border-success/40 bg-success/10" : "text-red-300 border-red-300/40 bg-red-300/10")}>{good ? "Healthy" : "Watch"}</span>
      </div>
    </div>
  );

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Cash And Bank": cashAndBank, "Short Term Investments": shortTermInvestments, "Receivables": receivables, "Inventory": inventory, "Other Current Assets": otherCurrentAssets, "Fixed Assets": fixedAssets, "Intangibles": intangibles, "Other Non Current Assets": otherNonCurrentAssets, "Short Term Debt": shortTermDebt, "Payables": payables, "Other Current Liab": otherCurrentLiab, "Long Term Debt": longTermDebt, "Other Non Current Liab": otherNonCurrentLiab, "Share Capital": shareCapital, "Reserves": reserves, "Shares Outstanding": sharesOutstanding },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Cash And Bank": cashAndBank, "Short Term Investments": shortTermInvestments, "Receivables": receivables, "Inventory": inventory, "Other Current Assets": otherCurrentAssets, "Fixed Assets": fixedAssets, "Intangibles": intangibles, "Other Non Current Assets": otherNonCurrentAssets, "Short Term Debt": shortTermDebt, "Payables": payables, "Other Current Liab": otherCurrentLiab, "Long Term Debt": longTermDebt, "Other Non Current Liab": otherNonCurrentLiab, "Share Capital": shareCapital, "Reserves": reserves, "Shares Outstanding": sharesOutstanding }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Balance Sheet Strength Analyser"
      subtitle="Balance check, ratios and financial strength score"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Cash & Bank" value={cashAndBank} onChange={setCashAndBank} />
          <MoneyInput label="Short-term Investments" value={shortTermInvestments} onChange={setShortTermInvestments} />
          <MoneyInput label="Receivables" value={receivables} onChange={setReceivables} />
          <MoneyInput label="Inventory" value={inventory} onChange={setInventory} />
          <MoneyInput label="Other Current Assets" value={otherCurrentAssets} onChange={setOtherCurrentAssets} />
          <MoneyInput label="Fixed Assets" value={fixedAssets} onChange={setFixedAssets} />
          <MoneyInput label="Intangibles" value={intangibles} onChange={setIntangibles} />
          <MoneyInput label="Other Non-current Assets" value={otherNonCurrentAssets} onChange={setOtherNonCurrentAssets} />
          <MoneyInput label="Short-term Debt" value={shortTermDebt} onChange={setShortTermDebt} />
          <MoneyInput label="Payables" value={payables} onChange={setPayables} />
          <MoneyInput label="Other Current Liabilities" value={otherCurrentLiab} onChange={setOtherCurrentLiab} />
          <MoneyInput label="Long-term Debt" value={longTermDebt} onChange={setLongTermDebt} />
          <MoneyInput label="Other Non-current Liabilities" value={otherNonCurrentLiab} onChange={setOtherNonCurrentLiab} />
          <MoneyInput label="Share Capital" value={shareCapital} onChange={setShareCapital} />
          <MoneyInput label="Reserves" value={reserves} onChange={setReserves} />
          <NumberInput label="Shares Outstanding" value={sharesOutstanding} onChange={setSharesOutstanding} />
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Balance Sheet</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="bg-primary/10"><td className="px-5 py-2 font-semibold" colSpan={2}>Assets</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Total Current Assets</td><td className="px-5 py-2 text-right">₹ {result.totalCurrentAssets.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Total Non-current Assets</td><td className="px-5 py-2 text-right">₹ {result.totalNonCurrentAssets.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr className="border-t border-primary/20"><td className="px-5 py-2.5 font-bold">Total Assets</td><td className="px-5 py-2.5 text-right font-bold">₹ {result.totalAssets.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr className="bg-primary/10"><td className="px-5 py-2 font-semibold" colSpan={2}>Liabilities & Equity</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Total Current Liabilities</td><td className="px-5 py-2 text-right">₹ {result.totalCurrentLiab.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Total Non-current Liabilities</td><td className="px-5 py-2 text-right">₹ {result.totalNonCurrentLiab.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr><td className="px-5 py-2 text-secondary">Total Equity</td><td className="px-5 py-2 text-right">₹ {result.totalEquity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                  <tr className="border-t border-primary/20"><td className="px-5 py-2.5 font-bold">Liabilities + Equity</td><td className="px-5 py-2.5 text-right font-bold">₹ {(result.totalLiabilities + result.totalEquity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className={cn("card-surface p-4 text-sm", result.balanced ? "border border-success/40 text-success" : "border border-red-400/40 text-red-300")}>{result.balanced ? "Balance sheet balances." : "Balance sheet does not balance — check totals."}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ratioCard("Current Ratio", result.currentRatio, result.currentRatio >= 1.5)}
            {ratioCard("Quick Ratio", result.quickRatio, result.quickRatio >= 1)}
            {ratioCard("Cash Ratio", result.cashRatio, result.cashRatio >= 0.5)}
            {ratioCard("Debt / Equity", result.debtEquity, result.debtEquity <= 1)}
            {ratioCard("Debt / Assets", result.debtAssets, result.debtAssets <= 0.5)}
            {ratioCard("Equity Ratio", result.equityRatio, result.equityRatio >= 0.5)}
            {ratioCard("Book Value / Share", result.bvps, result.bvps > 0, "")}
            {ratioCard("Tangible Net Worth", result.tangibleNetWorth, result.tangibleNetWorth > 0)}
          </div>
          <MiniStat label="Overall Financial Strength Score" value={`${result.score.toLocaleString('en-IN')} / 100`} green={result.score >= 70} />
        </div>
      )}
    />
  );
}

function Rebate87ACalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [totalIncome, setTotalIncome] = useState("");
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [result, setResult] = useState({ taxBeforeRebate: 0, rebateAmount: 0, taxAfterRebate: 0, cessAmount: 0, totalTax: 0, marginalReliefNote: "" });

  useEffect(() => {
    const income = toNum(totalIncome);
    const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
    const taxBeforeRebate = calculateSlabTax(income, slabs).baseTax;
    let rebateAmount = 0;
    let taxAfterRebate = taxBeforeRebate;
    let marginalReliefNote = "";

    if (regime === "new") {
      if (income <= 700000) {
        rebateAmount = Math.min(25000, taxBeforeRebate);
        taxAfterRebate = Math.max(0, taxBeforeRebate - rebateAmount);
      } else if (income <= 727000 && taxBeforeRebate > income - 700000) {
        taxAfterRebate = Math.max(0, income - 700000);
        marginalReliefNote = "Marginal relief applied under new regime.";
      }
    } else if (income <= 500000) {
      rebateAmount = Math.min(12500, taxBeforeRebate);
      taxAfterRebate = Math.max(0, taxBeforeRebate - rebateAmount);
    }

    const cessAmount = taxAfterRebate * 0.04;
    const totalTax = taxAfterRebate + cessAmount;
    setResult({ taxBeforeRebate, rebateAmount, taxAfterRebate, cessAmount, totalTax, marginalReliefNote });
  }, [totalIncome, regime]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Total Income": totalIncome, "Regime": regime },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Total Income": totalIncome, "Regime": regime }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Section 87A Rebate Calculator"
      subtitle="Rebate and marginal relief computation by regime"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Total Income" value={totalIncome} onChange={setTotalIncome} />
          <Field label="Regime">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["new", "old"] as const).map((item) => (<button key={item} onClick={() => setRegime(item)} className={cn("py-2 text-xs font-medium rounded-md transition-all uppercase", regime === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{item}</button>))}
            </div>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Step-by-step</div>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs"><tbody>
                <tr><td className="px-5 py-2 text-secondary">Income</td><td className="px-5 py-2 text-right">₹ {toNum(totalIncome).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                <tr><td className="px-5 py-2 text-secondary">Tax Before Rebate</td><td className="px-5 py-2 text-right">₹ {result.taxBeforeRebate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                <tr><td className="px-5 py-2 text-secondary">Rebate Amount</td><td className="px-5 py-2 text-right">₹ {result.rebateAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                <tr><td className="px-5 py-2 text-secondary">Tax After Rebate</td><td className="px-5 py-2 text-right">₹ {result.taxAfterRebate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                <tr><td className="px-5 py-2 text-secondary">Cess @4%</td><td className="px-5 py-2 text-right">₹ {result.cessAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
                <tr className="border-t border-primary/20"><td className="px-5 py-2.5 font-bold">Total Tax</td><td className="px-5 py-2.5 text-right font-bold">₹ {result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
              </tbody></table>
            </div>
          </div>
          {result.totalTax === 0 ? <div className="card-surface p-4 border border-success/40 text-success text-sm font-semibold">NIL TAX</div> : <MiniStat label="Total Tax" value={`₹ ${result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />}
          {result.marginalReliefNote && <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.marginalReliefNote}</div>}
        </div>
      )}
    />
  );
}

function SalaryRestructureCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [currentCTC, setCurrentCTC] = useState("");
  const [currentBasicPercent, setCurrentBasicPercent] = useState("");
  const [payingRent, setPayingRent] = useState(true);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [cityType, setCityType] = useState<"metro" | "non-metro">("metro");
  const [hasCarLease, setHasCarLease] = useState(false);
  const [carLeaseAmount, setCarLeaseAmount] = useState("");
  const [hasMealVoucher, setHasMealVoucher] = useState(false);
  const [mealVoucherAmount, setMealVoucherAmount] = useState("");
  const [hasLTA, setHasLTA] = useState(false);
  const [ltaAmount, setLtaAmount] = useState("");
  const [result, setResult] = useState({ currentTax: 0, optimizedTax: 0, monthlySaving: 0, annualSaving: 0, currentTaxable: 0, optimizedTaxable: 0, rows: [] as Array<{ label: string; currentValue: number; optimizedValue: number; annualSaving: number }> });

  useEffect(() => {
    const ctc = toNum(currentCTC);
    const basicPct = toNum(currentBasicPercent) / 100;
    const basicAnnual = ctc * basicPct;
    const currentTaxable = Math.max(0, ctc - 50000);
    const currentTax = calculateSlabTax(currentTaxable, NEW_REGIME_SLABS).baseTax * 1.04;

    const optimizedBasic = ctc * 0.4;
    const hraPct = cityType === "metro" ? 0.5 : 0.4;
    const hraReceived = payingRent ? optimizedBasic * hraPct : 0;
    const hraExempt = payingRent ? Math.min(hraReceived, toNum(monthlyRent) * 12 - optimizedBasic * 0.1, optimizedBasic * hraPct) : 0;
    const carBenefit = hasCarLease ? Math.min(toNum(carLeaseAmount), 1800 * 12) : 0;
    const mealBenefit = hasMealVoucher ? Math.min(toNum(mealVoucherAmount) * 12, 2200 * 12) : 0;
    const ltaBenefit = hasLTA ? toNum(ltaAmount) : 0;
    const npsBenefit = optimizedBasic * 0.1;
    const optimizedTaxable = Math.max(0, ctc - 50000 - hraExempt - carBenefit - mealBenefit - ltaBenefit - npsBenefit);
    const optimizedTax = calculateSlabTax(optimizedTaxable, NEW_REGIME_SLABS).baseTax * 1.04;
    const annualSaving = currentTax - optimizedTax;
    const monthlySaving = annualSaving / 12;
    const rows = [
      { label: "Basic", currentValue: basicAnnual, optimizedValue: optimizedBasic, annualSaving: basicAnnual - optimizedBasic },
      { label: "HRA", currentValue: 0, optimizedValue: hraReceived, annualSaving: hraExempt },
      { label: "Car Lease", currentValue: 0, optimizedValue: carBenefit, annualSaving: carBenefit },
      { label: "Meal Vouchers", currentValue: 0, optimizedValue: mealBenefit, annualSaving: mealBenefit },
      { label: "LTA", currentValue: 0, optimizedValue: ltaBenefit, annualSaving: ltaBenefit },
      { label: "Employer NPS", currentValue: 0, optimizedValue: npsBenefit, annualSaving: npsBenefit },
    ];
    setResult({ currentTax, optimizedTax, monthlySaving, annualSaving, currentTaxable, optimizedTaxable, rows });
  }, [currentCTC, currentBasicPercent, payingRent, monthlyRent, cityType, hasCarLease, carLeaseAmount, hasMealVoucher, mealVoucherAmount, hasLTA, ltaAmount]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Current Ctc": currentCTC, "Current Basic Percent": currentBasicPercent, "Paying Rent": payingRent, "Monthly Rent": monthlyRent, "City Type": cityType, "Has Car Lease": hasCarLease, "Car Lease Amount": carLeaseAmount, "Has Meal Voucher": hasMealVoucher, "Meal Voucher Amount": mealVoucherAmount, "Has Lta": hasLTA, "Lta Amount": ltaAmount },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Current C T C": currentCTC, "Current Basic Percent": currentBasicPercent, "Paying Rent": payingRent, "Monthly Rent": monthlyRent, "City Type": cityType, "Has Car Lease": hasCarLease, "Car Lease Amount": carLeaseAmount, "Has Meal Voucher": hasMealVoucher, "Meal Voucher Amount": mealVoucherAmount, "Has L T A": hasLTA, "Lta Amount": ltaAmount }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Salary Restructuring Optimizer"
      subtitle="Restructure salary and compare current vs optimized tax"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Current CTC" value={currentCTC} onChange={setCurrentCTC} />
          <NumberInput label="Current Basic (% of CTC)" value={currentBasicPercent} onChange={setCurrentBasicPercent} />
          <Field label="Paying Rent">
            <button onClick={() => setPayingRent((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", payingRent ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{payingRent ? "Yes" : "No"}</button>
          </Field>
          {payingRent && <MoneyInput label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} />}
          <Field label="City Type">
            <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
              {(["metro", "non-metro"] as const).map((item) => (<button key={item} onClick={() => setCityType(item)} className={cn("py-2 text-xs font-medium rounded-md transition-all capitalize", cityType === item ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>{item}</button>))}
            </div>
          </Field>
          <Field label="Car Lease Benefit">
            <button onClick={() => setHasCarLease((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", hasCarLease ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{hasCarLease ? "Yes" : "No"}</button>
          </Field>
          {hasCarLease && <MoneyInput label="Car Lease Amount" value={carLeaseAmount} onChange={setCarLeaseAmount} />}
          <Field label="Meal Voucher Benefit">
            <button onClick={() => setHasMealVoucher((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", hasMealVoucher ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{hasMealVoucher ? "Yes" : "No"}</button>
          </Field>
          {hasMealVoucher && <MoneyInput label="Meal Voucher Amount / Month" value={mealVoucherAmount} onChange={setMealVoucherAmount} />}
          <Field label="LTA Benefit">
            <button onClick={() => setHasLTA((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", hasLTA ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{hasLTA ? "Yes" : "No"}</button>
          </Field>
          {hasLTA && <MoneyInput label="LTA Amount" value={ltaAmount} onChange={setLtaAmount} />}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Current Tax" value={`₹ ${result.currentTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Optimized Tax" value={`₹ ${result.optimizedTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Annual Tax Saving" value={`₹ ${result.annualSaving.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Monthly Saving" value={`₹ ${result.monthlySaving.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
          </div>
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Restructured Salary Components</div>
            <div className="overflow-x-auto -mx-5"><table className="w-full text-xs"><thead><tr className="text-tertiary"><th className="text-left font-medium px-5 py-2 bg-primary/10">Component</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Current</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Optimized</th><th className="text-right font-medium px-5 py-2 bg-primary/10">Saving</th></tr></thead><tbody>{result.rows.map((row, index) => (<tr key={row.label} className={index % 2 ? "bg-white/[0.02]" : ""}><td className="px-5 py-2 text-secondary">{row.label}</td><td className="px-3 py-2 text-right">₹ {row.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-3 py-2 text-right">₹ {row.optimizedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-5 py-2 text-right">₹ {row.annualSaving.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>))}</tbody></table></div>
          </div>
        </div>
      )}
    />
  );
}

function InterestIncomeCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [savingsAccountInterest, setSavingsAccountInterest] = useState("");
  const [fdInterest, setFdInterest] = useState("");
  const [rdInterest, setRdInterest] = useState("");
  const [nscInterest, setNscInterest] = useState("");
  const [ppfInterest, setPpfInterest] = useState("");
  const [epfInterest, setEpfInterest] = useState("");
  const [bondInterest, setBondInterest] = useState("");
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
  const [result, setResult] = useState({ totalExempt: 0, totalTaxable: 0, estimatedTaxAt30: 0, tdsDeducted: 0, netInterestIncome: 0, deductionAmount: 0, rows: [] as Array<{ label: string; amount: number; exempt: number; taxable: number }> });

  useEffect(() => {
    const sav = toNum(savingsAccountInterest);
    const fd = toNum(fdInterest);
    const rd = toNum(rdInterest);
    const nsc = toNum(nscInterest);
    const ppf = toNum(ppfInterest);
    const epf = toNum(epfInterest);
    const bond = toNum(bondInterest);
    const deductionAmount = Math.min(sav, isSeniorCitizen ? 50000 : 10000);
    const totalExempt = deductionAmount + ppf;
    const totalTaxable = Math.max(0, sav - deductionAmount) + fd + rd + nsc + epf + bond;
    const estimatedTaxAt30 = totalTaxable * 0.3;
    const threshold = isSeniorCitizen ? 50000 : 40000;
    const tdsDeducted = fd > threshold ? fd * 0.1 : 0;
    const gross = sav + fd + rd + nsc + ppf + epf + bond;
    const netInterestIncome = gross - estimatedTaxAt30;
    const rows = [
      { label: "Savings account", amount: sav, exempt: deductionAmount, taxable: Math.max(0, sav - deductionAmount) },
      { label: "FD", amount: fd, exempt: 0, taxable: fd },
      { label: "RD", amount: rd, exempt: 0, taxable: rd },
      { label: "NSC", amount: nsc, exempt: 0, taxable: nsc },
      { label: "PPF", amount: ppf, exempt: ppf, taxable: 0 },
      { label: "EPF (taxable excess)", amount: epf, exempt: 0, taxable: epf },
      { label: "Bond interest", amount: bond, exempt: 0, taxable: bond },
    ];
    setResult({ totalExempt, totalTaxable, estimatedTaxAt30, tdsDeducted, netInterestIncome, deductionAmount, rows });
  }, [savingsAccountInterest, fdInterest, rdInterest, nscInterest, ppfInterest, epfInterest, bondInterest, isSeniorCitizen]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Savings Account Interest": savingsAccountInterest, "Fd Interest": fdInterest, "Rd Interest": rdInterest, "Nsc Interest": nscInterest, "Ppf Interest": ppfInterest, "Epf Interest": epfInterest, "Bond Interest": bondInterest, "Is Senior Citizen": isSeniorCitizen },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Savings Account Interest": savingsAccountInterest, "Fd Interest": fdInterest, "Rd Interest": rdInterest, "Nsc Interest": nscInterest, "Ppf Interest": ppfInterest, "Epf Interest": epfInterest, "Bond Interest": bondInterest, "Is Senior Citizen": isSeniorCitizen }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Interest Income Tax Calculator"
      subtitle="Interest source breakdown with exemptions and TDS estimation"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Savings Account Interest" value={savingsAccountInterest} onChange={setSavingsAccountInterest} />
          <MoneyInput label="FD Interest" value={fdInterest} onChange={setFdInterest} />
          <MoneyInput label="RD Interest" value={rdInterest} onChange={setRdInterest} />
          <MoneyInput label="NSC Interest" value={nscInterest} onChange={setNscInterest} />
          <MoneyInput label="PPF Interest" value={ppfInterest} onChange={setPpfInterest} />
          <MoneyInput label="EPF Taxable Interest (Excess over cap)" value={epfInterest} onChange={setEpfInterest} />
          <MoneyInput label="Bond Interest" value={bondInterest} onChange={setBondInterest} />
          <Field label="Senior Citizen">
            <button onClick={() => setIsSeniorCitizen((v) => !v)} className={cn("w-full py-2 text-sm font-medium rounded-md transition-all border", isSeniorCitizen ? "bg-gradient-orange text-white glow-orange border-transparent" : "text-secondary border-white/10 hover:text-[var(--text-primary)]")}>{isSeniorCitizen ? "Yes" : "No"}</button>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="80TTA / 80TTB Deduction" value={`₹ ${result.deductionAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Exempt" value={`₹ ${result.totalExempt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="Total Taxable" value={`₹ ${result.totalTaxable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Estimated Tax @30%" value={`₹ ${result.estimatedTaxAt30.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="TDS Deducted" value={`₹ ${result.tdsDeducted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Net Interest Income" value={`₹ ${result.netInterestIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
          </div>
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Source Breakdown</div>
            <div className="overflow-x-auto -mx-5"><table className="w-full text-xs"><thead><tr className="text-tertiary"><th className="text-left font-medium px-5 py-2 bg-primary/10">Source</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Amount</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Exempt</th><th className="text-right font-medium px-5 py-2 bg-primary/10">Taxable</th></tr></thead><tbody>{result.rows.map((row, index) => (<tr key={row.label} className={index % 2 ? "bg-white/[0.02]" : ""}><td className="px-5 py-2 text-secondary">{row.label}</td><td className="px-3 py-2 text-right">₹ {row.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-3 py-2 text-right">₹ {row.exempt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-5 py-2 text-right">₹ {row.taxable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>))}</tbody></table></div>
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">NSC interest is taxable; accrued interest may qualify as 80C investment in the year of accrual.</div>
        </div>
      )}
    />
  );
}

function LTCGMutualFundCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  type MfRow = { fundName: string; investedAmount: string; redemptionAmount: string; investmentDate: string; redemptionDate: string; fundType: "Equity" | "Debt" | "Hybrid"; hybridOrientation: "Equity-oriented" | "Debt-oriented" };
  const makeRow = (): MfRow => ({ fundName: "", investedAmount: "100000", redemptionAmount: "120000", investmentDate: "2024-01-01", redemptionDate: "2026-01-01", fundType: "Equity", hybridOrientation: "Equity-oriented" });
  const [redemptions, setRedemptions] = useState<MfRow[]>([makeRow(), makeRow()]);
  const [result, setResult] = useState({ rows: [] as Array<{ fundName: string; holdingYears: number; gain: number; rateLabel: string; tax: number }>, totalLTCG: 0, totalSTCG: 0, totalDebtGains: 0, ltcgAfterExemption: 0, totalTax: 0 });

  useEffect(() => {
    const rowsData = redemptions.map((row) => {
      const invested = toNum(row.investedAmount);
      const redeemed = toNum(row.redemptionAmount);
      const gain = redeemed - invested;
      const holdingYears = Math.max(0, (new Date(row.redemptionDate).getTime() - new Date(row.investmentDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
      const equityLike = row.fundType === "Equity" || (row.fundType === "Hybrid" && row.hybridOrientation === "Equity-oriented");
      const debtLike = row.fundType === "Debt" || (row.fundType === "Hybrid" && row.hybridOrientation === "Debt-oriented");
      return { ...row, invested, redeemed, gain, holdingYears, equityLike, debtLike };
    });

    const totalLTCG = rowsData.filter((r) => r.equityLike && r.holdingYears > 1 && r.gain > 0).reduce((sum, row) => sum + row.gain, 0);
    const totalSTCG = rowsData.filter((r) => r.equityLike && r.holdingYears <= 1 && r.gain > 0).reduce((sum, row) => sum + row.gain, 0);
    const totalDebtGains = rowsData.filter((r) => r.debtLike && r.gain > 0).reduce((sum, row) => sum + row.gain, 0);
    const ltcgAfterExemption = Math.max(0, totalLTCG - 125000);
    const equityLtcgTax = totalLTCG > 0 ? ltcgAfterExemption * 0.125 : 0;
    const debtTax = totalDebtGains > 0 ? calculateSlabTax(totalDebtGains, NEW_REGIME_SLABS).baseTax * 1.04 : 0;

    const eligibleRows = rowsData.filter((r) => r.equityLike && r.holdingYears > 1 && r.gain > 0);
    const eligibleTotal = eligibleRows.reduce((sum, row) => sum + row.gain, 0) || 1;
    const rows = rowsData.map((row) => {
      let tax = 0;
      let rateLabel = "";
      if (row.equityLike) {
        if (row.holdingYears > 1 && row.gain > 0) {
          const share = row.gain / eligibleTotal;
          const taxableGain = Math.max(0, row.gain - 125000 * share);
          tax = taxableGain * 0.125;
          rateLabel = "LTCG 12.5%";
        } else {
          tax = Math.max(0, row.gain) * 0.2;
          rateLabel = "STCG 20%";
        }
      } else if (row.debtLike) {
        tax = row.gain > 0 ? (calculateSlabTax(row.gain, NEW_REGIME_SLABS).baseTax * 1.04) : 0;
        rateLabel = "Slab rate";
      }
      return { fundName: row.fundName, holdingYears: row.holdingYears, gain: row.gain, rateLabel, tax };
    });

    setResult({ rows, totalLTCG, totalSTCG, totalDebtGains, ltcgAfterExemption, totalTax: equityLtcgTax + totalSTCG * 0.2 + debtTax });
  }, [redemptions]);

  const updateRow = (index: number, key: keyof MfRow, value: string) => setRedemptions((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const addRow = () => setRedemptions((prev) => (prev.length >= 5 ? prev : [...prev, makeRow()]));

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Redemptions": redemptions },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Redemptions": redemptions }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Mutual Fund Capital Gains Calculator"
      subtitle="Aggregate LTCG / STCG / debt taxation under post-budget 2024 rules"
      inputPanel={(
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Redemptions (Max 5)</h2><button onClick={addRow} className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:text-[var(--text-primary)]">Add Redemption</button></div>
          {redemptions.map((row, index) => (
            <div key={`mf-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_110px_110px_120px_120px_110px] gap-2">
              <input value={row.fundName} onChange={(e) => updateRow(index, "fundName", e.target.value)} className="glass-input h-10 px-3 text-sm" placeholder="Fund Name" />
              <input value={row.investedAmount} inputMode="decimal" onChange={(e) => updateRow(index, "investedAmount", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Invested" />
              <input value={row.redemptionAmount} inputMode="decimal" onChange={(e) => updateRow(index, "redemptionAmount", e.target.value.replace(/[^0-9.]/g, ""))} className="glass-input h-10 px-3 text-sm text-right" placeholder="Redeemed" />
              <input type="date" value={row.investmentDate} onChange={(e) => updateRow(index, "investmentDate", e.target.value)} className="glass-input h-10 px-3 text-sm" />
              <input type="date" value={row.redemptionDate} onChange={(e) => updateRow(index, "redemptionDate", e.target.value)} className="glass-input h-10 px-3 text-sm" />
              <div className="space-y-2">
                <select value={row.fundType} onChange={(e) => updateRow(index, "fundType", e.target.value)} className="glass-input h-10 px-2 text-sm w-full">
                  {(["Equity", "Debt", "Hybrid"] as const).map((item) => (<option key={item} value={item}>{item}</option>))}
                </select>
                {row.fundType === "Hybrid" && <select value={row.hybridOrientation} onChange={(e) => updateRow(index, "hybridOrientation", e.target.value)} className="glass-input h-10 px-2 text-sm w-full"><option value="Equity-oriented">Equity-oriented</option><option value="Debt-oriented">Debt-oriented</option></select>}
              </div>
            </div>
          ))}
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="card-surface p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Per Redemption</div>
            <div className="overflow-x-auto -mx-5"><table className="w-full text-xs"><thead><tr className="text-tertiary"><th className="text-left font-medium px-5 py-2 bg-primary/10">Fund</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Holding Years</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Gain/Loss</th><th className="text-right font-medium px-3 py-2 bg-primary/10">Rate</th><th className="text-right font-medium px-5 py-2 bg-primary/10">Tax</th></tr></thead><tbody>{result.rows.map((row, index) => (<tr key={`${row.fundName}-${index}`} className={index % 2 ? "bg-white/[0.02]" : ""}><td className="px-5 py-2 text-secondary">{row.fundName || `Fund ${index + 1}`}</td><td className="px-3 py-2 text-right">{row.holdingYears.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className={cn("px-3 py-2 text-right", row.gain >= 0 ? "text-success" : "text-red-300")}>₹ {row.gain.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-3 py-2 text-right">{row.rateLabel}</td><td className="px-5 py-2 text-right">₹ {row.tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>))}</tbody></table></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Total LTCG (Equity)" value={`₹ ${result.totalLTCG.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total STCG" value={`₹ ${result.totalSTCG.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Debt Gains" value={`₹ ${result.totalDebtGains.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="LTCG after ₹1.25L Exemption" value={`₹ ${result.ltcgAfterExemption.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Total Tax" value={`₹ ${result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
          </div>
        </div>
      )}
    />
  );
}

function ProfessionalTaxCalc({ dataRef }: { dataRef?: CalcDataRef }) {
  const [monthlyGrossSalary, setMonthlyGrossSalary] = useState("");
  const [state, setState] = useState<"Maharashtra" | "Karnataka" | "West Bengal" | "Tamil Nadu" | "Andhra Pradesh" | "Telangana" | "Gujarat" | "Delhi">("Maharashtra");
  const [result, setResult] = useState({ monthlyPT: 0, annualPT: 0, specialMonthAmount: 0, section16Deduction: 0, taxSavingAt30: 0, note: "" });

  useEffect(() => {
    const salary = toNum(monthlyGrossSalary);
    let monthlyPT = 0;
    let specialMonthAmount = 0;
    let note = "";

    if (state === "Delhi") {
      monthlyPT = 0;
      note = "Delhi has no professional tax.";
    } else if (state === "Maharashtra") {
      if (salary < 7500) monthlyPT = 0;
      else if (salary <= 10000) monthlyPT = 175;
      else monthlyPT = 200;
      specialMonthAmount = monthlyPT > 0 ? 300 : 0;
      note = "February PT in Maharashtra is ₹300.";
    } else if (state === "Karnataka") {
      monthlyPT = salary < 15000 ? 0 : 200;
      note = "Karnataka monthly slab applied.";
    } else if (state === "West Bengal") {
      if (salary < 10000) monthlyPT = 0;
      else if (salary < 15000) monthlyPT = 110;
      else if (salary < 25000) monthlyPT = 130;
      else if (salary < 40000) monthlyPT = 150;
      else monthlyPT = 200;
      note = "West Bengal professional tax slab applied.";
    } else if (state === "Tamil Nadu") {
      monthlyPT = salary < 21000 ? 0 : salary <= 30000 ? 135 : 315;
      note = "Tamil Nadu monthly PT slab applied.";
    } else if (state === "Andhra Pradesh" || state === "Telangana") {
      monthlyPT = salary < 15000 ? 0 : salary <= 20000 ? 150 : 200;
      note = `${state} monthly PT slab applied.`;
    } else if (state === "Gujarat") {
      monthlyPT = salary < 12000 ? 0 : salary <= 15000 ? 80 : 150;
      note = "Gujarat monthly PT slab applied.";
    }

    const annualPT = state === "Maharashtra" ? monthlyPT * 11 + specialMonthAmount : monthlyPT * 12;
    const section16Deduction = annualPT;
    const taxSavingAt30 = annualPT * 0.3;
    setResult({ monthlyPT, annualPT, specialMonthAmount, section16Deduction, taxSavingAt30, note });
  }, [monthlyGrossSalary, state]);

  useEffect(() => {
    if (dataRef) {
      dataRef.current = {
        inputs: { "Monthly Gross Salary": monthlyGrossSalary, "State": state },
        outputs: { ...result },
      };
    }
  });
  useEffect(() => { if (dataRef) dataRef.current = { inputs: { "Monthly Gross Salary": monthlyGrossSalary, "State": state }, outputs: { ...(typeof result === "object" && result ? result : {}) } }; });

  return (
    <CalculatorShell
      title="Professional Tax Calculator (State-wise)"
      subtitle="Monthly and annual professional tax with deduction benefit"
      inputPanel={(
        <div className="card-surface p-6 space-y-5">
          <MoneyInput label="Monthly Gross Salary" value={monthlyGrossSalary} onChange={setMonthlyGrossSalary} />
          <Field label="State">
            <select value={state} onChange={(e) => setState(e.target.value as typeof state)} className="glass-input w-full h-11 px-3 text-sm">
              {(["Maharashtra", "Karnataka", "West Bengal", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Gujarat", "Delhi"] as const).map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </Field>
        </div>
      )}
      outputPanel={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label="Monthly PT" value={`₹ ${result.monthlyPT.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Annual PT" value={`₹ ${result.annualPT.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} green />
            <MiniStat label="February PT / Special Month" value={`₹ ${result.specialMonthAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
            <MiniStat label="Tax Saving @30%" value={`₹ ${result.taxSavingAt30.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
          </div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">Section 16(iii) deduction: <span className="text-[var(--text-primary)]">₹ {result.section16Deduction.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
          <div className="card-surface p-4 border border-white/10 text-sm text-secondary">{result.note}</div>
        </div>
      )}
    />
  );
}

function CalculatorShell({
  title,
  subtitle,
  inputPanel,
  outputPanel,
}: {
  title: string;
  subtitle: string;
  inputPanel: JSX.Element;
  outputPanel: JSX.Element;
}) {
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-secondary text-sm">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div>{inputPanel}</div>
        <div>{outputPanel}</div>
      </div>
    </>
  );
}

function ComingSoonCard({ slug }: { slug: string }) {
  return (
    <div className="card-surface p-10 text-center max-w-3xl mx-auto">
      <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 grid place-items-center mb-4">
        <Calculator className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold capitalize">{slug.replace(/-/g, " ")}</h1>
      <p className="mt-2 text-secondary">Coming soon</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">₹</span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="0"
          className="glass-input w-full h-11 pl-8 pr-3 text-sm"
        />
      </div>
    </Field>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="0"
        className="glass-input w-full h-11 px-3 text-sm"
      />
    </Field>
  );
}

function MiniStat({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="card-surface p-3">
      <div className="text-[10px] uppercase tracking-wide text-tertiary">{label}</div>
      <div className={cn("mt-1 text-base font-bold", green && "text-success")}>{value}</div>
    </div>
  );
}
