import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE = "https://niucampus.org";

const META: Record<string, { title: string; description: string }> = {
  "/": { title: "NIU Connect — Your Smart Campus", description: "Events, Lost & Found, study materials, marketplace and AI Q&A for Noida International University students." },
  "/auth": { title: "Sign in — NIU Connect", description: "Sign in or create your NIU Connect account with your college email." },
  "/events": { title: "Campus Events — NIU Connect", description: "Discover upcoming fests, workshops and club events at Noida International University." },
  "/lost-found": { title: "Lost & Found — NIU Connect", description: "Report lost items and find what you lost on the NIU campus with smart AI matching." },
  "/marketplace": { title: "NIU Bazaar — Buy & Sell on Campus", description: "Buy and sell books, gadgets and hostel essentials with fellow NIU students." },
  "/qa": { title: "Campus AI — Ask Anything | NIU Connect", description: "Get instant answers to study and campus questions from NIU Connect's AI assistant." },
  "/planner": { title: "AI Study Planner — NIU Connect", description: "Build a personal study schedule for your exams with AI and get timely reminders." },
  "/materials": { title: "Study Materials & Notes — NIU Connect", description: "Find notes, previous papers and study resources shared by NIU students, sorted by subject." },
  "/trivia": { title: "Daily Trivia — NIU Connect", description: "Play five quick trivia questions every day and climb the NIU leaderboard." },
  "/campus": { title: "Campus Live — Food Buddy, Ride Share & Gigs | NIU Connect", description: "Find a food buddy, share a ride, borrow essentials or earn with micro-gigs around NIU." },
  "/crush": { title: "Crush @ NIU — NIU Connect", description: "A safe, verified-students-only way to find mutual crushes at NIU." },
};

function setTag(selector: string, attr: string, key: string, value: string, isLink = false) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = document.createElement(isLink ? "link" : "meta");
    el.setAttribute(isLink ? "rel" : attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute(isLink ? "href" : "content", value);
}

const RouteMeta = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = META[pathname] ?? META["/"];
    const url = BASE + (pathname === "/" ? "/" : pathname);
    document.title = m.title;
    setTag('meta[name="description"]', "name", "description", m.description);
    setTag('meta[property="og:title"]', "property", "og:title", m.title);
    setTag('meta[property="og:description"]', "property", "og:description", m.description);
    setTag('meta[property="og:url"]', "property", "og:url", url);
    setTag('meta[name="twitter:title"]', "name", "twitter:title", m.title);
    setTag('meta[name="twitter:description"]', "name", "twitter:description", m.description);
    setTag('link[rel="canonical"]', "rel", "canonical", url, true);
  }, [pathname]);
  return null;
};

export default RouteMeta;
