import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArchiveRestore, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/lost-found/PostCard";
import ClaimVerificationModal from "@/components/lost-found/ClaimVerificationModal";
import ClaimsPanel from "@/components/lost-found/ClaimsPanel";
import PrivateChat from "@/components/lost-found/PrivateChat";
import MatchNotification from "@/components/lost-found/MatchNotification";
import ReunionFeed from "@/components/lost-found/ReunionFeed";
import confetti from "canvas-confetti";
import { moderateContent } from "@/lib/moderation";

interface LostFoundPost {
  id: string; user_id: string; type: string; title: string; location: string;
  approximate_time: string | null; description: string; is_resolved: boolean; created_at: string;
  secret_question?: string | null; secret_answer?: string | null;
}

const LostFoundPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"lost" | "found" | "">("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [when, setWhen] = useState("");
  const [description, setDescription] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "lost" | "found" | "mine">("all");
  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [search, setSearch] = useState("");

  // Modal states
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimPost, setClaimPost] = useState<any>(null);
  const [claimsPanelOpen, setClaimsPanelOpen] = useState(false);
  const [claimsPost, setClaimsPost] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState("");
  const [activeChatTitle, setActiveChatTitle] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [matchPostId, setMatchPostId] = useState<string | null>(null);
  const [userChatPostIds, setUserChatPostIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => { if (user) { loadPosts(); loadUserChats(); } }, [user]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase.from("lost_found_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const loadUserChats = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("lost_found_chats")
      .select("post_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    if (data) setUserChatPostIds(data.map((c) => c.post_id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !type || !title.trim() || !location.trim() || !description.trim()) {
      toast({ variant: "destructive", title: "Missing information", description: "Please fill in all required fields." }); return;
    }
      const contentToCheck = `${title} ${description} ${location} ${when}`;
      const modResult = await moderateContent(contentToCheck, "lost_found");
      if (!modResult.safe) {
        toast({ title: "⚠️ Content not allowed", description: modResult.reason || "Please use appropriate language.", variant: "destructive" });
        return;
      }
      const insertData: any = {
        user_id: user.id, type, title: title.trim(), location: location.trim(),
        approximate_time: when.trim() || null, description: description.trim(),
      };
      if (type === "found" && secretQuestion.trim()) {
        insertData.secret_question = secretQuestion.trim();
        insertData.secret_answer = secretAnswer.trim() || null;
      }
      const { data, error } = await supabase.from("lost_found_posts").insert(insertData).select().single();
      if (error) throw error;
      setPosts((prev) => [data, ...prev]);
      toast({ title: "✅ Post added!", description: "Your post is now visible on the board." });
      setTitle(""); setLocation(""); setWhen(""); setDescription(""); setType(""); setSecretQuestion(""); setSecretAnswer("");

      // Trigger AI matching silently
      triggerAIMatching(data);
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const triggerAIMatching = async (post: LostFoundPost) => {
    try {
      const res = await supabase.functions.invoke("match-posts", {
        body: { post_id: post.id, title: post.title, description: post.description, location: post.location, type: post.type },
      });
      if (res.data?.matches?.length > 0) {
        setMatchCount(res.data.matches.length);
        setMatchPostId(post.id);
      }
    } catch (e) {
      console.error("AI matching error:", e);
    }
  };

  const handleRemovePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("lost_found_posts").delete().eq("id", postId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({ title: "Post removed" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const handleClaim = (post: any) => {
    setClaimPost(post);
    setClaimModalOpen(true);
  };

  const handleViewClaims = (post: any) => {
    setClaimsPost(post);
    setClaimsPanelOpen(true);
  };

  const handleChatCreated = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveChatTitle(claimsPost?.title || "Item");
    setChatOpen(true);
    loadUserChats();
  };

  const handleOpenChat = async (postId: string) => {
    // Check if a chat exists for this post
    const { data } = await supabase.from("lost_found_chats").select("*").eq("post_id", postId).limit(1);
    if (data && data.length > 0) {
      setActiveChatId(data[0].id);
      const post = posts.find((p) => p.id === postId);
      setActiveChatTitle(post?.title || "Item");
      setChatOpen(true);
    }
  };

  const handleItemReturned = async () => {
    if (!activeChatId) return;
    try {
      // Get chat details
      const { data: chat } = await supabase.from("lost_found_chats").select("*").eq("id", activeChatId).single();
      if (!chat) return;

      // Check if reunion record exists
      const { data: existing } = await supabase.from("lost_found_reunions").select("*").eq("post_id", chat.post_id).limit(1);

      if (existing && existing.length > 0) {
        // Update confirmation
        const isUser1 = user?.id === existing[0].user1_id;
        await supabase.from("lost_found_reunions").update(
          isUser1 ? { confirmed_by_user1: true } : { confirmed_by_user2: true }
        ).eq("id", existing[0].id);

        // Check if both confirmed
        if ((isUser1 && existing[0].confirmed_by_user2) || (!isUser1 && existing[0].confirmed_by_user1)) {
          // Both confirmed! Mark post as resolved
          await supabase.from("lost_found_posts").update({ is_resolved: true }).eq("id", chat.post_id);
          setPosts((prev) => prev.map((p) => (p.id === chat.post_id ? { ...p, is_resolved: true } : p)));
          triggerConfetti();
          toast({ title: "🎉 REUNITED!", description: "Both students confirmed the item was returned!" });
        } else {
          toast({ title: "✅ Your confirmation recorded", description: "Waiting for the other student to confirm." });
        }
      } else {
        // Create reunion record
        await supabase.from("lost_found_reunions").insert({
          post_id: chat.post_id,
          user1_id: chat.user1_id,
          user2_id: chat.user2_id,
          confirmed_by_user1: user?.id === chat.user1_id,
          confirmed_by_user2: user?.id === chat.user2_id,
        });
        toast({ title: "✅ Your confirmation recorded", description: "Waiting for the other student to confirm." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#10b981", "#34d399", "#6ee7b7"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#10b981", "#34d399", "#6ee7b7"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "lost") return post.type === "lost";
    if (activeTab === "found") return post.type === "found";
    if (activeTab === "mine") return post.user_id === user?.id;
    return true;
  }).filter((post) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return post.title.toLowerCase().includes(q) || post.description.toLowerCase().includes(q) || post.location.toLowerCase().includes(q);
  });

  const tabStats = {
    all: posts.length, lost: posts.filter((p) => p.type === "lost").length,
    found: posts.filter((p) => p.type === "found").length, mine: posts.filter((p) => p.user_id === user?.id).length,
  };

  const TabButton = ({ id, label }: { id: "all" | "lost" | "found" | "mine"; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.7rem] font-medium transition-all ${
        activeTab === id
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-primary/8 text-muted-foreground hover:bg-primary/15 hover:text-foreground border border-primary/15"
      }`}
    >
      {label}
      <span className="text-[0.6rem] opacity-70 bg-background/20 rounded-full px-1.5">{tabStats[id]}</span>
    </button>
  );

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  return (
    <main className="mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader icon="📍" title="Lost & Found" subtitle="A central board to reconnect people with their lost items across campus.">
        <div className="relative flex items-center rounded-full bg-muted/60 border border-primary/12 p-0.5 text-xs">
          <div
            className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-in-out"
            style={{
              width: 'calc(50% - 2px)',
              left: type === "lost" ? '2px' : 'calc(50%)',
              background: type === "lost"
                ? 'linear-gradient(to right, hsl(var(--destructive) / 0.9), hsl(var(--destructive) / 0.7))'
                : 'linear-gradient(to right, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.6))',
            }}
          />
          <button type="button" onClick={() => setType("lost")} className={`relative z-10 h-8 rounded-full px-4 font-medium transition-colors duration-200 ${type === "lost" ? "text-destructive-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            🔴 I lost something
          </button>
          <button type="button" onClick={() => setType("found")} className={`relative z-10 h-8 rounded-full px-4 font-medium transition-colors duration-200 ${type === "found" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            🟢 I found something
          </button>
        </div>
      </PageHeader>

      {/* Match Notification */}
      {matchCount > 0 && (
        <section className="mb-4">
          <MatchNotification matchCount={matchCount} onView={() => {
            setMatchCount(0);
            toast({ title: "AI Matches", description: "Check the board for highlighted matching posts!" });
          }} />
        </section>
      )}

      {/* Tabs */}
      <section className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-3 text-xs md:flex-row md:items-center md:justify-between md:p-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <TabButton id="all" label="All" />
          <TabButton id="lost" label="🔴 Lost" />
          <TabButton id="found" label="🟢 Found" />
          <TabButton id="mine" label="My posts" />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 text-[0.7rem] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>AI auto-matches similar lost &amp; found posts</span>
        </div>
      </section>

      {/* Search */}
      <section className="mb-5 flex rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-3 md:p-4">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-primary/15 bg-background/60 px-3 py-2 text-foreground text-xs">
          <Search className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by item, color, or location..." className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Posts */}
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <Card className="border-primary/12 bg-card/70 rounded-2xl">
              <CardContent className="py-10 text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3">
                  <ArchiveRestore className="h-6 w-6 text-primary/50" />
                </div>
                <p className="text-sm font-medium text-foreground">No posts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to report a lost or found item!</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userId={user?.id}
                userChatPostIds={userChatPostIds}
                onClaim={handleClaim}
                onRemove={handleRemovePost}
                onViewClaims={handleViewClaims}
                onOpenChat={handleOpenChat}
              />
            ))
          )}
        </div>

        {/* Form */}
        <Card className="border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl h-fit overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/50 to-accent-foreground/30" />
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">✍️ Report an item</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label className="text-[0.75rem]">Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as "lost" | "found")}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-primary/15"><SelectValue placeholder="Lost or found?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">🔴 I lost something</SelectItem>
                    <SelectItem value="found">🟢 I found something</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[0.75rem]">Short title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lost: black backpack in library" className="h-9 text-xs rounded-xl border-primary/15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[0.75rem]">Where *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Block B stairway" className="h-9 text-xs rounded-xl border-primary/15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[0.75rem]">Approximate time</Label>
                <Input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="e.g. Today 3:30 PM" className="h-9 text-xs rounded-xl border-primary/15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[0.75rem]">Description *</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item, color, any identifiers..." rows={3} className="resize-none text-xs rounded-xl border-primary/15" />
              </div>

              {/* Secret question for found items */}
              {type === "found" && (
                <div className="space-y-2 rounded-xl bg-primary/5 border border-primary/12 p-3">
                  <p className="text-[0.7rem] font-semibold text-primary flex items-center gap-1.5">🔐 Verification Question (optional)</p>
                  <p className="text-[0.65rem] text-muted-foreground">Ask a question only the true owner would know</p>
                  <Input value={secretQuestion} onChange={(e) => setSecretQuestion(e.target.value)} placeholder="e.g. What sticker is on the laptop?" className="h-8 text-xs rounded-xl border-primary/15" />
                  <Input value={secretAnswer} onChange={(e) => setSecretAnswer(e.target.value)} placeholder="Expected answer (for your reference)" className="h-8 text-xs rounded-xl border-primary/15" />
                </div>
              )}

              <Button type="submit" className="mt-2 h-9 w-full rounded-xl text-xs bg-gradient-to-r from-primary to-primary/80 shadow-sm">
                Save to board
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Reunion Feed */}
      <ReunionFeed />

      {/* Modals */}
      {claimPost && (
        <ClaimVerificationModal
          open={claimModalOpen}
          onOpenChange={setClaimModalOpen}
          post={claimPost}
          userId={user?.id || ""}
          onClaimSubmitted={(claimId) => {
            toast({ title: "Claim submitted", description: "The poster will review your answer." });
          }}
        />
      )}

      {claimsPost && (
        <ClaimsPanel
          open={claimsPanelOpen}
          onOpenChange={setClaimsPanelOpen}
          postId={claimsPost.id}
          postTitle={claimsPost.title}
          userId={user?.id || ""}
          onChatCreated={handleChatCreated}
        />
      )}

      <PrivateChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        chatId={activeChatId}
        userId={user?.id || ""}
        postTitle={activeChatTitle}
        onItemReturned={handleItemReturned}
      />
    </main>
  );
};

export default LostFoundPage;
