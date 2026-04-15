import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Plus, Search, Package, MessageCircle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import PageHeader from "@/components/PageHeader";
import PostItemDialog from "@/components/marketplace/PostItemDialog";
import ListingCard from "@/components/marketplace/ListingCard";
import ListingDetail from "@/components/marketplace/ListingDetail";
import MyListings from "@/components/marketplace/MyListings";
import WantedBoard from "@/components/marketplace/WantedBoard";
import MarketplaceChat from "@/components/marketplace/MarketplaceChat";
import CategoryGrid from "@/components/marketplace/CategoryGrid";
import { Skeleton } from "@/components/ui/skeleton";

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  is_free: boolean;
  is_urgent: boolean;
  is_sold: boolean;
  category: string;
  created_at: string;
  images: { id: string; image_url: string; position: number }[];
  seller?: { full_name: string | null; avatar_url: string | null };
}

const CATEGORIES = [
  { id: "books", label: "📚 Books", emoji: "📚" },
  { id: "electronics", label: "💻 Electronics", emoji: "💻" },
  { id: "room", label: "🛏️ Room Items", emoji: "🛏️" },
  { id: "clothes", label: "👕 Clothes", emoji: "👕" },
  { id: "sports", label: "⚽ Sports", emoji: "⚽" },
  { id: "free", label: "🎁 Free Items", emoji: "🎁" },
  { id: "other", label: "📦 Other", emoji: "📦" },
];

const MarketplacePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "price_low" | "price_high">("date");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeChatListingId, setActiveChatListingId] = useState<string | null>(null);
  const [tab, setTab] = useState("browse");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadListings = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("marketplace_listings")
        .select("*")
        .eq("is_sold", false)
        .order("is_urgent", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;

      const items = (data || []) as any[];
      const listingIds = items.map((l: any) => l.id);
      const userIds = [...new Set(items.map((l: any) => l.user_id))];

      const [imagesRes, profilesRes] = await Promise.all([
        listingIds.length > 0
          ? (supabase as any).from("marketplace_listing_images").select("*").in("listing_id", listingIds).order("position")
          : { data: [], error: null },
        userIds.length > 0
          ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds as string[])
          : { data: [], error: null },
      ]);

      const imagesMap: Record<string, any[]> = {};
      ((imagesRes.data || []) as any[]).forEach((img: any) => {
        if (!imagesMap[img.listing_id]) imagesMap[img.listing_id] = [];
        imagesMap[img.listing_id].push(img);
      });

      const profilesMap: Record<string, any> = {};
      ((profilesRes.data || []) as any[]).forEach((p: any) => { profilesMap[p.id] = p; });

      setListings(items.map((l: any) => ({
        ...l,
        images: imagesMap[l.id] || [],
        seller: profilesMap[l.user_id] || null,
      })));
    } catch (error: any) {
      toast({ title: "Error loading listings", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) loadListings();
  }, [user, loadListings]);

  const filtered = listings.filter(l => {
    if (selectedCategory && selectedCategory !== "all") {
      if (selectedCategory === "free") { if (!l.is_free) return false; }
      else if (l.category !== selectedCategory) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "price_low") return a.price - b.price;
    if (sortBy === "price_high") return b.price - a.price;
    return 0;
  });

  if (selectedListing) {
    return (
      <ListingDetail
        listing={selectedListing}
        user={user}
        onBack={() => setSelectedListing(null)}
        onChat={(listingId) => { setActiveChatListingId(listingId); setSelectedListing(null); setTab("chat"); }}
        onRefresh={loadListings}
      />
    );
  }

  if (activeChatListingId && tab === "chat") {
    return (
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
        <MarketplaceChat
          listingId={activeChatListingId}
          user={user}
          onBack={() => setActiveChatListingId(null)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader icon="🏪" title="Campus Market" subtitle="Buy, sell, or give away items within NIU campus. Safe, quick, student-only.">
        <Button size="sm" className="h-8 rounded-full text-xs px-4" onClick={() => setIsPostOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Sell Item
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-1.5 flex-wrap">
          <TabsTrigger value="browse" className="rounded-xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 px-3 py-1.5">
            <ShoppingBag className="h-3.5 w-3.5" /> Browse
          </TabsTrigger>
          <TabsTrigger value="my" className="rounded-xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 px-3 py-1.5">
            <Package className="h-3.5 w-3.5" /> My Listings
          </TabsTrigger>
          <TabsTrigger value="wanted" className="rounded-xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 px-3 py-1.5">
            <Megaphone className="h-3.5 w-3.5" /> Wanted
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 px-3 py-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> Chats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-0">
          <CategoryGrid
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={(cat) => setSelectedCategory(cat === selectedCategory ? null : cat)}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl h-9 text-xs" />
            </div>
            <div className="flex gap-1.5">
              {(["date", "price_low", "price_high"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} className={`rounded-full px-3 py-1.5 text-[0.65rem] font-medium transition-all border ${sortBy === s ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/30"}`}>
                  {s === "date" ? "Latest" : s === "price_low" ? "₹ Low" : "₹ High"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/40 bg-card/70 p-3 space-y-2">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card/70 py-12 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3">
                <ShoppingBag className="h-6 w-6 text-primary/50" />
              </div>
              <p className="text-sm font-medium">No items found</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to post something!</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map(listing => (
                <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-0">
          <MyListings user={user} onRefresh={loadListings} onEdit={() => setIsPostOpen(true)} />
        </TabsContent>

        <TabsContent value="wanted" className="mt-0">
          <WantedBoard user={user} />
        </TabsContent>

        <TabsContent value="chat" className="mt-0">
          <MarketplaceChat user={user} onBack={() => setTab("browse")} />
        </TabsContent>
      </Tabs>

      <PostItemDialog open={isPostOpen} onOpenChange={setIsPostOpen} user={user} onSuccess={() => { loadListings(); setIsPostOpen(false); }} />
    </main>
  );
};

export default MarketplacePage;
