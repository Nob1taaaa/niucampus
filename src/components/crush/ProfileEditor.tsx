import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Camera, Loader2, Plus, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, CrushProfile, INTERESTS, LOOKING, BRANCHES, YEARS, PROMPTS, VIBES, BAD } from "./shared";
import ProfileCard from "./ProfileCard";

const empty = (uid: string, name: string): CrushProfile => ({
  user_id: uid, display_name: name, age: null, bio: "", branch: null, year_of_study: null,
  interests: [], looking_for: "friends", prompts: [{ q: PROMPTS[0], a: "" }], photos: [], vibe_color: "rose", is_active: true,
});

export default function ProfileEditor({ userId, initial, defaultName, onSaved }: { userId: string; initial: CrushProfile | null; defaultName: string; onSaved: (p: CrushProfile) => void }) {
  const [p, setP] = useState<CrushProfile>(initial || empty(userId, defaultName));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (initial) setP(initial); }, [initial]);
  const set = (patch: Partial<CrushProfile>) => setP((x) => ({ ...x, ...patch }));

  const completeness = Math.round(([p.display_name, p.age, p.bio, p.branch, p.year_of_study, p.photos.length, p.interests.length >= 3, p.prompts.some((x) => x.a)].filter(Boolean).length / 8) * 100);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (p.photos.length >= 4) return toast.error("Up to 4 photos");
    const f = files[0];
    if (!f.type.startsWith("image/")) return toast.error("Pick an image");
    if (f.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    setUploading(true);
    const path = `${userId}/${Date.now()}-${f.name.replace(/[^a-z0-9.]/gi, "")}`;
    const { error } = await supabase.storage.from("crush-photos").upload(path, f);
    setUploading(false);
    if (error) return toast.error("Upload failed — is the photo storage set up?");
    const url = supabase.storage.from("crush-photos").getPublicUrl(path).data.publicUrl;
    set({ photos: [...p.photos, url] });
  };

  const save = async () => {
    if (saving) return;
    if (!p.display_name.trim()) return toast.error("Add your name");
    const text = [p.bio, ...p.prompts.map((x) => x.a)].join(" ");
    if (BAD.test(text)) return toast.error("Please keep your profile friendly 🙏");
    setSaving(true);
    const row = { ...p, prompts: p.prompts.filter((x) => x.a.trim()), updated_at: new Date().toISOString() };
    const { error } = await db.from("crush_profiles").upsert(row);
    setSaving(false);
    if (error) return toast.error("Couldn't save, try again");
    toast.success("Profile saved ✨");
    onSaved(row as CrushProfile);
  };

  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${on ? "border-[hsl(var(--tone))] bg-[hsl(var(--tone)/0.12)] text-[hsl(var(--tone))]" : "border-border/60 bg-background/60 text-muted-foreground"}`;

  return (
    <div className="space-y-4" style={{ ["--tone" as any]: `var(${VIBES[p.vibe_color] || "--mode-borrow"})` }}>
      <div className="rounded-3xl border border-border/50 bg-card/70 p-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>Profile strength</span><span className="text-[hsl(var(--tone))]">{completeness}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[hsl(var(--tone))] transition-all" style={{ width: `${completeness}%` }} /></div>
        <p className="mt-2 text-[0.7rem] text-muted-foreground">Profiles with photos and 3+ interests get way more likes.</p>
      </div>

      {/* Photos */}
      <section className="rounded-3xl border border-border/50 bg-card/70 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Photos</p>
        <div className="grid grid-cols-4 gap-2">
          {p.photos.map((u, i) => (
            <div key={u} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
              <img src={u} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-background/80 px-1.5 text-[0.55rem] font-bold">Main</span>}
              <button onClick={() => set({ photos: p.photos.filter((x) => x !== u) })} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {p.photos.length < 4 && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="grid aspect-[3/4] place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <p className="mt-2 text-[0.65rem] text-muted-foreground">No photo? That's fine — your card uses your vibe color and initials.</p>
      </section>

      {/* Basics */}
      <section className="space-y-3 rounded-3xl border border-border/50 bg-card/70 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About you</p>
        <div className="grid grid-cols-3 gap-2">
          <Input className="col-span-2 rounded-2xl" placeholder="Name shown" value={p.display_name} maxLength={40} onChange={(e) => set({ display_name: e.target.value })} />
          <Input className="rounded-2xl" type="number" placeholder="Age" value={p.age ?? ""} onChange={(e) => set({ age: e.target.value ? Math.min(40, Math.max(16, +e.target.value)) : null })} />
        </div>
        <Textarea className="rounded-2xl" rows={3} maxLength={300} placeholder="A short bio — what makes you, you?" value={p.bio || ""} onChange={(e) => set({ bio: e.target.value })} />
        <div className="flex flex-wrap gap-1.5">{BRANCHES.map((b) => <button key={b} onClick={() => set({ branch: b })} className={chip(p.branch === b)}>{b}</button>)}</div>
        <div className="flex flex-wrap gap-1.5">{YEARS.map((y) => <button key={y} onClick={() => set({ year_of_study: y })} className={chip(p.year_of_study === y)}>{y}</button>)}</div>
      </section>

      <section className="rounded-3xl border border-border/50 bg-card/70 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Looking for</p>
        <div className="grid grid-cols-2 gap-2">
          {LOOKING.map((l) => (
            <button key={l.id} onClick={() => set({ looking_for: l.id })} className={`rounded-2xl border p-3 text-left text-sm font-semibold ${p.looking_for === l.id ? "border-[hsl(var(--tone))] bg-[hsl(var(--tone)/0.1)]" : "border-border/60"}`}>
              <span className="text-xl">{l.emoji}</span><br />{l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/50 bg-card/70 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Interests · {p.interests.length}/6</p>
        <div className="flex flex-wrap gap-1.5">
          {INTERESTS.map((i) => {
            const on = p.interests.includes(i);
            return <button key={i} onClick={() => set({ interests: on ? p.interests.filter((x) => x !== i) : p.interests.length >= 6 ? p.interests : [...p.interests, i] })} className={chip(on)}>{i}</button>;
          })}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border/50 bg-card/70 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prompts</p>
        {p.prompts.map((pr, idx) => (
          <div key={idx} className="rounded-2xl border border-border/50 bg-background/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <select value={pr.q} onChange={(e) => set({ prompts: p.prompts.map((x, i) => i === idx ? { ...x, q: e.target.value } : x) })} className="flex-1 bg-transparent text-sm font-semibold outline-none">
                {PROMPTS.map((q) => <option key={q}>{q}</option>)}
              </select>
              {p.prompts.length > 1 && <button onClick={() => set({ prompts: p.prompts.filter((_, i) => i !== idx) })}><X className="h-4 w-4 text-muted-foreground" /></button>}
            </div>
            <Input className="mt-2 rounded-xl" maxLength={120} placeholder="Your answer…" value={pr.a} onChange={(e) => set({ prompts: p.prompts.map((x, i) => i === idx ? { ...x, a: e.target.value } : x) })} />
          </div>
        ))}
        {p.prompts.length < 3 && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => set({ prompts: [...p.prompts, { q: PROMPTS[p.prompts.length], a: "" }] })}><Plus className="mr-1 h-3.5 w-3.5" />Add prompt</Button>}
      </section>

      <section className="rounded-3xl border border-border/50 bg-card/70 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Card color</p>
        <div className="flex gap-3">
          {Object.entries(VIBES).map(([k, v]) => (
            <button key={k} aria-label={k} onClick={() => set({ vibe_color: k })} className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-background transition-all ${p.vibe_color === k ? "ring-2 ring-foreground scale-110" : ""}`} style={{ background: `hsl(var(${v}))` }} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-background/60 p-3">
          <div><p className="text-sm font-semibold">Show me in Discover</p><p className="text-[0.7rem] text-muted-foreground">Turn off to go invisible (ghost mode)</p></div>
          <Switch checked={p.is_active} onCheckedChange={(v) => set({ is_active: v })} />
        </div>
      </section>

      {preview && <div className="mx-auto max-w-sm"><ProfileCard p={p} /></div>}

      <div className="sticky bottom-16 z-10 flex gap-2 md:bottom-4">
        <Button variant="outline" className="h-12 flex-1 rounded-2xl bg-card" onClick={() => setPreview((v) => !v)}><Eye className="mr-2 h-4 w-4" />{preview ? "Hide preview" : "Preview"}</Button>
        <Button className="h-12 flex-[2] rounded-2xl bg-[hsl(var(--tone))] text-primary-foreground hover:opacity-90" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
