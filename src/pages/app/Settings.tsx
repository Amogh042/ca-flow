import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Bell, Palette, Globe, Shield, ChevronRight,
  Check, Moon, Sun, Monitor, Mail, Smartphone, Save, Loader2, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, updateProfile, updateUserMetadata } from "@/services/profiles";
import { toast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { useFilings } from "@/hooks/useFilings";
import { useDocuments } from "@/hooks/useDocuments";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useReports } from "@/hooks/useReports";
import { useCalculations } from "@/hooks/useCalculations";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import { usePlan, useRedeemCoupon, useRedemptionHistory } from "@/hooks/usePlan";
import { supabase } from "@/services/supabaseClient";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type Tab = "profile" | "preferences" | "appearance" | "notifications" | "account";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Globe },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account & Plan", icon: Shield },
];

function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`caflow_${key}`);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function savePref<T>(key: string, value: T) {
  localStorage.setItem(`caflow_${key}`, JSON.stringify(value));
}

const fontSizeMap: Record<string, string> = {
  small: "13px",
  medium: "15px",
  large: "17px",
};

function applyTheme(theme: string) {
  const root = document.documentElement;
  root.style.filter = "";

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("light", !prefersDark);
    root.style.colorScheme = prefersDark ? "dark" : "light";
  } else if (theme === "light") {
    root.classList.add("light");
    root.style.colorScheme = "light";
  } else {
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  }

  savePref("theme", theme);
}

function applyFontSize(size: string) {
  document.documentElement.style.fontSize = fontSizeMap[size] ?? "15px";
  savePref("fontSize", size);
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-secondary">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-secondary">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-tertiary">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-white/10"
      )}
    >
      <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="flex items-center gap-1.5 text-xs text-success"><Check className="h-3.5 w-3.5" /> Saved</span>;
}

