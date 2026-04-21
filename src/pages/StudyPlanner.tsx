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
import { Sparkles, Target, Clock, BookOpen, Mail, CalendarDays, Send, CheckCircle2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/PageHeader";
import EmailSentDialog from "@/components/EmailSentDialog";

const focusOptions = [
  // Engineering & Technology
  { label: "DSA & problem solving", emoji: "🧮" },
  { label: "Core CS (OS/DBMS/CN)", emoji: "💻" },
  { label: "Development & projects", emoji: "🛠️" },
  { label: "Interview / placement prep", emoji: "💼" },
  { label: "Gate / higher studies", emoji: "🎓" },
  { label: "Electronics & circuits", emoji: "🔌" },
  { label: "Mechanical engineering", emoji: "⚙️" },
  { label: "Civil engineering", emoji: "🏗️" },
  // Business Management
  { label: "Business & management", emoji: "📊" },
  { label: "Marketing & advertising", emoji: "📣" },
  { label: "Finance & accounting", emoji: "💰" },
  { label: "Entrepreneurship", emoji: "🚀" },
  // Law & Legal Affairs
  { label: "Law & legal studies", emoji: "⚖️" },
  // Allied Health Sciences & Nursing
  { label: "Nursing & healthcare", emoji: "🏥" },
  { label: "Allied health sciences", emoji: "🩺" },
  // Pharmacy
  { label: "Pharmacy & drug sciences", emoji: "💊" },
  // Sciences
  { label: "Physics & mathematics", emoji: "🔬" },
  { label: "Chemistry & biology", emoji: "🧪" },
  { label: "Environmental science", emoji: "🌿" },
  // Liberal Arts & Education
  { label: "Liberal arts & humanities", emoji: "📚" },
  { label: "Education & pedagogy", emoji: "🎒" },
  { label: "Psychology & sociology", emoji: "🧠" },
  // Journalism & Mass Communication
  { label: "Journalism & media", emoji: "📰" },
  { label: "Mass communication", emoji: "🎙️" },
  // Fine Arts & Design
  { label: "Fine arts & design", emoji: "🎨" },
  { label: "Architecture & planning", emoji: "📐" },
  // NIIMS (Medical)
  { label: "Medical sciences (NIIMS)", emoji: "🏨" },
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

  // Reminder state
  const [reminderSent, setReminderSent] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [examPrepDate, setExamPrepDate] = useState("");
  const [emailSuccessOpen, setEmailSuccessOpen] = useState(false);

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

    setIsGenerating(true); setPlan(""); setReminderSent(false);
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

  const sendPlanToEmail = async () => {
    if (!plan || !session?.user?.email) return;
    setIsSendingReminder(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "study-plan-reminder",
          recipientEmail: session.user.email,
          idempotencyKey: `study-plan-${session.user.id}-${Date.now()}`,
          templateData: {
            name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
            plan,
            examDate: examPrepDate || upcomingExams || undefined,
            focusAreas: selectedFocus.length > 0 ? selectedFocus.join(", ") : undefined,
          },
        },
      });
      if (error) throw error;
      setReminderSent(true);
      setEmailSuccessOpen(true);
    } catch {
      toast({ title: "Could not send email", description: "Please try again in a moment.", variant: "destructive" });
    }
    setIsSendingReminder(false);
  };

  return (
    <main className="mx-auto max-w-5xl px-3 pb-20 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader icon="🎯" title="Study & Placement Planner" subtitle="Answer a few questions and let the AI mentor design a realistic weekly plan for your semester and placements.">
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[0.7rem] text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> AI powered
        </Badge>
      </PageHeader>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Left: Input Form */}
        <Card className="border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-accent-foreground/50" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Target className="h-4 w-4 text-primary" /> Tell the planner about you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
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
              <Label className="text-xs">What do you want to focus on? <span className="text-muted-foreground">(select multiple)</span></Label>
              <ScrollArea className="h-[180px] rounded-xl border border-primary/10 bg-background/30 p-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {focusOptions.map(({ label, emoji }) => (
                    <button
                      key={label} type="button" onClick={() => toggleFocus(label)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-[0.72rem] font-medium transition-all ${
                        selectedFocus.includes(label)
                          ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                          : "border-primary/10 bg-card/50 text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                      }`}
                    >
                      <span className="flex-shrink-0">{emoji}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {selectedFocus.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedFocus.map((f) => (
                    <Badge key={f} variant="secondary" className="text-[0.65rem] px-2 py-0.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => toggleFocus(f)}>
                      {f} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exams" className="text-xs">Upcoming exams / deadlines</Label>
              <Input id="exams" value={upcomingExams} onChange={(e) => setUpcomingExams(e.target.value)} placeholder="e.g. intern tests in Aug" className="rounded-xl border-primary/15" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extra" className="text-xs">Anything else?</Label>
              <Textarea id="extra" value={extraContext} onChange={(e) => setExtraContext(e.target.value)} placeholder="Mention lab-heavy weeks, backlogs, clubs, constraints..." className="min-h-[70px] resize-none rounded-xl border-primary/15" />
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <Button className="h-10 rounded-xl px-5 text-sm bg-gradient-to-r from-primary to-primary/80 shadow-[var(--shadow-glow)] hover:shadow-lg transition-shadow" onClick={generatePlan} disabled={isGenerating}>
                {isGenerating ? "✨ Generating your plan…" : "🎯 Generate my weekly plan"}
              </Button>
              {remainingToday !== null && (
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[0.7rem] text-primary">
                  {remainingToday} plans left today
                </Badge>
              )}
              <p className="w-full mt-1 text-[0.65rem] text-muted-foreground">Powered by AI — uses your inputs only. Limited to 5 plans/day per student.</p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Plan Output + Reminder */}
        <div className="flex flex-col gap-5">
          <Card className="border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden flex-1">
            <div className="h-1 bg-gradient-to-r from-accent-foreground/40 to-primary/40" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Clock className="h-4 w-4 text-primary" /> Your weekly roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ScrollArea className="h-[320px] rounded-xl border border-primary/10 bg-background/40 p-4 text-sm">
                {plan ? (
                  <article className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-primary prose-headings:font-bold prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 prose-strong:text-foreground prose-li:marker:text-primary/60 prose-ul:space-y-1 prose-p:leading-relaxed">
                    <ReactMarkdown>{plan}</ReactMarkdown>
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

          {/* Email Reminder Card */}
          <Card className={`rounded-2xl overflow-hidden border transition-all duration-500 ${
            plan
              ? "border-primary/20 bg-gradient-to-br from-primary/5 via-card/80 to-accent/10 shadow-md"
              : "border-primary/8 bg-card/40 opacity-60 pointer-events-none"
          }`}>
            <div className="h-1 bg-gradient-to-r from-primary/60 via-accent-foreground/30 to-primary/40" />
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    📩 Email this plan to yourself
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get your study roadmap delivered to your inbox — reference it anytime, even offline!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary/60 flex-shrink-0" />
                  <Input
                    value={examPrepDate}
                    onChange={(e) => setExamPrepDate(e.target.value)}
                    placeholder="Exam target date (e.g. May 2026)"
                    className="rounded-xl border-primary/15 h-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{session?.user?.email}</span>
                  </div>

                  {reminderSent ? (
                    <div className="flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Sent! Check your inbox</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={sendPlanToEmail}
                      disabled={!plan || isSendingReminder}
                      className="h-9 rounded-xl px-4 text-xs gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-sm hover:shadow-md transition-all"
                    >
                      {isSendingReminder ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" /> Send to my email
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-[0.6rem] text-muted-foreground/70 mt-3 leading-relaxed">
                ✉️ Your plan with focus areas, tips, and study schedule will be emailed to you. You can unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default StudyPlannerPage;
