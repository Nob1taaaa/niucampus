import { useState, useEffect } from "react";
import { Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { moderateContent } from "@/lib/moderation";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@supabase/supabase-js";

interface WantedPost {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  budget: number | null;
  category: string;
  is_fulfilled: boolean;
  created_at: string;
  poster?: { full_name: string | null };
}

interface Props {
  user: User | null;
}

const WantedBoard = ({ user }: Props) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<WantedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", budget: "" });

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("marketplace_wanted")
        .select("*")
        .eq("is_fulfilled", false)
        .order("created_at", { ascending: false });
      if (error) { setLoading(false); return; }

      const userIds = [...new Set((data || []).map(d => d.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] };

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      setPosts((data || []).map(d => ({ ...d, poster: profileMap[d.user_id] })));
      setLoading(false);
    };
    load();
  }, []);

  const handlePost = async () => {
    if (!user || submitting || !form.title.trim()) return;
    setSubmitting(true);
    try {
      const mod = await moderateContent(form.title + " " + form.description, "marketplace_wanted");
      if (!mod.safe) { toast({ title: "⚠️ Content not allowed", description: mod.reason, variant: "destructive" }); return; }

      const { data, error } = await supabase.from("marketplace_wanted").insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        budget: form.budget ? parseFloat(form.budget) : null,
      }).select().single();

      if (error) throw error;
      setPosts(prev => [{ ...data, poster: { full_name: user.user_metadata?.full_name || user.email } }, ...prev]);
      setIsOpen(false);
      setForm({ title: "", description: "", budget: "" });
      toast({ title: "Wanted post created! 📢" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/70 p-4 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Post what you need — someone might have it!</p>
        <Button size="sm" className="h-8 rounded-full text-xs px-4" onClick={() => setIsOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Post Request
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/70 py-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3">
            <Megaphone className="h-6 w-6 text-primary/50" />
          </div>
          <p className="text-sm font-medium">No wanted posts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to request something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm p-3 sm:p-4 space-y-2 transition-all hover:border-primary/25">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold">🔍 {post.title}</h3>
                  {post.description && <p className="text-[0.7rem] text-muted-foreground mt-1 line-clamp-2">{post.description}</p>}
                </div>
                {post.budget && (
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[0.6rem] shrink-0">
                    Budget: ₹{post.budget}
                  </Badge>
                )}
              </div>
              <p className="text-[0.6rem] text-muted-foreground">
                {post.poster?.full_name || "Student"} · {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">📢 What are you looking for?</DialogTitle>
            <DialogDescription>Post a request and fellow students might have it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label className="text-xs">What do you need? *</Label>
              <Input placeholder="e.g. DSA book by Cormen, paying ₹200" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl text-sm" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Details</Label>
              <Textarea placeholder="Edition, condition preferences..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl text-sm" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Budget (₹)</Label>
              <Input type="number" placeholder="Optional" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="rounded-xl text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button onClick={handlePost} disabled={submitting} className="rounded-xl text-xs">{submitting ? "Posting..." : "Post Request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WantedBoard;
