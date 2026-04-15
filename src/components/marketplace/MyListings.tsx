import { useState, useEffect } from "react";
import { Trash2, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
  onRefresh: () => void;
  onEdit: () => void;
}

interface MyListing {
  id: string;
  title: string;
  price: number;
  is_free: boolean;
  is_urgent: boolean;
  is_sold: boolean;
  category: string;
  created_at: string;
}

const MyListings = ({ user, onRefresh }: Props) => {
  const { toast } = useToast();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("id, title, price, is_free, is_urgent, is_sold, category, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setListings(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setListings(prev => prev.filter(l => l.id !== id));
    toast({ title: "Listing deleted" });
    onRefresh();
  };

  const handleToggleSold = async (id: string, currentlySold: boolean) => {
    const { error } = await supabase.from("marketplace_listings").update({ is_sold: !currentlySold }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setListings(prev => prev.map(l => l.id === id ? { ...l, is_sold: !currentlySold } : l));
    toast({ title: currentlySold ? "Marked as available" : "Marked as sold! 🎉" });
    onRefresh();
  };

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/70 p-4 flex gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  if (listings.length === 0) return (
    <div className="rounded-2xl border border-border/40 bg-card/70 py-12 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3">
        <Package className="h-6 w-6 text-primary/50" />
      </div>
      <p className="text-sm font-medium">No listings yet</p>
      <p className="text-xs text-muted-foreground mt-1">Post your first item to start selling!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {listings.map(l => (
        <div key={l.id} className={`rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm p-3 sm:p-4 flex items-center gap-3 transition-all ${l.is_sold ? "opacity-60" : ""}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-semibold truncate">{l.title}</h3>
              {l.is_sold && <Badge variant="outline" className="text-[0.55rem] border-muted">Sold</Badge>}
              {l.is_urgent && <Badge className="bg-destructive/80 text-[0.55rem] border-0">🔥</Badge>}
            </div>
            <p className="text-xs font-bold text-primary mt-0.5">{l.is_free ? "Free" : `₹${l.price}`}</p>
            <p className="text-[0.6rem] text-muted-foreground capitalize">{l.category} · {new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-xl border-primary/20 hover:bg-primary/5"
              onClick={() => handleToggleSold(l.id, l.is_sold)}
              title={l.is_sold ? "Mark available" : "Mark sold"}
            >
              <CheckCircle className={`h-3.5 w-3.5 ${l.is_sold ? "text-primary" : "text-muted-foreground"}`} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-xl border-destructive/20 hover:bg-destructive/5"
              onClick={() => handleDelete(l.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyListings;
