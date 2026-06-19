import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, CalendarCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/compliance", label: "Workflows", icon: CalendarCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/ai", label: "AI", icon: Sparkles },
];

export const MobileNav = () => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 glass-topbar flex">
    {items.map(({ to, label, icon: Icon }) => (
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
  </nav>
);
