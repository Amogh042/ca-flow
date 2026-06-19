import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-panel rounded-md">
        <h2 className="text-lg font-semibold mb-4">Create account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
