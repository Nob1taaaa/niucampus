import { useState } from "react";
import { CrushProfile, LOOKING, VIBES, initials } from "./shared";
import { GraduationCap } from "lucide-react";

export default function ProfileCard({ p, common = [] }: { p: CrushProfile; common?: string[] }) {
  const [idx, setIdx] = useState(0);
  const tone = VIBES[p.vibe_color] || "--mode-borrow";
  const look = LOOKING.find((l) => l.id === p.looking_for);
  const photo = p.photos[idx];
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-border/40 bg-card shadow-2xl" style={{ ["--tone" as any]: `var(${tone})` }}>
      <div className="relative h-[62%] w-full overflow-hidden">
        {photo ? (
          <img src={photo} alt={p.display_name} draggable={false} className="h-full w-full select-none object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[hsl(var(--tone))] to-[hsl(var(--tone)/0.45)]">
            <span className="font-serif text-7xl font-extrabold text-primary-foreground/90">{initials(p.display_name)}</span>
          </div>
        )}
        {p.photos.length > 1 && (
          <>
            <div className="absolute inset-x-3 top-3 flex gap-1">
              {p.photos.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i === idx ? "bg-background" : "bg-background/40"}`} />)}
            </div>
            <button aria-label="Previous photo" className="absolute inset-y-0 left-0 w-1/3" onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)); }} />
            <button aria-label="Next photo" className="absolute inset-y-0 right-0 w-1/3" onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(p.photos.length - 1, i + 1)); }} />
          </>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-card to-transparent" />
        {look && <span className="absolute left-3 bottom-3 rounded-full bg-background/85 px-2.5 py-1 text-[0.7rem] font-bold backdrop-blur">{look.emoji} {look.label}</span>}
      </div>
      <div className="h-[38%] overflow-y-auto px-5 pb-5 pt-1">
        <p className="font-serif text-2xl font-extrabold">{p.display_name}{p.age ? <span className="font-sans text-xl font-medium text-muted-foreground">, {p.age}</span> : null}</p>
        {(p.branch || p.year_of_study) && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><GraduationCap className="h-3.5 w-3.5" />{[p.branch, p.year_of_study].filter(Boolean).join(" · ")}</p>}
        {p.bio && <p className="mt-2 text-sm leading-snug">{p.bio}</p>}
        {p.interests.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.interests.map((i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${common.includes(i) ? "bg-[hsl(var(--tone))] text-primary-foreground" : "bg-muted"}`}>{i}</span>
            ))}
          </div>
        )}
        {p.prompts?.filter((x) => x.a).map((x) => (
          <div key={x.q} className="mt-2 rounded-2xl bg-[hsl(var(--tone)/0.08)] p-2.5">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[hsl(var(--tone))]">{x.q}</p>
            <p className="text-sm font-medium">{x.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
