import { NavLink } from "react-router-dom";
import React, { useState } from "react";
import {
  LayoutDashboard, Users, FolderOpen, CalendarCheck,
  Calculator, Sparkles, Download, Settings, GitBranch,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ComponentType, SVGProps } from "react";

const workspace = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/compliance", label: "Compliance", icon: CalendarCheck },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/reports", label: "Reports", icon: Download },
];

const tools = [
  { to: "/calculators", label: "Calculators", icon: Calculator },
  { to: "/ai", label: "AI Assistant", icon: Sparkles, glow: true },
];

const SectionHeader = ({ children, collapsed }: { children: string; collapsed?: boolean }) => (
  collapsed ? null : (
    <div
      className="px-5 pt-5 pb-2 text-[10px] font-semibold uppercase"
      style={{ letterSpacing: "0.08em", color: "var(--text-tertiary)" }}
    >
      {children}
    </div>
  )
);

const NavItem = ({
  to, label, icon: Icon, glow, collapsed,
}: {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  glow?: boolean;
  collapsed?: boolean;
}) => {
  const link = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors",
          collapsed && "justify-center px-0 mx-auto w-10",
          isActive ? "bg-primary/10 font-medium" : "hover:bg-white/[0.04]"
        )
      }
      style={({ isActive }) => ({
        color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-primary rounded-r" />
          )}
          <div className="relative shrink-0">
            <Icon className="h-[18px] w-[18px]" />
            {glow && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
            )}
          </div>
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
};

export const Sidebar = React.memo(function Sidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "true"
  );
  const { user } = useAuth();
  const { data: planData } = usePlan();
  const planLabel = planData?.plan === "pro" ? "Pro" : planData?.plan === "firm" ? "Firm" : "Free";
  const planExpiry = planData?.expiresAt
    ? new Date(planData.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase() || "?";

  const toggle = () => {
    setCollapsed((s) => {
      const next = !s;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <aside className={cn(
        "hidden md:flex flex-col shrink-0 h-screen sticky top-6",
        "glass-sidebar",
        collapsed ? "glass-sidebar-mini" : "glass-sidebar-expanded"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center px-3 py-2",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Logo />
            </div>
          )}
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggle}
            className="h-8 w-8 rounded-md grid place-items-center glass-button shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin pb-3">
          <SectionHeader collapsed={collapsed}>Workspace</SectionHeader>
          {workspace.map((i) => <NavItem key={i.to} {...i} collapsed={collapsed} />)}

          <SectionHeader collapsed={collapsed}>Tools</SectionHeader>
          {tools.map((i) => <NavItem key={i.to} {...i} collapsed={collapsed} />)}
        </nav>

        {/* Bottom section */}
        <div className="border-t p-3 space-y-2" style={{ borderColor: "var(--border-color)" }}>
          <NavItem to="/settings" label="Settings" icon={Settings} collapsed={collapsed} />

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink to="/settings" className="flex justify-center px-0 mx-auto w-10 py-2">
                  <div className="h-8 w-8 rounded-full grid place-items-center text-xs font-bold text-white bg-gradient-orange">
                    {userInitial}
                  </div>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{userName || userEmail || "Profile"}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full grid place-items-center text-xs font-bold text-white bg-gradient-orange shrink-0">
                {userInitial}
              </div>
              {user ? (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{userName || "User"}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-tertiary)" }}>{userEmail}</div>
                    {planLabel !== "Free" && planExpiry && (
                      <div className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>{planLabel} until {planExpiry}</div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                    planLabel === "Pro" ? "bg-primary/15 text-primary" :
                    planLabel === "Firm" ? "bg-gradient-orange text-white" :
                    "bg-white/10 text-secondary"
                  )}>{planLabel}</span>
                </>
              ) : (
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3.5 w-20 rounded bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-28 rounded bg-white/5 animate-pulse" />
                </div>
              )}
            </div>
          )}

          {!collapsed && (
            <div className="rounded-xl p-3 bg-gradient-orange/10 border border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-orange opacity-10" />
              <div className="relative">
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Unlock all 100+ tools
                </div>
                <div className="text-[11px] mb-2" style={{ color: "var(--text-secondary)" }}>
                  PDF export, CalcAI, premium calculators
                </div>
                <NavLink to="/pricing" className="block w-full text-center text-xs font-semibold py-1.5 rounded-md bg-gradient-orange text-white glow-orange hover:glow-orange-strong transition-shadow">
                  Upgrade to Pro
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
});
