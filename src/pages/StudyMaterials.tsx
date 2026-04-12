import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Link as LinkIcon, Upload, Plus, Download, ExternalLink, Trash2,
  Search, GraduationCap, Bookmark, Library, ChevronDown, ChevronUp, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import StudyMaterialsSkeleton from "@/components/skeletons/StudyMaterialsSkeleton";
import { moderateContent } from "@/lib/moderation";
import { CURATED_CATEGORIES, type ResourceCategory } from "@/data/curated-resources";

interface StudyMaterial {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  subject: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  external_url: string | null;
  download_count: number;
  created_at: string;
}

const SUBJECTS = [
  "General", "DSA", "DBMS", "CN", "OS", "OOPs", "Web Dev", "AI/ML",
  "Math", "Physics", "Chemistry", "English",
  "Commerce", "Accounting", "Economics", "Business Studies",
  "Law", "Political Science", "Psychology", "Sociology",
  "History", "Geography", "Philosophy",
  "Biology", "Biotechnology", "Medical",
  "Mechanical", "Civil", "Electrical", "Electronics",
  "Design", "Architecture", "Fine Arts",
  "Other"
];

type ViewMode = "library" | "community" | "curated";

const StudyMaterialsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "link">("file");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", description: "", subject: "General", external_url: "" });
  const [viewMode, setViewMode] = useState<ViewMode>("curated");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [curatedSearch, setCuratedSearch] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) { Promise.all([loadMaterials(), loadBookmarks()]); }
  }, [user]);

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast({ title: "Error loading materials", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase.from("study_material_bookmarks").select("material_id").eq("user_id", user.id);
    if (data) setBookmarkedIds(new Set(data.map((d) => d.material_id)));
  };

  const toggleBookmark = async (materialId: string) => {
    if (!user) return;
    if (bookmarkedIds.has(materialId)) {
      await supabase.from("study_material_bookmarks").delete().eq("user_id", user.id).eq("material_id", materialId);
      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(materialId); return n; });
      toast({ title: "Bookmark removed" });
    } else {
      await supabase.from("study_material_bookmarks").insert({ user_id: user.id, material_id: materialId });
      setBookmarkedIds((prev) => new Set(prev).add(materialId));
      toast({ title: "Bookmarked!" });
    }
  };

  const handleUpload = async () => {
    if (uploading) return;
    if (!user || !form.title.trim() || !form.subject.trim()) {
      toast({ title: "Missing fields", description: "Title and subject are required.", variant: "destructive" });
      return;
    }
    if (uploadType === "file" && !selectedFile) {
      toast({ title: "No file selected", variant: "destructive" }); return;
    }
    if (uploadType === "link" && !form.external_url.trim()) {
      toast({ title: "No URL provided", variant: "destructive" }); return;
    }
    setUploading(true);
    try {
      const modResult = await moderateContent(`${form.title} ${form.description}`, "study_material");
      if (!modResult.safe) {
        toast({ title: "⚠️ Content not allowed", description: modResult.reason, variant: "destructive" });
        setUploading(false); return;
      }
      let fileUrl: string | null = null, fileName: string | null = null, fileSize: number | null = null;
      if (uploadType === "file" && selectedFile) {
        const filePath = `${user.id}/${Date.now()}.${selectedFile.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage.from("study-materials").upload(filePath, selectedFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("study-materials").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl; fileName = selectedFile.name; fileSize = selectedFile.size;
      }
      const { data, error } = await supabase.from("study_materials").insert({
        user_id: user.id, title: form.title.trim(), description: form.description.trim() || null,
        type: uploadType, subject: form.subject, file_url: fileUrl, file_name: fileName,
        file_size: fileSize, external_url: uploadType === "link" ? form.external_url.trim() : null,
      }).select().single();
      if (error) throw error;
      setMaterials((prev) => [data, ...prev]);
      setIsUploadOpen(false);
      setForm({ title: "", description: "", subject: "General", external_url: "" });
      setSelectedFile(null);
      toast({ title: "Material shared!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("study_materials").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Material deleted" });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const subjectTabMap: Record<string, string[]> = {
    general: ["general"], dsa: ["dsa"], dbms: ["dbms"], cn: ["cn"], os: ["os"],
    "ai/ml": ["ai/ml"], commerce: ["commerce", "accounting", "business studies"],
    law: ["law"], medical: ["medical"], design: ["design", "architecture", "fine arts"],
    math: ["math"], economics: ["economics"], psychology: ["psychology"], biology: ["biology", "biotechnology"],
  };

  const filteredMaterials = materials.filter((m) => {
    if (showSaved && !bookmarkedIds.has(m.id)) return false;
    const isGeneral = m.subject.toLowerCase() === "general";
    const matchesTab = tab === "all" || isGeneral || tab === "general" || (subjectTabMap[tab]?.some((s) => m.subject.toLowerCase() === s) ?? m.subject.toLowerCase() === tab.toLowerCase());
    const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  const filteredCurated: ResourceCategory[] = curatedSearch.trim()
    ? CURATED_CATEGORIES.map((cat) => ({
        ...cat,
        resources: cat.resources.filter((r) =>
          r.title.toLowerCase().includes(curatedSearch.toLowerCase()) ||
          r.description.toLowerCase().includes(curatedSearch.toLowerCase())
        ),
      })).filter((cat) => cat.resources.length > 0)
    : CURATED_CATEGORIES;

  const subjectColors: Record<string, string> = {
    dsa: "from-primary to-primary/50", dbms: "from-accent-foreground to-accent-foreground/50",
    cn: "from-primary/70 to-accent-foreground/50", os: "from-destructive/70 to-destructive/30",
    "ai/ml": "from-primary/80 to-primary/40", commerce: "from-primary/60 to-primary/30",
    law: "from-accent-foreground/80 to-accent-foreground/40", medical: "from-destructive/60 to-primary/40",
    design: "from-primary/70 to-accent-foreground/60", math: "from-primary/50 to-primary/25",
    economics: "from-accent-foreground/70 to-primary/40", psychology: "from-primary/65 to-accent-foreground/35",
  };

  const getGradient = (subject: string) => {
    const lower = subject.toLowerCase();
    for (const key of Object.keys(subjectColors)) {
      if (lower.includes(key)) return subjectColors[key];
    }
    return "from-primary/60 to-accent-foreground/40";
  };

  const Tab = ({ id, label }: { id: string; label: string }) => (
    <button onClick={() => setTab(id)}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition-all ${
        tab === id ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-primary/8 text-muted-foreground hover:bg-primary/15 hover:text-foreground border border-primary/15"
      }`}
    >{label}</button>
  );

  if (loading) return <StudyMaterialsSkeleton />;

  return (
    <main className="mx-auto max-w-6xl px-3 pb-20 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader icon="📚" title="Study Materials" subtitle="Curated resources, NIU library links, and student-shared notes — everything in one place.">
        <Button size="sm" className="h-8 rounded-full text-xs px-4" onClick={() => setIsUploadOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Share Material
        </Button>
      </PageHeader>

      {/* View Mode Tabs */}
      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-2">
        {([
          { id: "curated" as ViewMode, label: "📂 Department Resources", desc: "90+ curated links" },
          { id: "library" as ViewMode, label: "🏛️ NIU Library", desc: "Official e-resources" },
          { id: "community" as ViewMode, label: "👥 Community Shared", desc: "Student uploads" },
        ]).map(({ id, label, desc }) => (
          <button key={id} onClick={() => setViewMode(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2.5 px-2 text-center transition-all ${
              viewMode === id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
            }`}
          >
            <span className="text-xs font-semibold">{label}</span>
            <span className={`text-[0.6rem] ${viewMode === id ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>{desc}</span>
          </button>
        ))}
      </div>

      {/* ============ CURATED DEPARTMENT RESOURCES ============ */}
      {viewMode === "curated" && (
        <section className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all departments..."
              value={curatedSearch}
              onChange={(e) => setCuratedSearch(e.target.value)}
              className="h-10 rounded-xl pl-10 text-sm border-primary/15"
            />
          </div>

          <div className="grid gap-3">
            {filteredCurated.map((cat) => {
              const isExpanded = expandedCategories.has(cat.name);
              return (
                <Card key={cat.name} className="border-primary/12 bg-card/70 backdrop-blur-sm rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => toggleCategory(cat.name)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-lg flex-shrink-0">
                        {cat.emoji}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{cat.name}</h3>
                        <p className="text-[0.7rem] text-muted-foreground">{cat.resources.length} free resources</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[0.65rem] text-primary hidden sm:inline-flex">
                        {cat.resources.length} links
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-primary/10 px-4 pb-4">
                      <div className="grid gap-2 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                        {cat.resources.map((r, i) => (
                          <a
                            key={i}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/link flex items-start gap-3 rounded-xl border border-primary/10 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                          >
                            <div className="h-8 w-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Globe className="h-3.5 w-3.5 text-primary/60 group-hover/link:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate group-hover/link:text-primary transition-colors">
                                {r.title}
                              </p>
                              <p className="text-[0.65rem] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                {r.description}
                              </p>
                              <Badge variant="outline" className="mt-1.5 border-primary/15 bg-primary/5 text-[0.6rem] text-primary/80 px-1.5 py-0">
                                {r.tag}
                              </Badge>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover/link:text-primary/60 flex-shrink-0 mt-1 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {filteredCurated.length === 0 && (
            <Card className="border-primary/12 bg-card/70 rounded-2xl">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No resources match your search.</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* ============ NIU LIBRARY SECTION ============ */}
      {viewMode === "library" && (
        <section className="space-y-4">
          <Card className="border-primary/12 bg-gradient-to-br from-primary/5 via-card/80 to-accent/5 rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent-foreground/50 to-primary/60" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Library className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">NIU Library E-Resources</h2>
                  <p className="text-xs text-muted-foreground">Official digital library subscriptions and databases by Noida International University</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {materials.filter((m) => m.user_id !== user?.id || true).map((material) => (
                  <a
                    key={material.id}
                    href={material.external_url || material.file_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/lib flex items-start gap-3 rounded-xl border border-primary/10 bg-background/60 p-3 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {material.type === "file" ? (
                        <FileText className="h-3.5 w-3.5 text-primary/60" />
                      ) : (
                        <LinkIcon className="h-3.5 w-3.5 text-primary/60 group-hover/lib:text-primary transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate group-hover/lib:text-primary transition-colors">
                        {material.title}
                      </p>
                      {material.description && (
                        <p className="text-[0.65rem] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {material.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className="border-primary/15 bg-primary/5 text-[0.6rem] text-primary/80 px-1.5 py-0">
                          {material.subject}
                        </Badge>
                        <span className="text-[0.6rem] text-muted-foreground/60">
                          {new Date(material.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(material.id); }}
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                          bookmarkedIds.has(material.id)
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground/40 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        <Bookmark className={`h-3 w-3 ${bookmarkedIds.has(material.id) ? "fill-primary" : ""}`} />
                      </button>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover/lib:text-primary/60 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
              {materials.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No library materials added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ============ COMMUNITY SHARED ============ */}
      {viewMode === "community" && (
        <section className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-3 md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <ScrollArea className="w-full" type="scroll">
                <div className="flex items-center gap-2 pb-1">
                  <Tab id="all" label="All" />
                  <Tab id="general" label="📖 General" />
                  <Tab id="dsa" label="🧮 DSA" />
                  <Tab id="dbms" label="🗄️ DBMS" />
                  <Tab id="cn" label="🌐 CN" />
                  <Tab id="os" label="💻 OS" />
                  <Tab id="ai/ml" label="🤖 AI/ML" />
                  <Tab id="commerce" label="📊 Commerce" />
                  <Tab id="law" label="⚖️ Law" />
                  <Tab id="medical" label="🩺 Medical" />
                  <Tab id="design" label="🎨 Design" />
                  <Tab id="math" label="📐 Math" />
                  <Tab id="economics" label="💹 Economics" />
                  <Tab id="psychology" label="🧠 Psychology" />
                  <Tab id="biology" label="🧬 Biology" />
                  <button
                    onClick={() => setShowSaved(!showSaved)}
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.7rem] font-medium transition-all ${
                      showSaved ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-primary/8 text-muted-foreground hover:bg-primary/15 hover:text-foreground border border-primary/15"
                    }`}
                  >
                    <Bookmark className="h-3 w-3" /> Saved
                  </button>
                </div>
              </ScrollArea>
              <div className="relative max-w-xs w-full flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="h-8 rounded-full pl-8 text-xs border-primary/15" />
              </div>
            </div>
          </div>

          {/* Materials grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.length === 0 ? (
              <Card className="border-primary/12 bg-card/70 rounded-2xl sm:col-span-2 lg:col-span-3">
                <CardContent className="py-10 text-center">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-primary/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No study materials yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Be the first to share notes or links!</p>
                </CardContent>
              </Card>
            ) : (
              filteredMaterials.map((material) => {
                const isOwner = material.user_id === user?.id;
                const isBookmarked = bookmarkedIds.has(material.id);
                return (
                  <Card key={material.id} className="group border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md hover:border-primary/25">
                    <div className={`h-1.5 bg-gradient-to-r ${getGradient(material.subject)}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-bold truncate flex items-center gap-2">
                            {material.type === "file" ? <FileText className="h-4 w-4 text-primary shrink-0" /> : <LinkIcon className="h-4 w-4 text-accent-foreground shrink-0" />}
                            {material.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => toggleBookmark(material.id)}
                            className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${isBookmarked ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-primary" : ""}`} />
                          </button>
                          <Badge variant="outline" className="border-primary/20 bg-primary/8 text-[0.6rem] text-foreground font-semibold">
                            {material.type === "file" ? "File" : "Link"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      {material.description && <p className="text-muted-foreground line-clamp-2">{material.description}</p>}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-2.5 py-1 text-[0.7rem] font-medium text-primary">
                          <GraduationCap className="h-3 w-3" /> {material.subject}
                        </span>
                        {material.file_name && <span className="text-[0.65rem] text-muted-foreground truncate max-w-[120px]">{material.file_name}</span>}
                        {material.file_size && <span className="text-[0.65rem] text-muted-foreground">{formatFileSize(material.file_size)}</span>}
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground">
                        {new Date(material.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {material.type === "file" && material.file_url && (
                          <Button size="sm" className="h-7 rounded-full text-[0.7rem] px-3" onClick={() => window.open(material.file_url!, "_blank")}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                        )}
                        {material.type === "link" && material.external_url && (
                          <Button size="sm" className="h-7 rounded-full text-[0.7rem] px-3" onClick={() => window.open(material.external_url!, "_blank")}>
                            <ExternalLink className="h-3 w-3 mr-1" /> Open Link
                          </Button>
                        )}
                        {isOwner && (
                          <Button size="sm" variant="outline" className="h-7 rounded-full text-[0.7rem] border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(material.id)}>
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">📚 Share Study Material</DialogTitle>
            <DialogDescription>Upload a file or share a useful link with everyone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <button onClick={() => setUploadType("file")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium border transition-all ${
                uploadType === "file" ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-primary/12 text-muted-foreground hover:bg-primary/5"
              }`}
            >
              <Upload className="h-4 w-4" /> Upload File
            </button>
            <button onClick={() => setUploadType("link")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium border transition-all ${
                uploadType === "link" ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-primary/12 text-muted-foreground hover:bg-primary/5"
              }`}
            >
              <LinkIcon className="h-4 w-4" /> Share Link
            </button>
          </div>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. DSA Notes Chapter 3" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>Subject *</Label>
              <Select value={form.subject} onValueChange={(v) => setForm((p) => ({ ...p, subject: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="What's in this material?" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl" />
            </div>
            {uploadType === "file" ? (
              <div className="grid gap-2">
                <Label>File *</Label>
                <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4 text-center">
                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-primary/40 mb-2" />
                    <p className="text-xs font-medium text-foreground">{selectedFile ? selectedFile.name : "Click to select a file"}</p>
                    <p className="text-[0.65rem] text-muted-foreground mt-1">PDF, DOC, PPT, XLS, Images, ZIP (max 50MB)</p>
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>URL *</Label>
                <Input placeholder="https://example.com/notes" value={form.external_url} onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))} className="rounded-xl" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="rounded-xl" disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} className="rounded-xl" disabled={uploading}>{uploading ? "Uploading..." : "Share"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default StudyMaterialsPage;
