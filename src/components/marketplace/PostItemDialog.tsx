import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { moderateContent } from "@/lib/moderation";
import type { User } from "@supabase/supabase-js";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: "books", label: "📚 Books" },
  { value: "electronics", label: "💻 Electronics" },
  { value: "room", label: "🛏️ Room Items" },
  { value: "clothes", label: "👕 Clothes" },
  { value: "sports", label: "⚽ Sports" },
  { value: "free", label: "🎁 Free Items" },
  { value: "other", label: "📦 Other" },
];

const PostItemDialog = ({ open, onOpenChange, user, onSuccess }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "other", is_free: false, is_urgent: false,
  });

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - photos.length);
    const newPhotos = [...photos, ...files].slice(0, 4);
    setPhotos(newPhotos);
    setPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    setPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const modResult = await moderateContent(`${form.title} ${form.description}`, "marketplace");
      if (!modResult.safe) { toast({ title: "⚠️ Content not allowed", description: modResult.reason, variant: "destructive" }); return; }

      const isFree = form.is_free || form.category === "free";
      const { data: listing, error } = await (supabase as any).from("marketplace_listings").insert({
        user_id: user.id, title: form.title.trim(), description: form.description.trim() || null,
        price: isFree ? 0 : parseFloat(form.price) || 0, is_free: isFree, is_urgent: form.is_urgent, category: form.category,
      }).select().single();
      if (error) throw error;

      if (photos.length > 0 && listing) {
        const uploadPromises = photos.map(async (photo, i) => {
          const ext = photo.name.split(".").pop();
          const path = `${user.id}/${listing.id}/${i}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("marketplace-images").upload(path, photo, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from("marketplace-images").getPublicUrl(path);
          return (supabase as any).from("marketplace_listing_images").insert({ listing_id: listing.id, image_url: publicUrl, position: i });
        });
        await Promise.all(uploadPromises);
      }

      toast({ title: "Item posted! 🎉" });
      setForm({ title: "", description: "", price: "", category: "other", is_free: false, is_urgent: false });
      setPhotos([]); setPreviews([]);
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🏷️ Post an item</DialogTitle>
          <DialogDescription>List something for sale or give it away for free.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-3">
          <div className="space-y-2">
            <Label className="text-xs">Photos (max 4)</Label>
            <div className="flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden border border-border/40">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <button onClick={() => fileRef.current?.click()} className="h-16 w-16 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-0.5 text-primary/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <Camera className="h-4 w-4" /><span className="text-[0.5rem]">Add</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Title *</Label>
            <Input placeholder="e.g. DSA Book by Cormen" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (<SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Price (₹)</Label>
              <Input type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} disabled={form.is_free} className="rounded-xl text-sm h-9" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Description</Label>
            <Textarea placeholder="Condition, reason for selling, etc." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="rounded-xl text-sm" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_free} onCheckedChange={v => setForm(p => ({ ...p, is_free: v }))} />
              <Label className="text-xs">🎁 Free item</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_urgent} onCheckedChange={v => setForm(p => ({ ...p, is_urgent: v }))} />
              <Label className="text-xs">🔥 Urgent sale</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl text-xs">{submitting ? "Posting..." : "Post Item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostItemDialog;
