import { useState } from "react";
import { Send, Sparkles, Heart, MessageSquareHeart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EmailSentDialog from "@/components/EmailSentDialog";

interface FeedbackButtonProps {
  variant?: "footer" | "floating";
}

const FeedbackButton = ({ variant = "footer" }: FeedbackButtonProps) => {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState<string>("idea");
  const [sending, setSending] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [sentTo, setSentTo] = useState<string>("");

  const categories = [
    { id: "idea", label: "💡 Idea", desc: "I have a feature suggestion" },
    { id: "bug", label: "🐛 Bug", desc: "Something is broken" },
    { id: "love", label: "💖 Love", desc: "I love this app!" },
    { id: "other", label: "✨ Other", desc: "Something else" },
  ];

  const handleSend = async () => {
    if (sending) return;
    if (!feedback.trim()) {
      toast({
        title: "Tell us something first 😊",
        description: "Please share your thoughts before sending.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Please sign in first",
          description: "Sign in to send feedback so we can follow up if needed.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      const selectedCat = categories.find((c) => c.id === category);
      const fromUser = session.user.email || "Anonymous user";

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "user-feedback",
          idempotencyKey: `feedback-${session.user.id}-${Date.now()}`,
          templateData: {
            category: selectedCat?.label || "Other",
            message: feedback.trim(),
            fromUser,
            submittedAt: new Date().toLocaleString(),
          },
        },
      });

      if (error) throw error;

      setSentTo(fromUser);
      setOpen(false);
      setFeedback("");
      setCategory("idea");
      setSuccessOpen(true);
    } catch (err) {
      console.error("Feedback send failed:", err);
      toast({
        title: "Couldn't send feedback",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {variant === "floating" ? (
        <button
          onClick={() => setOpen(true)}
          className="group fixed bottom-[68px] left-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-background transition-all active:scale-90"
          aria-label="Send feedback"
        >
          <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-40" />
          <MessageSquareHeart className="relative h-[18px] w-[18px]" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive ring-2 ring-background">
            <Heart className="h-2 w-2 text-destructive-foreground fill-destructive-foreground" />
          </span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:from-primary/20 hover:shadow-sm hover:shadow-primary/10"
        >
          <MessageSquareHeart className="h-3.5 w-3.5 text-primary" />
          <span>Share Feedback</span>
          <Sparkles className="h-3 w-3 text-primary/70 group-hover:text-primary group-hover:rotate-12 transition-all" />
        </button>
      )}

      <Dialog open={open} onOpenChange={(v) => !sending && setOpen(v)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-primary/15 bg-card/95 backdrop-blur-xl max-h-[85dvh] overflow-y-auto p-0">
          {/* Decorative top */}
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pt-8 pb-5">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 ring-2 ring-primary/20">
                <Heart className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
              </div>
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Help Us Make NIU Connect Better
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Your ideas shape what we build next 💭✨
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 pb-6">
            {/* Category chips */}
            <div>
              <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                What's on your mind?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    disabled={sending}
                    className={`rounded-2xl border-2 px-3 py-2.5 text-left transition-all ${
                      category === cat.id
                        ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                        : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-primary/5"
                    } disabled:opacity-50`}
                  >
                    <div className="text-sm font-semibold">{cat.label}</div>
                    <div className="text-[0.65rem] text-muted-foreground mt-0.5">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                Your message
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 300);
                }}
                placeholder="Tell us what you love, what's broken, or what you wish existed in NIU Connect..."
                className="min-h-[120px] resize-none rounded-2xl"
                maxLength={1000}
                disabled={sending}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[0.65rem] text-muted-foreground/70">
                  Sent directly to the NIU Connect team 💌
                </p>
                <p className="text-[0.65rem] text-muted-foreground/70">{feedback.length}/1000</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmailSentDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        title="Feedback sent! 💌"
        description="Thank you — your ideas help us shape what we build next in NIU Connect."
        recipient={sentTo}
      />
    </>
  );
};

export default FeedbackButton;