function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-orange text-white glow-orange transition-all">
      <Save className="h-4 w-4" /> Save changes
    </button>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [role, setRole] = useState("Chartered Accountant");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const email = user?.email ?? "";

  useEffect(() => {
    if (!user) return;
    const fallbackName = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
    setName(fallbackName);

    getProfile(user.id).then((p) => {
      if (p) {
        setName(p.fullName || fallbackName);
        setFirm(p.firmName);
        setRole(p.role || "Chartered Accountant");
        setPhone(p.phone);
      }
      setProfileLoaded(true);
    }).catch(() => {
      setProfileLoaded(true);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await Promise.all([
        updateProfile(user.id, { fullName: name, firmName: firm, role, phone }),
        updateUserMetadata(name),
      ]);
      setSaved(true);
      toast({ title: "Profile saved" });
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message || "Could not save profile" });
    } finally {
      setSaving(false);
    }
  };

  if (!profileLoaded) {
    return (
      <div className="space-y-5">
        <SectionCard title="Personal Information" desc="Your name and contact details">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information" desc="Your name and contact details">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-orange grid place-items-center text-2xl font-bold text-white shrink-0">
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{name || "Your Name"}</p>
            <p className="text-xs text-secondary mt-0.5">{email}</p>
            <p className="text-xs text-tertiary mt-1">Free plan</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name"><input value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-full h-10 px-3 text-sm" placeholder="Your full name" /></Field>
          <Field label="Email" hint="Managed by your login — change via account settings"><input value={email} readOnly className="glass-input w-full h-10 px-3 text-sm opacity-60 cursor-not-allowed" /></Field>
          <Field label="Firm / Organisation"><input value={firm} onChange={(e) => setFirm(e.target.value)} className="glass-input w-full h-10 px-3 text-sm" placeholder="ABC & Associates" /></Field>
          <Field label="Role / Designation"><input value={role} onChange={(e) => setRole(e.target.value)} className="glass-input w-full h-10 px-3 text-sm" placeholder="Chartered Accountant" /></Field>
          <Field label="Phone (optional)"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="glass-input w-full h-10 px-3 text-sm" placeholder="+91 98765 43210" /></Field>
        </div>
        <div className="flex items-center justify-end gap-3">
          <SavedBadge show={saved} />
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-orange text-white glow-orange transition-all disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Preferences ─────────────────────────────────────────────────────────────
function PreferencesTab() {
  const [defaultFY, setDefaultFY] = useState(() => loadPref("pref_fy", "FY 2025-26"));
  const [taxRegime, setTaxRegime] = useState(() => loadPref("pref_regime", "new"));
  const [numberFormat, setNumberFormat] = useState(() => loadPref("pref_numformat", "indian"));
  const [saved, setSaved] = useState(false);

  const save = () => {
    savePref("pref_fy", defaultFY);
    savePref("pref_regime", taxRegime); savePref("pref_numformat", numberFormat);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Tax Defaults" desc="Pre-fill calculators with your preferred settings">
        <Field label="Default Financial Year">
          <select value={defaultFY} onChange={(e) => setDefaultFY(e.target.value)} className="glass-select w-full h-10 px-3 text-sm rounded-[10px]">
            {["FY 2026-27", "FY 2025-26", "FY 2024-25", "FY 2023-24"].map((fy) => <option key={fy}>{fy}</option>)}
          </select>
        </Field>
        <Field label="Default Tax Regime">
          <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
            {[{ id: "new", label: "New Regime" }, { id: "old", label: "Old Regime" }].map((r) => (
              <button key={r.id} onClick={() => setTaxRegime(r.id)}
                className={cn("py-2 text-sm font-medium rounded-md transition-all", taxRegime === r.id ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>
                {r.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Number Format">
          <div className="grid grid-cols-2 p-1 rounded-lg bg-card-elevated border border-white/10">
            {[{ id: "indian", label: "Indian (1,00,000)" }, { id: "international", label: "International (100,000)" }].map((f) => (
              <button key={f.id} onClick={() => setNumberFormat(f.id)}
                className={cn("py-2 text-xs font-medium rounded-md transition-all", numberFormat === f.id ? "bg-gradient-orange text-white glow-orange" : "text-secondary hover:text-[var(--text-primary)]")}>
                {f.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex items-center justify-end gap-3"><SavedBadge show={saved} /><SaveButton onSave={save} /></div>
      </SectionCard>
    </div>
  );
}

// ─── Appearance ───────────────────────────────────────────────────────────────
function AppearanceTab() {
  const [theme, setTheme] = useState(() => loadPref("theme", "dark"));
  const [fontSize, setFontSize] = useState(() => loadPref("fontSize", "medium"));
  const [compactMode, setCompactMode] = useState(() => loadPref("compactMode", false));
  const [saved, setSaved] = useState(false);

  // Restore on mount
  useEffect(() => {
    applyTheme(loadPref("theme", "dark"));
    applyFontSize(loadPref("fontSize", "medium"));
  }, []);

  const handleTheme = (t: string) => { setTheme(t); applyTheme(t); };
  const handleFontSize = (s: string) => { setFontSize(s); applyFontSize(s); };
  const handleCompact = (v: boolean) => {
    setCompactMode(v);
    document.documentElement.classList.toggle("compact", v);
    savePref("compactMode", v);
  };
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const themes = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Theme" desc="Choose how CA-flow looks — changes apply instantly">
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => handleTheme(id)}
              className={cn("flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                theme === id ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/20")}>
              <Icon className={cn("h-6 w-6", theme === id ? "text-primary" : "text-secondary")} />
              <span className={cn("text-xs font-medium", theme === id ? "text-[var(--text-primary)]" : "text-secondary")}>{label}</span>
              {theme === id && <Check className="h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
        {theme === "system" && (
          <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
            Theme follows your operating system preference.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Font Size" desc="Changes the text size across the entire app instantly">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "small", label: "Small", sampleClass: "text-xs" },
            { id: "medium", label: "Medium", sampleClass: "text-sm" },
            { id: "large", label: "Large", sampleClass: "text-lg" },
          ].map(({ id, label, sampleClass }) => (
            <button key={id} onClick={() => handleFontSize(id)}
              className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                fontSize === id ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/20")}>
              <span className={cn("font-bold text-[var(--text-primary)]", sampleClass)}>Aa</span>
              <span className={cn("text-xs", fontSize === id ? "text-primary font-medium" : "text-secondary")}>{label}</span>
              {fontSize === id && <Check className="h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
        <p className="text-xs text-tertiary">
          Applied: <span className="text-[var(--text-primary)] font-medium">{fontSizeMap[fontSize]}</span> — scroll any page to see the effect
        </p>
      </SectionCard>

      <SectionCard title="Layout Density">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-primary)]">Compact Mode</p>
            <p className="text-xs text-secondary mt-0.5">Reduce padding and spacing throughout the app</p>
          </div>
          <Toggle checked={compactMode} onChange={handleCompact} />
        </div>
        <div className="flex items-center justify-end gap-3"><SavedBadge show={saved} /><SaveButton onSave={save} /></div>
      </SectionCard>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState(() => loadPref("notif_prefs", {
    complianceDue: true, complianceOverdue: true, weeklyDigest: false,
    calcSaved: false, productUpdates: true, emailNotifs: true, browserNotifs: false,
  }));
  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const [saved, setSaved] = useState(false);
  const save = () => { savePref("notif_prefs", prefs); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const rows: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "complianceDue", label: "Compliance Due Reminders", desc: "Get notified 3 days before a filing deadline" },
    { key: "complianceOverdue", label: "Overdue Filing Alerts", desc: "Immediate alert when a deadline is missed" },
    { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary of calculations and upcoming deadlines" },
    { key: "calcSaved", label: "Calculation Saved", desc: "Confirm when a calculation is saved to history" },
    { key: "productUpdates", label: "Product Updates", desc: "New calculators and feature announcements" },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Notification Preferences">
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div><p className="text-sm text-[var(--text-primary)]">{row.label}</p><p className="text-xs text-secondary mt-0.5">{row.desc}</p></div>
              <Toggle checked={prefs[row.key]} onChange={() => toggle(row.key)} />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Delivery Channels">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-secondary" />
              <div><p className="text-sm text-[var(--text-primary)]">Email Notifications</p><p className="text-xs text-secondary">Sent to hello@ca-flow.in</p></div>
            </div>
            <Toggle checked={prefs.emailNotifs} onChange={() => toggle("emailNotifs")} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-secondary" />
              <div><p className="text-sm text-[var(--text-primary)]">Browser Notifications</p><p className="text-xs text-secondary">Push notifications in your browser</p></div>
            </div>
            <Toggle checked={prefs.browserNotifs} onChange={() => toggle("browserNotifs")} />
          </div>
        </div>
      </SectionCard>
      <div className="px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
        Email and browser notifications are coming soon. Your preferences will be saved for when they launch.
      </div>
      <div className="flex items-center justify-end gap-3"><SavedBadge show={saved} /><SaveButton onSave={save} /></div>
    </div>
  );
}

// ─── Account ──────────────────────────────────────────────────────────────────
function AccountTab() {
  const { user, signOut } = useAuth();
  const clientsQuery = useClients();
  const filingsQuery = useFilings();
  const documentsQuery = useDocuments();
  const workflowsQuery = useWorkflows();
  const reportsQuery = useReports();
  const calculationsQuery = useCalculations();
  const docRequestsQuery = useDocumentRequests();
  const { data: planData } = usePlan();
  const redeemMutation = useRedeemCoupon();
  const { data: redemptions } = useRedemptionHistory();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const activePlan = planData?.plan ?? "free";
  const planExpiry = planData?.expiresAt
    ? new Date(planData.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const handleCouponRedeem = async () => {
    if (!couponCode.trim()) { setCouponError("Enter a code"); return; }
    setCouponError("");
    setCouponSuccess("");
    const res = await redeemMutation.mutateAsync(couponCode);
    if (!res.valid) { setCouponError(res.error); }
    else { setCouponSuccess(res.message); setCouponCode(""); }
  };

  const starterFeatures = ["Up to 5 clients", "Core compliance tracker", "15 calculators", "Document upload (500MB)", "Email support"];
  const proFeatures = ["Up to 25 clients", "Full compliance tracker", "All 100+ calculators", "CalcAI assistant", "Document upload (5GB)", "Priority support", "Calculation history", "Client reports"];
  const firmFeatures = ["Everything in Professional", "Unlimited clients", "Team management & roles", "Workflow assignment", "Advanced reports", "Dedicated support"];

  async function handleExport() {
    setExporting(true);
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        clients: clientsQuery.data ?? [],
        filings: filingsQuery.data ?? [],
        documents: documentsQuery.data ?? [],
        workflows: workflowsQuery.data ?? [],
        reports: reportsQuery.data ?? [],
        calculations: calculationsQuery.data ?? [],
        documentRequests: docRequestsQuery.data ?? [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ca-flow-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Your data has been downloaded as JSON." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message || "Could not export data" });
    } finally {
      setExporting(false);
    }
  }

  async function handleClearHistory() {
    setClearing(true);
    try {
      if (!supabase) throw new Error("Not connected");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("calculations").delete().eq("owner", userData.user.id);
      if (error) throw error;
      toast({ title: "History cleared", description: "All saved calculations have been removed." });
      setConfirmClear(false);
    } catch (err: any) {
      toast({ title: "Clear failed", description: err?.message || "Could not clear history" });
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      await signOut();
    } catch {}
    window.location.href = "mailto:hello@ca-flow.in?subject=Delete%20my%20CA-flow%20account&body=Please%20delete%20my%20account%20(" + encodeURIComponent(user?.email || "") + ").%20I%20understand%20this%20is%20permanent.";
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Your Plan" desc="Manage your CA-flow subscription">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Starter */}
          <div className={cn("p-5 rounded-xl border-2", activePlan === "free" ? "border-primary/50 bg-primary/5" : "border-white/10")}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Starter</span>
              {activePlan === "free" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">CURRENT</span>}
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">₹0 <span className="text-sm font-normal text-secondary">/ month</span></div>
            <p className="text-xs text-tertiary mb-3">For solo CAs starting out</p>
            <ul className="space-y-1.5">
              {starterFeatures.map((f) => <li key={f} className="flex items-center gap-2 text-xs text-secondary"><Check className="h-3 w-3 text-primary shrink-0" />{f}</li>)}
            </ul>
          </div>

          {/* Professional */}
          <div className={cn("relative p-5 rounded-xl border-2 overflow-hidden", activePlan === "pro" ? "border-primary/50 bg-primary/5" : "border-white/10 bg-gradient-to-br from-primary/5 to-warning/5")}>
            <div className="absolute inset-0 bg-gradient-orange opacity-[0.03]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Professional</span>
                {activePlan === "pro" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">ACTIVE</span>
                ) : activePlan === "free" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20">RECOMMENDED</span>
                ) : null}
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">₹699 <span className="text-sm font-normal text-secondary">/ month</span></div>
              <p className="text-xs text-tertiary mb-3">For growing CA practices</p>
              <ul className="space-y-1.5 mb-4">
                {proFeatures.map((f) => <li key={f} className="flex items-center gap-2 text-xs text-secondary"><Check className="h-3 w-3 text-primary shrink-0" />{f}</li>)}
              </ul>
              {activePlan !== "pro" && activePlan !== "firm" && (
                <Link to="/pricing" className="block w-full py-2 rounded-lg text-sm font-semibold bg-gradient-orange text-white glow-orange text-center">Upgrade to Pro</Link>
              )}
              {activePlan === "pro" && planExpiry && <p className="text-xs text-secondary">Active until {planExpiry}</p>}
            </div>
          </div>

          {/* Firm */}
          <div className={cn("p-5 rounded-xl border-2", activePlan === "firm" ? "border-primary/50 bg-primary/5" : "border-white/10")}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Firm</span>
              {activePlan === "firm" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">ACTIVE</span>}
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">₹1,599 <span className="text-sm font-normal text-secondary">/ month</span></div>
            <p className="text-xs text-tertiary mb-3">For CA firms with teams</p>
            <ul className="space-y-1.5 mb-4">
              {firmFeatures.map((f) => <li key={f} className="flex items-center gap-2 text-xs text-secondary"><Check className="h-3 w-3 text-primary shrink-0" />{f}</li>)}
            </ul>
            {activePlan !== "firm" && (
              <Link to="/pricing" className="block w-full py-2 rounded-lg text-sm font-semibold bg-gradient-orange text-white glow-orange text-center">Upgrade to Firm</Link>
            )}
            {activePlan === "firm" && planExpiry && <p className="text-xs text-secondary">Active until {planExpiry}</p>}
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl border border-white/[0.06] bg-card space-y-3">
          <div className="text-xs font-medium text-secondary">Redeem a coupon code</div>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); setCouponSuccess(""); }}
              maxLength={20}
              placeholder="ENTER CODE"
              className="glass-input flex-1 h-9 px-3 text-sm tracking-wider uppercase font-semibold"
            />
            <button
              onClick={handleCouponRedeem}
              disabled={redeemMutation.status === "pending"}
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-gradient-orange text-white glow-orange disabled:opacity-50"
            >
              {redeemMutation.status === "pending" ? "..." : "Activate"}
            </button>
          </div>
          {couponError && <p className="text-xs text-red-400">{couponError}</p>}
          {couponSuccess && <p className="text-xs text-emerald-400">{couponSuccess}</p>}
        </div>

        {redemptions && redemptions.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-secondary mb-2">Redemption history</div>
            <div className="space-y-1.5">
              {redemptions.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02]">
                  <span className="font-mono text-[var(--text-primary)]">{r.coupons?.code ?? "—"}</span>
                  <span className="text-secondary">
                    {r.coupons?.plan} · {r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString("en-IN") : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
      <SectionCard title="Account Actions" desc="Manage your account data">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.06] bg-card">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Export my data</p>
              <p className="text-xs text-secondary mt-0.5">Download all your calculations and client data as JSON</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-all border-white/10 text-secondary hover:text-[var(--text-primary)] hover:border-white/30 disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Export"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.06] bg-card">
            <div>
              <p className="text-sm font-medium text-red-400">Clear calculation history</p>
              <p className="text-xs text-secondary mt-0.5">Remove all saved calculations permanently</p>
            </div>
            <button
              onClick={() => setConfirmClear(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-all border-red-400/30 text-red-400 hover:bg-red-400/10"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.06] bg-card">
            <div>
              <p className="text-sm font-medium text-red-400">Delete account</p>
              <p className="text-xs text-secondary mt-0.5">Permanently delete your account and all associated data</p>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-all border-red-400/30 text-red-400 hover:bg-red-400/10"
            >
              Delete
            </button>
          </div>
        </div>
      </SectionCard>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear calculation history</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete all your saved calculations. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory} disabled={clearing} className="bg-destructive text-white">
              {clearing ? "Clearing…" : "Clear all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account</AlertDialogTitle>
            <AlertDialogDescription>
              Account self-deletion is not yet available. You will be signed out and directed to email support for account deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white">
              Contact support to delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const ActiveComponent = { profile: ProfileTab, preferences: PreferencesTab, appearance: AppearanceTab, notifications: NotificationsTab, account: AccountTab }[activeTab];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-secondary text-sm">Manage your account, preferences and notifications</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-48 shrink-0 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                activeTab === id ? "bg-primary/10 text-primary font-medium" : "text-secondary hover:bg-white/[0.04] hover:text-[var(--text-primary)]")}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {activeTab === id && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
            </button>
          ))}
        </nav>
        <div className="flex-1 min-w-0"><ActiveComponent /></div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors"
        style={{
          color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.3)",
          background: "transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <LogOut className="h-[18px] w-[18px]" />
        Sign out
      </button>
    </div>
  );
}
