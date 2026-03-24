import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import logoImage from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Enter your email", description: "We need your email to send a reset link.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset link sent!", description: "Check your email inbox and click the link to set a new password." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast({ title: "Check your email!", description: "We sent a confirmation link to verify your account." });
        setEmail(""); setPassword(""); setFullName("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logoImage} alt="Campus Innovation" className="h-14 w-14 rounded-2xl object-contain" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Campus Innovation</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your smart campus companion</p>
          </div>
        </div>

        <Card className="border-border bg-card shadow-sm rounded-2xl">
          <CardHeader className="pb-4 pt-6 text-center">
            <CardTitle className="text-lg font-semibold">
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Phone sign-in"}
            </CardTitle>
            <CardDescription className="text-sm">
              {mode === "signin" ? "Sign in to continue" : mode === "signup" ? "Sign up to get started" : mode === "forgot" ? "We'll email you a reset link" : "We'll send you a verification code"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Forgot password form */}
            {mode === "forgot" ? (
              <>
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email" className="text-sm">Email</Label>
                    <Input id="reset-email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
                <button type="button" onClick={() => setMode("signin")} className="flex items-center gap-1 text-sm text-primary hover:underline mx-auto">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </>
            ) : mode === "phone" ? (
              <>
                {!otpSent ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!phone) { toast({ title: "Enter phone number", variant: "destructive" }); return; }
                    setLoading(true);
                    try {
                      const { error } = await supabase.auth.signInWithOtp({ phone });
                      if (error) throw error;
                      setOtpSent(true);
                      toast({ title: "OTP sent! 📱", description: "Check your phone for the verification code." });
                    } catch (error: any) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-10 rounded-xl" />
                      <p className="text-[0.65rem] text-muted-foreground">Include country code (e.g. +91)</p>
                    </div>
                    <Button type="submit" className="w-full h-10 rounded-xl" disabled={loading}>
                      {loading ? "Sending..." : "📱 Send OTP"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!otp) { toast({ title: "Enter the OTP", variant: "destructive" }); return; }
                    setLoading(true);
                    try {
                      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
                      if (error) throw error;
                    } catch (error: any) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="otp" className="text-sm">Verification Code</Label>
                      <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="h-10 rounded-xl text-center text-lg tracking-widest" />
                    </div>
                    <Button type="submit" className="w-full h-10 rounded-xl" disabled={loading}>
                      {loading ? "Verifying..." : "✅ Verify & Sign In"}
                    </Button>
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-sm text-primary hover:underline mx-auto block">
                      Resend code
                    </button>
                  </form>
                )}
                <button type="button" onClick={() => { setMode("signin"); setOtpSent(false); setOtp(""); setPhone(""); }} className="flex items-center gap-1 text-sm text-primary hover:underline mx-auto">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </>
            ) : (
              <>
                {/* Google button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-xl border-border text-foreground hover:bg-secondary gap-3"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? "Connecting..." : "Continue with Google"}
                </Button>

                {/* Phone button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-xl border-border text-foreground hover:bg-secondary gap-3"
                  onClick={() => setMode("phone")}
                >
                  📱 Continue with Phone
                </Button>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>

                {/* Email form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm">Full Name</Label>
                      <Input id="name" type="text" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-10 rounded-xl" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input id="email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-10 rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl" disabled={loading}>
                    {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
                  </Button>
                </form>

                {/* Toggle mode */}
                <p className="text-center text-sm text-muted-foreground">
                  {mode === "signin" ? (
                    <>Don't have an account?{" "}<button type="button" onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Sign up</button></>
                  ) : (
                    <>Already have an account?{" "}<button type="button" onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">Sign in</button></>
                  )}
                </p>

                {mode === "signin" && (
                  <p className="text-center text-xs text-muted-foreground">
                    <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline">
                      Forgot password?
                    </button>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
