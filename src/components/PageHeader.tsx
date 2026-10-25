import { ReactNode } from "react";

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}

const PageHeader = ({ icon, title, subtitle, children }: PageHeaderProps) => {
  return (
    <section className="relative mb-5 overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-4 shadow-lg backdrop-blur-2xl sm:mb-7 sm:p-6 md:p-8">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-[80px]" />
      <div className="pointer-events-none absolute -right-16 -bottom-20 h-48 w-48 rounded-full bg-[hsl(var(--mode-food)/0.12)] blur-[70px]" />

      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-2xl sm:h-14 sm:w-14 sm:text-3xl">
            {icon}
          </span>
          <div className="min-w-0 space-y-1">
            <h1 className="font-serif text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground line-clamp-2 sm:text-sm">{subtitle}</p>
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </section>
  );
};

export default PageHeader;
