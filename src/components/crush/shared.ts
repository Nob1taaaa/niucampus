import { supabase } from "@/integrations/supabase/client";

export const db = supabase as any;

export type CrushProfile = {
  user_id: string;
  display_name: string;
  age: number | null;
  bio: string | null;
  branch: string | null;
  year_of_study: string | null;
  interests: string[];
  looking_for: string;
  prompts: { q: string; a: string }[];
  photos: string[];
  vibe_color: string;
  is_active: boolean;
};

export const INTERESTS = ["🎵 Music", "🏏 Cricket", "⚽ Football", "🎮 Gaming", "📸 Photography", "💃 Dance", "🎬 Movies", "📚 Reading", "🍕 Foodie", "✈️ Travel", "💻 Coding", "🏋️ Gym", "🎨 Art", "☕ Chai lover", "🎤 Singing", "🧘 Yoga", "📺 Anime", "🛍️ Fashion"];
export const LOOKING = [
  { id: "friends", label: "New friends", emoji: "🤝" },
  { id: "study", label: "Study buddy", emoji: "📚" },
  { id: "date", label: "Something cute", emoji: "💘" },
  { id: "vibe", label: "Just vibing", emoji: "✨" },
];
export const BRANCHES = ["B.Tech CSE", "B.Tech ECE", "B.Tech ME", "BBA", "MBA", "BCA", "MCA", "B.Com", "BA", "B.Sc", "B.Pharm", "Law", "Design", "Other"];
export const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "PG"];
export const PROMPTS = [
  "My ideal canteen order is…",
  "Green flag I look for…",
  "Best spot on campus is…",
  "I'll never shut up about…",
  "Two truths and a lie…",
  "Let's skip class to…",
  "My most controversial opinion…",
];
export const VIBES: Record<string, string> = {
  rose: "--mode-borrow",
  sky: "--mode-radar",
  sunset: "--mode-food",
  mint: "--mode-gig",
  violet: "--mode-creator",
  gold: "--mode-ride",
};
export const initials = (n: string) => (n || "?").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
export const isMissingTable = (e: any) => e && (e.code === "PGRST205" || e.code === "42P01" || /schema cache|does not exist/i.test(e.message || ""));
export const BAD = /\b(fuck|shit|bitch|bc|mc|chutiya|madarchod|behenchod|randi|gandu|bsdk|nude|sex)\b/i;
