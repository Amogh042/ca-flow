import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signIn(email, password);
      toast({ title: "Signed in" });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err?.message || "Unable to sign in" });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-panel rounded-md">
        <h2 className="text-lg font-semibold mb-4">Sign in</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 text-sm">
          Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
