import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useRedeemCoupon } from "@/hooks/usePlan";

const plans = [
  {
    name: "Solo",
    tag: "Most Popular",
    desc: "For individual CAs",
    monthly: 199,
    annual: 2149,
    annualSaving: 239,
    features: [
      "Unlimited clients",
      "All calculators",
      "Compliance tracker",
      "Task management",
      "PDF export",
    ],
    cta: "Get started",
    ctaLink: "/signup",
    ctaStyle: "bg-gradient-orange text-white glow-orange hover:glow-orange-strong" as const,
    highlight: true,
  },
  {
    name: "Firm",
    tag: null,
    desc: "For CA firms with teams",
    monthly: 999,
    annual: 10790,
    annualSaving: 1198,
    features: [
      "Everything in Solo",
      "Up to 10 team members",
      "+₹99 per additional member",
      "Team management & roles",
      "Dedicated support",
    ],
    cta: "Get started",
    ctaLink: "/signup",
    ctaStyle: "border border-white/10 text-[var(--text-primary)] hover:bg-white/5" as const,
    highlight: false,
  },
];

const faqs = [
  {
    q: "Can I try before paying?",
    a: "Yes, Starter is free forever. Professional and Firm have a 14-day free trial.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major cards, UPI, and net banking. Indian payments only currently.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, upgrade or downgrade anytime. Annual plans are non-refundable.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-secondary shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-secondary shrink-0" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-sm text-secondary -mt-1">{a}</p>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ["#f97316", "#22c55e", "#eab308", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899"];

function fireConfetti(container: HTMLElement) {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:10;";
  container.style.position = "relative";
  container.appendChild(overlay);

  const count = 60 + Math.floor(Math.random() * 20);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    const size = 4 + Math.random() * 4;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const left = 40 + Math.random() * 20;
    const drift = (Math.random() - 0.5) * 200;
    const delay = Math.random() * 0.6;
    const duration = 1.8 + Math.random() * 1.2;
    const rotation = Math.random() * 720;

    piece.style.cssText = `
      position:absolute;
      left:${left}%;
      top:40%;
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:${Math.random() > 0.5 ? "50%" : "1px"};
      opacity:1;
      pointer-events:none;
      animation:confetti-fall ${duration}s ${delay}s ease-out forwards;
      --drift:${drift}px;
      --rotation:${rotation}deg;
    `;
    overlay.appendChild(piece);
  }

  setTimeout(() => overlay.remove(), 3500);
}

function CouponSection() {
  const { user } = useAuth();
  const redeemMutation = useRedeemCoupon();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ plan: string; durationDays: number; expiresAt: string } | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleActivate = useCallback(async () => {
    if (!user) {
      setError("sign-in-required");
      return;
    }
    if (!code.trim()) {
      setError("Please enter a coupon code");
      return;
    }
    setError("");
    const result = await redeemMutation.mutateAsync(code);
    if (!result.valid) {
      setError(result.error);
    } else {
      setSuccess({ plan: result.plan, durationDays: result.durationDays, expiresAt: result.expiresAt });
      if (sectionRef.current) fireConfetti(sectionRef.current);
    }
  }, [user, code, redeemMutation]);

  const expiryDate = success?.expiresAt
    ? new Date(success.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  const planLabel = success?.plan === "firm" ? "Firm" : "Pro";

  return (
    <div
      ref={sectionRef}
      className="relative rounded-2xl border border-white/[0.08] p-8 sm:p-10 text-center"
      style={{ background: "var(--bg-surface)" }}
    >
      {success ? (
        <div className="space-y-4 animate-fade-in">
          <div
            className="h-16 w-16 mx-auto rounded-full bg-emerald-500/15 grid place-items-center"
            style={{ animation: "scale-in 0.4s cubic-bezier(.2,.9,.2,1) both" }}
          >
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {"🎉"} You're in!
          </div>
          <p className="text-sm text-secondary">
            {planLabel} plan activated for {success.durationDays} days
          </p>
          <p className="text-xs text-tertiary">Expires on {expiryDate}</p>
          <Link
            to="/dashboard"
            className="inline-block mt-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-orange text-white glow-orange hover:glow-orange-strong transition-all"
          >
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Have a promo code?</h3>
          <p className="text-sm text-secondary mb-6">Enter your code below to unlock Pro features</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              maxLength={20}
              placeholder="ENTER CODE"
              className="glass-input w-full sm:flex-1 h-12 px-4 text-center text-base font-semibold tracking-widest uppercase rounded-xl"
            />
            <button
              onClick={handleActivate}
              disabled={redeemMutation.status === "pending"}
              className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-semibold bg-gradient-orange text-white glow-orange hover:glow-orange-strong transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {redeemMutation.status === "pending" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Validating...</>
              ) : (
                "Activate"
              )}
            </button>
          </div>

          {error === "sign-in-required" ? (
            <p className="mt-3 text-sm text-red-400">
              Please sign in first to activate your code.{" "}
              <Link to="/login" className="underline text-primary">Sign in</Link>
            </p>
          ) : error ? (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bg-base)",
        backgroundImage:
          "radial-gradient(circle at 25% 0%, rgba(249, 115, 22, 0.04), transparent 40%), radial-gradient(circle at 75% 100%, rgba(245, 158, 11, 0.03), transparent 40%)",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Nav */}
        <div className="flex items-center justify-between mb-16">
          <Link to={user ? "/dashboard" : "/"} className="inline-flex items-center">
            <img src={logoSrc} alt="CA-flow" style={{ height: 32, width: "auto", objectFit: "contain" }} />
          </Link>
          {user ? (
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full grid place-items-center transition-colors"
              style={{ border: "1px solid var(--border-color)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm text-secondary hover:text-[var(--text-primary)] transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em] mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            Pricing
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            Simple pricing for CA firms
          </h1>
          <p className="mt-3 text-secondary text-sm sm:text-base">
            Two plans. No hidden fees. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !annual ? "text-[var(--text-primary)]" : "text-secondary"
              )}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                annual ? "bg-primary" : "bg-white/10"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  annual && "translate-x-5"
                )}
              />
            </button>
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                annual ? "text-[var(--text-primary)]" : "text-secondary"
              )}
            >
              Annual
            </span>
            {annual && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                Save 10%
              </span>
            )}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-6 sm:p-7 flex flex-col",
                plan.highlight
                  ? "border-2 border-primary/50 bg-gradient-to-b from-primary/[0.06] to-transparent shadow-[0_0_60px_rgba(249,115,22,0.08)]"
                  : "border border-white/[0.08] bg-white/[0.02]"
              )}
            >
              {plan.tag && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gradient-orange text-white shadow-lg">
                    {plan.tag}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="text-xs text-secondary mt-1">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {plan.monthly === 0 ? (
                  <div>
                    <span className="text-4xl font-bold text-[var(--text-primary)]">&#8377;0</span>
                    <span className="text-sm text-secondary ml-1">/ month</span>
                  </div>
                ) : annual ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-[var(--text-primary)]">
                        &#8377;{plan.annual.toLocaleString("en-IN")}
                      </span>
                      <span className="text-sm text-secondary">/ year</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-secondary line-through">
                        &#8377;{(plan.monthly * 12).toLocaleString("en-IN")}/yr
                      </span>
                      <span className="text-xs font-medium text-primary">
                        You save &#8377;{plan.annualSaving.toLocaleString("en-IN")}/year
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-bold text-[var(--text-primary)]">
                      &#8377;{plan.monthly.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-secondary ml-1">/ month</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-secondary">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        plan.highlight ? "text-primary" : "text-white/40"
                      )}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.ctaLink.startsWith("mailto:") ? (
                <a
                  href={plan.ctaLink}
                  className={cn(
                    "block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all",
                    plan.ctaStyle
                  )}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  to={plan.ctaLink}
                  className={cn(
                    "block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all",
                    plan.ctaStyle
                  )}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-8">
            Frequently asked questions
          </h2>
          <div>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>

        {/* Coupon Redemption */}
        <div className="mb-20">
          <CouponSection />
        </div>

        {/* Footer CTA */}
        <div className="text-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 sm:p-14">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Have more than 50 clients?
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Talk to us about an enterprise plan tailored for your firm.
          </p>
          <a
            href="mailto:hello@ca-flow.in"
            className="inline-block mt-6 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-orange text-white glow-orange hover:glow-orange-strong transition-all"
          >
            Contact us
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-tertiary">
          &copy; {new Date().getFullYear()} CA-flow. Built for Indian CA firms.
        </div>
      </div>
    </div>
  );
}
