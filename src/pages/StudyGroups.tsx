import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, GraduationCap, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { moderateContent } from "@/lib/moderation";

interface StudyGroup {
  id: string; creator_id: string; title: string; description: string | null;
  subject: string; schedule: string | null; max_members: number | null; created_at: string;
}

const StudyGroupsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<"all" | "dsa" | "dbms" | "others">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", schedule: "", max_members: "10" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => { if (user) { loadGroups(); loadJoinedGroups(); } }, [user]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase.from("study_groups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setGroups(data || []);
      if (data && data.length > 0) {
        const { data: members, error: membersError } = await supabase.from("study_group_members").select("group_id");
        if (!membersError && members) {
          const counts: Record<string, number> = {};
          members.forEach((m) => { counts[m.group_id] = (counts[m.group_id] || 0) + 1; });
          setMemberCounts(counts);
        }
      }
    } catch (error: any) {
      toast({ title: "Error loading groups", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const loadJoinedGroups = async () => {
    if (!user) return;
    const { data } = await supabase.from("study_group_members").select("group_id").eq("user_id", user.id);
    if (data) setJoinedGroups(new Set(data.map((d) => d.group_id)));
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    if (joinedGroups.has(groupId)) {
      const { error } = await supabase.from("study_group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setJoinedGroups((prev) => { const n = new Set(prev); n.delete(groupId); return n; });
      setMemberCounts((prev) => ({ ...prev, [groupId]: Math.max(0, (prev[groupId] || 1) - 1) }));
      toast({ title: "Left group" });
    } else {
      const { error } = await supabase.from("study_group_members").insert({ group_id: groupId, user_id: user.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setJoinedGroups((prev) => new Set(prev).add(groupId));
      setMemberCounts((prev) => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));
      toast({ title: "Joined group!" });
    }
  };

  const handleCreateGroup = async () => {
    if (!user || submitting || !form.title.trim() || !form.subject.trim()) {
      if (!form.title.trim() || !form.subject.trim()) toast({ title: "Missing fields", description: "Title and subject are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const contentToCheck = `${form.title} ${form.description} ${form.subject} ${form.schedule}`;
      const modResult = await moderateContent(contentToCheck, "study_group");
      if (!modResult.safe) {
        toast({ title: "⚠️ Content not allowed", description: modResult.reason || "Please use appropriate language.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.from("study_groups").insert({
        creator_id: user.id, title: form.title.trim(), description: form.description.trim() || null,
        subject: form.subject.trim(), schedule: form.schedule.trim() || null, max_members: parseInt(form.max_members) || 10,
      }).select().single();
      if (error) throw error;
      setGroups((prev) => [data, ...prev]);
      setIsCreateOpen(false);
      setForm({ title: "", description: "", subject: "", schedule: "", max_members: "10" });
      toast({ title: "Group created!" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const { error } = await supabase.from("study_groups").delete().eq("id", groupId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    toast({ title: "Group deleted" });
  };

  const filteredGroups = groups.filter((g) => {
    if (tab === "all") return true;
    if (tab === "dsa") return g.subject.toLowerCase().includes("dsa");
    if (tab === "dbms") return g.subject.toLowerCase().includes("dbms");
    return !g.subject.toLowerCase().includes("dsa") && !g.subject.toLowerCase().includes("dbms");
  });

  const Tab = ({ id, label }: { id: "all" | "dsa" | "dbms" | "others"; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[0.7rem] font-medium transition-all ${
        tab === id
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-primary/8 text-muted-foreground hover:bg-primary/15 hover:text-foreground border border-primary/15"
      }`}
    >{label}</button>
  );

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  const subjectColors: Record<string, string> = {
    dsa: "from-primary to-primary/50",
    dbms: "from-accent-foreground to-accent-foreground/50",
    cn: "from-primary/70 to-accent-foreground/50",
  };

  const getGradient = (subject: string) => {
    const lower = subject.toLowerCase();
    for (const key of Object.keys(subjectColors)) {
      if (lower.includes(key)) return subjectColors[key];
    }
    return "from-primary/60 to-accent-foreground/40";
  };

  return (
    <main className="mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader icon="👥" title="Study Groups" subtitle="Join or create focused groups for DSA, DBMS, CN, OS and more.">
        <Button size="sm" className="h-8 rounded-full text-xs px-4" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Create group
        </Button>
      </PageHeader>

      {/* Tabs */}
      <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-3 text-xs md:flex-row md:items-center md:justify-between md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tab id="all" label="All" />
          <Tab id="dsa" label="🧮 DSA" />
          <Tab id="dbms" label="🗄️ DBMS" />
          <Tab id="others" label="📚 Others" />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 text-[0.7rem] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>AI suggests ideal groups based on your subjects</span>
        </div>
      </section>

      {/* Groups grid */}
      <section className="grid gap-4 md:grid-cols-2">
        {filteredGroups.length === 0 ? (
          <Card className="border-primary/12 bg-card/70 rounded-2xl md:col-span-2">
            <CardContent className="py-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary/50" />
              </div>
              <p className="text-sm font-medium text-foreground">No study groups yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create the first one!</p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => {
            const count = memberCounts[group.id] || 0;
            const isJoined = joinedGroups.has(group.id);
            const isCreator = group.creator_id === user?.id;
            const progress = Math.min(100, (count / (group.max_members || 10)) * 100);

            return (
              <Card key={group.id} className="hover-scale group border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md hover:border-primary/25">
                <div className={`h-1.5 bg-gradient-to-r ${getGradient(group.subject)}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-bold truncate">{group.title}</CardTitle>
                      {group.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="border-primary/20 bg-primary/8 text-[0.6rem] text-foreground font-semibold shrink-0">
                      {count}/{group.max_members || 10}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-2.5 py-1 text-[0.7rem] font-medium text-primary">
                      <GraduationCap className="h-3 w-3" /> {group.subject}
                    </span>
                    {group.schedule && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent-foreground/10 px-2.5 py-1 text-[0.7rem] font-medium text-accent-foreground">
                        <Clock className="h-3 w-3" /> {group.schedule}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                      <Users className="h-3 w-3" /> {count} members
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant={isJoined ? "outline" : "default"}
                      className={`h-8 rounded-full text-[0.7rem] px-4 ${isJoined ? "border-primary/20 text-primary hover:bg-primary/5" : ""}`}
                      onClick={() => handleJoinGroup(group.id)}
                    >
                      {isJoined ? "✓ Leave group" : "Join group"}
                    </Button>
                    {isCreator && (
                      <Button size="sm" variant="outline" className="h-8 rounded-full text-[0.7rem] border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => handleDeleteGroup(group.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">👥 Create a study group</DialogTitle>
            <DialogDescription>Set up a new study group for your campus mates.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Group title *</Label>
              <Input placeholder="e.g. DSA Prep – Evening batch" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>Subject *</Label>
              <Input placeholder="e.g. DSA, DBMS, CN" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="What will you study? Any prerequisites?" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Schedule</Label>
                <Input placeholder="e.g. Mon, Wed 7 PM" value={form.schedule} onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label>Max members</Label>
                <Input type="number" min={2} value={form.max_members} onChange={(e) => setForm((p) => ({ ...p, max_members: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreateGroup} className="rounded-xl" disabled={submitting}>{submitting ? "Creating..." : "Create Group"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default StudyGroupsPage;
