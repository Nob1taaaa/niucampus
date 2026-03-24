import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Clock, BookOpen } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import PageHeader from "@/components/PageHeader";

const focusOptions = [
  { label: "DSA & problem solving", emoji: "🧮" },
  { label: "Core CS (OS/DBMS/CN)", emoji: "💻" },
  { label: "Development & projects", emoji: "🛠️" },
  { label: "Interview / placement prep", emoji: "💼" },
  { label: "Gate / higher studies", emoji: "🎓" },
];

const StudyPlannerPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [semester, setSemester] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [upcomingExams, setUpcomingExams] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [plan, setPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const lastGenRef = useRef(0);
  const COOLDOWN_MS = 5000;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); setIsLoading(false);
      if (!session) { toast({ title: "Login required", description: "Please sign in to use the Study Planner." }); navigate("/auth"); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setIsLoading(false);
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;
  if (!session) return null;

  const toggleFocus = (label: string) => {
    setSelectedFocus((prev) => prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]);
  };

  const generatePlan = async () => {
    if (!hoursPerWeek.trim()) { toast({ title: "Add weekly hours", description: "Tell the assistant roughly how many hours you can give per week." }); return; }

    const now = Date.now();
    if (now - lastGenRef.current < COOLDOWN_MS) {
      toast({ title: "Please wait ⏳", description: "Wait a few seconds before generating again." });
      return;
    }
    lastGenRef.current = now;

    setIsGenerating(true); setPlan("");
    const { data, error } = await supabase.functions.invoke<{ plan: string; remainingToday?: number; dailyLimit?: boolean }>("study-planner", {
      body: { semester, targetRole, hoursPerWeek, focusAreas: selectedFocus, upcomingExams, extraContext },
    });
    if (error) {
      const msg = typeof error === "object" && "message" in error ? error.message : "";
      if (msg.includes("limit") || msg.includes("daily")) {
        toast({ title: "Daily limit reached 📖", description: "You've used all study plans for today. Come back tomorrow!", variant: "destructive" });
      } else {
        toast({ title: "Could not generate plan", description: "The AI planner is unavailable right now.", variant: "destructive" });
      }
      setIsGenerating(false);
      return;
    }
    if (data?.remainingToday !== undefined) setRemainingToday(data.remainingToday);
    if (data?.plan) setPlan(data.plan.trim());
    setIsGenerating(false);
  };

  return (
    <main className="mx-auto max-w-5xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader icon="🎯" title="Study & Placement Planner" subtitle="Answer a few questions and let the AI mentor design a realistic weekly plan for your semester and placements.">
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[0.7rem] text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> AI powered
        </Badge>
      </PageHeader>

      <section className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
        <Card className="border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-accent-foreground/50" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Target className="h-4 w-4 text-primary" /> Tell the planner about you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="semester" className="text-xs">Semester / year</Label>
                <Input id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. 3rd year, 5th sem" className="rounded-xl border-primary/15" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hours" className="text-xs">Hours per week *</Label>
                <Input id="hours" type="number" min={1} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} placeholder="e.g. 12" className="rounded-xl border-primary/15" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetRole" className="text-xs">Main goal or target role</Label>
              <Input id="targetRole" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. product-based SDE, ML" className="rounded-xl border-primary/15" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">What do you want to focus on?</Label>
              <div className="flex flex-wrap gap-2">
                {focusOptions.map(({ label, emoji }) => (
                  <button
                    key={label} type="button" onClick={() => toggleFocus(label)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.72rem] font-medium transition-all ${
                      selectedFocus.includes(label)
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                        : "border-primary/12 bg-card/50 text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exams" className="text-xs">Upcoming exams / deadlines</Label>
              <Input id="exams" value={upcomingExams} onChange={(e) => setUpcomingExams(e.target.value)} placeholder="e.g. intern tests in Aug" className="rounded-xl border-primary/15" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extra" className="text-xs">Anything else?</Label>
              <Textarea id="extra" value={extraContext} onChange={(e) => setExtraContext(e.target.value)} placeholder="Mention lab-heavy weeks, backlogs, clubs, constraints..." className="min-h-[80px] resize-none rounded-xl border-primary/15" />
            </div>

            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <Button className="h-10 rounded-xl px-5 text-sm bg-gradient-to-r from-primary to-primary/80 shadow-[var(--shadow-glow)] hover:shadow-lg transition-shadow" onClick={generatePlan} disabled={isGenerating}>
                {isGenerating ? "✨ Generating your plan…" : "🎯 Generate my weekly plan"}
              </Button>
              {remainingToday !== null && (
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[0.7rem] text-primary">
                  {remainingToday} plans left today
                </Badge>
              )}
              <p className="w-full mt-1.5 text-[0.65rem] text-muted-foreground">Powered by AI — uses your inputs only. Limited to 5 plans/day per student.</p>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent-foreground/40 to-primary/40" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Clock className="h-4 w-4 text-primary" /> Your weekly roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ScrollArea className="h-[360px] rounded-xl border border-primary/10 bg-background/40 p-4 text-sm">
              {plan ? (
                <article className="max-w-none whitespace-pre-wrap text-[0.86rem] leading-relaxed text-foreground">
                  {plan}
                </article>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <div className="h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary/50" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Your plan appears here</p>
                    <p className="max-w-xs text-xs mt-1">Including daily slots, non-negotiable habits, and 4-week milestones ✨</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default StudyPlannerPage;
