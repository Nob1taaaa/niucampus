import { useMemo, useState } from "react";
import { Flame, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], a: 1 },
  { q: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Power Unit", "Core Program Utility", "Central Print Unit"], a: 0 },
  { q: "Who wrote 'Wings of Fire'?", options: ["R.K. Narayan", "A.P.J. Abdul Kalam", "Ruskin Bond", "Chetan Bhagat"], a: 1 },
  { q: "Which data structure works on FIFO?", options: ["Stack", "Tree", "Queue", "Graph"], a: 2 },
  { q: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], a: 2 },
  { q: "Binary of decimal 10 is…", options: ["1010", "1100", "1001", "1110"], a: 0 },
  { q: "Capital of Uttar Pradesh?", options: ["Noida", "Kanpur", "Lucknow", "Agra"], a: 2 },
  { q: "Which gas do plants absorb?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Helium"], a: 1 },
  { q: "HTML stands for HyperText ___ Language", options: ["Markup", "Machine", "Modern", "Main"], a: 0 },
  { q: "Speed of light is roughly…", options: ["3×10⁸ m/s", "3×10⁶ m/s", "340 m/s", "1×10⁸ m/s"], a: 0 },
  { q: "Who is known as the father of computers?", options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Tim Berners-Lee"], a: 1 },
  { q: "Largest organ of the human body?", options: ["Liver", "Brain", "Skin", "Heart"], a: 2 },
  { q: "Which year did India win its first cricket World Cup?", options: ["1983", "1987", "2011", "1975"], a: 0 },
  { q: "SQL is used to…", options: ["Style pages", "Query databases", "Compile C", "Edit images"], a: 1 },
  { q: "What is 15% of 200?", options: ["20", "25", "30", "35"], a: 2 },
];

const todayKey = () => new Date().toISOString().slice(0, 10);
const dayIndex = () => Math.floor(Date.now() / 86400000);

const load = () => {
  try { return JSON.parse(localStorage.getItem("niu-trivia") || "{}"); } catch { return {}; }
};

const Trivia = () => {
  const questions = useMemo(() => {
    const start = (dayIndex() * 5) % QUESTIONS.length;
    return Array.from({ length: 5 }, (_, i) => QUESTIONS[(start + i) % QUESTIONS.length]);
  }, []);
  const saved = load();
  const playedToday = saved.last === todayKey();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(playedToday);
  const [stats, setStats] = useState({ streak: saved.streak || 0, best: saved.best || 0, lastScore: saved.lastScore ?? null });

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === questions[idx].a;
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    setTimeout(() => {
      if (idx + 1 < questions.length) { setIdx(idx + 1); setPicked(null); return; }
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const streak = saved.last === yesterday ? (saved.streak || 0) + 1 : 1;
      const next = { last: todayKey(), streak, best: Math.max(saved.best || 0, newScore), lastScore: newScore };
      localStorage.setItem("niu-trivia", JSON.stringify(next));
      setStats(next);
      setDone(true);
    }, 900);
  };

  const q = questions[idx];

  return (
    <main className="mx-auto max-w-xl px-3 pb-24 pt-6 sm:px-4">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Daily Trivia</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">5 questions. Every day.</h1>
      </header>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="rounded-2xl border border-border/50 bg-card/70 p-4 flex items-center gap-3"><Flame className="h-6 w-6 text-primary" /><div><p className="text-2xl font-bold">{stats.streak}</p><p className="text-xs text-muted-foreground">day streak</p></div></div>
        <div className="rounded-2xl border border-border/50 bg-card/70 p-4 flex items-center gap-3"><Trophy className="h-6 w-6 text-primary" /><div><p className="text-2xl font-bold">{stats.best}/5</p><p className="text-xs text-muted-foreground">best score</p></div></div>
      </div>

      {done ? (
        <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-8 text-center">
          <p className="text-5xl mb-3">🎉</p>
          <h2 className="font-serif text-2xl font-bold">You scored {stats.lastScore ?? score}/5 today</h2>
          <p className="text-sm text-muted-foreground mt-2">New questions tomorrow. Keep your streak alive!</p>
          <Button className="mt-5 rounded-2xl" onClick={() => navigator.share?.({ title: "NIU Trivia", text: `I scored ${stats.lastScore ?? score}/5 on today's NIU Trivia 🔥 Beat me:`, url: location.origin + "/trivia" })}>Challenge a friend</Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-5 sm:p-7">
          <div className="flex justify-between text-xs text-muted-foreground mb-3"><span>Question {idx + 1}/5</span><span>Score {score}</span></div>
          <div className="h-1.5 rounded-full bg-muted mb-5"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(idx / 5) * 100}%` }} /></div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold mb-5">{q.q}</h2>
          <div className="grid gap-2.5">
            {q.options.map((o, i) => {
              const state = picked === null ? "" : i === q.a ? "border-primary bg-primary/10" : i === picked ? "border-destructive bg-destructive/10" : "opacity-60";
              return (
                <button key={o} onClick={() => choose(i)} disabled={picked !== null} className={`flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${state}`}>
                  {o}
                  {picked !== null && i === q.a && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  {picked === i && i !== q.a && <XCircle className="h-5 w-5 text-destructive" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
};

export default Trivia;
