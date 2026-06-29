import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Command } from "lucide-react";
import { SearchModal } from "./SearchModal";
import { useFilings } from "@/hooks/useFilings";
import { useClients } from "@/hooks/useClients";

export const TopBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const filingsQuery = useFilings();
  const clientsQuery = useClients();
  const filings = filingsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const clientLookup = new Map(clients.map((c) => [c.id, c]));

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = filings
    .filter((f) => {
      if (f.status === "filed" || !f.dueDate) return false;
      const d = new Date(f.dueDate);
      return d >= now && d <= in7Days;
    })
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);

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

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="glass-topbar sticky top-6 z-30 flex items-center gap-4 px-6 h-14">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-3 flex-1 max-w-md h-9 px-3 rounded-xl text-sm transition-colors glass-input"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search clients, tasks, or calculators...</span>
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium glass-input">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative h-8 w-8 rounded-lg grid place-items-center transition-colors glass-button"
            >
              <Bell className="h-4 w-4" />
              {upcoming.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-[var(--drawer-bg,#1a1a2e)] shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Upcoming Deadlines</div>
                </div>
                {upcoming.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-secondary">No upcoming deadlines</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {upcoming.map((f) => (
                      <div key={f.id} className="px-4 py-3">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{f.title}</div>
                        <div className="mt-0.5 text-xs text-secondary">
                          {clientLookup.get(f.clientId)?.name ?? "—"} · Due{" "}
                          {f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-4 py-2.5 border-t border-white/[0.06]">
                  <Link
                    to="/compliance"
                    onClick={() => setBellOpen(false)}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
