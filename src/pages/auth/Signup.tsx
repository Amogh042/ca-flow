import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { toast } from "@/hooks/use-toast";

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signUp(email, password);
      toast({ title: "Account created" });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Sign up failed", description: err?.message || "Unable to create account" });
    }
  }

  async function handleGoogleSignup() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) toast({ title: "Google sign up failed", description: error.message });
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-lg font-semibold mb-6 text-[var(--text-primary)]">Create account</h2>

        <button
          onClick={handleGoogleSignup}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all hover:shadow-md"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
          }}
        >
          <GoogleLogo />
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: "var(--border-color)" }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs" style={{ background: "var(--bg-surface)", color: "var(--text-tertiary)" }}>or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-secondary">
          Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
