import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Link as LinkIcon, Upload, Plus, Download, ExternalLink, Trash2, Search, GraduationCap, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { moderateContent } from "@/lib/moderation";

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

const SUBJECTS = ["General", "DSA", "DBMS", "CN", "OS", "OOPs", "Web Dev", "AI/ML", "Math", "Physics", "Chemistry", "English", "Other"];

const StudyMaterialsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "link">("file");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", description: "", subject: "General", external_url: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth"); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => { if (user) loadMaterials(); }, [user]);

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

  const handleUpload = async () => {
    if (!user || !form.title.trim() || !form.subject.trim()) {
      toast({ title: "Missing fields", description: "Title and subject are required.", variant: "destructive" });
      return;
    }

    if (uploadType === "file" && !selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }

    if (uploadType === "link" && !form.external_url.trim()) {
      toast({ title: "No URL provided", description: "Please enter a link.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const contentToCheck = `${form.title} ${form.description}`;
      const modResult = await moderateContent(contentToCheck, "study_material");
      if (!modResult.safe) {
        toast({ title: "⚠️ Content not allowed", description: modResult.reason || "Please use appropriate language.", variant: "destructive" });
        setUploading(false);
        return;
      }

      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      if (uploadType === "file" && selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("study-materials")
          .upload(filePath, selectedFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("study-materials").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      }

      const { data, error } = await supabase.from("study_materials").insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: uploadType,
        subject: form.subject,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        external_url: uploadType === "link" ? form.external_url.trim() : null,
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

  const filteredMaterials = materials.filter((m) => {
    const matchesTab = tab === "all" || m.subject.toLowerCase() === tab.toLowerCase();
    const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const Tab = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[0.7rem] font-medium transition-all ${
        tab === id
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-primary/8 text-muted-foreground hover:bg-primary/15 hover:text-foreground border border-primary/15"
      }`}
    >{label}</button>
  );

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  const subjectColors: Record<string, string> = {
    dsa: "from-primary to-primary/50",
    dbms: "from-accent-foreground to-accent-foreground/50",
    cn: "from-primary/70 to-accent-foreground/50",
    os: "from-destructive/70 to-destructive/30",
    "ai/ml": "from-primary/80 to-primary/40",
  };

  const getGradient = (subject: string) => {
    const lower = subject.toLowerCase();
    for (const key of Object.keys(subjectColors)) {
      if (lower.includes(key)) return subjectColors[key];
    }
    return "from-primary/60 to-accent-foreground/40";
  };

  return (
    <main className="mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
      <PageHeader icon="📚" title="Study Materials" subtitle="Upload notes, PDFs, and share useful links with your campus mates.">
        <Button size="sm" className="h-8 rounded-full text-xs px-4" onClick={() => setIsUploadOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Share Material
        </Button>
      </PageHeader>

      {/* Filters */}
      <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Tab id="all" label="All" />
            <Tab id="dsa" label="🧮 DSA" />
            <Tab id="dbms" label="🗄️ DBMS" />
            <Tab id="cn" label="🌐 CN" />
            <Tab id="os" label="💻 OS" />
            <Tab id="ai/ml" label="🤖 AI/ML" />
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-full pl-8 text-xs border-primary/15"
            />
          </div>
        </div>
      </section>

      {/* Materials grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.length === 0 ? (
          <Card className="border-primary/12 bg-card/70 rounded-2xl md:col-span-2 lg:col-span-3">
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

            return (
              <Card key={material.id} className="hover-scale group border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md hover:border-primary/25">
                <div className={`h-1.5 bg-gradient-to-r ${getGradient(material.subject)}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-bold truncate flex items-center gap-2">
                        {material.type === "file" ? (
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <LinkIcon className="h-4 w-4 text-accent-foreground shrink-0" />
                        )}
                        {material.title}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="border-primary/20 bg-primary/8 text-[0.6rem] text-foreground font-semibold shrink-0">
                      {material.type === "file" ? "File" : "Link"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {material.description && (
                    <p className="text-muted-foreground line-clamp-2">{material.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-2.5 py-1 text-[0.7rem] font-medium text-primary">
                      <GraduationCap className="h-3 w-3" /> {material.subject}
                    </span>
                    {material.file_name && (
                      <span className="text-[0.65rem] text-muted-foreground truncate max-w-[120px]">
                        {material.file_name}
                      </span>
                    )}
                    {material.file_size && (
                      <span className="text-[0.65rem] text-muted-foreground">
                        {formatFileSize(material.file_size)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                    {new Date(material.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {material.type === "file" && material.file_url && (
                      <Button
                        size="sm"
                        className="h-7 rounded-full text-[0.7rem] px-3"
                        onClick={() => window.open(material.file_url!, "_blank")}
                      >
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    )}
                    {material.type === "link" && material.external_url && (
                      <Button
                        size="sm"
                        className="h-7 rounded-full text-[0.7rem] px-3"
                        onClick={() => window.open(material.external_url!, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> Open Link
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full text-[0.7rem] border-destructive/20 text-destructive hover:bg-destructive/5"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">📚 Share Study Material</DialogTitle>
            <DialogDescription>Upload a file or share a useful link with everyone.</DialogDescription>
          </DialogHeader>

          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUploadType("file")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium border transition-all ${
                uploadType === "file"
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card border-primary/12 text-muted-foreground hover:bg-primary/5"
              }`}
            >
              <Upload className="h-4 w-4" /> Upload File
            </button>
            <button
              onClick={() => setUploadType("link")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium border transition-all ${
                uploadType === "link"
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card border-primary/12 text-muted-foreground hover:bg-primary/5"
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
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="What's in this material? Any notes for others?" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl" />
            </div>

            {uploadType === "file" ? (
              <div className="grid gap-2">
                <Label>File *</Label>
                <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-primary/40 mb-2" />
                    <p className="text-xs font-medium text-foreground">
                      {selectedFile ? selectedFile.name : "Click to select a file"}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground mt-1">
                      PDF, DOC, PPT, XLS, Images, ZIP (max 50MB)
                    </p>
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
            <Button onClick={handleUpload} className="rounded-xl" disabled={uploading}>
              {uploading ? "Uploading..." : "Share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default StudyMaterialsPage;
