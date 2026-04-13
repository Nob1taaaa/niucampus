import { useState, useEffect } from "react";
import { CalendarDays, MapPin, ArrowRight, Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import PageHeader from "@/components/PageHeader";
import EventsSkeleton from "@/components/skeletons/EventsSkeleton";
import { moderateContent } from "@/lib/moderation";

type Event = Tables<"events">;

const EventsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newEventForm, setNewEventForm] = useState({
    title: "", description: "", event_date: "", location: "", category: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      Promise.all([loadEvents(), loadInterestedEvents()]);
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({ title: "Error loading events", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const loadInterestedEvents = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("event_attendees").select("event_id").eq("user_id", user.id);
      if (error) throw error;
      setInterestedEvents(new Set(data?.map(item => item.event_id) || []));
    } catch (error: any) { console.error("Error loading interested events:", error); }
  };

  const filteredEvents = events
    .filter((event) => new Date(event.event_date) >= new Date(new Date().toDateString()))
    .filter((event) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return event.title.toLowerCase().includes(query) || event.description?.toLowerCase().includes(query) || event.location?.toLowerCase().includes(query) || event.category?.toLowerCase().includes(query);
    });

  const handleToggleInterested = async (event: Event) => {
    if (!user) return;
    try {
      if (interestedEvents.has(event.id)) {
        const { error } = await supabase.from("event_attendees").delete().eq("event_id", event.id).eq("user_id", user.id);
        if (error) throw error;
        setInterestedEvents((prev) => { const next = new Set(prev); next.delete(event.id); return next; });
        toast({ title: "Removed interest", description: `${event.title} removed from your list.` });
      } else {
        const { error } = await supabase.from("event_attendees").insert({ event_id: event.id, user_id: user.id });
        if (error) throw error;
        setInterestedEvents((prev) => new Set(prev).add(event.id));
        toast({ title: "Interest marked!", description: `${event.title} added to your list.` });
      }
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const handleRemoveEvent = async (eventId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId).eq("organizer_id", user.id);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast({ title: "Event removed" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const handleAddEvent = async () => {
    if (!user || submitting) return;
    if (!newEventForm.title.trim() || !newEventForm.description.trim() || !newEventForm.event_date.trim() || !newEventForm.location.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const contentToCheck = `${newEventForm.title} ${newEventForm.description} ${newEventForm.location} ${newEventForm.category}`;
      const modResult = await moderateContent(contentToCheck, "event");
      if (!modResult.safe) {
        toast({ title: "⚠️ Content not allowed", description: modResult.reason || "Please use appropriate language.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.from("events").insert({
        title: newEventForm.title.trim(), description: newEventForm.description.trim(),
        event_date: new Date(newEventForm.event_date).toISOString(), location: newEventForm.location.trim(),
        category: newEventForm.category.trim() || "general", organizer_id: user.id,
      }).select().single();
      if (error) throw error;
      setEvents((prev) => [data, ...prev]);
      toast({ title: "Event added!" });
      setIsAddEventDialogOpen(false);
      setNewEventForm({ title: "", description: "", event_date: "", location: "", category: "" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (loading) return <EventsSkeleton />;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <PageHeader icon="📅" title="Campus Events" subtitle="Workshops, fests, club meets, and guest lectures across campus.">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-xs text-foreground">
            <CalendarDays className="h-3 w-3 mr-1 text-primary" /> {events.length} events
          </Badge>
          <Button size="sm" className="h-8 rounded-full text-xs" onClick={() => setIsAddEventDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Event
          </Button>
        </div>
      </PageHeader>

      {/* Search */}
      <section className="mb-6 rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-3">
        <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-background/60 px-3 py-2">
          <Search className="h-4 w-4 text-primary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, location, or category..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </section>

      {/* Events grid */}
      {filteredEvents.length === 0 && !search ? (
        <Card className="border-primary/12 bg-card/70 rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-base font-semibold text-foreground">No events yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to add an event!</p>
            <Button size="sm" className="mt-4 rounded-full" onClick={() => setIsAddEventDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover-scale group border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md hover:border-primary/25">
              <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-accent-foreground/40" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-bold text-foreground leading-snug">{event.title}</CardTitle>
                  {event.category && (
                    <Badge className="bg-primary/10 border-primary/25 text-primary text-xs font-semibold shrink-0">
                      {event.category}
                    </Badge>
                  )}
                </div>
                {event.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-primary/8 border-primary/20 text-primary font-semibold text-xs">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {new Date(event.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </Badge>
                  {event.location && (
                    <Badge variant="outline" className="bg-accent/15 border-accent-foreground/15 text-accent-foreground text-xs">
                      <MapPin className="h-3 w-3 mr-1" /> {event.location}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  {user && event.organizer_id === user.id && (
                    <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => handleRemoveEvent(event.id)}>
                      Remove
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className={`h-8 rounded-full px-4 text-xs font-semibold ${interestedEvents.has(event.id) ? "bg-primary/10 text-primary border border-primary/25 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/25" : ""}`}
                    variant={interestedEvents.has(event.id) ? "outline" : "default"}
                    onClick={() => handleToggleInterested(event)}
                  >
                    {interestedEvents.has(event.id) ? "✗ Not Interested" : <>Mark interested <ArrowRight className="ml-1 h-3 w-3" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Add Event Dialog */}
      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>📅 Add a new event</DialogTitle>
            <DialogDescription>Fill in the details. Visible to all students.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event title *</Label>
              <Input id="title" placeholder="e.g. Club showcase" value={newEventForm.title} onChange={(e) => setNewEventForm((p) => ({ ...p, title: e.target.value }))} className="rounded-xl" onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Brief description" value={newEventForm.description} onChange={(e) => setNewEventForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="rounded-xl" onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_date">Date & Time *</Label>
              <Input id="event_date" type="datetime-local" value={newEventForm.event_date} onChange={(e) => setNewEventForm((p) => ({ ...p, event_date: e.target.value }))} className="rounded-xl" onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" placeholder="e.g. Room 301" value={newEventForm.location} onChange={(e) => setNewEventForm((p) => ({ ...p, location: e.target.value }))} className="rounded-xl" onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Technical" value={newEventForm.category} onChange={(e) => setNewEventForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl" onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAddEvent} className="rounded-xl" disabled={submitting}>{submitting ? "Adding..." : "Add Event"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default EventsPage;
