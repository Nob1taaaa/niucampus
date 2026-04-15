import { useState } from "react";
import { ArrowLeft, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@/pages/Marketplace";
import type { User } from "@supabase/supabase-js";

interface Props {
  listing: Listing;
  user: User | null;
  onBack: () => void;
  onChat: (listingId: string) => void;
  onRefresh: () => void;
}

const ListingDetail = ({ listing, user, onBack, onChat, onRefresh }: Props) => {
  const { toast } = useToast();
  const [currentImage, setCurrentImage] = useState(0);
  const [marking, setMarking] = useState(false);
  const isOwner = user?.id === listing.user_id;
  const images = listing.images || [];

  const handleMarkSold = async () => {
    setMarking(true);
    const { error } = await supabase.from("marketplace_listings").update({ is_sold: true }).eq("id", listing.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Marked as sold! 🎉" }); onRefresh(); onBack(); }
    setMarking(false);
  };

  const handleStartChat = async () => {
    if (!user) return;
    // Check if chat already exists
    const { data: existing } = await supabase
      .from("marketplace_chats")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("marketplace_chats").insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.user_id,
      });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    onChat(listing.id);
  };

  return (
    <main className="mx-auto max-w-3xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-xs rounded-xl">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to listings
      </Button>

      <div className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm overflow-hidden">
        {/* Photo carousel */}
        {images.length > 0 ? (
          <div className="relative">
            <div className="aspect-[16/10] bg-muted/30">
              <img
                src={images[currentImage]?.image_url}
                alt={listing.title}
                className="h-full w-full object-contain bg-muted/10"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-1.5 p-2 justify-center">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImage(i)}
                    className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentImage ? "border-primary" : "border-transparent opacity-60"
                    }`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[16/10] bg-muted/20 flex items-center justify-center text-5xl opacity-30">📦</div>
        )}

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {listing.is_urgent && <Badge className="bg-destructive/90 text-destructive-foreground border-0">🔥 Urgent Sale</Badge>}
            {listing.is_free && <Badge className="bg-primary/90 text-primary-foreground border-0">🎁 FREE</Badge>}
            {listing.is_sold && <Badge variant="outline" className="border-muted text-muted-foreground">Sold</Badge>}
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-xs capitalize">{listing.category}</Badge>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">{listing.title}</h1>

          <p className="text-2xl font-extrabold text-primary">
            {listing.is_free ? "Free 🎁" : `₹${listing.price}`}
          </p>

          {listing.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          )}

          {/* Seller info */}
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 p-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center text-sm font-bold text-primary-foreground ring-2 ring-primary/20">
              {listing.seller?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-sm font-medium">{listing.seller?.full_name || "NIU Student"}</p>
              <p className="text-[0.65rem] text-muted-foreground">
                Posted {new Date(listing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {isOwner ? (
              <Button
                onClick={handleMarkSold}
                disabled={marking || listing.is_sold}
                className="rounded-xl gap-1.5"
              >
                <CheckCircle className="h-4 w-4" /> {marking ? "Marking..." : listing.is_sold ? "Already Sold" : "Mark as Sold"}
              </Button>
            ) : (
              <Button onClick={handleStartChat} className="rounded-xl gap-1.5">
                <MessageCircle className="h-4 w-4" /> Chat with Seller
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ListingDetail;
