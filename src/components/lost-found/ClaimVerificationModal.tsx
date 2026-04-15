import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2 } from "lucide-react";

interface ClaimVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: { id: string; title: string; secret_question: string | null; user_id: string; type?: string };
  userId: string;
  onClaimSubmitted: (claimId: string) => void;
}

const ClaimVerificationModal = ({ open, onOpenChange, post, userId, onClaimSubmitted }: ClaimVerificationModalProps) => {
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({ variant: "destructive", title: "Answer required", description: "Please answer the verification question." });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("lost_found_claims").insert({
        post_id: post.id,
        claimant_id: userId,
        answer: answer.trim(),
      }).select().single();
      if (error) throw error;

      // Send notification to post owner
      supabase.functions.invoke("notify-claim", {
        body: {
          type: "claim",
          post_id: post.id,
          post_title: post.title,
          target_user_id: post.user_id,
        },
      }).catch(console.error);

      toast({ title: "✅ Claim submitted!", description: "The item poster will review your answer." });
      setAnswer("");
      onOpenChange(false);
      onClaimSubmitted(data.id);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

    const isLostPost = post.type === "lost";

    return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-primary/15 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-base">
            {isLostPost ? "I Found This Item" : "Verify Your Claim"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            {isLostPost ? "Reaching out to: " : "Claiming: "}
            <span className="font-semibold text-foreground">{post.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isLostPost ? (
            <div className="rounded-2xl bg-primary/5 border border-primary/12 p-4">
              <Label className="text-xs font-semibold text-primary mb-1 block">🔍 Describe what you found</Label>
              <p className="text-xs text-muted-foreground">Please describe the item you found in detail — color, brand, location where you found it — so the owner can verify.</p>
            </div>
          ) : post.secret_question ? (
            <div className="rounded-2xl bg-primary/5 border border-primary/12 p-4">
              <Label className="text-xs font-semibold text-primary mb-1 block">🔐 Verification Question</Label>
              <p className="text-sm text-foreground font-medium">{post.secret_question}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-accent/30 border border-accent-foreground/12 p-4">
              <Label className="text-xs font-semibold text-accent-foreground mb-1 block">📝 Describe the item</Label>
              <p className="text-xs text-muted-foreground">Since no verification question was set, please describe the item in detail to prove it's yours.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Your {isLostPost ? "Description" : "Answer"} *</Label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                isLostPost
                  ? "I found this item at... It looks like... (describe in detail)"
                  : post.secret_question
                  ? "Type your answer here..."
                  : "Describe your item in detail (color, brand, distinguishing marks)..."
              }
              rows={3}
              className="resize-none text-sm rounded-xl border-primary/15"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 h-10 rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 h-10 rounded-xl text-xs bg-gradient-to-r from-primary to-primary/80"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isLostPost ? "Send to Owner" : "Submit Claim"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimVerificationModal;
