import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, MessageCircle, Loader2 } from "lucide-react";

interface Claim {
  id: string;
  post_id: string;
  claimant_id: string;
  answer: string;
  status: string;
  created_at: string;
}

interface ClaimsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  postType?: string;
  userId: string;
  onChatCreated: (chatId: string) => void;
}

const ClaimsPanel = ({ open, onOpenChange, postId, postTitle, postType, userId, onChatCreated }: ClaimsPanelProps) => {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (open) loadClaims();
  }, [open]);

  const loadClaims = async () => {
    setLoading(true);
    const { data } = await supabase.from("lost_found_claims").select("*").eq("post_id", postId).order("created_at", { ascending: false });
    setClaims(data || []);
    setLoading(false);
  };

  const handleAccept = async (claim: Claim) => {
    setProcessing(claim.id);
    try {
      const { error: updateError } = await supabase.from("lost_found_claims").update({ status: "accepted" }).eq("id", claim.id);
      if (updateError) throw updateError;

      const { data: chatData, error: chatError } = await supabase.from("lost_found_chats").insert({
        post_id: postId,
        claim_id: claim.id,
        user1_id: userId,
        user2_id: claim.claimant_id,
      }).select().single();
      if (chatError) throw chatError;

      // Notify claimant that their claim was accepted
      supabase.functions.invoke("notify-claim", {
        body: {
          type: "claim_accepted",
          post_id: postId,
          post_title: postTitle,
          target_user_id: claim.claimant_id,
        },
      }).catch(console.error);

      toast({ title: "✅ Claim accepted!", description: "A private chat has been opened." });
      onOpenChange(false);
      onChatCreated(chatData.id);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (claim: Claim) => {
    setProcessing(claim.id);
    try {
      const { error } = await supabase.from("lost_found_claims").update({ status: "rejected" }).eq("id", claim.id);
      if (error) throw error;
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: "rejected" } : c)));

      // Notify claimant
      supabase.functions.invoke("notify-claim", {
        body: {
          type: "claim_rejected",
          post_id: postId,
          post_title: postTitle,
          target_user_id: claim.claimant_id,
        },
      }).catch(console.error);

      toast({ title: "Claim rejected" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    accepted: "bg-primary/10 text-primary border-primary/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-primary/15 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">{postType === "lost" ? "🔍 Found Reports" : "📋 Claims"} for "{postTitle}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : claims.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No claims yet.</p>
          ) : (
            claims.map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-primary/10 bg-background/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={`text-[0.6rem] rounded-md ${statusColors[claim.status] || ""}`}>
                    {claim.status.toUpperCase()}
                  </Badge>
                  <span className="text-[0.6rem] text-muted-foreground">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-foreground bg-muted/20 rounded-xl p-2.5 leading-relaxed">"{claim.answer}"</p>
                {claim.status === "pending" && (
                  <div className="flex gap-2">
                    <Button type="button" size="sm" className="flex-1 h-8 rounded-xl text-[0.7rem] bg-gradient-to-r from-primary to-primary/80" onClick={() => handleAccept(claim)} disabled={processing === claim.id}>
                      {processing === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Accept</>}
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="flex-1 h-8 rounded-xl text-[0.7rem] text-destructive border-destructive/20" onClick={() => handleReject(claim)} disabled={processing === claim.id}>
                      <X className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimsPanel;
