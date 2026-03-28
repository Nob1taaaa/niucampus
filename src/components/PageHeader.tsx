import { ReactNode } from "react";

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}

const PageHeader = ({ icon, title, subtitle, children }: PageHeaderProps) => {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-card/70 backdrop-blur-2xl p-6 sm:p-8 shadow-sm">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/8 blur-[80px]" />
      <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-accent/10 blur-[70px]" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl font-serif text-foreground">
              {title}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{subtitle}</p>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
