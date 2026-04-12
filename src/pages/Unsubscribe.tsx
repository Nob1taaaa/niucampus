import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  const content: Record<Status, { icon: React.ReactNode; title: string; desc: string }> = {
    loading: { icon: <Loader2 className="h-10 w-10 animate-spin text-primary" />, title: "Verifying…", desc: "Please wait while we verify your request." },
    valid: { icon: <MailX className="h-10 w-10 text-primary" />, title: "Unsubscribe", desc: "Click below to stop receiving app emails from NIU Connect." },
    already: { icon: <CheckCircle2 className="h-10 w-10 text-muted-foreground" />, title: "Already unsubscribed", desc: "You've already unsubscribed from these emails." },
    invalid: { icon: <AlertCircle className="h-10 w-10 text-destructive" />, title: "Invalid link", desc: "This unsubscribe link is invalid or expired." },
    success: { icon: <CheckCircle2 className="h-10 w-10 text-primary" />, title: "Unsubscribed!", desc: "You won't receive app emails from NIU Connect anymore." },
    error: { icon: <AlertCircle className="h-10 w-10 text-destructive" />, title: "Something went wrong", desc: "Please try again later or contact support." },
  };

  const c = content[status];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-2xl border-primary/10 shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {c.icon}
          <h1 className="text-xl font-bold text-foreground">{c.title}</h1>
          <p className="text-sm text-muted-foreground">{c.desc}</p>
          {status === "valid" && (
            <Button onClick={handleUnsubscribe} disabled={processing} className="mt-2 rounded-xl">
              {processing ? "Processing…" : "Confirm Unsubscribe"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribePage;
