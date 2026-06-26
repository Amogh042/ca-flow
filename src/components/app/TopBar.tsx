import { useEffect, useState } from "react";
import { Search, Bell, Command } from "lucide-react";
import { SearchModal } from "./SearchModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const TopBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="glass-topbar sticky top-6 z-30 flex items-center gap-4 px-6 h-14">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-3 flex-1 max-w-md h-9 px-3 rounded-xl text-sm transition-colors glass-input"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search clients, workflows, or calculators...</span>
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium glass-input">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button className="relative h-8 w-8 rounded-lg grid place-items-center transition-colors glass-button">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </button>

          <ProfileMenu />
        </div>
      </header>
    </>
  );
};

function ProfileMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      toast({ title: "Signed out", description: "You have been signed out." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Sign out failed", description: err?.message || String(err) });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 rounded-full grid place-items-center text-xs font-bold text-white cursor-pointer bg-gradient-orange">
          {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6}>
        <div className="px-3 py-2">
          <div className="text-sm font-semibold">{user?.email ?? "Signed in"}</div>
          <div className="text-xs text-muted-foreground">Account</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
