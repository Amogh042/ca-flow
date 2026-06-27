import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CalendarCheck, GitBranch,
  MoreHorizontal, Calculator,
  Settings, LogOut, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";

const primary = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/compliance", label: "Compliance", icon: CalendarCheck },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
];

const more = [
  { to: "/calculators", label: "Calculators", icon: Calculator },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: planData } = usePlan();
  const navigate = useNavigate();

  const planLabel = planData?.plan === "pro" ? "Pro" : planData?.plan === "firm" ? "Firm" : "Free";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase() || "?";

  const handleMoreNav = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex"
        style={{
          background: "var(--topbar-bg)",
          borderTop: "1px solid var(--border-color)",
          height: "64px",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {primary.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-tertiary"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
            open ? "text-primary" : "text-tertiary"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: "var(--overlay-bg)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up sheet */}
      <div
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          background: "var(--drawer-bg)",
          borderTop: "1px solid var(--border-color)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Handle + close */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-10 h-1 rounded-full bg-white/20" />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>More</span>
          <button
            onClick={() => setOpen(false)}
            className="h-7 w-7 rounded-md grid place-items-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <div className="px-3 pb-2">
          {more.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              onClick={() => handleMoreNav(to)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-white/[0.04]"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-4 my-1" style={{ borderTop: "1px solid var(--border-color)" }} />

        {/* User section */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full grid place-items-center text-sm font-bold text-white bg-gradient-orange shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{userName || "User"}</div>
              <div className="text-[11px] truncate" style={{ color: "var(--text-tertiary)" }}>{userEmail}</div>
            </div>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
              planLabel === "Pro" ? "bg-primary/15 text-primary" :
              planLabel === "Firm" ? "bg-gradient-orange text-white" :
              "bg-white/10 text-secondary"
            )}>{planLabel}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-white/[0.04]"
            style={{ color: "var(--color-error)" }}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};
