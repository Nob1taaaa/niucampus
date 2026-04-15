import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/pages/Marketplace";

interface Props {
  listing: Listing;
  onClick: () => void;
}

const ListingCard = ({ listing, onClick }: Props) => {
  const firstImage = listing.images?.[0]?.image_url;

  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm overflow-hidden text-left transition-all hover:shadow-md hover:border-primary/25 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
        {firstImage ? (
          <img src={firstImage} alt={listing.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl opacity-40">📦</div>
        )}
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
          {listing.is_urgent && (
            <Badge className="bg-destructive/90 text-destructive-foreground text-[0.55rem] px-1.5 py-0 border-0">
              🔥 Urgent
            </Badge>
          )}
          {listing.is_free && (
            <Badge className="bg-primary/90 text-primary-foreground text-[0.55rem] px-1.5 py-0 border-0">
              🎁 FREE
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1">
        <h3 className="text-xs font-semibold truncate text-foreground">{listing.title}</h3>
        <p className="text-sm font-bold text-primary">
          {listing.is_free ? "Free" : `₹${listing.price}`}
        </p>
        <p className="text-[0.6rem] text-muted-foreground truncate">
          {listing.seller?.full_name || "NIU Student"} · {new Date(listing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
      </div>
    </button>
  );
};

export default ListingCard;
