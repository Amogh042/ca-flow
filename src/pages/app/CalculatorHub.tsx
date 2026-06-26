import { Link } from "react-router-dom";
import {
  Receipt, Landmark, TrendingDown, BarChart3, Briefcase,
  ShieldCheck, DollarSign, Building2, LineChart, FileText,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const categories: {
  slug: string;
  name: string;
  count: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  desc: string;
}[] = [
  { slug: "tax", name: "Tax Tools", count: 27, icon: Receipt, desc: "Income tax, TDS, capital gains, crypto tax, and regime comparisons for Indian taxation." },
  { slug: "loans", name: "Loans & EMI", count: 9, icon: Landmark, desc: "EMI, home loan, car loan, balance transfer, prepayment savings, and eligibility checks." },
  { slug: "depreciation", name: "Depreciation", count: 5, icon: TrendingDown, desc: "WDV, straight line, SYD, and IT Act depreciation with block-rate support." },
  { slug: "ratios", name: "Financial Ratios", count: 12, icon: BarChart3, desc: "20+ ratios from P&L and balance sheet — liquidity, solvency, profitability, and efficiency." },
  { slug: "payroll", name: "Payroll & HR", count: 11, icon: Briefcase, desc: "CTC breakup, gratuity, PF, ESI, leave encashment, and salary restructuring." },
  { slug: "audit", name: "Audit Tools", count: 3, icon: ShieldCheck, desc: "Planning materiality, statistical sampling, and audit readiness checklist." },
  { slug: "valuation", name: "Valuation", count: 8, icon: DollarSign, desc: "DCF, WACC, NPV, IRR, bond pricing, equity DDM, and startup valuation models." },
  { slug: "realestate", name: "Real Estate", count: 4, icon: Building2, desc: "Rental yield, stamp duty, rent vs buy analysis, and property capital gains." },
  { slug: "investment", name: "Investment", count: 10, icon: LineChart, desc: "SIP, lumpsum, PPF, NPS, compound interest, and senior citizen FD comparisons." },
  { slug: "gst", name: "GST", count: 9, icon: FileText, desc: "GST forward & reverse, ITC reconciliation, composition scheme, exports, and customs duty." },
];

export default function CalculatorHub() {
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-1">TOOLS</p>
        <h1 className="text-3xl font-bold tracking-tight">Calculators</h1>
        <p className="mt-1 text-secondary text-sm">
          {totalCount} calculators across {categories.length} categories — built for Indian CA firms.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/calculators/${cat.slug}`}
            className="card-surface p-5 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                <cat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5 text-secondary">
                {cat.count}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{cat.name}</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {cat.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
