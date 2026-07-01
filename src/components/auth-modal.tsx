"use client";

import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase-browser";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const supabase = getSupabaseClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md p-6 flex flex-col gap-6"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-heading">
            <Shield className="w-5 h-5 text-primary" />
            {isSignUp ? "Create Account" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="auth-email"
              className="text-xs font-semibold text-muted-foreground"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2 w-4 h-4 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="auth-password"
              className="text-xs font-semibold text-muted-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2 w-4 h-4 text-muted-foreground" />
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0.5 top-0.5 text-muted-foreground hover:"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-success/10 text-success border border-success/20 rounded-lg">
              {successMsg}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Log In"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border" />
          <span
            className="flex-shrink text-xs text-muted-foreground font-medium"
            style={{ marginInline: "1rem" }}
          >
            or continue with
          </span>
          <div className="flex-grow border-t border-border" />
        </div>

        {/* Google */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Google"
          >
            <title>Google</title>
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4v-3.13a11.53 11.53 0 0 0 3.53-8.62z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3a7.48 7.48 0 0 1-11.23-3.95H.83v3.1A12 12 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M4.85 14.14a7.17 7.17 0 0 1 0-4.28V6.76H.83a12 12 0 0 0 0 10.48l4.02-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.92 11.92 0 0 0 12 0 12 12 0 0 0 .83 6.76l4.02 3.1a7.48 7.48 0 0 1 7.15-5.11z"
            />
          </svg>
          Google
        </Button>

        {/* Toggle */}
        <div className="text-center text-xs text-muted-foreground font-medium">
          {isSignUp ? "Already have an account?" : "New to the platform?"}{" "}
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold px-0"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
