import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Mail, Sparkles } from "lucide-react";

interface EmailSentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  recipient?: string;
  autoCloseMs?: number;
}

const EmailSentDialog = ({
  open,
  onOpenChange,
  title = "Email sent successfully!",
  description = "Your message is on its way 💌",
  recipient,
  autoCloseMs = 3500,
}: EmailSentDialogProps) => {
  useEffect(() => {
    if (open && autoCloseMs > 0) {
      const t = setTimeout(() => onOpenChange(false), autoCloseMs);
      return () => clearTimeout(t);
    }
  }, [open, autoCloseMs, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl border-primary/20 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
        {/* Decorative gradient header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-10 pb-6">
          <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />

          {/* Sparkles */}
          <Sparkles className="absolute top-4 left-6 h-3 w-3 text-primary/60 animate-pulse" />
          <Sparkles className="absolute top-8 right-10 h-4 w-4 text-primary/40 animate-pulse [animation-delay:300ms]" />
          <Sparkles className="absolute bottom-3 right-6 h-3 w-3 text-primary/50 animate-pulse [animation-delay:600ms]" />

          <div className="relative flex flex-col items-center text-center">
            {/* Animated check badge */}
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/40 ring-4 ring-primary/15 animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="h-10 w-10 text-primary-foreground animate-in zoom-in-75 duration-700 delay-150" strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-lg font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[260px] animate-in fade-in duration-500 delay-300">
              {description}
            </p>

            {recipient && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[0.7rem] font-medium text-primary animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{recipient}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subtle footer bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-transparent via-primary/5 to-transparent text-center">
          <p className="text-[0.65rem] text-muted-foreground/70 italic">
            Thank you for being part of NIU Connect ✨
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailSentDialog;
