import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, CalendarCheck, Calculator, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useFilings } from "@/hooks/useFilings";
import { useCalculations } from "@/hooks/useCalculations";

const ONBOARDED_KEY = "caflow_onboarded";

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, "true");
  } catch {}
}

export function shouldShowOnboarding(clientCount: number, filingCount: number, calcCount: number): boolean {
  if (isOnboarded()) return false;
  return clientCount === 0 && filingCount === 0 && calcCount === 0;
}

export default function OnboardingGuide({ onDismiss }: { onDismiss: () => void }) {
  const clients = useClients().data ?? [];
  const filings = useFilings().data ?? [];
  const calculations = useCalculations().data ?? [];

  const steps = [
    {
      num: 1,
      title: "Add your first client",
      description: "Add a client workspace with their PAN, GSTIN, and basic details. We'll auto-create their compliance deadlines.",
      cta: "Add Client",
      to: "/clients",
      icon: Users,
      done: clients.length > 0,
    },
    {
      num: 2,
      title: "Create a filing for your client",
      description: "Track GST returns, TDS filings, ITR deadlines and more. Never miss a due date.",
      cta: "View Compliance",
      to: "/compliance",
      icon: CalendarCheck,
      done: filings.length > 0,
    },
    {
      num: 3,
      title: "Try a calculator",
      description: "Run income tax, GST, EMI, or any of our 100+ calculators — and save the result to a client.",
      cta: "Browse Calculators",
      to: "/calculators",
      icon: Calculator,
      done: calculations.length > 0,
    },
  ];

  const allDone = steps.every((s) => s.done);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="card-surface p-8 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to CA-flow</h1>
        <p className="mt-2 text-secondary text-sm">
          Let's set up your workspace in 3 steps
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className={cn(
              "card-surface p-6 transition-all",
              step.done && "border-emerald-500/20 bg-emerald-500/[0.02]",
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "h-10 w-10 rounded-xl grid place-items-center shrink-0",
                step.done ? "bg-emerald-500/15" : "bg-primary/10",
              )}>
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <step.icon className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-secondary">Step {step.num}</span>
                  {step.done && (
                    <span className="text-xs font-semibold text-emerald-400">Complete</span>
                  )}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <p className="mt-1 text-sm text-secondary">{step.description}</p>
              </div>
              {!step.done && (
                <Link
                  to={step.to}
                  className="shrink-0 px-4 h-9 rounded-pill bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  {step.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {allDone ? (
        <div className="card-surface p-8 text-center border-primary/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">You're all set!</h2>
          <p className="mt-2 text-sm text-secondary">
            Your dashboard will now show your clients, deadlines, and pending items.
          </p>
          <button
            onClick={() => { markOnboarded(); onDismiss(); }}
            className="mt-4 px-6 h-10 rounded-pill bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={() => { markOnboarded(); onDismiss(); }}
            className="text-sm text-secondary hover:text-[var(--text-primary)] transition-colors"
          >
            Skip setup
          </button>
        </div>
      )}
    </div>
  );
}
