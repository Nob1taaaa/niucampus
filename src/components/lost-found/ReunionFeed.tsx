import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PartyPopper } from "lucide-react";

interface Reunion {
  id: string;
  post_id: string;
  created_at: string;
  post_title?: string;
}

const ReunionFeed = () => {
  const [reunions, setReunions] = useState<Reunion[]>([]);

  useEffect(() => {
    loadReunions();
  }, []);

  const isMissingTable = (error: any) =>
    ["42P01", "PGRST205", "42501"].includes(String(error?.code || ""));

  const loadReunions = async () => {
    const viaView = await (supabase as any)
      .from("lost_found_reunion_highlights")
      .select("id, post_id, created_at, post_title")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!isMissingTable(viaView.error)) {
      if (viaView.data && viaView.data.length > 0) setReunions(viaView.data);
      return;
    }

    // Older setup: read the table directly and look up titles separately.
    const { data } = await supabase
      .from("lost_found_reunions")
      .select("*")
      .eq("confirmed_by_user1", true)
      .eq("confirmed_by_user2", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data && data.length > 0) {
      // Fetch post titles
      const postIds = data.map((r) => r.post_id);
      const { data: posts } = await supabase.from("lost_found_posts").select("id, title").in("id", postIds);
      const postMap = new Map(posts?.map((p) => [p.id, p.title]) || []);
      setReunions(data.map((r) => ({ ...r, post_title: postMap.get(r.post_id) || "Unknown item" })));
    }
  };

  if (reunions.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-accent/5 to-background p-5">
      <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
        <PartyPopper className="h-4 w-4 text-primary" />
        🎉 Recent Reunions
      </h2>
      <div className="space-y-2">
        {reunions.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl bg-background/60 border border-primary/10 p-3 animate-in fade-in duration-300">
            <span className="text-lg">🤝</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{r.post_title}</p>
              <p className="text-[0.65rem] text-muted-foreground">
                Reunited {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[0.6rem] font-bold text-primary">
              REUNITED 🎉
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReunionFeed;
