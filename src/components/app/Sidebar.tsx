import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, FolderOpen, CalendarCheck, Clock,
  Receipt, Landmark, TrendingDown, BarChart3, Briefcase,
  ShieldCheck, DollarSign, Building2, LineChart, FileText,
  Sparkles, Download, Settings, GitBranch, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Logo } from "./Logo";
import { CountrySelector } from "./CountrySelector";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { ComponentType, SVGProps } from "react";

const workspace = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/compliance", label: "Compliance", icon: CalendarCheck },
  { to: "/reports", label: "Reports", icon: Download },
  { to: "/history", label: "History", icon: Clock },
];

const calculators = [
  { to: "/calculators/tax", label: "Tax Tools", icon: Receipt, badge: 30 },
  { to: "/calculators/loans", label: "Loans & EMI", icon: Landmark, badge: 9 },
  { to: "/calculators/depreciation", label: "Depreciation", icon: TrendingDown, badge: 5 },
  { to: "/calculators/ratios", label: "Financial Ratios", icon: BarChart3, badge: 12 },
  { to: "/calculators/payroll", label: "Payroll & HR", icon: Briefcase, badge: 11 },
  { to: "/calculators/audit", label: "Audit Tools", icon: ShieldCheck, badge: 3 },
  { to: "/calculators/valuation", label: "Valuation", icon: DollarSign, badge: 8 },
  { to: "/calculators/realestate", label: "Real Estate", icon: Building2, badge: 4 },
  { to: "/calculators/investment", label: "Investment", icon: LineChart, badge: 10 },
  { to: "/calculators/gst", label: "GST / VAT", icon: FileText, badge: 11 },
];

const tools = [
  { to: "/ai", label: "CalcAI Assistant", icon: Sparkles, glow: true },
];

const SectionHeader = ({ children, collapsed }: { children: string; collapsed?: boolean }) => (
  <div
    className={cn(
      "px-5 pt-5 pb-2 text-[10px] font-semibold uppercase",
      collapsed && "hidden"
    )}
    style={{ letterSpacing: "0.08em", color: "rgba(255,255,255,0.40)" }}
  >
    {children}
  </div>
);

const NavItem = ({ to, label, icon: Icon, badge, glow, collapsed }: { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; badge?: number; glow?: boolean; collapsed?: boolean; }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "group relative flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all",
        isActive
          ? "bg-primary/10 font-medium"
          : "hover:bg-white/[0.04]"
      )
    }
    style={({ isActive }) => ({
      color: isActive ? "hsl(25 95% 53%)" : "rgba(255,255,255,0.65)",
    })}
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-primary rounded-r" />
        )}
        <div className="relative">
          <Icon className="h-[18px] w-[18px]" />
          {glow && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
          )}
        </div>
        <span className={cn("flex-1 truncate", collapsed && "hidden")}>{label}</span>
        {!collapsed && badge != null && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/5 group-hover:bg-primary/15 group-hover:text-primary transition-colors"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase() || "?";

  return (
    <aside className={cn(
      "hidden md:flex flex-col shrink-0 h-screen sticky top-6 transition-all",
      "glass-sidebar",
      collapsed ? "glass-sidebar-mini" : "glass-sidebar-expanded"
    )}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((s) => !s)}
          className="h-8 w-8 rounded-md grid place-items-center glass-button"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="px-3 pb-3">
        <CountrySelector />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin pb-3">
        <SectionHeader collapsed={collapsed}>Workspace</SectionHeader>
        {workspace.map((i) => (<NavItem key={i.to} {...i} collapsed={collapsed} />))}

        <SectionHeader collapsed={collapsed}>Calculators</SectionHeader>
        {calculators.map((i) => (<NavItem key={i.to} {...i} collapsed={collapsed} />))}

        <SectionHeader collapsed={collapsed}>Tools</SectionHeader>
        {tools.map((i) => (<NavItem key={i.to} {...i} collapsed={collapsed} />))}
      </nav>

      <div className="border-t border-white/[0.06] p-3 space-y-2">
        <NavItem to="/settings" label="Settings" icon={Settings} collapsed={collapsed} />

        <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors", collapsed && "justify-center") }>
          <div className={cn("h-8 w-8 rounded-full grid place-items-center text-xs font-bold text-white", collapsed ? "" : "bg-gradient-orange") } style={{ background: collapsed ? "linear-gradient(135deg, #f97316, #f59e0b)" : undefined }}>
            {userInitial}
          </div>
          {!collapsed && (
            user ? (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.90)" }}>{userName || "User"}</div>
                  <div className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.40)" }}>{userEmail}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-primary/15 text-primary">Free</span>
              </>
            ) : (
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3.5 w-20 rounded bg-white/10 animate-pulse" />
                <div className="h-2.5 w-28 rounded bg-white/5 animate-pulse" />
              </div>
            )
          )}
        </div>

        {!collapsed && (
          <div className="rounded-xl p-3 bg-gradient-orange/10 border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-orange opacity-10" />
            <div className="relative">
              <div className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.90)" }}>
                Unlock all 100+ tools
              </div>
              <div className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                PDF export, CalcAI, premium calculators
              </div>
              <button className="w-full text-xs font-semibold py-1.5 rounded-md bg-gradient-orange text-white glow-orange hover:glow-orange-strong transition-shadow">
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
